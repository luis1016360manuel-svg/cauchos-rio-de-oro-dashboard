import { supabase } from './supabaseClient';

export interface PaymentAttachment {
  id: string;
  payment_id: string;
  file_url: string;
  file_name?: string;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  monto: number;
  fecha_abono: string;
  metodo_pago?: string;
  referencia?: string;
  notas?: string;
  created_at: string;
  attachments?: PaymentAttachment[];
}

export interface CreatePaymentPayload {
  invoice_id: string;
  monto: number;
  fecha_abono?: string;
  metodo_pago?: string;
  referencia?: string;
  notas?: string;
}

// Helper to upload a single attachment
const uploadPaymentAttachment = async (file: File, paymentId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `abonos/${paymentId}/${Math.random()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('invoice-files')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Upload error for attachment:', uploadError);
    throw new Error('Failed to upload attachment file');
  }

  const { data } = supabase.storage
    .from('invoice-files')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const fetchPaymentsForInvoice = async (invoiceId: string): Promise<InvoicePayment[]> => {
  const { data: paymentsData, error: paymentsError } = await supabase
    .from('invoice_payments')
    .select(`
      *,
      attachments:payment_attachments(*)
    `)
    .eq('invoice_id', invoiceId)
    .order('fecha_abono', { ascending: true });

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError);
    throw new Error('No se pudieron cargar los abonos');
  }

  return paymentsData as InvoicePayment[];
};

export const fetchAllPayments = async (): Promise<InvoicePayment[]> => {
  const { data, error } = await supabase
    .from('invoice_payments')
    .select('*');

  if (error) {
    console.error('Error fetching all payments:', error);
    throw new Error('No se pudieron cargar todos los abonos');
  }
  return data as InvoicePayment[];
};

export const addPayment = async (
  payload: CreatePaymentPayload, 
  files: File[]
): Promise<InvoicePayment> => {
  // 1. Insert payment record
  const { data: paymentData, error: paymentError } = await supabase
    .from('invoice_payments')
    .insert([{
      ...payload,
      fecha_abono: payload.fecha_abono || new Date().toISOString()
    }])
    .select()
    .single();

  if (paymentError || !paymentData) {
    console.error('Insert payment error:', paymentError);
    throw new Error('No se pudo registrar el abono');
  }

  const paymentId = paymentData.id;

  // 2. Upload files and insert attachment records
  const attachments: PaymentAttachment[] = [];
  if (files && files.length > 0) {
    const uploadPromises = files.map(async (f) => {
      const url = await uploadPaymentAttachment(f, paymentId);
      return {
        payment_id: paymentId,
        file_url: url,
        file_name: f.name
      };
    });

    const attachmentsDataToInsert = await Promise.all(uploadPromises);

    const { data: attData, error: attError } = await supabase
      .from('payment_attachments')
      .insert(attachmentsDataToInsert)
      .select();

    if (attError) {
      console.error('Error linking attachments:', attError);
    } else if (attData) {
      attachments.push(...attData);
    }
  }

  // Also update the invoice paidAmount locally so we don't have to refetch all, or just let UI handle it?
  // Wait, if we keep `invoices.paidAmount` in sync, we should update it here.
  // Actually, let's just let the frontend calculate it dynamically or update the `paidAmount` in `invoices` table.
  // For safety, let's update `invoices` table `paidAmount`:
  const { data: invData } = await supabase.from('invoices').select('paidAmount, totalAmount').eq('id', payload.invoice_id).single();
  const currentPaid = (invData?.paidAmount || 0) + payload.monto;
  const totalAmt = invData?.totalAmount || 0;
  const status = currentPaid >= totalAmt ? 'PAID' : currentPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
  await supabase.from('invoices').update({ paidAmount: currentPaid, status }).eq('id', payload.invoice_id);

  return { ...paymentData, attachments };
};

export const deletePayment = async (paymentId: string, invoiceId: string, monto: number): Promise<void> => {
  const { error } = await supabase
    .from('invoice_payments')
    .delete()
    .eq('id', paymentId);

  if (error) {
    console.error('Error deleting payment:', error);
    throw new Error('No se pudo eliminar el abono');
  }

  const { data: invData } = await supabase.from('invoices').select('paidAmount, totalAmount').eq('id', invoiceId).single();
  const newPaid = Math.max(0, (invData?.paidAmount || 0) - monto);
  const totalAmt = invData?.totalAmount || 0;
  const status = newPaid >= totalAmt ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
  await supabase.from('invoices').update({ paidAmount: newPaid, status }).eq('id', invoiceId);
};

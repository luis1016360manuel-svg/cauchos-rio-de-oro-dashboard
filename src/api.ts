import type { Invoice } from './components/InvoiceDashboard';
import { supabase } from './supabaseClient';

export interface Company {
  id: string;
  name: string;
  taxId?: string;
  phone?: string;
  address?: string;
}

// Helper to upload a file to Supabase Storage
const uploadFile = async (file: File, path: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${path}-${Math.random()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('invoice-files')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('Failed to upload file');
  }

  const { data } = supabase.storage
    .from('invoice-files')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const fetchInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('dueDate', { ascending: false });

  if (error) {
    console.error('Fetch error:', error);
    throw new Error('Failed to fetch invoices');
  }

  return data as Invoice[];
};

export const addInvoice = async (
  invoice: Invoice, 
  receiptFile: File | null, 
  proofFile: File | null
): Promise<Invoice> => {
  let receiptUrl = invoice.receiptImage || '';
  let proofUrl = invoice.paymentProofImage || '';

  if (receiptFile) {
    receiptUrl = await uploadFile(receiptFile, `receipts/${invoice.id}`);
  }
  if (proofFile) {
    proofUrl = await uploadFile(proofFile, `proofs/${invoice.id}`);
  }

  const newInvoice = {
    ...invoice,
    receiptImage: receiptUrl,
    paymentProofImage: proofUrl
  };

  const { error } = await supabase
    .from('invoices')
    .insert([newInvoice]);

  if (error) {
    console.error('Insert error:', error);
    throw new Error('Failed to add invoice');
  }

  // Create initial payment record if there is a paid amount
  if (newInvoice.paidAmount > 0) {
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert([{
        invoice_id: newInvoice.id,
        monto: newInvoice.paidAmount,
        fecha_abono: new Date().toISOString(),
        metodo_pago: newInvoice.paymentMethod,
        referencia: newInvoice.transactionReference,
        notas: 'Pago inicial al registrar la factura'
      }]);
      
    if (paymentError) {
      console.error('Failed to insert initial payment record:', paymentError);
    }
  }

  return newInvoice;
};

export const updateInvoice = async (
  invoice: Invoice,
  receiptFile: File | null,
  proofFile: File | null
): Promise<Invoice> => {
  let receiptUrl = invoice.receiptImage || '';
  let proofUrl = invoice.paymentProofImage || '';

  if (receiptFile) {
    receiptUrl = await uploadFile(receiptFile, `receipts/${invoice.id}`);
  }
  if (proofFile) {
    proofUrl = await uploadFile(proofFile, `proofs/${invoice.id}`);
  }

  const updatedInvoice = {
    ...invoice,
    receiptImage: receiptUrl,
    paymentProofImage: proofUrl
  };

  const { error } = await supabase
    .from('invoices')
    .update(updatedInvoice)
    .eq('id', invoice.id);

  if (error) {
    console.error('Update error:', error);
    throw new Error('Failed to update invoice');
  }

  return updatedInvoice;
};

export const permanentlyDeleteInvoice = async (invoiceOrId: string | Invoice): Promise<void> => {
  try {
    const id = typeof invoiceOrId === 'string' ? invoiceOrId : invoiceOrId.id;

    // Remove files from storage if deleting full invoice object
    if (typeof invoiceOrId !== 'string') {
      const urlsToRemove = [];
      if (invoiceOrId.receiptImage) urlsToRemove.push(invoiceOrId.receiptImage);
      if (invoiceOrId.paymentProofImage) urlsToRemove.push(invoiceOrId.paymentProofImage);

      for (const url of urlsToRemove) {
        // Simple extraction of file path from public URL
        const match = url.match(/\/invoice-files\/(.+)$/);
        if (match && match[1]) {
          await supabase.storage.from('invoice-files').remove([match[1]]);
        }
      }
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Permanent delete error from Supabase:', error);
      throw new Error('Failed to permanently delete invoice');
    }
  } catch (err) {
    console.error('Delete error caught in API:', err);
    throw err; // Rethrow to be caught by the component
  }
};

export const softDeleteInvoice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .update({ 
      isDeleted: true, 
      deletedAt: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    console.error('Soft delete error:', error);
    throw new Error('Failed to soft delete invoice');
  }
};

export const restoreInvoice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .update({ 
      isDeleted: false, 
      deletedAt: null 
    })
    .eq('id', id);

  if (error) {
    console.error('Restore error:', error);
    throw new Error('Failed to restore invoice');
  }
};

// --- Company API ---

export const fetchCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Fetch companies error:', error);
    throw new Error('Failed to fetch companies');
  }

  return data as Company[];
};

export const addCompany = async (company: Company): Promise<Company> => {
  const { error } = await supabase
    .from('companies')
    .insert([company]);

  if (error) {
    console.error('Insert company error:', error);
    throw new Error('Failed to add company');
  }

  return company;
};

export const deleteCompany = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete company error:', error);
    throw new Error('Failed to delete company');
  }
};

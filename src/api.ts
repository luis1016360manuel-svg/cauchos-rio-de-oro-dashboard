import type { Invoice } from './components/InvoiceDashboard';
import { supabase } from './supabaseClient';

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

export const deleteInvoice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete invoice');
  }
};

import React, { useState, useMemo, useRef } from 'react';
import { X, Save, Trash2, AlertCircle, Camera, FileText } from 'lucide-react';
import type { Invoice, InvoiceStatus, PaymentMethod } from './InvoiceDashboard';
import type { Company } from '../api';

interface EditInvoiceModalProps {
  invoice: Invoice;
  onUpdate: (updatedInvoice: Invoice, receiptFile: File | null, proofFile: File | null) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onImageClick: (url: string) => void;
  existingClients: string[];
  companies: Company[];
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ invoice, onUpdate, onDelete, onClose, onImageClick, existingClients, companies }) => {
  const [clientName, setClientName] = useState(invoice.clientName);
  const [invoiceCode, setInvoiceCode] = useState(invoice.invoiceCode);
  const [totalAmount, setTotalAmount] = useState<number | ''>(invoice.totalAmount);
  const [paidAmount, setPaidAmount] = useState<number | ''>(invoice.paidAmount);
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(invoice.paymentMethod || 'Zelle');
  const [transactionReference, setTransactionReference] = useState(invoice.transactionReference || '');
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paymentProofRef = useRef<HTMLInputElement>(null);

  const pendingBalance = useMemo(() => {
    const total = Number(totalAmount) || 0;
    const paid = Number(paidAmount) || 0;
    return Math.max(0, total - paid);
  }, [totalAmount, paidAmount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
    }
  };

  const renderPreview = (file: File | null, existingUrl: string | undefined) => {
    let dataUrl = existingUrl;
    let isPdf = existingUrl ? existingUrl.toLowerCase().endsWith('.pdf') : false;

    if (file) {
      dataUrl = URL.createObjectURL(file);
      isPdf = file.type === 'application/pdf';
    }

    if (!dataUrl) return null;

    return (
      <div 
        title="View Full Size"
        onClick={(e) => { e.stopPropagation(); onImageClick(dataUrl!); }}
        style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
      >
        {isPdf ? (
          <FileText size={20} color="var(--gold-light)" />
        ) : (
          <img src={dataUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const total = Number(totalAmount);
    const paid = Number(paidAmount);

    if (!invoiceCode.trim()) { setError('Invoice Code is required.'); return; }
    if (!clientName.trim()) { setError('Client Name is required.'); return; }
    if (total <= 0) { setError('Total Amount must be greater than 0.'); return; }
    if (paid < 0) { setError('Paid Amount cannot be negative.'); return; }
    if (paid > total) { setError('Paid Amount cannot exceed Total Amount.'); return; }
    if (!dueDate) { setError('Due Date is required.'); return; }
    if ((paymentMethod === 'Zelle' || paymentMethod === 'Wire') && !transactionReference.trim()) {
      setError(`Transaction Reference is required for ${paymentMethod} payments.`);
      return;
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      invoiceCode: invoiceCode.trim(),
      clientName: clientName.trim(),
      totalAmount: total,
      paidAmount: paid,
      pendingBalance,
      status: pendingBalance === 0 ? 'PAID' : (paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
      dueDate,
      paymentMethod,
      transactionReference: transactionReference.trim(),
    };

    onUpdate(updatedInvoice, receiptFile, paymentProofFile);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      onDelete(invoice.id);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          Edit Invoice
        </h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '24px', fontFamily: 'var(--font-mono)' }}>
          ID: {invoice.id}
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Invoice Code *</label>
            <input 
              type="text" 
              value={invoiceCode}
              onChange={e => setInvoiceCode(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Client Name</label>
            <input 
              type="text" 
              list="existing-clients-edit"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              style={inputStyle}
            />
            <datalist id="existing-clients-edit">
              {Array.from(new Set([...companies.map(c => c.name), ...existingClients])).sort().map(client => (
                <option key={client} value={client} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Total Amount ($)</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Paid Amount ($)</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Pending Balance</label>
            <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
              ${pendingBalance.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Status</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as InvoiceStatus)}
                style={inputStyle}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Due Date</label>
              <input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Receipt Image (Optional)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ ...inputStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
              >
                <Camera size={16} color="var(--gold-light)" /> {(receiptFile || invoice.receiptImage) ? 'Replace Receipt' : 'Upload Receipt'}
              </button>
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={e => handleFileSelect(e, setReceiptFile)}
                style={{ display: 'none' }}
              />
              {renderPreview(receiptFile, invoice.receiptImage)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Payment Details</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  style={inputStyle}
                >
                  <option value="Zelle">Zelle</option>
                  <option value="Wire">Wire Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {(paymentMethod === 'Zelle' || paymentMethod === 'Wire') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Transaction Ref *</label>
                  <input 
                    type="text" 
                    value={transactionReference}
                    onChange={e => setTransactionReference(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. TR-12345"
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Payment Proof Image (Optional)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => paymentProofRef.current?.click()}
                  style={{ ...inputStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                >
                  <Camera size={16} color="var(--gold-light)" /> {(paymentProofFile || invoice.paymentProofImage) ? 'Replace Proof' : 'Upload Proof'}
                </button>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  capture="environment" 
                  ref={paymentProofRef} 
                  onChange={e => handleFileSelect(e, setPaymentProofFile)}
                  style={{ display: 'none' }}
                />
                {renderPreview(paymentProofFile, invoice.paymentProofImage)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              type="button"
              onClick={handleDelete}
              style={{ padding: '10px 16px', borderRadius: 'var(--radius-full)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              <Trash2 size={16} /> Delete Invoice
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={onClose}
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  background: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-main)',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: 'inherit'
};

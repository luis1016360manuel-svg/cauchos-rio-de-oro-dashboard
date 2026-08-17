import React, { useState, useMemo, useRef } from 'react';
import { X, PlusCircle, AlertCircle, Camera, FileText } from 'lucide-react';
import type { Invoice, InvoiceStatus, PaymentMethod } from './InvoiceDashboard';
import type { Company } from '../api';
import { t } from '../translations';

interface AddInvoiceFormProps {
  onAdd: (newInvoice: Invoice, receiptFile: File | null, proofFile: File | null) => void;
  onClose: () => void;
  existingClients: string[];
  companies: Company[];
}

export const AddInvoiceForm: React.FC<AddInvoiceFormProps> = ({ onAdd, onClose, existingClients, companies }) => {
  const [clientName, setClientName] = useState('');
  const [invoiceCode, setInvoiceCode] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<InvoiceStatus>('UNPAID');
  const [dueDate, setDueDate] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paymentProofRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
    }
  };

  const renderPreview = (file: File | null) => {
    if (!file) return null;
    const isPdf = file.type === 'application/pdf';
    const dataUrl = URL.createObjectURL(file);
    return (
      <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
        {isPdf ? (
          <FileText size={14} color="var(--gold-light)" />
        ) : (
          <img src={dataUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
    );
  };

  const pendingBalance = useMemo(() => {
    const total = Number(totalAmount) || 0;
    const paid = Number(paidAmount) || 0;
    return Math.max(0, total - paid);
  }, [totalAmount, paidAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const total = Number(totalAmount);
    const paid = Number(paidAmount);

    if (!invoiceCode.trim()) {
      setError('Invoice Code is required.');
      return;
    }
    if (!clientName.trim()) {
      setError('Client Name is required.');
      return;
    }
    if (total <= 0) {
      setError('Total Amount must be greater than 0.');
      return;
    }
    if (paid < 0) {
      setError('Paid Amount cannot be negative.');
      return;
    }
    if (paid > total) {
      setError('Paid Amount cannot exceed Total Amount.');
      return;
    }
    if (!dueDate) {
      setError('Due Date is required.');
      return;
    }
    if (paymentMethod && (paymentMethod === 'Zelle' || paymentMethod === 'Wire') && !transactionReference.trim()) {
      setError(`Transaction Reference is required for ${paymentMethod} payments.`);
      return;
    }

    const newInvoice: Invoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
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

    onAdd(newInvoice, receiptFile, paymentProofFile);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={20} color="var(--gold-light)" />
          {t.addNewInvoice}
        </h3>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.invoiceCode}</label>
            <input 
              type="text" 
              value={invoiceCode}
              onChange={e => setInvoiceCode(e.target.value)}
              style={inputStyle}
              placeholder="e.g. INV-2026-001"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.clientName}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Escribe o selecciona..."
              />
              <select 
                style={{ ...inputStyle, width: '44px', padding: '0 4px', cursor: 'pointer' }}
                onChange={e => {
                  if (e.target.value) setClientName(e.target.value);
                  e.target.value = '';
                }}
                title="Seleccionar de la lista"
              >
                <option value="">▼</option>
                {Array.from(new Set([...companies.map(c => c.name), ...existingClients])).sort().map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.totalAmount}</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.paidAmount}</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Pending Balance (Auto-calculated)</label>
            <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
              ${pendingBalance.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.statusLabel}</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as InvoiceStatus)}
                style={inputStyle}
              >
                <option value="UNPAID">{t.status.UNPAID}</option>
                <option value="PARTIALLY_PAID">{t.status.PARTIALLY_PAID}</option>
                <option value="PAID">{t.status.PAID}</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.dueDate} *</label>
              <input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.receiptImage} (Optional)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ ...inputStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
              >
                <Camera size={16} color="var(--gold-light)" /> {receiptFile ? receiptFile.name : t.clickToUpload}
              </button>
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={e => handleFileSelect(e, setReceiptFile)}
                style={{ display: 'none' }}
              />
              {renderPreview(receiptFile)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{t.paymentDetails}</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.paymentMethod}</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  style={inputStyle}
                >
                  <option value="">Por Cobrar (Pendiente)</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Cash">Cash</option>
                  <option value="Wire">Wire Transfer</option>
                </select>
              </div>

              {paymentMethod && (paymentMethod === 'Zelle' || paymentMethod === 'Wire') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.transactionReference} *</label>
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
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.paymentProof} (Optional)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => paymentProofRef.current?.click()}
                  style={{ ...inputStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                >
                  <Camera size={16} color="var(--gold-light)" /> {paymentProofFile ? paymentProofFile.name : t.clickToUpload}
                </button>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  capture="environment" 
                  ref={paymentProofRef} 
                  onChange={e => handleFileSelect(e, setPaymentProofFile)}
                  style={{ display: 'none' }}
                />
                {renderPreview(paymentProofFile)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              {t.cancel}
            </button>
            <button 
              type="submit"
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              {t.saveInvoice}
            </button>
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

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle, Camera, FileText, PlusCircle } from 'lucide-react';
import type { Invoice } from './InvoiceDashboard';
import type { Company } from '../api';
import { t } from '../translations';
import { fetchPaymentsForInvoice, deletePayment } from '../paymentApi';
import type { InvoicePayment } from '../paymentApi';
import { AddPaymentModal } from './AddPaymentModal';

interface EditInvoiceModalProps {
  invoice: Invoice;
  onUpdate: (updatedInvoice: Invoice, receiptFile: File | null, proofFile: File | null) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onImageClick: (url: string) => void;
  companies: Company[];
  onManageCompanies: () => void;
  onLocalSync?: (invoice: Invoice) => void;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ invoice, onUpdate, onDelete, onClose, onImageClick, companies, onManageCompanies, onLocalSync }) => {
  const [clientName, setClientName] = useState(invoice.clientName);
  const [invoiceCode, setInvoiceCode] = useState(invoice.invoiceCode);
  const [totalAmount, setTotalAmount] = useState<number | ''>(invoice.totalAmount);
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payments State
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  const loadPayments = async () => {
    try {
      setIsLoadingPayments(true);
      const data = await fetchPaymentsForInvoice(invoice.id);
      setPayments(data);
      
      // Update parent state locally without saving to DB or closing the modal
      const calculatedTotalAbonado = data.reduce((sum, p) => sum + Number(p.monto), 0);
      const totalAmt = Number(invoice.totalAmount) || 0;
      const calcStatus = calculatedTotalAbonado >= totalAmt ? 'PAID' : calculatedTotalAbonado > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
      
      if (onLocalSync) {
        onLocalSync({ ...invoice, paidAmount: calculatedTotalAbonado, status: calcStatus });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [invoice.id]);

  const totalAbonado = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.monto), 0);
  }, [payments]);

  const pendingBalance = useMemo(() => {
    const total = Number(totalAmount) || 0;
    return Math.max(0, total - totalAbonado);
  }, [totalAmount, totalAbonado]);

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

    if (!invoiceCode.trim()) { setError('Invoice Code is required.'); return; }
    if (!clientName.trim()) { setError('Client Name is required.'); return; }
    if (total <= 0) { setError('Total Amount must be greater than 0.'); return; }
    if (!dueDate) { setError('Due Date is required.'); return; }

    const updatedInvoice: Invoice = {
      ...invoice,
      invoiceCode: invoiceCode.trim(),
      clientName: clientName.trim(),
      totalAmount: total,
      paidAmount: totalAbonado,
      pendingBalance,
      status: pendingBalance === 0 ? 'PAID' : (totalAbonado > 0 ? 'PARTIALLY_PAID' : 'UNPAID'),
      dueDate,
    };

    onUpdate(updatedInvoice, receiptFile, null);
  };

  const handleDelete = () => {
    if (window.confirm(t.deleteInvoicePrompt)) {
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
          {t.editInvoice}
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
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.invoiceCode}</label>
            <input 
              type="text" 
              value={invoiceCode}
              onChange={e => setInvoiceCode(e.target.value)}
              style={inputStyle}
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
                {Array.from(new Set(companies.map(c => c.name))).sort().map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onManageCompanies}
                title="Añadir / Borrar Empresas"
                style={{ ...inputStyle, width: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
              >
                ⚙️
              </button>
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
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Total Abonado (Automático)</label>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                ${totalAbonado.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Saldo Pendiente</label>
            <div style={{ ...inputStyle, background: 'rgba(212, 175, 55, 0.05)', color: 'var(--gold-light)', fontWeight: 700 }}>
              ${pendingBalance.toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.statusLabel} (Automático)</label>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                {totalAbonado === 0 ? 'Pendiente' : pendingBalance === 0 ? 'Pagada' : 'Abonada / Parcial'}
              </div>
            </div>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.receiptImage}</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ ...inputStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
              >
                <Camera size={16} color="var(--gold-light)" /> {receiptFile ? receiptFile.name : (invoice.receiptImage ? t.receiptImage : t.clickToUpload)}
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
                {t.cancel}
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

        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />



        {/* Historial de Abonos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--gold-light)" />
              Historial de Abonos
            </h4>
            <button
              type="button"
              onClick={() => setIsAddPaymentOpen(true)}
              disabled={pendingBalance <= 0}
              style={{
                padding: '8px 16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--gold-light)',
                border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.85rem', fontWeight: 600, cursor: pendingBalance <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', opacity: pendingBalance <= 0 ? 0.5 : 1
              }}
            >
              <PlusCircle size={16} />
              Nuevo Abono
            </button>
          </div>

          {isLoadingPayments ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando abonos...</div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)' }}>
              No hay abonos registrados para esta factura.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payments.map(p => (
                <div key={p.id} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(p.fecha_abono).toLocaleString('es-ES')}</div>
                    <div style={{ fontWeight: 800, color: 'var(--gold-light)' }}>${p.monto.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{p.metodo_pago}</span> {p.referencia ? `• Ref: ${p.referencia}` : ''}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('¿Eliminar abono? Se restaurará el saldo pendiente.')) {
                          await deletePayment(p.id, invoice.id, p.monto);
                          loadPayments();
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                      title="Eliminar Abono"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {p.notas && <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.notas}</div>}
                  
                  {p.attachments && p.attachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {p.attachments.map(att => (
                        <img
                          key={att.id}
                          src={att.file_url}
                          alt="comprobante"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                          onClick={() => onImageClick(att.file_url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isAddPaymentOpen && (
          <AddPaymentModal
            invoice={invoice}
            pendingBalance={pendingBalance}
            onClose={() => setIsAddPaymentOpen(false)}
            onSuccess={() => {
              setIsAddPaymentOpen(false);
              loadPayments();
            }}
          />
        )}
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

import React from 'react';
import { X, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import type { Invoice } from './InvoiceDashboard';
import { t } from '../translations';

interface RecycleBinModalProps {
  deletedInvoices: Invoice[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onClose: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({ deletedInvoices, onRestore, onPermanentDelete, onClose }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const calculateDaysLeft = (deletedAt?: string) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const today = new Date();
    const diffTime = today.getTime() - deletedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Trash2 size={24} color="#ef4444" />
          {t.recycleBin}
        </h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>
          Las facturas en la papelera se eliminarán permanentemente después de 30 días.
        </p>

        {deletedInvoices.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            <Trash2 size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-muted)' }}>{t.noDeletedInvoices}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {deletedInvoices.map(invoice => {
              const daysLeft = calculateDaysLeft(invoice.deletedAt);
              const deletedDate = invoice.deletedAt ? new Date(invoice.deletedAt).toLocaleDateString() : 'Desconocido';

              return (
                <div key={invoice.id} style={{ 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.1rem' }}>{invoice.clientName}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{invoice.invoiceCode}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: daysLeft <= 3 ? '#ef4444' : 'var(--text-dim)' }}>
                      <AlertTriangle size={14} />
                      {t.expiresIn} {daysLeft} {t.days} <span style={{ color: 'var(--border-color)', margin: '0 4px' }}>|</span> {t.deletedOn}: {deletedDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => onRestore(invoice.id)}
                      style={{ 
                        padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'var(--gold-gradient)', 
                        color: '#07090e', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                      }}
                    >
                      <RotateCcw size={16} />
                      {t.restore}
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que quieres eliminar esta factura DEFINITIVAMENTE? Esta acción no se puede deshacer.')) {
                          onPermanentDelete(invoice.id);
                        }
                      }}
                      style={{ 
                        padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'transparent', 
                        color: '#ef4444', border: '1px solid #ef4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'
                      }}
                    >
                      <Trash2 size={16} />
                      {t.permanentDelete}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Building2, Trash2, Phone, FileText, MapPin, PlusCircle, Plus } from 'lucide-react';
import type { Company } from '../api';
import { t } from '../translations';
import { toastService } from './Toast';

interface CompanyManagerModalProps {
  companies: Company[];
  onAdd: (company: Omit<Company, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const CompanyManagerModal: React.FC<CompanyManagerModalProps> = ({ companies, onAdd, onDelete, onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        taxId: taxId.trim(),
        phone: phone.trim(),
        address: address.trim()
      });
      // Reset form
      setName('');
      setTaxId('');
      setPhone('');
      setAddress('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      toastService.error(t.errorAddingCompany);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await toastService.confirm({
      message: t.deleteCompanyPrompt,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (ok) {
      await onDelete(id);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
    color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color="var(--gold-light)" />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>{t.frequentCompanies}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {isAdding ? (
            <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="var(--gold-light)" />
                {t.addNewCompany}
              </h4>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.companyName}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.taxId}</label>
                    <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.phone}</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.address}</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-dim)', border: 'none', cursor: 'pointer' }}>{t.cancel}</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? t.saving : t.saveCompany}
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', fontWeight: 500 }}
            >
              <PlusCircle size={20} /> {t.addCompany}
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {companies.length === 0 && !isAdding && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Building2 size={32} color="var(--text-dim)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-muted)' }}>{t.noCompanies}</p>
              </div>
            )}
            {companies.map(company => (
              <div key={company.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '4px' }}>{company.name}</div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {company.taxId && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={12}/> {company.taxId}</span>}
                    {company.phone && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {company.phone}</span>}
                    {company.address && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {company.address}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(company.id)} style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px', cursor: 'pointer', opacity: 0.8 }} title={t.delete}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

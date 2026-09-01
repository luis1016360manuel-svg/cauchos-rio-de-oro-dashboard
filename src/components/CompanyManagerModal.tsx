import React, { useState } from 'react';
import { X, Building2, Trash2, Phone, FileText, MapPin, PlusCircle, Plus, Edit2, Save } from 'lucide-react';
import type { Company } from '../api';
import { t } from '../translations';
import { toastService } from './Toast';

interface CompanyManagerModalProps {
  companies: Company[];
  onAdd: (company: Omit<Company, 'id'>) => Promise<void>;
  onUpdate: (company: Company, oldName?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const CompanyManagerModal: React.FC<CompanyManagerModalProps> = ({ 
  companies, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onClose 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Add form state
  const [addName, setAddName] = useState('');
  const [addTaxId, setAddTaxId] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAddress, setAddAddress] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [oldNameOriginal, setOldNameOriginal] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartEdit = (company: Company) => {
    setIsAdding(false);
    setEditingId(company.id);
    setEditName(company.name);
    setEditTaxId(company.taxId || '');
    setEditPhone(company.phone || '');
    setEditAddress(company.address || '');
    setOldNameOriginal(company.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditTaxId('');
    setEditPhone('');
    setEditAddress('');
    setOldNameOriginal('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      toastService.error('El nombre de la empresa no puede estar vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: addName.trim(),
        taxId: addTaxId.trim() || undefined,
        phone: addPhone.trim() || undefined,
        address: addAddress.trim() || undefined
      });
      toastService.success('Empresa registrada exitosamente');
      setAddName('');
      setAddTaxId('');
      setAddPhone('');
      setAddAddress('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      toastService.error(t.errorAddingCompany);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent, companyId: string) => {
    e.preventDefault();
    if (!editName.trim()) {
      toastService.error('El nombre de la empresa no puede estar vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedComp: Company = {
        id: companyId,
        name: editName.trim(),
        taxId: editTaxId.trim() || undefined,
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined
      };
      await onUpdate(updatedComp, oldNameOriginal);
      toastService.success('Empresa y facturas asociadas actualizadas con éxito');
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      toastService.error('Error al actualizar la empresa');
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
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={26} color="var(--gold-light)" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>{t.frequentCompanies}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gestiona o edita tus empresas registradas</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Add New Company Form */}
          {isAdding ? (
            <form onSubmit={handleAddSubmit} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="var(--gold-light)" />
                {t.addNewCompany}
              </h4>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.companyName} *</label>
                  <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Ej. Inversiones El Diamante C.A." style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.taxId}</label>
                    <input type="text" value={addTaxId} onChange={e => setAddTaxId(e.target.value)} placeholder="J-12345678-9" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.phone}</label>
                    <input type="text" value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="+58 414 1234567" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{t.address}</label>
                  <input type="text" value={addAddress} onChange={e => setAddAddress(e.target.value)} placeholder="Av. Principal, Local 1" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-dim)', border: 'none', cursor: 'pointer' }}>{t.cancel}</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 18px', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? t.saving : t.saveCompany}
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => { handleCancelEdit(); setIsAdding(true); }}
              style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 500 }}
            >
              <PlusCircle size={18} /> {t.addCompany}
            </button>
          )}

          {/* Companies List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {companies.length === 0 && !isAdding && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Building2 size={32} color="var(--text-dim)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-muted)' }}>{t.noCompanies}</p>
              </div>
            )}
            
            {companies.map(company => {
              const isEditingThis = editingId === company.id;

              if (isEditingThis) {
                // In-place inline edit form
                return (
                  <form 
                    key={company.id} 
                    onSubmit={(e) => handleSaveEdit(e, company.id)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,0,0,0.3))',
                      border: '1px solid rgba(212,175,55,0.4)',
                      borderRadius: '12px',
                      padding: '18px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Edit2 size={16} color="var(--gold-light)" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                        Modificando: {oldNameOriginal}
                      </span>
                    </div>

                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '14px', fontSize: '0.78rem', color: 'var(--gold-bright)' }}>
                      ⚠️ Si cambias el nombre, se actualizará en todas las facturas asociadas.
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Nombre de la Empresa *</label>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          style={inputStyle} 
                          required 
                          autoFocus
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>RIF / Identificación</label>
                          <input 
                            type="text" 
                            value={editTaxId} 
                            onChange={e => setEditTaxId(e.target.value)} 
                            style={inputStyle} 
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Teléfono</label>
                          <input 
                            type="text" 
                            value={editPhone} 
                            onChange={e => setEditPhone(e.target.value)} 
                            style={inputStyle} 
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Dirección Fiscal</label>
                        <input 
                          type="text" 
                          value={editAddress} 
                          onChange={e => setEditAddress(e.target.value)} 
                          style={inputStyle} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                      <button 
                        type="button" 
                        onClick={handleCancelEdit} 
                        style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text-dim)', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        style={{ 
                          padding: '7px 16px', 
                          background: 'var(--gold-gradient)', 
                          color: '#07090e', 
                          border: 'none', 
                          borderRadius: '6px', 
                          fontWeight: 600, 
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Save size={14} />
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                );
              }

              // Normal Card View
              return (
                <div 
                  key={company.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '14px 16px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '4px' }}>
                      {company.name}
                    </div>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      {company.taxId && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={12}/> {company.taxId}</span>}
                      {company.phone && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {company.phone}</span>}
                      {company.address && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {company.address}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button 
                      type="button"
                      onClick={() => handleStartEdit(company)} 
                      style={{ 
                        background: 'rgba(212,175,55,0.12)', 
                        border: '1px solid rgba(212,175,55,0.3)', 
                        color: 'var(--gold-light)', 
                        padding: '7px 12px', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }} 
                      title="Editar Empresa"
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(company.id)} 
                      style={{ 
                        background: 'rgba(239,68,68,0.08)', 
                        border: '1px solid rgba(239,68,68,0.2)', 
                        color: '#ef4444', 
                        padding: '7px', 
                        borderRadius: '8px', 
                        cursor: 'pointer' 
                      }} 
                      title={t.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

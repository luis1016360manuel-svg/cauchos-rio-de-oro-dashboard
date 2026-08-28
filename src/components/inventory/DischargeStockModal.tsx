import React, { useState } from 'react';
import { X, ArrowDownRight, PackageMinus } from 'lucide-react';
import type { InventoryItem } from './InventoryTypes';
import { toastService } from '../Toast';

interface DischargeStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onDischarge: (quantity: number, clientName?: string, invoiceReference?: string) => void;
}

export const DischargeStockModal: React.FC<DischargeStockModalProps> = ({ item, onClose, onDischarge }) => {
  const [quantity, setQuantity] = useState('1');
  const [clientName, setClientName] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty <= 0 || qty > item.quantity) {
      toastService.warning(`Cantidad inválida. Stock disponible: ${item.quantity} u.`);
      return;
    }
    onDischarge(qty, clientName.trim(), invoiceReference.trim());
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-dim)',
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

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PackageMinus size={24} color="#f59e0b" />
          Descargar Inventario
        </h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>
          {item.brand} {item.model} ({item.size}) - Stock disponible: <strong>{item.quantity}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Cantidad a descargar</label>
            <input 
              type="number" 
              min="1" 
              max={item.quantity}
              required 
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cliente (Opcional)</label>
            <input 
              type="text" 
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ej. Empresa ABC"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Referencia / N° Factura (Opcional)</label>
            <input 
              type="text" 
              value={invoiceReference}
              onChange={e => setInvoiceReference(e.target.value)}
              placeholder="Ej. FAC-001"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowDownRight size={18} />
              Confirmar Descarga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

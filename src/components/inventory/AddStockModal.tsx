import React, { useState } from 'react';
import { X, Save, Package } from 'lucide-react';
import type { InventoryItem } from './InventoryTypes';

interface AddStockModalProps {
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  initialData?: InventoryItem | null;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ onClose, onSave, initialData }) => {
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [size, setSize] = useState(initialData?.size || '');
  const [unitCost, setUnitCost] = useState(initialData?.unitCost.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice.toString() || '');
  const [quantity, setQuantity] = useState(initialData?.quantity.toString() || '1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      brand: brand.trim(),
      model: model.trim(),
      size: size.trim(),
      unitCost: parseFloat(unitCost) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      quantity: parseInt(quantity) || 0
    });
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

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Package size={24} color="var(--gold-light)" />
          {initialData ? 'Editar Inventario' : 'Añadir al Inventario'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Marca (Ej. Kumho)</label>
            <input 
              type="text" 
              required 
              value={brand}
              onChange={e => setBrand(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Modelo</label>
            <input 
              type="text" 
              required 
              value={model}
              onChange={e => setModel(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Medida (Ej. 205/55R16)</label>
            <input 
              type="text" 
              required 
              value={size}
              onChange={e => setSize(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Costo Unitario ($)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                required 
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Precio de Venta ($)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                required 
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Cantidad en Stock</label>
            <input 
              type="number" 
              min="0" 
              required 
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
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
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={18} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

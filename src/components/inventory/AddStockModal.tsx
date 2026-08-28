import React, { useState } from 'react';
import { X, ArrowUpRight, PackagePlus } from 'lucide-react';
import type { InventoryItem } from './InventoryTypes';
import { toastService } from '../Toast';

interface AddStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: (quantityToAdd: number) => Promise<void>;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ item, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(qty);
      onClose();
    } catch (e) {
      toastService.error('Error al agregar stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          zIndex: 9999
        }}
      />
      
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-secondary)', padding: '32px', borderRadius: '24px',
        width: '90%', maxWidth: '400px', zIndex: 10000,
        border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
              <PackagePlus size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Cargar Inventario</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Ingresar nueva mercancía</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Artículo seleccionado</div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1.1rem' }}>{item.brand} {item.model}</div>
          <div style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>{item.size}</div>
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Stock actual: <strong style={{ color: 'var(--text-main)' }}>{item.quantity} u.</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Cantidad a Sumar
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="number"
                min="1"
                required
                autoFocus
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600
                }}
              />
              <div style={{ color: 'var(--text-dim)', fontWeight: 600 }}>unidades</div>
            </div>
            
            {parseInt(quantity) > 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                Nuevo stock total: <strong style={{ color: '#10b981', fontSize: '1rem' }}>{item.quantity + parseInt(quantity)} u.</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || parseInt(quantity) <= 0 || isNaN(parseInt(quantity))}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Guardando...' : (
                <>
                  <ArrowUpRight size={18} />
                  Confirmar Carga
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

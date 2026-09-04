import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, CheckCircle2, Eye, PackagePlus } from 'lucide-react';
import type { InventoryItem } from './InventoryTypes';
import type { ScannedTireItem } from './inventoryAiScanner';

interface AIStockScanConfirmModalProps {
  isOpen: boolean;
  scannedItems: ScannedTireItem[];
  existingInventory: InventoryItem[];
  imagePreviewUrl: string | null;
  onClose: () => void;
  onConfirmBatch: (items: ScannedTireItem[]) => Promise<void>;
}

export const AIStockScanConfirmModal: React.FC<AIStockScanConfirmModalProps> = ({
  isOpen,
  scannedItems: initialScannedItems,
  existingInventory,
  imagePreviewUrl,
  onClose,
  onConfirmBatch,
}) => {
  const [items, setItems] = useState<ScannedTireItem[]>(initialScannedItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Sync state when props change
  React.useEffect(() => {
    setItems(initialScannedItems);
  }, [initialScannedItems]);

  if (!isOpen) return null;

  // Calculate totals
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalCostValue = items.reduce((sum, it) => sum + ((Number(it.unitCost) || 0) * (Number(it.quantity) || 0)), 0);

  const handleFieldChange = (id: string, field: keyof ScannedTireItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };
      
      // Auto-extract rim if size changes
      if (field === 'size' && typeof value === 'string') {
        const rimMatch = value.match(/R\s*(\d+(?:\.\d+)?)/i) || value.match(/[\/-](\d+(?:\.\d+)?)$/);
        if (rimMatch && rimMatch[1]) {
          updated.rim = parseFloat(rimMatch[1]);
        }
      }

      // Auto-suggest selling price if cost changes and price is 0 or unassigned
      if (field === 'unitCost' && Number(value) > 0 && (!item.sellingPrice || item.sellingPrice === Math.round(item.unitCost * 1.35 * 100) / 100)) {
        updated.sellingPrice = Math.round(Number(value) * 1.35 * 100) / 100;
      }

      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleAddNewRow = () => {
    const newItem: ScannedTireItem = {
      id: `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      brand: '',
      model: 'Radial',
      size: '',
      rim: 15,
      quantity: 4,
      unitCost: 0,
      sellingPrice: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  // Helper to find match in existing inventory
  const getExistingMatch = (brand: string, size: string): InventoryItem | undefined => {
    if (!brand || !size) return undefined;
    return existingInventory.find(inv => 
      inv.brand.trim().toLowerCase() === brand.trim().toLowerCase() &&
      inv.size.trim().toLowerCase() === size.trim().toLowerCase()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Validate
    const invalidItem = items.find(it => !it.brand.trim() || !it.size.trim() || it.quantity <= 0);
    if (invalidItem) {
      alert('Por favor verifica que todos los cauchos tengan Marca, Medida y una Cantidad mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmBatch(items);
      onClose();
    } catch (err: any) {
      console.error('Error confirming batch:', err);
      alert(err.message || 'Error al ingresar el lote de cauchos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '1050px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', position: 'relative',
        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        border: '1px solid rgba(212, 175, 55, 0.35)'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(212,175,55,0.08), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(212,175,55,0.3)'
            }}>
              <Sparkles size={22} color="var(--gold-light)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Confirmar Carga de Cauchos (Lectura IA)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Revisa y ajusta los cauchos detectados en la foto antes de agregarlos al inventario.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Ítems / Medidas:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Cauchos:</span>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem', background: 'rgba(16,185,129,0.12)', padding: '2px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.25)' }}>
                +{totalUnits} u.
              </span>
            </div>
            {totalCostValue > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Costo Total Lote:</span>
                <span style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '1rem' }}>
                  ${totalCostValue.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {imagePreviewUrl && (
            <button
              type="button"
              onClick={() => setShowFullImage(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <Eye size={14} /> Ver Foto Escaneada
            </button>
          )}
        </div>

        {/* Items Table Container */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No hay cauchos en la lista. Puedes agregar uno manualmente con el botón inferior.
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px', width: '18%' }}>Marca *</th>
                    <th style={{ padding: '10px 12px', width: '15%' }}>Modelo / Diseño</th>
                    <th style={{ padding: '10px 12px', width: '16%' }}>Medida *</th>
                    <th style={{ padding: '10px 12px', width: '8%' }}>Rin</th>
                    <th style={{ padding: '10px 12px', width: '11%' }}>Ingreso (+u) *</th>
                    <th style={{ padding: '10px 12px', width: '10%' }}>Costo ($)</th>
                    <th style={{ padding: '10px 12px', width: '10%' }}>Precio ($)</th>
                    <th style={{ padding: '10px 12px', width: '12%' }}>Estado</th>
                    <th style={{ padding: '10px 12px', width: '5%', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const match = getExistingMatch(item.brand, item.size);

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        
                        {/* Marca */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            value={item.brand}
                            onChange={(e) => handleFieldChange(item.id, 'brand', e.target.value)}
                            placeholder="Ej. Goodyear"
                            style={inputStyle}
                            required
                          />
                        </td>

                        {/* Modelo */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) => handleFieldChange(item.id, 'model', e.target.value)}
                            placeholder="Ej. AT / Radial"
                            style={inputStyle}
                          />
                        </td>

                        {/* Medida */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            value={item.size}
                            onChange={(e) => handleFieldChange(item.id, 'size', e.target.value)}
                            placeholder="Ej. 265/70R16"
                            style={{ ...inputStyle, fontWeight: 600, color: 'var(--gold-bright)' }}
                            required
                          />
                        </td>

                        {/* Rin */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            step="0.5"
                            value={item.rim || ''}
                            onChange={(e) => handleFieldChange(item.id, 'rim', Number(e.target.value))}
                            placeholder="16"
                            style={inputStyle}
                          />
                        </td>

                        {/* Cantidad (+u) */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleFieldChange(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ ...inputStyle, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.3)' }}
                            required
                          />
                        </td>

                        {/* Costo ($) */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost === 0 ? '' : item.unitCost}
                            onChange={(e) => handleFieldChange(item.id, 'unitCost', Number(e.target.value) || 0)}
                            placeholder="0.00"
                            style={inputStyle}
                          />
                        </td>

                        {/* Precio ($) */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.sellingPrice === 0 ? '' : item.sellingPrice}
                            onChange={(e) => handleFieldChange(item.id, 'sellingPrice', Number(e.target.value) || 0)}
                            placeholder="0.00"
                            style={{ ...inputStyle, fontWeight: 600, color: 'var(--gold-light)' }}
                          />
                        </td>

                        {/* Estado / Match */}
                        <td style={{ padding: '8px 10px' }}>
                          {match ? (
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 600,
                              padding: '4px 8px', borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }} title={`Existencia actual: ${match.quantity} u. Se sumará esta carga.`}>
                              <CheckCircle2 size={12} /> Stock: {match.quantity} u.
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 600,
                              padding: '4px 8px', borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              <PackagePlus size={12} /> Nuevo Ítem
                            </span>
                          )}
                        </td>

                        {/* Eliminar fila */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            style={{
                              background: 'none', border: 'none', color: '#ef4444',
                              cursor: 'pointer', padding: '6px', opacity: 0.7
                            }}
                            title="Eliminar este ítem"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add row button */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleAddNewRow}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)',
                color: 'var(--gold-light)', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={15} /> Agregar otra fila de cauchos
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '18px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.3)', flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            ⚠️ Al confirmar, se actualizará el stock y se registrará la entrada en el historial de cargas.
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                background: 'transparent', border: '1px solid var(--border-color)',
                color: 'var(--text-dim)', fontSize: '0.9rem', cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || items.length === 0}
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: 'var(--gold-gradient)', color: '#07090e', border: 'none',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: (isSubmitting || items.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: (isSubmitting || items.length === 0) ? 0.6 : 1,
                boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
              }}
            >
              <PackagePlus size={18} />
              {isSubmitting ? 'Ingresando cauchos...' : `Confirmar e Ingresar ${totalUnits} Caucho${totalUnits === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>

      </div>

      {/* Enlarged Photo Modal */}
      {showFullImage && imagePreviewUrl && (
        <div
          onClick={() => setShowFullImage(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setShowFullImage(false)}
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                background: '#ef4444', color: '#fff', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}
            >
              <X size={18} />
            </button>
            <img
              src={imagePreviewUrl}
              alt="Foto Escaneada"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

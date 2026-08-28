import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Zap, ChevronDown } from 'lucide-react';
import type { InventoryItem } from './InventoryTypes';
import { toastService } from '../Toast';

interface QuickAddModalProps {
  onClose: () => void;
  onSave: (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'quantity'>, quantityToAdd: number) => Promise<void>;
  existingItems: InventoryItem[];
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose, onSave, existingItems }) => {
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSizeSuggestions, setShowSizeSuggestions] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  const sizeInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Focus the first input on mount
  useEffect(() => {
    sizeInputRef.current?.focus();
  }, []);

  // Calculate unique sizes
  const uniqueSizes = useMemo(() => {
    const sizes = existingItems.map(i => i.size.trim().toUpperCase());
    return Array.from(new Set(sizes)).filter(Boolean).sort();
  }, [existingItems]);

  const filteredSizes = useMemo(() => {
    return uniqueSizes.filter(s => s.toLowerCase().includes(size.toLowerCase()));
  }, [size, uniqueSizes]);

  // Calculate all unique brands globally
  const allUniqueBrands = useMemo(() => {
    const brands = existingItems.map(i => i.brand.trim().toUpperCase());
    return Array.from(new Set(brands)).filter(Boolean).sort();
  }, [existingItems]);

  const filteredBrands = useMemo(() => {
    if (!brand) return allUniqueBrands;
    return allUniqueBrands.filter(b => b.toLowerCase().includes(brand.toLowerCase()));
  }, [brand, allUniqueBrands]);

  // Calculate Cost Reactively
  const unitCost = useMemo(() => {
    const price = parseFloat(sellingPrice);
    if (isNaN(price)) return 0;
    return Math.round(price * 0.70 * 100) / 100;
  }, [sellingPrice]);

  // Extract Rim from Size
  const extractedRim = useMemo(() => {
    const match = size.match(/R(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }, [size]);

  // Handle Selection of an existing brand to auto-fill prices
  const handleSelectBrand = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setShowBrandSuggestions(false);
    
    const existing = existingItems.find(i => i.size.toLowerCase() === size.toLowerCase() && i.brand.toLowerCase() === selectedBrand.toLowerCase());
    if (existing) {
      setSellingPrice(existing.sellingPrice.toString());
      // Jump to quantity
      setTimeout(() => quantityInputRef.current?.focus(), 50);
    } else {
      setTimeout(() => priceInputRef.current?.focus(), 50);
    }
  };

  const handleSelectSize = (selectedSize: string) => {
    setSize(selectedSize);
    setShowSizeSuggestions(false);
    setTimeout(() => brandInputRef.current?.focus(), 50);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!size || !brand || !sellingPrice || !quantity) return;

    setIsSubmitting(true);
    try {
      await onSave({
        brand: brand.trim(),
        model: '', // Kept empty as per previous logic (all in brand)
        size: size.trim(),
        rim: extractedRim,
        unitCost,
        sellingPrice: parseFloat(sellingPrice) || 0
      }, parseInt(quantity) || 0);

      // Reset form for continuous fast typing
      setSize('');
      setBrand('');
      setSellingPrice('');
      setQuantity('1');
      setTimeout(() => sizeInputRef.current?.focus(), 50);
    } catch (e) {
      toastService.error('Error guardando en inventario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If we are in the size input and we press enter, if there's exactly one suggestion and we haven't typed it exactly, select it
      if (e.currentTarget === sizeInputRef.current && filteredSizes.length > 0 && showSizeSuggestions) {
        handleSelectSize(filteredSizes[0]);
      } else if (e.currentTarget === brandInputRef.current && filteredBrands.length > 0 && showBrandSuggestions) {
        handleSelectBrand(filteredBrands[0]);
      } else {
        if (showSizeSuggestions) setShowSizeSuggestions(false);
        if (showBrandSuggestions) setShowBrandSuggestions(false);
        nextRef.current?.focus();
      }
    }
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
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

  const suggestionsDropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#1a1f2e',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Zap size={20} />
          </div>
          Ingreso Rápido (Quick Add)
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* MEDIDA */}
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Medida (Buscar o Nueva)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  ref={sizeInputRef}
                  type="text" 
                  required 
                  value={size}
                  onChange={e => { setSize(e.target.value); setShowSizeSuggestions(true); }}
                  onFocus={() => setShowSizeSuggestions(true)}
                  onClick={() => setShowSizeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSizeSuggestions(false), 200)}
                  onKeyDown={e => handleKeyDown(e, brandInputRef)}
                  placeholder="Ej. 205/55R16"
                  style={inputStyle}
                  autoComplete="off"
                />
                <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {showSizeSuggestions && filteredSizes.length > 0 && (
                <div style={suggestionsDropdownStyle}>
                  {filteredSizes.map(s => (
                    <div 
                      key={s} 
                      onClick={() => handleSelectSize(s)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MARCA */}
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Marca / Modelo</label>
              <div style={{ position: 'relative' }}>
                <input 
                  ref={brandInputRef}
                  type="text" 
                  required 
                  value={brand}
                  onChange={e => { setBrand(e.target.value); setShowBrandSuggestions(true); }}
                  onFocus={() => setShowBrandSuggestions(true)}
                  onClick={() => setShowBrandSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                  onKeyDown={e => handleKeyDown(e, priceInputRef)}
                  placeholder="Ej. KUMHO AT52"
                  style={inputStyle}
                  autoComplete="off"
                />
                <ChevronDown size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>

              {showBrandSuggestions && (
                <div style={suggestionsDropdownStyle}>
                  {filteredBrands.map(b => (
                    <div 
                      key={b} 
                      onClick={() => handleSelectBrand(b)}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {b}
                    </div>
                  ))}
                  {brand && !allUniqueBrands.some(b => b.toLowerCase() === brand.toLowerCase()) && (
                    <div 
                      onClick={() => { setShowBrandSuggestions(false); setTimeout(() => priceInputRef.current?.focus(), 50); }}
                      style={{ padding: '12px 16px', cursor: 'pointer', color: '#10b981', fontWeight: 600, transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      + Crear / Usar "{brand}"
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* CANTIDAD (STOCK) */}
            <div>
              <label style={labelStyle}>Unidades a ingresar</label>
              <input 
                ref={quantityInputRef}
                type="number" 
                min="1" 
                required 
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                onKeyDown={submitOnEnter}
                style={{ ...inputStyle, background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 600 }}
              />
            </div>

            {/* PRECIO VENTA */}
            <div>
              <label style={labelStyle}>Precio de Venta ($)</label>
              <input 
                ref={priceInputRef}
                type="number" 
                min="0" 
                step="0.01" 
                required 
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                onKeyDown={e => handleKeyDown(e, quantityInputRef)}
                style={inputStyle}
              />
            </div>

            {/* COSTO (CALCULADO) */}
            <div>
              <label style={labelStyle}>Costo (-30%)</label>
              <input 
                type="text" 
                value={`$${unitCost}`}
                readOnly
                style={{ ...inputStyle, background: 'rgba(0,0,0,0.2)', color: 'var(--text-dim)', borderStyle: 'dashed' }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Rin extraído automáticamente: <strong>{extractedRim ? `R${extractedRim}` : 'Ninguno'}</strong></span>
            <span>Usa <kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Enter</kbd> para avanzar y guardar</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              Cerrar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)', background: '#10b981', color: '#000', border: 'none', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar y Continuar (Upsert)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

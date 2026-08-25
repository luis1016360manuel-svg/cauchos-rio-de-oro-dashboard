import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Loader } from 'lucide-react';
import { fetchInventoryMovements, type InventoryMovement } from './inventoryApi';

interface InventoryMovementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryMovementsDrawer: React.FC<InventoryMovementsDrawerProps> = ({ isOpen, onClose }) => {
  const [period, setPeriod] = useState<'Diario' | 'Semanal' | 'Mensual' | 'Anual'>('Semanal');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchInventoryMovements()
        .then(data => setMovements(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);



  // Filter movements by period
  const filteredMovements = useMemo(() => {
    const now = new Date();
    return movements.filter(m => {
      if (!m.date) return false;
      const d = new Date(m.date);
      if (isNaN(d.getTime())) return false; // Skip invalid dates
      
      if (period === 'Diario') {
        return d.toDateString() === now.toDateString();
      }
      if (period === 'Semanal') {
        const diff = now.getTime() - d.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (period === 'Mensual') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (period === 'Anual') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [movements, period]);

  // Calculate stats based on filtered movements
  const totalIn = filteredMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.qty, 0);
  const totalOut = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.qty, 0);
  const maxBar = Math.max(totalIn, totalOut, 1);
  const inPercent = (totalIn / maxBar) * 100;
  const outPercent = (totalOut / maxBar) * 100;

  // Monthly breakdown for Anual view
  const monthlyBreakdown = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const breakdown = months.map(m => ({ month: m, in: 0, out: 0 }));
    
    if (period === 'Anual') {
      filteredMovements.forEach(m => {
        if (!m.date) return;
        const d = new Date(m.date);
        if (isNaN(d.getTime())) return;
        
        const mIndex = d.getMonth();
        if (mIndex >= 0 && mIndex < 12) {
          if (m.type === 'IN') breakdown[mIndex].in += m.qty;
          else breakdown[mIndex].out += m.qty;
        }
      });
    }
    return breakdown;
  }, [filteredMovements, period]);

  const maxMonthly = Math.max(...monthlyBreakdown.map(m => Math.max(m.in, m.out, 1)));

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 999
        }}
      />
      
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: '500px',
          background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>

        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowDownRight size={24} color="var(--gold-light)" />
              Flujo de Inventario
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Análisis de Cargas y Descargas</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '50%', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Calendar size={18} color="var(--text-dim)" />
            <select 
              value={period}
              onChange={e => setPeriod(e.target.value as any)}
              style={{
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', 
                border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', flex: 1,
                outline: 'none', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <option value="Diario">Hoy</option>
              <option value="Semanal">Esta Semana</option>
              <option value="Mensual">Este Mes</option>
              <option value="Anual">Este Año (Desglose)</option>
            </select>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '16px', fontWeight: 600 }}>Resumen del Periodo ({period})</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowUpRight size={14}/> Cargas (Entradas Totales)</span>
                  <span style={{ color: 'var(--text-main)' }}>+{totalIn} unds</span>
                </div>
                {period !== 'Anual' && (
                  <div style={{ width: '100%', height: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: inPercent + '%', background: '#10b981', borderRadius: '6px', transition: 'width 0.5s ease-out' }} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowDownRight size={14}/> Descargas (Salidas Totales)</span>
                  <span style={{ color: 'var(--text-main)' }}>{totalOut} unds</span>
                </div>
                {period !== 'Anual' && (
                  <div style={{ width: '100%', height: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: outPercent + '%', background: '#ef4444', borderRadius: '6px', transition: 'width 0.5s ease-out' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Desglose Mensual (Solo si es Anual) */}
            {period === 'Anual' && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <h5 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Desglose por Mes</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {monthlyBreakdown.filter(m => m.in > 0 || m.out > 0).map(m => (
                    <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>{m.month}</span>
                      
                      {/* In Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(16,185,129,0.1)', borderRadius: '3px' }}>
                          <div style={{ height: '100%', width: (m.in / maxMonthly) * 100 + '%', background: '#10b981', borderRadius: '3px' }} />
                        </div>
                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, width: '28px' }}>+{m.in}</span>
                      </div>

                      {/* Out Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(239,68,68,0.1)', borderRadius: '3px' }}>
                          <div style={{ height: '100%', width: (m.out / maxMonthly) * 100 + '%', background: '#ef4444', borderRadius: '3px' }} />
                        </div>
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, width: '28px' }}>{m.out}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '16px', fontWeight: 600 }}>
              Historial de Movimientos {loading && <Loader size={14} className="spin" style={{ display: 'inline-block', marginLeft: '8px' }} />}
            </h4>
            <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Llanta</th>
                    <th style={{ padding: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Mov.</th>
                    <th style={{ padding: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay movimientos en este periodo</td>
                    </tr>
                  )}
                  {filteredMovements.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {new Date(m.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {m.item}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: m.type === 'IN' ? '#10b981' : '#ef4444' }}>
                        {m.type === 'IN' ? '+' : ''}{m.qty}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ color: 'var(--text-main)' }}>{m.reason}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>por {m.user}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

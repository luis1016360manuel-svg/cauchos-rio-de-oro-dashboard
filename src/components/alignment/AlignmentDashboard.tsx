import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, Car, Banknote, CalendarRange, CheckCircle2, Trash2, RefreshCw, Edit, X } from 'lucide-react';
import type { AlignmentService } from './AlignmentTypes';
import { fetchAlignments, createAlignment, deleteAlignment, liquidateAlignments, toggleAlignmentStatus, autoCleanupOldAlignments, updateAlignment } from './alignmentApi';
import { AddAlignmentForm } from './AddAlignmentForm';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const AlignmentDashboard: React.FC = () => {
  const [services, setServices] = useState<AlignmentService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<AlignmentService | null>(null);
  const [isWeeklyBreakdownOpen, setIsWeeklyBreakdownOpen] = useState(false);
  const [filterState, setFilterState] = useState<'all' | 'pendiente' | 'pagado'>('all');
  const [isLiquidating, setIsLiquidating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await autoCleanupOldAlignments(); // Borrar automáticamente los de >15 días
      const data = await fetchAlignments();
      setServices(data);
    } catch (e) {
      console.error(e);
      alert('Error cargando servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    if (editingService) {
      const updatedSvc = await updateAlignment(editingService.id, payload);
      setServices(prev => {
        const updatedList = prev.map(s => s.id === updatedSvc.id ? updatedSvc : s);
        return updatedList.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      });
      setEditingService(null);
    } else {
      const newSvc = await createAlignment(payload);
      setServices(prev => {
        const updatedList = [newSvc, ...prev];
        return updatedList.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      });
    }
  };

  const handleToggleStatus = async (svc: AlignmentService) => {
    const newStatus = svc.estado_pago === 'pagado' ? 'pendiente' : 'pagado';
    try {
      await toggleAlignmentStatus(svc.id, newStatus);
      const now = new Date().toISOString();
      setServices(prev => prev.map(s => 
        s.id === svc.id ? { ...s, estado_pago: newStatus, fecha_pago: newStatus === 'pagado' ? now : undefined, updated_at: now } : s
      ));
    } catch (e) {
      console.error(e);
      alert('Error cambiando estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) {
      try {
        await deleteAlignment(id);
        setServices(prev => prev.filter(s => s.id !== id));
      } catch (e) {
        console.error(e);
        alert('Error eliminando servicio');
      }
    }
  };

  const handleLiquidate = async () => {
    const pendientes = services.filter(s => s.estado_pago === 'pendiente');
    if (!pendientes.length) return;

    if (window.confirm(`¿Confirmas liquidar ${pendientes.length} servicio(s) por un total de ${formatCurrency(totalAPagar)}?`)) {
      setIsLiquidating(true);
      try {
        const ids = pendientes.map(s => s.id);
        await liquidateAlignments(ids);
        
        // Update local state instead of full reload for speed
        const now = new Date().toISOString();
        setServices(prev => prev.map(s => 
          ids.includes(s.id) ? { ...s, estado_pago: 'pagado', fecha_pago: now, updated_at: now } : s
        ));
      } catch (e) {
        console.error(e);
        alert('Error liquidando servicios');
      } finally {
        setIsLiquidating(false);
      }
    }
  };

  // Calculations
  const filteredServices = useMemo(() => {
    if (filterState === 'all') return services;
    return services.filter(s => s.estado_pago === filterState);
  }, [services, filterState]);

  const getServiceWeight = (tipo: string) => {
    return (tipo === 'delantera_trasera' || tipo === 'doble_camioneta') ? 2 : 1;
  };

  const carrosHoy = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return services
      .filter(s => s.fecha.startsWith(today))
      .reduce((sum, s) => sum + getServiceWeight(s.servicio_tipo), 0);
  }, [services]);

  const carrosSemana = useMemo(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return services
      .filter(s => new Date(s.fecha) >= lastWeek)
      .reduce((sum, s) => sum + getServiceWeight(s.servicio_tipo), 0);
  }, [services]);

  const carrosSemanaBreakdown = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    
    const breakdown = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const count = services
        .filter(s => s.fecha.startsWith(dateStr))
        .reduce((sum, s) => sum + getServiceWeight(s.servicio_tipo), 0);
        
      const formattedDate = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      breakdown.push({
        dateStr,
        label: i === 0 ? `Hoy (${formattedDate})` : formattedDate,
        count
      });
    }
    return breakdown;
  }, [services]);

  const totalAPagar = useMemo(() => {
    return services.filter(s => s.estado_pago === 'pendiente')
                   .reduce((acc, s) => acc + Number(s.monto_alineador), 0);
  }, [services]);


  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--gold-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings2 color="var(--gold-light)" size={32} />
            Alineación
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Control y liquidación de servicios</p>
        </div>

        <button 
          onClick={() => { setEditingService(null); setIsAddFormOpen(true); }}
          style={{ 
            padding: '10px 24px', borderRadius: 'var(--radius-full)', 
            background: 'var(--gold-gradient)', color: '#07090e', border: 'none', 
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Car size={18} />
          Registrar Servicio
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* KPI 1 */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <Car size={28} color="var(--text-dim)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Atendidos Hoy</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{carrosHoy} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-dim)' }}>vehículos</span></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          className="glass-panel" 
          onClick={() => {
            console.log('Semana card clicked!');
            setIsWeeklyBreakdownOpen(true);
          }}
          style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
          onMouseOut={e=>e.currentTarget.style.transform='none'}
        >
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <CalendarRange size={28} color="var(--text-dim)" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Semana (Últimos 7 días)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{carrosSemana} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-dim)' }}>vehículos</span></div>
          </div>
        </div>

        {/* KPI 3 - Total a Pagar */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px' }}>
            <Banknote size={28} color="var(--gold-light)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--gold-light)', fontWeight: 600, textTransform: 'uppercase' }}>Pendiente por Pagar</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(totalAPagar)}</div>
          </div>
          {totalAPagar > 0 && (
            <button
              onClick={handleLiquidate}
              disabled={isLiquidating}
              style={{
                padding: '10px 16px', borderRadius: '8px', background: 'var(--gold-gradient)', color: '#000',
                border: 'none', fontWeight: 700, cursor: isLiquidating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <CheckCircle2 size={18} />
              Liquidar
            </button>
          )}
        </div>
      </div>

      {/* Tabs / Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <button
          onClick={() => setFilterState('all')}
          style={{
            padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem',
            background: filterState === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: filterState === 'all' ? 'var(--gold-light)' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer'
          }}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterState('pendiente')}
          style={{
            padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem',
            background: filterState === 'pendiente' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: filterState === 'pendiente' ? '#ef4444' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer'
          }}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilterState('pagado')}
          style={{
            padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.95rem',
            background: filterState === 'pagado' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: filterState === 'pagado' ? '#10b981' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer'
          }}
        >
          Pagados
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem' }}>Fecha</th>
                <th style={{ padding: '16px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem' }}>Vehículo</th>
                <th style={{ padding: '16px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem' }}>Servicio</th>
                <th style={{ padding: '16px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem' }}>Monto a Pagar</th>
                <th style={{ padding: '16px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem' }}>Estado</th>
                <th style={{ padding: '16px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((svc) => (
                <tr key={svc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                    {new Date(svc.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                      {svc.vehiculo_tipo}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {svc.placa_vehiculo || 'Sin placa'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                    {svc.servicio_tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--gold-light)' }}>
                    {formatCurrency(svc.monto_alineador)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => handleToggleStatus(svc)}
                      title="Clic para cambiar estado (Corrección de error)"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {svc.estado_pago === 'pagado' ? (
                        <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='0.7'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                          PAGADO
                        </span>
                      ) : (
                        <span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)', transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity='0.7'} onMouseOut={e=>e.currentTarget.style.opacity='1'}>
                          PENDIENTE
                        </span>
                      )}
                      <RefreshCw size={12} color="var(--text-dim)" />
                    </button>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => { setEditingService(svc); setIsAddFormOpen(true); }}
                        title="Editar"
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(svc.id)}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8 }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay servicios registrados en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddFormOpen && (
        <AddAlignmentForm 
          initialData={editingService || undefined}
          onAdd={handleSave}
          onClose={() => {
            setIsAddFormOpen(false);
            setEditingService(null);
          }}
        />
      )}

      {isWeeklyBreakdownOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsWeeklyBreakdownOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarRange size={22} color="var(--gold-light)" />
              Resumen Semanal
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>Desglose de vehículos atendidos por día (últimos 7 días).</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {carrosSemanaBreakdown.map(day => (
                <div key={day.dateStr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600, textTransform: 'capitalize' }}>{day.label}</span>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 800, fontSize: '1.2rem' }}>{day.count} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>veh.</span></span>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.4rem' }}>{carrosSemana}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

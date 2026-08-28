import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle, CarFront } from 'lucide-react';
import type { CreateAlignmentPayload, VehiculoTipo, ServicioTipo, AlignmentService } from './AlignmentTypes';
import { toastService } from '../Toast';

interface AddAlignmentFormProps {
  onAdd: (payload: CreateAlignmentPayload) => Promise<void>;
  onClose: () => void;
  initialData?: AlignmentService;
}

export const AddAlignmentForm: React.FC<AddAlignmentFormProps> = ({ onAdd, onClose, initialData }) => {
  const [placa, setPlaca] = useState(initialData?.placa_vehiculo || '');
  const [vehiculoTipo, setVehiculoTipo] = useState<VehiculoTipo>(initialData?.vehiculo_tipo || 'carro');
  const [servicioTipo, setServicioTipo] = useState<ServicioTipo>(initialData?.servicio_tipo || 'delantera');
  const [fechaStr, setFechaStr] = useState(initialData?.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-ajustar el servicio si cambia a carro y tenía doble_camioneta
  useEffect(() => {
    if (vehiculoTipo === 'carro' && servicioTipo === 'doble_camioneta') {
      setServicioTipo('delantera');
    }
  }, [vehiculoTipo, servicioTipo]);

  const montoAlineador = (servicioTipo === 'doble_camioneta' || servicioTipo === 'delantera_trasera') ? 15.00 : 7.50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAdd({
        placa_vehiculo: placa.trim() || undefined,
        vehiculo_tipo: vehiculoTipo,
        servicio_tipo: servicioTipo,
        monto_alineador: montoAlineador,
        fecha: fechaStr ? new Date(fechaStr + 'T12:00:00Z').toISOString() : undefined
      });
      onClose();
    } catch (error) {
      console.error(error);
      toastService.error('Error al registrar el servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench size={24} color="var(--gold-light)" />
          {initialData ? 'Editar Servicio' : 'Nuevo Servicio'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Fecha del Servicio</label>
              <input 
                type="date" 
                value={fechaStr}
                onChange={e => setFechaStr(e.target.value)}
                style={inputStyle}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Vehículo / Placa (Opcional)</label>
              <input 
                type="text" 
                value={placa}
                onChange={e => setPlaca(e.target.value.toUpperCase())}
                style={inputStyle}
                placeholder="Ej. ABC-123 o Corolla"
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Tipo de Vehículo</label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={vehiculoTipo}
                  onChange={e => setVehiculoTipo(e.target.value as VehiculoTipo)}
                  style={selectStyle}
                >
                  <option value="carro">Carro / Auto</option>
                  <option value="camioneta">Camioneta / SUV</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none', color: 'var(--text-dim)' }}>▼</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Tipo de Servicio</label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={servicioTipo}
                  onChange={e => setServicioTipo(e.target.value as ServicioTipo)}
                  style={selectStyle}
                >
                  <option value="delantera">Delantera</option>
                  <option value="trasera">Trasera</option>
                  <option value="delantera_trasera">Delantera y Trasera</option>
                  {vehiculoTipo === 'camioneta' && (
                    <option value="doble_camioneta">Doble (Camioneta)</option>
                  )}
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none', color: 'var(--text-dim)' }}>▼</div>
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed var(--gold-light)', 
            borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
              <CarFront size={18} color="var(--gold-light)" />
              Pago al Alineador:
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-light)' }}>
              ${montoAlineador.toFixed(2)}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              marginTop: '8px', padding: '14px', borderRadius: '8px',
              background: 'var(--gold-gradient)', color: '#07090e', border: 'none',
              fontWeight: 700, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <CheckCircle size={20} />
                {initialData ? 'Guardar Cambios' : 'Guardar Servicio (Enter)'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

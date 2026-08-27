import React, { useState, useRef } from 'react';
import { X, Save, Upload, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import type { Invoice, PaymentMethod } from './InvoiceDashboard';
import { scanPaymentWithAI } from '../aiScanner';
import { addPayment } from '../paymentApi';

interface AddPaymentModalProps {
  invoice: Invoice;
  pendingBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ invoice, pendingBalance, onClose, onSuccess }) => {
  const [monto, setMonto] = useState<number | ''>('');
  const [fechaAbono, setFechaAbono] = useState(() => {
    // default to today's date in YYYY-MM-DD
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  });
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('Zelle');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAIScan = async () => {
    if (files.length === 0) {
      setError('Por favor, adjunta primero la foto del recibo.');
      return;
    }
    setIsScanning(true);
    setError('');
    try {
      const data = await scanPaymentWithAI(files[0]);
      if (data.monto) setMonto(data.monto);
      if (data.fecha) setFechaAbono(data.fecha);
      if (data.referencia) setReferencia(data.referencia);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el recibo con IA.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (montoNum > pendingBalance) {
      setError(`El monto no puede superar el saldo pendiente ($${pendingBalance.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayment({
        invoice_id: invoice.id,
        monto: montoNum,
        fecha_abono: new Date(fechaAbono).toISOString(),
        metodo_pago: metodoPago,
        referencia: referencia,
        notas: notas
      }, files);

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al registrar el abono');
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
    color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px',
      padding: '24px', marginTop: '16px', position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Registrar Nuevo Abono
        </h4>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Monto a Abonar ($)</label>
              <input
                type="number"
                step="0.01"
                required
                max={pendingBalance}
                value={monto}
                onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Fecha</label>
              <input
                type="date"
                required
                value={fechaAbono}
                onChange={(e) => setFechaAbono(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                style={inputStyle}
              >
                <option value="Zelle">Zelle</option>
                <option value="Efectivo ($)">Efectivo ($)</option>
                <option value="Pago Movil">Pago Móvil</option>
                <option value="Transferencia (Bs)">Transferencia (Bs)</option>
                <option value="ACH">ACH</option>
                <option value="Banesco Panama">Banesco Panamá</option>
                <option value="Punto de Venta">Punto de Venta</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Referencia (Opcional)</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                style={inputStyle}
                placeholder="Ej. #1234"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Notas (Opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Detalles adicionales del abono..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Comprobantes (Imágenes)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '24px', border: '2px dashed var(--border-color)', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)', color: 'var(--text-dim)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gold-light)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Upload size={24} />
              <span>Haz clic para subir comprobantes (Opcional)</span>
            </button>
            
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {files.map((file, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={handleAIScan}
                  disabled={isScanning}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--gold-gradient)',
                    color: '#07090e',
                    border: 'none',
                    fontWeight: 600,
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isScanning ? 0.7 : 1,
                    width: 'fit-content'
                  }}
                >
                  <Sparkles size={16} />
                  {isScanning ? 'Escaneando Comprobante...' : 'Autocompletar Datos con IA'}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '16px', padding: '16px', borderRadius: '8px',
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
                <Save size={20} />
                Guardar Abono
              </>
            )}
          </button>
        </form>
    </div>
  );
};

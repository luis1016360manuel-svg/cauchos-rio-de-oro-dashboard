import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, CheckCircle, AlertCircle, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, testApiKeyConnection } from '../services/geminiService';
import { toastService } from './Toast';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey.trim());
    toastService.success('Configuración de IA guardada exitosamente.');
    onClose();
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toastService.warning('Por favor ingresa una API Key primero.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const success = await testApiKeyConnection(apiKey.trim());
    setIsTesting(false);
    setTestResult(success ? 'success' : 'error');
    if (success) {
      toastService.success('¡Conexión exitosa con Google Gemini!');
    } else {
      toastService.error('Error al conectar. Verifica que la llave sea válida.');
    }
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
    setTestResult(null);
    toastService.info('Llave de IA eliminada de este navegador.');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#0e1118', border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '16px', width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(212, 175, 55, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={20} color="var(--gold-light)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>
                Configuración de Inteligencia Artificial
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Google Gemini 3.5 Lite / 3.7 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-dim)',
              cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status banner */}
          <div style={{
            padding: '14px 16px', borderRadius: '10px',
            background: apiKey ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${apiKey ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {apiKey ? (
                <CheckCircle size={18} color="#22c55e" />
              ) : (
                <AlertCircle size={18} color="#ef4444" />
              )}
              <span style={{ fontSize: '0.88rem', color: apiKey ? '#86efac' : '#fca5a5', fontWeight: 500 }}>
                {apiKey ? 'Servicio de IA Configurado' : 'Falta configurar la API Key'}
              </span>
            </div>
            {testResult && (
              <span style={{
                fontSize: '0.78rem', padding: '3px 8px', borderRadius: '4px',
                background: testResult === 'success' ? '#14532d' : '#7f1d1d',
                color: testResult === 'success' ? '#86efac' : '#fca5a5',
              }}>
                {testResult === 'success' ? '✓ Conexión OK' : '✗ Falló conexión'}
              </span>
            )}
          </div>

          {/* Key input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} /> Clave Secreta de Gemini (API Key)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... o AQ.Ab8RN6..."
                style={{
                  width: '100%', padding: '12px 90px 12px 14px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-dim)',
                  fontSize: '0.75rem', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer'
                }}
              >
                {showKey ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Esta clave se guarda de forma segura en este navegador para el escaneo de facturas, abonos y análisis predictivo de inventario.
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              style={{
                flex: 1, padding: '11px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.88rem', fontWeight: 500, cursor: isTesting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <RefreshCw size={15} className={isTesting ? 'animate-spin' : ''} />
              {isTesting ? 'Probando conexión...' : 'Probar Conexión'}
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '11px 16px', borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171', fontSize: '0.88rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
                title="Eliminar llave"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px', borderRadius: '8px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text-dim)', fontSize: '0.9rem', cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '10px 22px', borderRadius: '8px',
              background: 'var(--gold-gradient)', color: '#07090e',
              border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <ShieldCheck size={16} />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

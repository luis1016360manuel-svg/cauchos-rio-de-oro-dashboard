import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, Upload, AlertCircle, Sparkles } from 'lucide-react';

interface LiveCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onSelectFile: () => void;
}

export const LiveCameraScannerModal: React.FC<LiveCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onSelectFile,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Start live camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setError(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error opening camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de cámara denegado. Por favor permite el acceso a la cámara o sube una foto desde tu galería.');
      } else {
        setError(err.message || 'No se pudo acceder a la cámara. Puedes subir un archivo directamente.');
      }
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      // Stop camera stream when closed
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          // Stop stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
          }

          onCapture(file);
        } else {
          setError('Error al capturar la imagen. Intenta de nuevo.');
          setIsCapturing(false);
        }
      }, 'image/jpeg', 0.88);
    } catch (err: any) {
      console.error('Capture error:', err);
      setError('Error al capturar la imagen.');
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1150,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '640px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', position: 'relative',
        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
        border: '1px solid rgba(212, 175, 55, 0.4)'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={22} color="var(--gold-light)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Escanear en Vivo con Cámara
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                Apunta hacia la factura, nota de entrega o lote de cauchos
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Video Camera Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          background: '#05070b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444', maxWidth: '400px' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{error}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectFile();
                }}
                style={{
                  padding: '10px 20px', borderRadius: '8px',
                  background: 'var(--gold-gradient)', color: '#07090e', border: 'none',
                  fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Upload size={16} /> Subir Foto desde Archivo
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Viewfinder Target Frame */}
              <div style={{
                position: 'absolute',
                top: '15%', left: '10%', right: '10%', bottom: '15%',
                border: '2px dashed rgba(212, 175, 55, 0.7)',
                borderRadius: '16px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  padding: '6px 14px', borderRadius: '20px',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(212,175,55,0.4)',
                  color: 'var(--gold-light)', fontSize: '0.78rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Sparkles size={13} /> Encuadra el texto o los cauchos
                </div>
              </div>

              {/* Switch Camera Button (Top Right of video) */}
              <button
                type="button"
                onClick={handleToggleCamera}
                title="Cambiar cámara frontal / trasera"
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', borderRadius: '50%', width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 10
                }}
              >
                <RefreshCw size={18} />
              </button>
            </>
          )}
        </div>

        {/* Bottom Shutter & Action Bar */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.5)', flexWrap: 'wrap', gap: '16px'
        }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectFile();
            }}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
              color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Upload size={15} /> Subir de Galería
          </button>

          {!error && (
            <button
              type="button"
              onClick={handleTakeSnapshot}
              disabled={isCapturing}
              style={{
                padding: '12px 28px', borderRadius: 'var(--radius-full)',
                background: 'var(--gold-gradient)', color: '#07090e', border: 'none',
                fontWeight: 700, fontSize: '0.95rem', cursor: isCapturing ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: '0 4px 20px rgba(212,175,55,0.4)'
              }}
            >
              <Camera size={20} />
              {isCapturing ? 'Procesando captura...' : 'Capturar y Escanear (IA)'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px', background: 'transparent',
              color: 'var(--text-dim)', border: 'none', cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

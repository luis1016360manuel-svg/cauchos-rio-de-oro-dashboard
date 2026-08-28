import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

// ─────────────────────────────────────────────
// Global event bus (no context / no prop-drilling)
// ─────────────────────────────────────────────

type ToastListener = (item: ToastItem) => void;
type ConfirmListener = (opts: ConfirmOptions & { resolve: (v: boolean) => void }) => void;

let _toastListener: ToastListener | null = null;
let _confirmListener: ConfirmListener | null = null;
let _toastId = 0;

export const toastService = {
  show(type: ToastType, message: string) {
    _toastListener?.({ id: ++_toastId, type, message });
  },
  success(msg: string) { this.show('success', msg); },
  error(msg: string)   { this.show('error', msg); },
  warning(msg: string) { this.show('warning', msg); },
  info(msg: string)    { this.show('info', msg); },

  /** Returns true if confirmed, false if cancelled */
  confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (_confirmListener) {
        _confirmListener({ ...opts, resolve });
      } else {
        // Fallback if provider not mounted yet
        resolve(window.confirm(opts.message));
      }
    });
  },
};

// ─────────────────────────────────────────────
// Styling helpers
// ─────────────────────────────────────────────

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.4)',
    icon: <CheckCircle size={18} color="#10b981" />,
  },
  error: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
    icon: <XCircle size={18} color="#ef4444" />,
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.4)',
    icon: <AlertTriangle size={18} color="#f59e0b" />,
  },
  info: {
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.4)',
    icon: <Info size={18} color="#6366f1" />,
  },
};

// ─────────────────────────────────────────────
// ToastItem component
// ─────────────────────────────────────────────

const DURATION = 4500;

const ToastCard: React.FC<{ item: ToastItem; onRemove: (id: number) => void }> = ({
  item,
  onRemove,
}) => {
  const [visible, setVisible] = useState(false);
  const cfg = toastStyles[item.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 320);
    }, DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        minWidth: '280px',
        maxWidth: '380px',
        transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(24px) scale(0.95)',
        cursor: 'default',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</div>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, flex: 1 }}>
        {item.message}
      </p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(item.id), 320); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-dim)', padding: '0', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Confirm Dialog
// ─────────────────────────────────────────────

interface ConfirmState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

const ConfirmDialog: React.FC<{ state: ConfirmState; onDone: () => void }> = ({ state, onDone }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handle = (result: boolean) => {
    setVisible(false);
    setTimeout(() => {
      state.resolve(result);
      onDone();
    }, 220);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        transition: 'opacity 0.22s',
        opacity: visible ? 1 : 0,
      }}
      onClick={() => handle(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '28px 32px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          transition: 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), opacity 0.22s',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(10px)',
          opacity: visible ? 1 : 0,
        }}
      >
        {state.danger && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
          </div>
        )}
        <p style={{
          margin: '0 0 24px', fontSize: '0.95rem', color: 'var(--text-main)',
          lineHeight: 1.6, textAlign: 'center',
        }}>
          {state.message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handle(false)}
            style={{
              padding: '9px 20px', borderRadius: 'var(--radius-full)',
              background: 'transparent', border: '1px solid var(--border-color)',
              color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            }}
          >
            {state.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            onClick={() => handle(true)}
            style={{
              padding: '9px 20px', borderRadius: 'var(--radius-full)', border: 'none',
              background: state.danger ? '#ef4444' : 'var(--gold-gradient)',
              color: state.danger ? '#fff' : '#07090e',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            }}
          >
            {state.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Provider — mount once in App.tsx
// ─────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev, item]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openConfirm = useCallback((opts: ConfirmOptions & { resolve: (v: boolean) => void }) => {
    setConfirmState(opts);
  }, []);

  useEffect(() => {
    _toastListener = addToast;
    _confirmListener = openConfirm;
    return () => {
      _toastListener = null;
      _confirmListener = null;
    };
  }, [addToast, openConfirm]);

  return (
    <>
      {children}

      {/* Toast stack — bottom right */}
      <div
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          zIndex: 9998, display: 'flex', flexDirection: 'column', gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: toasts.length === 0 ? 'none' : 'auto',
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onRemove={removeToast} />
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <ConfirmDialog
          state={confirmState}
          onDone={() => setConfirmState(null)}
        />
      )}
    </>
  );
};

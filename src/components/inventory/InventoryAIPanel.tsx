import React, { useState } from 'react';
import { Brain, X, AlertTriangle, TrendingDown, CheckCircle, RefreshCw, RotateCcw, DollarSign } from 'lucide-react';
import type { AIInventoryAnalysis, ProductAlert } from './inventoryAnalyzer';

// ---------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------

const severityConfig = {
  CRITICO: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    icon: <AlertTriangle size={18} color="#ef4444" />,
    badge: '🔴 CRÍTICO',
  },
  MODERADO: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    icon: <TrendingDown size={18} color="#f59e0b" />,
    badge: '🟡 MODERADO',
  },
  SIN_ROTACION: {
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.3)',
    icon: <RotateCcw size={18} color="#8b5cf6" />,
    badge: '⚪ SIN ROTACIÓN',
  },
  SALUDABLE: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.3)',
    icon: <CheckCircle size={18} color="#10b981" />,
    badge: '🟢 SALUDABLE',
  },
} as const;

const AlertCard: React.FC<{ alert: ProductAlert; index: number }> = ({ alert, index }) => {
  const cfg = severityConfig[alert.severidad];

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: `slideInUp 0.35s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cfg.icon}
          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
            {alert.producto}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '100px',
            background: cfg.border,
            color: cfg.color,
            letterSpacing: '0.5px',
          }}
        >
          {cfg.badge}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Stock: <strong style={{ color: cfg.color }}>{alert.stock_actual} u.</strong>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Vendidas (30d): <strong style={{ color: 'var(--text-main)' }}>{alert.unidades_vendidas_30d} u.</strong>
        </div>
        {alert.dias_estimados_agotamiento !== null && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Se agota en:{' '}
            <strong style={{ color: cfg.color }}>~{Math.round(alert.dias_estimados_agotamiento)} días</strong>
          </div>
        )}
      </div>

      {/* Reason */}
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        {alert.razon}
      </p>

      {/* Recommendation */}
      {alert.recomendacion && (
        <div
          style={{
            fontSize: '0.82rem',
            color: cfg.color,
            fontWeight: 600,
            padding: '6px 12px',
            background: `rgba(0,0,0,0.15)`,
            borderRadius: '8px',
            borderLeft: `3px solid ${cfg.color}`,
          }}
        >
          💡 {alert.recomendacion}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------
// Section header
// ---------------------------------------------------------------

const SectionTitle: React.FC<{ title: string; count: number; color: string }> = ({
  title,
  count,
  color,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
      marginTop: '4px',
    }}
  >
    <span style={{ fontSize: '0.85rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px' }}>
      {title}
    </span>
    <span
      style={{
        minWidth: '24px',
        height: '24px',
        borderRadius: '100px',
        background: color,
        color: '#07090e',
        fontSize: '0.75rem',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 8px',
      }}
    >
      {count}
    </span>
  </div>
);

// ---------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------

interface InventoryAIPanelProps {
  analysis: AIInventoryAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
  onClose: () => void;
}

export const InventoryAIPanel: React.FC<InventoryAIPanelProps> = ({
  analysis,
  isLoading,
  error,
  onAnalyze,
  onClose,
}) => {
  const [showSaludables, setShowSaludables] = useState(false);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
        }
      `}</style>

      {/* Panel container */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '28px',
          animation: 'slideInUp 0.4s ease both',
        }}
      >
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #d4af37, #f5d76e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: !isLoading && !analysis ? 'pulseGold 2s ease infinite' : undefined,
              }}
            >
              <Brain size={24} color="#07090e" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Análisis IA del Inventario
              </h3>
              {analysis && (
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Analizado el{' '}
                  {new Date(analysis.fecha_analisis).toLocaleString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Re-analyze button */}
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: isLoading ? 'rgba(255,255,255,0.05)' : 'var(--gold-gradient)',
                color: isLoading ? 'var(--text-muted)' : '#07090e',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw
                size={15}
                style={{ animation: isLoading ? 'spin 1s linear infinite' : undefined }}
              />
              {isLoading ? 'Analizando...' : analysis ? 'Re-analizar' : 'Analizar Ahora'}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── LOADING ── */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(255,255,255,0.08)',
                borderTopColor: 'var(--gold-light)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Gemini está analizando tu inventario y el historial de ventas…
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {!isLoading && error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#ef4444',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!isLoading && !error && !analysis && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <Brain size={48} color="var(--text-dim)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem' }}>
              Presiona <strong style={{ color: 'var(--gold-light)' }}>Analizar Ahora</strong> para que
              la IA revise tu inventario y te dé predicciones de stock.
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!isLoading && !error && analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Summary + KPI bar */}
            <div
              style={{
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <p style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                📊 {analysis.resumen_general}
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <DollarSign size={14} color="var(--gold-light)" />
                  Valor inventario:{' '}
                  <strong style={{ color: 'var(--gold-light)' }}>
                    {formatCurrency(analysis.valor_total_inventario)}
                  </strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  🔴 {analysis.alertas_criticas.length} críticos &nbsp;·&nbsp;
                  🟡 {analysis.alertas_moderadas.length} moderados &nbsp;·&nbsp;
                  ⚪ {analysis.productos_sin_rotacion.length} sin rotación &nbsp;·&nbsp;
                  🟢 {analysis.productos_saludables.length} saludables
                </div>
              </div>
            </div>

            {/* Críticos */}
            {analysis.alertas_criticas.length > 0 && (
              <div>
                <SectionTitle title="Alertas Críticas" count={analysis.alertas_criticas.length} color="#ef4444" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.alertas_criticas.map((a, i) => (
                    <AlertCard key={a.producto + i} alert={a} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Moderados */}
            {analysis.alertas_moderadas.length > 0 && (
              <div>
                <SectionTitle title="Atención Moderada" count={analysis.alertas_moderadas.length} color="#f59e0b" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.alertas_moderadas.map((a, i) => (
                    <AlertCard key={a.producto + i} alert={a} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Sin rotación */}
            {analysis.productos_sin_rotacion.length > 0 && (
              <div>
                <SectionTitle title="Sin Rotación (30 días)" count={analysis.productos_sin_rotacion.length} color="#8b5cf6" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysis.productos_sin_rotacion.map((a, i) => (
                    <AlertCard key={a.producto + i} alert={a} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Saludables (colapsable) */}
            {analysis.productos_saludables.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSaludables((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    marginBottom: '12px',
                  }}
                >
                  <SectionTitle
                    title={`Productos Saludables ${showSaludables ? '▲' : '▼'}`}
                    count={analysis.productos_saludables.length}
                    color="#10b981"
                  />
                </button>
                {showSaludables && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.productos_saludables.map((a, i) => (
                      <AlertCard key={a.producto + i} alert={a} index={i} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

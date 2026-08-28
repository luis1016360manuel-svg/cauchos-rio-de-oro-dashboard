import { useState, useEffect, lazy, Suspense } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { getSessionUser, logoutUser } from './auth';
import type { AuthUser } from './auth';
import { LogOut, User, FileText, Package, Wrench, Sun, Moon, Sparkles } from 'lucide-react';
import { t } from './translations';
import { ToastProvider } from './components/Toast';
import { AISettingsModal } from './components/AISettingsModal';
import { getStoredApiKey } from './services/geminiService';

// ── Code Splitting / Lazy Loading for High Performance ──
const InvoiceDashboard = lazy(() => import('./components/InvoiceDashboard').then(m => ({ default: m.InvoiceDashboard })));
const InventoryDashboard = lazy(() => import('./components/inventory/InventoryDashboard').then(m => ({ default: m.InventoryDashboard })));
const AlignmentDashboard = lazy(() => import('./components/alignment/AlignmentDashboard').then(m => ({ default: m.AlignmentDashboard })));
const UserManagement = lazy(() => import('./components/UserManagement').then(m => ({ default: m.UserManagement })));

type ViewMode = 'INVOICES' | 'INVENTORY' | 'ALIGNMENT' | 'USERS';

const ViewLoadingFallback = () => (
  <div style={{
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '16px'
  }}>
    <div style={{
      width: '44px', height: '44px', borderRadius: '50%',
      border: '3px solid rgba(212, 175, 55, 0.15)', borderTopColor: 'var(--gold-light)',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)', fontWeight: 500 }}>
      Cargando módulo...
    </span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('INVOICES');
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const user = getSessionUser();
    if (user) {
      setCurrentUser(user);
    }
    setHasApiKey(!!getStoredApiKey());
    setIsCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--gold-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <ToastProvider>
        <LoginScreen onLoginSuccess={setCurrentUser} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header Navigation */}
        <header className="app-header" style={{ 
          padding: '16px 32px', 
          background: 'rgba(255,255,255,0.02)', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontWeight: 800, color: '#07090e', fontSize: '1.1rem' }}>RO</span>
            </div>
            <span className="header-brand-text" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Rio de Oro</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <nav className="desktop-nav" style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
              <button
                onClick={() => setCurrentView('INVOICES')}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.9rem',
                  background: currentView === 'INVOICES' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: currentView === 'INVOICES' ? 'var(--gold-light)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                }}
              >
                <FileText size={16} />
                Facturación
              </button>
              <button
                onClick={() => setCurrentView('INVENTORY')}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.9rem',
                  background: currentView === 'INVENTORY' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: currentView === 'INVENTORY' ? 'var(--gold-light)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                }}
              >
                <Package size={16} />
                Inventario
              </button>
              <button
                onClick={() => setCurrentView('ALIGNMENT')}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.9rem',
                  background: currentView === 'ALIGNMENT' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: currentView === 'ALIGNMENT' ? 'var(--gold-light)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                }}
              >
                <Wrench size={16} />
                Alineación
              </button>
              
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setCurrentView('USERS')}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.9rem',
                    background: currentView === 'USERS' ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: currentView === 'USERS' ? 'var(--gold-light)' : 'var(--text-muted)',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                  }}
                >
                  <User size={16} />
                  Usuarios
                </button>
              )}
            </nav>

            <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <User size={16} color="var(--gold-light)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>{currentUser.displayName}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{currentUser.role}</span>
              </div>
            </div>

            <div className="header-actions-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* AI Settings Button */}
              <button
                onClick={() => setIsAISettingsOpen(true)}
                title="Configuración de Inteligencia Artificial"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 10px', borderRadius: 'var(--radius-full)',
                  background: hasApiKey ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${hasApiKey ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: hasApiKey ? 'var(--gold-light)' : '#f87171',
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = hasApiKey ? 'rgba(212,175,55,0.2)' : 'rgba(239,68,68,0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = hasApiKey ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.1)';
                }}
              >
                <Sparkles size={14} />
                <span>IA</span>
              </button>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button 
                onClick={handleLogout}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                  borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-color)', 
                  color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', flexShrink: 0
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                title="Cerrar sesión"
              >
                <LogOut size={15} />
                <span className="hide-on-mobile">{t.logout}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="main-content-layout" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<ViewLoadingFallback />}>
            {currentView === 'INVOICES' && <InvoiceDashboard />}
            {currentView === 'INVENTORY' && <InventoryDashboard />}
            {currentView === 'ALIGNMENT' && <AlignmentDashboard />}
            {currentView === 'USERS' && currentUser.role === 'admin' && <UserManagement />}
          </Suspense>
        </main>

        {/* ── Mobile Bottom Navigation Bar ── */}
        <nav className="mobile-nav-bottom">
          <button
            onClick={() => setCurrentView('INVOICES')}
            className={`bottom-nav-item ${currentView === 'INVOICES' ? 'active' : ''}`}
          >
            <FileText size={20} />
            <span>Facturas</span>
          </button>
          <button
            onClick={() => setCurrentView('INVENTORY')}
            className={`bottom-nav-item ${currentView === 'INVENTORY' ? 'active' : ''}`}
          >
            <Package size={20} />
            <span>Inventario</span>
          </button>
          <button
            onClick={() => setCurrentView('ALIGNMENT')}
            className={`bottom-nav-item ${currentView === 'ALIGNMENT' ? 'active' : ''}`}
          >
            <Wrench size={20} />
            <span>Alineación</span>
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setCurrentView('USERS')}
              className={`bottom-nav-item ${currentView === 'USERS' ? 'active' : ''}`}
            >
              <User size={20} />
              <span>Usuarios</span>
            </button>
          )}
        </nav>

        <AISettingsModal
          isOpen={isAISettingsOpen}
          onClose={() => {
            setIsAISettingsOpen(false);
            setHasApiKey(!!getStoredApiKey());
          }}
        />
      </div>
    </ToastProvider>
  );
}

export default App;

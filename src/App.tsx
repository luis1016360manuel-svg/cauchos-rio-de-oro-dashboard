import { useState, useEffect } from 'react';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { LoginScreen } from './components/LoginScreen';
import { getSessionUser, logoutUser } from './auth';
import type { AuthUser } from './auth';
import { LogOut, User, FileText, Package, Wrench, Sun, Moon, KeyRound } from 'lucide-react';
import { t } from './translations';
import { AlignmentDashboard } from './components/alignment/AlignmentDashboard';
import { UserManagement } from './components/UserManagement';
import { ToastProvider } from './components/Toast';

type ViewMode = 'INVOICES' | 'INVENTORY' | 'ALIGNMENT' | 'USERS';

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('INVOICES');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Check if user is already logged in via sessionStorage on app load
    const user = getSessionUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // ── API Key modal state ──
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const openApiKeyModal = () => {
    setApiKeyInput(localStorage.getItem('GEMINI_API_KEY') || '');
    setShowKey(false);
    setShowApiKeyModal(true);
  };
  const saveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('GEMINI_API_KEY', trimmed);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
    setShowApiKeyModal(false);
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
      <header style={{ 
        padding: '16px 32px', 
        background: 'rgba(255,255,255,0.02)', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 800, color: '#07090e', fontSize: '1.2rem' }}>RO</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Rio de Oro</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          
          <nav style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
              <User size={16} color="var(--gold-light)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>{currentUser.displayName}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{currentUser.role}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* API Key button */}
            <button
              onClick={openApiKeyModal}
              title="Configurar API Key de Gemini"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%',
                background: localStorage.getItem('GEMINI_API_KEY') ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${localStorage.getItem('GEMINI_API_KEY') ? 'rgba(212,175,55,0.4)' : 'var(--border-color)'}`,
                color: localStorage.getItem('GEMINI_API_KEY') ? 'var(--gold-light)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = localStorage.getItem('GEMINI_API_KEY') ? 'var(--gold-light)' : 'var(--text-muted)'; }}
            >
              <KeyRound size={16} />
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', 
                borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--border-color)', 
                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <LogOut size={14} />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        {currentView === 'INVOICES' && <InvoiceDashboard />}
        {currentView === 'INVENTORY' && <InventoryDashboard />}
        {currentView === 'ALIGNMENT' && <AlignmentDashboard />}
        {currentView === 'USERS' && currentUser.role === 'admin' && <UserManagement />}
      </main>
    </div>

    {/* ── API Key Modal ── */}
    {showApiKeyModal && (
      <div
        onClick={() => setShowApiKeyModal(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '20px', padding: '32px', width: '90%', maxWidth: '480px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#d4af37,#f5d76e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={20} color="#07090e" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>API Key de Gemini</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Requerida para el escáner IA y el análisis de inventario</p>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Pega tu API Key aquí..."
              style={{
                width: '100%', padding: '12px 48px 12px 16px', borderRadius: '10px',
                border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => setShowKey(v => !v)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 600,
              }}
            >
              {showKey ? 'Ocultar' : 'Ver'}
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: 1.5 }}>
            🔒 La clave se guarda únicamente en tu navegador (localStorage). Nunca se envía a nuestros servidores.
            Puedes obtener una clave gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-light)' }}>aistudio.google.com</a>.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowApiKeyModal(false)}
              style={{
                padding: '9px 20px', borderRadius: 'var(--radius-full)',
                background: 'transparent', border: '1px solid var(--border-color)',
                color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
              }}
            >Cancelar</button>
            <button
              onClick={saveApiKey}
              style={{
                padding: '9px 20px', borderRadius: 'var(--radius-full)', border: 'none',
                background: 'var(--gold-gradient)', color: '#07090e',
                cursor: 'pointer', fontWeight: 700,
              }}
            >Guardar Clave</button>
          </div>
        </div>
      </div>
    )}
    </ToastProvider>
  );
}

export default App;

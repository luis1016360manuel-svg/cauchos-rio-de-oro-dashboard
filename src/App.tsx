import { useState, useEffect } from 'react';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { LoginScreen } from './components/LoginScreen';
import { getSessionUser, logoutUser } from './auth';
import type { AuthUser } from './auth';
import { LogOut, User, FileText, Package, Wrench } from 'lucide-react';
import { t } from './translations';
import { AlignmentDashboard } from './components/alignment/AlignmentDashboard';

type ViewMode = 'INVOICES' | 'INVENTORY' | 'ALIGNMENT';

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('INVOICES');

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

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--gold-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
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
      </header>

      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        {currentView === 'INVOICES' && <InvoiceDashboard />}
        {currentView === 'INVENTORY' && <InventoryDashboard />}
        {currentView === 'ALIGNMENT' && <AlignmentDashboard />}
      </main>
    </div>
  );
}

export default App;

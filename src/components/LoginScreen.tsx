import React, { useState } from 'react';
import { Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { loginUser } from '../auth';
import type { AuthUser } from '../auth';
import { t } from '../translations';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginUser(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(t.loginError);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('incorrecta') || err.message.includes('Usuario'))) {
        setError(err.message);
      } else {
        setError(t.loginError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px 12px 42px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease-out' }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <Lock size={28} color="var(--gold-light)" />
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', textAlign: 'center' }}>
          {t.login}
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '32px', textAlign: 'center' }}>
          {t.authSubtitle}
        </p>

        {error && (
          <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder={t.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--gold-gradient)',
              color: '#07090e',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'transform 0.2s',
              transform: isLoading ? 'scale(0.98)' : 'scale(1)',
              opacity: isLoading ? 0.8 : 1
            }}
          >
            {isLoading ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <LogIn size={18} />
                {t.login}
              </>
            )}
          </button>
        </form>

      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

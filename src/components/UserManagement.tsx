import React, { useState, useEffect } from 'react';
import { fetchUsers, manageUser } from '../api/userApi';
import type { AuthUser } from '../auth';
import { Users, UserPlus, Shield, X, Save, Key } from 'lucide-react';
import { toastService } from './Toast';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal State
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT_ROLE' | 'CHANGE_PASSWORD'>('CREATE');
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operador');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setSelectedUser(null);
    setUsername('');
    setPassword('');
    setRole('operador');
    setDisplayName('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditRoleModal = (user: AuthUser) => {
    setModalMode('EDIT_ROLE');
    setSelectedUser(user);
    setRole(user.role);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openChangePasswordModal = (user: AuthUser) => {
    setModalMode('CHANGE_PASSWORD');
    setSelectedUser(user);
    setPassword('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const toggleUserStatus = async (user: any) => {
    try {
      await manageUser('UPDATE_STATUS', { id: user.id, isActive: !user.isActive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
    } catch (e: any) {
      toastService.error('Error: ' + e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'CREATE') {
        if (!username || !password || !role) throw new Error('Usuario, Contraseña y Rol son requeridos');
        await manageUser('CREATE', { username, password, role, displayName });
        setSuccess('Usuario creado exitosamente');
      } else if (modalMode === 'EDIT_ROLE' && selectedUser) {
        await manageUser('UPDATE_ROLE', { id: selectedUser.id, role });
        setSuccess('Rol actualizado');
      } else if (modalMode === 'CHANGE_PASSWORD' && selectedUser) {
        if (!password) throw new Error('La nueva contraseña no puede estar vacía');
        await manageUser('CHANGE_PASSWORD', { id: selectedUser.id, password });
        setSuccess('Contraseña cambiada');
      }
      
      setTimeout(() => {
        setIsModalOpen(false);
        loadUsers();
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
    color: 'var(--text-main)', outline: 'none'
  };

  return (
    <div style={{ background: 'var(--bg-primary)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users color="var(--gold-light)" size={32} />
            Gestión de Usuarios
          </h2>
          <p style={{ color: 'var(--text-dim)', marginTop: '8px', fontSize: '1.05rem' }}>Administra roles, accesos y credenciales de los empleados.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}
        >
          <UserPlus size={18} />
          Crear Usuario
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Usuario</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Rol</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios...</td></tr>
            ) : users.map((user: any) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.username}</div>
                  {user.displayName && <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{user.displayName}</div>}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600,
                    background: user.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: user.role === 'admin' ? 'var(--gold-light)' : 'var(--text-main)',
                    border: `1px solid ${user.role === 'admin' ? 'rgba(212, 175, 55, 0.3)' : 'var(--border-color)'}`
                  }}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: user.isActive ? '#10b981' : '#ef4444', fontSize: '0.9rem', fontWeight: 500 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.isActive ? '#10b981' : '#ef4444' }} />
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => openEditRoleModal(user)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} title="Editar Rol">
                      <Shield size={14} /> Rol
                    </button>
                    <button onClick={() => openChangePasswordModal(user)} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} title="Cambiar Contraseña">
                      <Key size={14} /> Clave
                    </button>
                    <button 
                      onClick={() => toggleUserStatus(user)} 
                      style={{ background: 'none', border: `1px solid ${user.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, borderRadius: '6px', padding: '6px 12px', color: user.isActive ? '#ef4444' : '#10b981', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px' }}>
              {modalMode === 'CREATE' ? 'Crear Nuevo Usuario' : modalMode === 'EDIT_ROLE' ? `Editar Rol: ${selectedUser?.username}` : `Cambiar Clave: ${selectedUser?.username}`}
            </h3>

            {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {modalMode === 'CREATE' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Usuario (Login) *</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Nombre a Mostrar</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} placeholder="Ej: Juan Pérez" />
                  </div>
                </>
              )}

              {(modalMode === 'CREATE' || modalMode === 'EDIT_ROLE') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Rol *</label>
                  <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle} required>
                    <option value="admin">Administrador</option>
                    <option value="cajero">Cajero</option>
                    <option value="operador">Operador (Usuario Normal)</option>
                  </select>
                </div>
              )}

              {(modalMode === 'CREATE' || modalMode === 'CHANGE_PASSWORD') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Contraseña *</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Escribe la contraseña..." required={modalMode === 'CREATE'} />
                  {modalMode === 'CREATE' && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>La contraseña será encriptada automáticamente.</span>}
                </div>
              )}

              <button type="submit" style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'var(--gold-gradient)', color: '#07090e', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}>
                <Save size={18} /> Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

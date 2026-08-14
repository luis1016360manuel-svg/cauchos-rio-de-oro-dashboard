export interface AuthUser {
  id: string;
  username: string;
  password?: string; // Optional because we omit it when returning the user session
  role: string;
  displayName: string;
}

// Secure array of authorized users
// To add new users, simply add them to this array!
const AUTHORIZED_USERS: AuthUser[] = [
  {
    id: '1',
    username: 'admin',
    password: 'adminpassword',
    role: 'Admin',
    displayName: 'Administrador Principal'
  },
  {
    id: '2',
    username: 'cajero',
    password: 'cajeropassword',
    role: 'Cajero',
    displayName: 'Caja 1'
  }
];

export const AUTH_SESSION_KEY = 'rio_de_oro_auth_session';

export const loginUser = (username: string, password: string): AuthUser | null => {
  const user = AUTHORIZED_USERS.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (user) {
    // Clone and remove the password before storing in session
    const { password: _, ...userSession } = user;
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userSession));
    return userSession as AuthUser;
  }
  return null;
};

export const logoutUser = (): void => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
};

export const getSessionUser = (): AuthUser | null => {
  const stored = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AuthUser;
    } catch (e) {
      return null;
    }
  }
  return null;
};

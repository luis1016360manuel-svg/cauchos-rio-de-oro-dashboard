import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  displayName: string;
}

export const AUTH_SESSION_KEY = 'rio_de_oro_auth_session';

export const loginUser = async (username: string, password: string): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password
    });

    if (error) {
      console.error('Supabase auth error:', error.message);
      throw new Error(error.message);
    }

    if (data) {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data));
      return data as AuthUser;
    }
    
    return null;
  } catch (err) {
    console.error('Login exception:', err);
    throw err;
  }
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

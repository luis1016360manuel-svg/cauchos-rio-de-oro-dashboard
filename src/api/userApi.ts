import { supabase } from '../supabaseClient';

export const fetchUsers = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, display_name, is_active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('No se pudieron cargar los usuarios');
  }

  return data.map((u: any) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    displayName: u.display_name,
    isActive: u.is_active
  }));
};

export const manageUser = async (action: string, payload: any): Promise<any> => {
  const { data, error } = await supabase.rpc('manage_user', {
    p_action: action,
    p_user_id: payload.id || null,
    p_username: payload.username || null,
    p_password: payload.password || null,
    p_role: payload.role || null,
    p_display_name: payload.displayName || null,
    p_is_active: payload.isActive !== undefined ? payload.isActive : null
  });

  if (error) {
    console.error(`Error in manageUser (${action}):`, error);
    throw new Error(error.message);
  }

  return data;
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dvnhltunkpkkumghxpas.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YnRuXkjrH7EuV86KMtpeVg_zARD1mNT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

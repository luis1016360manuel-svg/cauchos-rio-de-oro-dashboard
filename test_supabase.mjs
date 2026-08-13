import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvnhltunkpkkumghxpas.supabase.co';
const supabaseAnonKey = 'sb_publishable_YnRuXkjrH7EuV86KMtpeVg_zARD1mNT';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase Connection...');
  
  // Test 1: Fetch invoices to check database access
  const { data, error, status } = await supabase.from('invoices').select('*').limit(1);
  
  if (error) {
    console.error('❌ Database Connection Failed:', error.message);
  } else {
    console.log(`✅ Database Connection Successful! (Status: ${status})`);
    console.log('Data returned:', data);
  }
}

testConnection();

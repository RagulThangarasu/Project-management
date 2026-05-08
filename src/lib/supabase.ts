import { createClient } from '@supabase/supabase-js';

// These would normally come from your .env file
// For Netlify/Production, you add these in the Netlify Dashboard under "Environment Variables"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Authentication will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

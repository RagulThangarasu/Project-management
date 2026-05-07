import { createClient } from '@supabase/supabase-js';

// These would normally come from your .env file
// For Netlify/Production, you add these in the Netlify Dashboard under "Environment Variables"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

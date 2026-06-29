import { CONFIG } from '../config/config.js';

let client = null;

export async function getSupabaseClient() {
  if (client) return client;
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return client;
  } catch (e) {
    console.warn('Supabase init failed:', e.message);
    return null;
  }
}

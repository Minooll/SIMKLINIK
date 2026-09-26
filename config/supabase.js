const SUPABASE_URL = 'https://vzksksouhdozzmkjidgo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SPIF_l22y7XBY77BQAV4Lg_fXVpK2b_';

const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

if (typeof window !== 'undefined') {
  window.supabaseClient = supabaseClient;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
}
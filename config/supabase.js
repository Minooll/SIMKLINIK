// ====================================================================
// Konfigurasi Klien Supabase - SIMKLINIK Purworejo
// ====================================================================

const SUPABASE_CONFIG = {
  supabaseUrl: (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 'https://purworejo-simklinik.supabase.co',
  supabaseKey: (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.purworejo-key'
};

let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseInstance = window.supabase.createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseKey);
    return supabaseInstance;
  }

  // Fallback Mock Client untuk browser offline dan runner test Node.js
  supabaseInstance = {
    auth: {
      async getUser() { return { data: { user: null }, error: null }; },
      async signInWithOAuth() { return { data: {}, error: null }; },
      async signOut() { return { error: null }; }
    },
    from(tableName) {
      return {
        select() {
          return {
            eq() { return this; },
            order() { return this; },
            limit() { return this; },
            async then(resolve) { resolve({ data: [], error: null }); }
          };
        },
        insert() {
          return {
            async then(resolve) { resolve({ data: [], error: null }); }
          };
        },
        update() {
          return {
            eq() { return this; },
            async then(resolve) { resolve({ data: [], error: null }); }
          };
        }
      };
    },
    rpc(fnName, params) {
      return {
        async then(resolve) {
          resolve({ data: { success: true, message: 'Executed mock RPC ' + fnName }, error: null });
        }
      };
    }
  };

  return supabaseInstance;
}

const supabaseClient = getSupabaseClient();

if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.supabaseClient = supabaseClient;
  window.getSupabaseClient = getSupabaseClient;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_CONFIG,
    supabaseClient,
    getSupabaseClient
  };
}

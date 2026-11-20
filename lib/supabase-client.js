// Optional Supabase client — the app stays fully functional in local mode
// when SUPABASE_URL / SUPABASE_ANON_KEY are not configured.
// To enable: set window.SUPABASE_URL and window.SUPABASE_ANON_KEY before app.js loads
// (e.g. via a small config script), or copy supabase/config.example.js to config.js.

const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || '';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let clientPromise = null;

export async function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    );
  }
  return clientPromise;
}

// Subscribe to live order changes for KDS / Pickup screens.
// Returns an unsubscribe function. No-op in local mode.
export async function subscribeOrders(branchId, onChange) {
  const supabase = await getSupabase();
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`orders-branch-${branchId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
      () => onChange()
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

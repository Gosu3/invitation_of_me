import { createClient } from '@supabase/supabase-js';
import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isDatabaseConfigured() {
  return Boolean(url && anonKey && serviceKey);
}

export function publicDb() {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function serviceDb() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function sessionDb() {
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(items: Parameters<SetAllCookies>[0]) {
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy refreshes sessions. */ }
      },
    },
  });
}

export async function requireAdmin() {
  const session = await sessionDb();
  const service = serviceDb();
  if (!session || !service) return null;
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return null;
  const { data: admin } = await service.from('wedding_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  return admin ? { user, service } : null;
}

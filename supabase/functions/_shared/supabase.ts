/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getSupabaseEnv() {
  const url = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : '') || '';
  const serviceKey =
    (typeof Deno !== 'undefined'
      ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
      : '') || '';
  return { url, serviceKey };
}

export async function supabaseQuery(path: string, options: RequestInit = {}): Promise<Response> {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${path.replace(/^\//, '')}`;
  const headers = new Headers(options.headers || {});
  headers.set('apikey', serviceKey);
  headers.set('Authorization', `Bearer ${serviceKey}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(endpoint, {
    ...options,
    headers,
  });
}

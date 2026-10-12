/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getSupabaseConfig, setSavedLanguage } from '../storage';

export type AuthLanguage = 'en' | 'hi' | 'mr';

// Custom storage adapter utilizing chrome.storage.local
const inMemoryStorage = new Map<string, string>();

export const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const res = await chrome.storage.local.get(key);
      return (res[key] as string) ?? null;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return inMemoryStorage.get(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    inMemoryStorage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove(key);
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    inMemoryStorage.delete(key);
  },
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastAnonKey = '';

/**
 * Returns or initializes the Supabase client with chrome.storage.local adapter.
 * Uses public ANON KEY only. Never includes service role or Gemini key (NFR-SEC.3).
 */
export async function getSupabaseAuthClient(): Promise<SupabaseClient | null> {
  const config = await getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastUrl === config.url && lastAnonKey === config.anonKey) {
    return cachedClient;
  }

  lastUrl = config.url;
  lastAnonKey = config.anonKey;

  cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      storage: chromeStorageAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

/**
 * Sign up with email + password, choosing default_language at signup (FR-LANG.1).
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  default_language: AuthLanguage = 'en'
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  const client = await getSupabaseAuthClient();
  if (!client) {
    return { user: null, session: null, error: 'Supabase URL or anon key is not configured.' };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        default_language,
      },
    },
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  await setSavedLanguage(default_language);

  // If user is auto-confirmed, initialize users row preference
  if (data.session && data.user) {
    try {
      await client
        .from('users')
        .upsert({ id: data.user.id, default_language }, { onConflict: 'id' });
    } catch (_e) {
      // Non-fatal
    }
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign in with email + password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  const client = await getSupabaseAuthClient();
  if (!client) {
    return { user: null, session: null, error: 'Supabase URL or anon key is not configured.' };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  // Sync user's default language
  if (data.user?.id) {
    try {
      const { data: userRow } = await client
        .from('users')
        .select('default_language')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userRow?.default_language) {
        await setSavedLanguage(userRow.default_language as AuthLanguage);
      }
    } catch (_e) {
      // Non-fatal
    }
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign out active user.
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  const client = await getSupabaseAuthClient();
  if (!client) {
    return { error: null };
  }

  const { error } = await client.auth.signOut();
  return { error: error ? error.message : null };
}

/**
 * Get current session.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const client = await getSupabaseAuthClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

/**
 * Get current user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const client = await getSupabaseAuthClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

/**
 * Retrieves the active access token for attaching to requests.
 * Returns null if no active authenticated session.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.access_token || null;
}

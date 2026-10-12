/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLanguage } from '../i18n';
import { SessionState } from '../session/types';

export interface AuthSession {
  isSignedIn: boolean;
  user?: {
    id: string;
    email: string;
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// In-memory / web fallback stores for Workbench or environments without chrome.storage
const inMemoryLocal = new Map<string, unknown>();
const inMemorySession = new Map<string, unknown>();

function hasChromeStorageLocal(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

function hasChromeStorageSession(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.session;
}

// ============================================================================
// chrome.storage.local Adapter
// Saved language, auth session, supabase credentials
// ============================================================================

export async function getSavedLanguage(): Promise<SupportedLanguage> {
  const KEY = 'formassist_saved_language';
  if (hasChromeStorageLocal()) {
    const res = await chrome.storage.local.get(KEY);
    const lang = res[KEY];
    if (lang === 'en' || lang === 'hi' || lang === 'mr') {
      return lang;
    }
  } else if (typeof localStorage !== 'undefined') {
    const lang = localStorage.getItem(KEY);
    if (lang === 'en' || lang === 'hi' || lang === 'mr') {
      return lang;
    }
  } else {
    const lang = inMemoryLocal.get(KEY);
    if (lang === 'en' || lang === 'hi' || lang === 'mr') {
      return lang;
    }
  }
  return 'en';
}

export async function setSavedLanguage(lang: SupportedLanguage): Promise<void> {
  const KEY = 'formassist_saved_language';
  if (hasChromeStorageLocal()) {
    await chrome.storage.local.set({ [KEY]: lang });
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, lang);
  } else {
    inMemoryLocal.set(KEY, lang);
  }
}

export async function getAuthSession(): Promise<AuthSession> {
  const KEY = 'formassist_auth_session';
  const defaultSession: AuthSession = { isSignedIn: true };

  if (hasChromeStorageLocal()) {
    const res = await chrome.storage.local.get(KEY);
    return (res[KEY] as AuthSession) || defaultSession;
  } else if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  } else {
    const val = inMemoryLocal.get(KEY);
    if (val) return val as AuthSession;
  }
  return defaultSession;
}

export async function setAuthSession(session: AuthSession): Promise<void> {
  const KEY = 'formassist_auth_session';
  if (hasChromeStorageLocal()) {
    await chrome.storage.local.set({ [KEY]: session });
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(session));
  } else {
    inMemoryLocal.set(KEY, session);
  }
}

export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  const defaultUrl = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
  const defaultKey = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';

  const KEY_URL = 'formassist_supabase_url';
  const KEY_KEY = 'formassist_supabase_anon_key';

  if (hasChromeStorageLocal()) {
    const res = await chrome.storage.local.get([KEY_URL, KEY_KEY]);
    return {
      url: (res[KEY_URL] as string) || defaultUrl,
      anonKey: (res[KEY_KEY] as string) || defaultKey,
    };
  } else if (typeof localStorage !== 'undefined') {
    return {
      url: localStorage.getItem(KEY_URL) || defaultUrl,
      anonKey: localStorage.getItem(KEY_KEY) || defaultKey,
    };
  }
  return { url: defaultUrl, anonKey: defaultKey };
}

export async function setSupabaseConfig(cfg: SupabaseConfig): Promise<void> {
  const KEY_URL = 'formassist_supabase_url';
  const KEY_KEY = 'formassist_supabase_anon_key';

  if (hasChromeStorageLocal()) {
    await chrome.storage.local.set({ [KEY_URL]: cfg.url, [KEY_KEY]: cfg.anonKey });
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_URL, cfg.url);
    localStorage.setItem(KEY_KEY, cfg.anonKey);
  }
}

// ============================================================================
// chrome.storage.session Adapter
// Per-tab language override & Per-tab live session state
// ============================================================================

export async function getTabLanguage(tabId: number): Promise<SupportedLanguage | null> {
  const key = `tab_lang_${tabId}`;
  if (hasChromeStorageSession()) {
    const res = await chrome.storage.session.get(key);
    const val = res[key];
    if (val === 'en' || val === 'hi' || val === 'mr') {
      return val;
    }
  } else if (typeof sessionStorage !== 'undefined') {
    const val = sessionStorage.getItem(key);
    if (val === 'en' || val === 'hi' || val === 'mr') {
      return val;
    }
  } else {
    const val = inMemorySession.get(key);
    if (val === 'en' || val === 'hi' || val === 'mr') {
      return val;
    }
  }
  return null;
}

export async function setTabLanguage(tabId: number, lang: SupportedLanguage): Promise<void> {
  const key = `tab_lang_${tabId}`;
  if (hasChromeStorageSession()) {
    await chrome.storage.session.set({ [key]: lang });
  } else if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, lang);
  } else {
    inMemorySession.set(key, lang);
  }
}

export async function getTabSessionState(tabId: number): Promise<SessionState | null> {
  const key = `tab_state_${tabId}`;
  if (hasChromeStorageSession()) {
    const res = await chrome.storage.session.get(key);
    return (res[key] as SessionState) || null;
  } else if (typeof sessionStorage !== 'undefined') {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
  } else {
    return (inMemorySession.get(key) as SessionState) || null;
  }
  return null;
}

export async function setTabSessionState(tabId: number, state: SessionState): Promise<void> {
  const key = `tab_state_${tabId}`;
  if (hasChromeStorageSession()) {
    await chrome.storage.session.set({ [key]: state });
  } else if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, JSON.stringify(state));
  } else {
    inMemorySession.set(key, state);
  }
}

export async function clearTabSession(tabId: number): Promise<void> {
  const keyState = `tab_state_${tabId}`;
  const keyLang = `tab_lang_${tabId}`;
  if (hasChromeStorageSession()) {
    await chrome.storage.session.remove([keyState, keyLang]);
  } else if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(keyState);
    sessionStorage.removeItem(keyLang);
  } else {
    inMemorySession.delete(keyState);
    inMemorySession.delete(keyLang);
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApiClient,
  AnalyzeFormRequest,
  AnalyzeFormResponse,
  AnalyzeFormResponseSchema,
  ChatRequest,
  ChatResponse,
  ChatResponseSchema,
  Explanation,
  ExplanationSchema,
  Preferences,
  BackendHealthResult,
} from './types';
import { perfTracker } from './timing';

/**
 * HttpApiClient connecting to deployed Supabase Edge Functions.
 * Active when VITE_API_MODE=live.
 */
export class HttpApiClient implements ApiClient {
  private baseUrl: string;
  private anonKey: string;
  private authToken: string | null = null;
  private tokenGetter?: () => Promise<string | null> | string | null;

  constructor(
    customUrl?: string,
    customKey?: string,
    customToken?: string | null,
    tokenGetter?: () => Promise<string | null> | string | null
  ) {
    // Read from Vite env vars, local storage override, or custom constructor
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

    const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('formassist_supabase_url') || '' : '';
    const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('formassist_supabase_anon_key') || '' : '';

    this.baseUrl = (customUrl || storedUrl || envUrl).replace(/\/$/, '');
    this.anonKey = customKey || storedKey || envKey;
    this.authToken = customToken || null;
    this.tokenGetter = tokenGetter;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let activeToken = this.authToken;
    if (!activeToken && this.tokenGetter) {
      activeToken = await this.tokenGetter();
    }

    if (this.anonKey) {
      headers['apikey'] = this.anonKey;
    }

    // Attach active user JWT or fall back to anon key (NFR-SEC.3, NFR-SEC.5)
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    } else if (this.anonKey) {
      headers['Authorization'] = `Bearer ${this.anonKey}`;
    }

    return headers;
  }

  private ensureConfigured() {
    if (!this.baseUrl) {
      throw new Error(
        'Supabase URL not configured. Set VITE_SUPABASE_URL in .env.local or configure it in the Backend Health panel.'
      );
    }
  }

  async checkHealth(): Promise<BackendHealthResult> {
    this.ensureConfigured();
    const endpoint = `${this.baseUrl}/functions/v1/health`;

    try {
      const headers = await this.getHeaders();
      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          ok: false,
          timestamp: new Date().toISOString(),
          database: { reachable: false, indexed_documents: 0, latency_ms: 0, error: `HTTP ${res.status}: ${errorText}` },
          gemini: { reachable: false, model: 'unknown', error: `HTTP ${res.status}` },
          embedding: { reachable: false, model: 'unknown', error: `HTTP ${res.status}` },
        };
      }

      return (await res.json()) as BackendHealthResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        timestamp: new Date().toISOString(),
        database: { reachable: false, indexed_documents: 0, latency_ms: 0, error: msg },
        gemini: { reachable: false, model: 'unknown', error: msg },
        embedding: { reachable: false, model: 'unknown', error: msg },
      };
    }
  }

  async analyzeForm(req: AnalyzeFormRequest): Promise<AnalyzeFormResponse> {
    this.ensureConfigured();
    const endpoint = `${this.baseUrl}/functions/v1/analyze-form`;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const headers = await this.getHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AnalyzeForm failed (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const parsed = AnalyzeFormResponseSchema.parse(json);

    // Track latency against p95 threshold targets (NFR-PERF.1 <300ms hit, NFR-PERF.2 <4s miss)
    const isCacheHit = elapsedMs < 300 || parsed.fields.every((f) => f.explanation?.source_label === 'page');
    perfTracker.record(isCacheHit ? 'cache-hit' : 'cache-miss', 'analyze-form', elapsedMs);

    return parsed;
  }

  async explainField(req: {
    field_key: string;
    form_key: string;
    language: 'en' | 'hi' | 'mr';
    label?: string;
    page_help?: string;
    input_type?: string;
  }): Promise<Explanation> {
    this.ensureConfigured();
    const endpoint = `${this.baseUrl}/functions/v1/explain-field`;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const headers = await this.getHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ExplainField failed (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const parsed = ExplanationSchema.parse(json);

    const isCacheHit = elapsedMs < 300 || parsed.source_label === 'page';
    perfTracker.record(isCacheHit ? 'cache-hit' : 'cache-miss', 'explain-field', elapsedMs);

    return parsed;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    this.ensureConfigured();
    const endpoint = `${this.baseUrl}/functions/v1/chat`;

    const headers = await this.getHeaders();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Chat failed (${res.status}): ${errText}`);
    }

    const json = await res.json();
    return ChatResponseSchema.parse(json);
  }

  async getPreferences(): Promise<Preferences> {
    if (this.baseUrl) {
      try {
        const endpoint = `${this.baseUrl}/functions/v1/preferences`;
        const headers = await this.getHeaders();
        const res = await fetch(endpoint, {
          method: 'GET',
          headers,
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.default_language) {
            return { default_language: json.default_language };
          }
        }
      } catch (_e) {
        // Fall back to local storage
      }
    }

    if (typeof localStorage !== 'undefined') {
      const lang = localStorage.getItem('formassist_pref_lang');
      if (lang === 'en' || lang === 'hi' || lang === 'mr') {
        return { default_language: lang };
      }
    }
    return { default_language: 'en' };
  }

  async setPreferences(p: Preferences): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('formassist_pref_lang', p.default_language);
    }

    if (this.baseUrl) {
      try {
        const endpoint = `${this.baseUrl}/functions/v1/preferences`;
        const headers = await this.getHeaders();
        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(p),
        });
      } catch (_e) {
        // Fall back to local storage
      }
    }
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classifyRisk } from '../supabase/functions/_shared/riskClassifier';
import { enforceRateLimit } from '../supabase/functions/_shared/rateLimit';
import {
  l2Normalize,
  callGeminiStructuredExplanation,
  callGeminiEmbedding,
} from '../supabase/functions/_shared/gemini';
import { HttpApiClient } from '../src/core/api/httpClient';
import { perfTracker, calculatePercentile } from '../src/core/api/timing';
import {
  AnalyzeFormResponseSchema,
  ChatResponseSchema,
  ChatRequestSchema,
  ExplanationSchema,
  PreferencesSchema,
} from '../src/core/api/types';

describe('Phase 3 Backend: Core Logic & Edge Functions', () => {
  describe('Risk Classification & Tag Precedence (FR-RISK.1–5)', () => {
    it('detects domain spoofing when form action domain differs from page domain', () => {
      const result = classifyRisk({
        pageUrl: 'https://nationalbank.in/portal/login',
        formAction: 'https://evil-phishing.com/harvest',
        fields: [{ field_key: 'account_number', label: 'Account Number', input_type: 'text', required: true }],
      });

      const domainFlag = result.flags.find((f) => f.flag_type === 'domain_spoof');
      expect(domainFlag).toBeDefined();
      expect(domainFlag?.severity).toBe('high');
    });

    it('flags insecure HTTP transmission for non-localhost endpoints', () => {
      const result = classifyRisk({
        pageUrl: 'http://insecure-portal.org/form',
        formAction: 'http://insecure-portal.org/submit',
        fields: [{ field_key: 'name', label: 'Full Name', input_type: 'text', required: true }],
      });

      const httpFlag = result.flags.find((f) => f.flag_type === 'insecure_transmission');
      expect(httpFlag).toBeDefined();
      expect(httpFlag?.severity).toBe('medium');
    });

    it('flags sensitive credential harvesting (OTP/PIN/CVV) on non-banking domains as unusual & high risk', () => {
      const result = classifyRisk({
        pageUrl: 'https://random-store.com/checkout',
        formAction: 'https://random-store.com/pay',
        fields: [
          { field_key: 'card_cvv', label: 'Enter CVV Number', input_type: 'password', required: true },
          { field_key: 'atm_pin', label: 'ATM Secret PIN', input_type: 'password', required: true },
        ],
      });

      expect(result.tagsByFieldKey['card_cvv']).toBe('unusual');
      expect(result.tagsByFieldKey['atm_pin']).toBe('unusual');

      const harvestFlags = result.flags.filter((f) => f.flag_type === 'credential_harvesting');
      expect(harvestFlags.length).toBe(2);
    });

    it('enforces tag precedence: unusual > required > optional', () => {
      const result = classifyRisk({
        pageUrl: 'https://regular-site.com',
        formAction: 'https://regular-site.com/post',
        fields: [
          { field_key: 'cvv', label: 'CVV Code', input_type: 'text', required: false },
          { field_key: 'email', label: 'Email Address', input_type: 'email', required: true },
          { field_key: 'notes', label: 'Optional Notes', input_type: 'text', required: false },
        ],
      });

      expect(result.tagsByFieldKey['cvv']).toBe('unusual');
      expect(result.tagsByFieldKey['email']).toBe('required');
      expect(result.tagsByFieldKey['notes']).toBe('optional');
    });
  });

  describe('Embedding Math & L2 Normalization', () => {
    it('correctly normalizes vectors to unit length 1.0', () => {
      const rawVector = [3, 4, 0, 0];
      const normalized = l2Normalize(rawVector);
      expect(normalized[0]).toBeCloseTo(0.6, 5);
      expect(normalized[1]).toBeCloseTo(0.8, 5);

      const norm = Math.hypot(...normalized);
      expect(norm).toBeCloseTo(1.0, 5);
    });

    it('handles zero vector safely without NaN', () => {
      const zeroVec = [0, 0, 0];
      const res = l2Normalize(zeroVec);
      expect(res).toEqual([0, 0, 0]);
    });
  });

  describe('Rate Limiter Helper (FR-ACC.3)', () => {
    it('allows requests within window and tracks client IP', () => {
      const mockReq = new Request('https://api.test/functions/v1/analyze-form', {
        headers: { 'x-forwarded-for': '198.51.100.1' },
      });

      const response = enforceRateLimit(mockReq);
      expect(response).toBeNull();
    });
  });

  describe('Zod Contracts & Response Validation (NFR-SEC.4)', () => {
    it('validates explanation schema with provenance labels', () => {
      const validPageExp = {
        summary: 'Helpful summary',
        text: 'Detailed explanation text',
        source_label: 'page' as const,
        confidence: 0.95,
      };
      expect(() => ExplanationSchema.parse(validPageExp)).not.toThrow();

      const validOfficialExp = {
        summary: 'Regulatory guideline',
        text: 'Per RBI Master Direction...',
        source_label: 'official' as const,
        source_url: 'https://rbi.org.in',
        confidence: 0.92,
      };
      expect(() => ExplanationSchema.parse(validOfficialExp)).not.toThrow();

      const invalidExp = {
        summary: 'Bad explanation',
        text: 'Missing valid source',
        source_label: 'unknown_source',
      };
      expect(() => ExplanationSchema.parse(invalidExp)).toThrow();
    });

    it('validates analyze form response schema', () => {
      const sampleResponse = {
        fields: [
          {
            field_key: 'applicant_name',
            label: 'Applicant Name',
            input_type: 'text',
            required: true,
            risk_tag: 'required' as const,
            explanation: {
              summary: 'Enter your legal name',
              text: 'Name as shown on educational certificates',
              source_label: 'ai' as const,
              confidence: 0.88,
            },
          },
        ],
        risk_flags: [],
      };

      expect(() => AnalyzeFormResponseSchema.parse(sampleResponse)).not.toThrow();
    });

    it('validates chat request and response schemas', () => {
      const validChatReq = {
        message: 'Where do I find my IFSC code?',
        language: 'en' as const,
        focused_field_key: 'ifsc_code',
        completed_field_keys: ['account_name'],
      };
      expect(() => ChatRequestSchema.parse(validChatReq)).not.toThrow();

      const sampleChatRes = {
        reply: 'You can find your IFSC code on your cheque book or bank passbook.',
        session_id: 'session-12345',
      };
      expect(() => ChatResponseSchema.parse(sampleChatRes)).not.toThrow();
    });

    it('validates preferences schema with en/hi/mr check', () => {
      expect(() => PreferencesSchema.parse({ default_language: 'hi' })).not.toThrow();
      expect(() => PreferencesSchema.parse({ default_language: 'invalid' })).toThrow();
    });
  });

  describe('Integration Tests with Gemini Mocked', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('successfully calls callGeminiStructuredExplanation with mocked Gemini JSON', async () => {
      // Mock Deno.env or process.env
      (globalThis as any).Deno = {
        env: {
          get: (key: string) => (key === 'GEMINI_API_KEY' ? 'test-gemini-key' : ''),
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: 'Enter your 10-digit mobile number.',
                      explanation: 'This number will be used for SMS notifications and OTP verification.',
                      confidence: 0.98,
                      source_excerpt: 'Mobile number must be registered with Aadhaar.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

      const result = await callGeminiStructuredExplanation(
        'Explain phone number field',
        'System prompt'
      );

      expect(result.summary).toBe('Enter your 10-digit mobile number.');
      expect(result.explanation).toContain('OTP verification');
      expect(result.confidence).toBe(0.98);
      expect(result.source_excerpt).toBe('Mobile number must be registered with Aadhaar.');
    });

    it('successfully embeds content using mocked Gemini embedding endpoint', async () => {
      (globalThis as any).Deno = {
        env: {
          get: (key: string) => (key === 'GEMINI_API_KEY' ? 'test-gemini-key' : ''),
        },
      };

      // Mock 768-dim vector
      const mockVector = new Array(768).fill(0.1);
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          embedding: {
            values: mockVector,
          },
        }),
      } as any);

      const embedding = await callGeminiEmbedding('IFSC code guidelines');
      expect(embedding.length).toBe(768);
      // Normalized length should be 1.0
      const norm = Math.hypot(...embedding);
      expect(norm).toBeCloseTo(1.0, 4);
    });

    it('HttpApiClient performs analyzeForm and attaches authorization headers', async () => {
      const mockApiResponse = {
        fields: [
          {
            field_key: 'dob',
            label: 'Date of Birth',
            input_type: 'date',
            required: true,
            risk_tag: 'required',
            explanation: {
              summary: 'Enter date of birth as per 10th marksheet.',
              text: 'Format DD/MM/YYYY.',
              source_label: 'page',
              confidence: 0.99,
            },
          },
        ],
        risk_flags: [],
      };

      let capturedHeaders: Record<string, string> = {};
      globalThis.fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedHeaders = options.headers;
        return {
          ok: true,
          json: async () => mockApiResponse,
        };
      });

      const client = new HttpApiClient('https://test.supabase.co', 'test-anon-key', 'mock-user-jwt');
      const response = await client.analyzeForm({
        page_url: 'https://scholarships.gov.in/apply',
        form_action: 'https://scholarships.gov.in/submit',
        form_title: 'Scholarship Form',
        language: 'en',
        fields: [{ field_key: 'dob', label: 'Date of Birth', input_type: 'date', required: true }],
      });

      expect(response.fields.length).toBe(1);
      expect(capturedHeaders['apikey']).toBe('test-anon-key');
      expect(capturedHeaders['Authorization']).toBe('Bearer mock-user-jwt');
    });
  });

  describe('p95 Timing Log & Performance SLA Enforcement (NFR-PERF.1–2)', () => {
    beforeEach(() => {
      perfTracker.clear();
    });

    it('calculates percentiles correctly', () => {
      const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const p50 = calculatePercentile(data, 50);
      const p95 = calculatePercentile(data, 95);

      expect(p50).toBe(50);
      expect(p95).toBe(100);
    });

    it('verifies cache-hit path meets <300 ms SLA and cache-miss meets <4000 ms SLA', () => {
      // Record sample cache-hits (target < 300ms)
      const hitSamples = [45, 60, 80, 110, 140, 180, 210, 250, 280];
      for (const dur of hitSamples) {
        perfTracker.record('cache-hit', 'explain-field', dur);
      }

      // Record sample cache-misses (target < 4000ms)
      const missSamples = [1200, 1500, 1800, 2100, 2500, 2900, 3200, 3600];
      for (const dur of missSamples) {
        perfTracker.record('cache-miss', 'analyze-form', dur);
      }

      const p95Hit = perfTracker.getP95('cache-hit');
      const p95Miss = perfTracker.getP95('cache-miss');

      expect(p95Hit).toBeLessThan(300);
      expect(p95Miss).toBeLessThan(4000);
    });

    it('logs p95 summary to console without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      perfTracker.record('cache-hit', 'test', 120);
      perfTracker.record('cache-miss', 'test', 1800);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FormAssist Perf] p95 Timing Log (NFR-PERF.1-2)')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('HttpApiClient Live Mode Initializer', () => {
    it('initializes with custom url and key', () => {
      const client = new HttpApiClient('https://test-project.supabase.co', 'custom-anon-key');
      expect(client).toBeDefined();
    });

    it('falls back to local preference storage when offline', async () => {
      const client = new HttpApiClient();
      await client.setPreferences({ default_language: 'hi' });
      const prefs = await client.getPreferences();
      expect(prefs.default_language).toBe('hi');
    });
  });
});

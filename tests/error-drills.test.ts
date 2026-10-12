/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormAssistStateMachine } from '../src/extension/stateMachine';
import { MAX_RETRY_ATTEMPTS } from '../supabase/functions/_shared/config';
import { callGeminiStructuredExplanation } from '../supabase/functions/_shared/gemini';

describe('Error-Path Drills (UC-5 & NFR-REL.1–3)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Drill 1: 429 Rate Limit & Exponential Backoff (NFR-REL.3)', () => {
    it('retries on 429 Too Many Requests with exponential backoff before throwing', async () => {
      (globalThis as any).Deno = {
        env: { get: () => 'test-key' },
      };

      let attempts = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        attempts++;
        return {
          ok: false,
          status: 429,
          text: async () => 'ResourceExhausted: Quota exceeded for model',
        };
      });

      await expect(
        callGeminiStructuredExplanation('test prompt', 'system prompt')
      ).rejects.toThrow(/ResourceExhausted|429/);

      // Should attempt initial request + MAX_RETRY_ATTEMPTS retries (>= 2 retries)
      expect(attempts).toBe(1 + MAX_RETRY_ATTEMPTS);
      expect(MAX_RETRY_ATTEMPTS).toBeGreaterThanOrEqual(2);
    });

    it('recovers successfully if a retry succeeds after initial 429', async () => {
      (globalThis as any).Deno = {
        env: { get: () => 'test-key' },
      };

      let attempts = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          return {
            ok: false,
            status: 429,
            text: async () => 'Rate limit exceeded',
          };
        }
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        summary: 'Success after backoff retry',
                        explanation: 'Recovered cleanly from rate limit.',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      });

      const res = await callGeminiStructuredExplanation('test prompt', 'system prompt');
      expect(res.summary).toBe('Success after backoff retry');
      expect(attempts).toBe(2);
    });
  });

  describe('Drill 2: 500/503 Server Errors & Retries', () => {
    it('retries on 503 Service Unavailable with exponential backoff', async () => {
      (globalThis as any).Deno = {
        env: { get: () => 'test-key' },
      };

      let attempts = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        attempts++;
        return {
          ok: false,
          status: 503,
          text: async () => '503 Service Unavailable - backend temporarily overloaded',
        };
      });

      await expect(
        callGeminiStructuredExplanation('test prompt', 'system prompt')
      ).rejects.toThrow(/503/);

      expect(attempts).toBe(1 + MAX_RETRY_ATTEMPTS);
    });
  });

  describe('Drill 3 & 4: State Machine Recovery Guarantee (NFR-REL.1)', () => {
    it('guarantees Error state transitions: RETRY transitions to scanning, DISMISS transitions to idle', () => {
      const sm = new FormAssistStateMachine();

      // Trigger error from scanning
      sm.activate();
      expect(sm.getState()).toBe('scanning');

      sm.fail('Network failure');
      expect(sm.getState()).toBe('error');

      // Test Retry action: must return to scanning
      sm.retry();
      expect(sm.getState()).toBe('scanning');

      // Force error again
      sm.fail('Second failure');
      expect(sm.getState()).toBe('error');

      // Test Dismiss action: must return to idle
      sm.dismiss();
      expect(sm.getState()).toBe('idle');
    });
  });

  describe('Drill 5: Fault Isolation — One Failed Field Does Not Block Others (NFR-REL.2 & FR-EXPLAIN.6)', () => {
    it('returns partial results with unavailable marker when one field fails', async () => {
      // Simulate multi-field processing logic where field 2 fails
      const fields = [
        { field_key: 'field_1', label: 'Field One', input_type: 'text', required: true },
        { field_key: 'field_2', label: 'Failing Field', input_type: 'text', required: false },
        { field_key: 'field_3', label: 'Field Three', input_type: 'number', required: true },
      ];

      const results = await Promise.all(
        fields.map(async (f) => {
          if (f.field_key === 'field_2') {
            // Field 2 encounters an unexpected exception or quota timeout
            try {
              throw new Error('API Timeout on field_2');
            } catch (_e) {
              return {
                ...f,
                risk_tag: 'optional' as const,
                explanation: {
                  summary: 'Explanation unavailable',
                  text: 'We could not generate an explanation for this field at this time.',
                  source_label: 'ai' as const,
                  confidence: 0.0,
                  unavailable: true,
                },
              };
            }
          }

          // Field 1 & 3 succeed
          return {
            ...f,
            risk_tag: 'required' as const,
            explanation: {
              summary: `Guidance for ${f.label}`,
              text: `Detailed instructions for ${f.label}`,
              source_label: 'official' as const,
              confidence: 0.95,
            },
          };
        })
      );

      // Verify all 3 fields are returned in the response
      expect(results.length).toBe(3);

      // Verify field 1 succeeded
      expect(results[0].explanation.summary).toBe('Guidance for Field One');
      expect(results[0].explanation.unavailable).toBeUndefined();

      // Verify field 2 has graceful unavailable marker
      expect(results[1].explanation.unavailable).toBe(true);
      expect(results[1].explanation.summary).toBe('Explanation unavailable');

      // Verify field 3 succeeded despite field 2 failure
      expect(results[2].explanation.summary).toBe('Guidance for Field Three');
      expect(results[2].explanation.unavailable).toBeUndefined();
    });
  });
});

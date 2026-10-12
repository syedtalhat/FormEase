/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Model constants per NFR-MAIN.1
// Stable model IDs verified from https://ai.google.dev/gemini-api/docs/models
export const GEMINI_TEXT_MODEL =
  (typeof Deno !== 'undefined' ? Deno.env.get('GEMINI_TEXT_MODEL') : '') || 'gemini-3.8-flash';

export const GEMINI_EMBEDDING_MODEL =
  (typeof Deno !== 'undefined' ? Deno.env.get('GEMINI_EMBEDDING_MODEL') : '') || 'gemini-embedding-2-preview';

// Minimum cosine similarity to accept an official source grounding (Tier 2)
export const GROUNDING_SIMILARITY_THRESHOLD = 0.65;

// Output dimensionality for embeddings
export const EMBEDDING_DIMENSIONALITY = 768;

// Rate limiting settings for unauthenticated expensive endpoints (FR-ACC.3)
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Network resiliency settings (NFR-REL.3)
export const MAX_RETRY_ATTEMPTS = 2; // >= 2 retries (3 total attempts)
export const INITIAL_BACKOFF_MS = 500;

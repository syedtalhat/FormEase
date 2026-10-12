/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EMBEDDING_DIMENSIONALITY,
  GEMINI_EMBEDDING_MODEL,
  GEMINI_TEXT_MODEL,
  INITIAL_BACKOFF_MS,
  MAX_RETRY_ATTEMPTS,
} from './config.ts';

export { GEMINI_TEXT_MODEL, GEMINI_EMBEDDING_MODEL };

export interface ExplanationOutput {
  summary: string;
  explanation: string;
  confidence?: number;
  source_excerpt?: string;
}

/**
 * L2 Normalization helper for embedding vectors.
 */
export function l2Normalize(vec: number[]): number[] {
  const norm = Math.hypot(...vec);
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/**
 * Retry helper with exponential backoff and jitter on 429/5xx (NFR-REL.3).
 */
async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isRateOrServer =
        err instanceof Error &&
        (err.message.includes('429') ||
          err.message.includes('500') ||
          err.message.includes('503') ||
          err.message.includes('ResourceExhausted'));

      if (attempt < MAX_RETRY_ATTEMPTS && isRateOrServer) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

/**
 * Generates structured JSON explanation with responseSchema and prompt-injection defenses.
 */
export async function callGeminiStructuredExplanation(
  prompt: string,
  systemInstruction?: string
): Promise<ExplanationOutput> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY secret in Supabase dashboard');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          summary: {
            type: 'STRING',
            description: 'Summary up to 15 words in the requested language',
          },
          explanation: {
            type: 'STRING',
            description: 'Plain-language explanation at Grade 5 reading level in the requested language',
          },
          confidence: {
            type: 'NUMBER',
            description: 'Confidence between 0.0 and 1.0',
          },
          source_excerpt: {
            type: 'STRING',
            description: 'Short excerpt or quotation from grounding text if applicable',
          },
        },
        required: ['summary', 'explanation'],
      },
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  return callWithRetry(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) {
      throw new Error('Gemini returned an empty candidate payload');
    }

    try {
      const parsed = JSON.parse(rawJsonText);
      return {
        summary: String(parsed.summary || '').slice(0, 150),
        explanation: String(parsed.explanation || '').slice(0, 1000),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
        source_excerpt: parsed.source_excerpt ? String(parsed.source_excerpt).slice(0, 300) : undefined,
      };
    } catch (_e) {
      throw new Error(`Failed to parse structured Gemini JSON response: ${rawJsonText}`);
    }
  });
}

/**
 * Standard text generation with retry.
 */
export async function callGeminiGenerate(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY secret in Supabase dashboard');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`;
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  return callWithRetry(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  });
}

/**
 * Embed content using RETRIEVAL_QUERY with 768 dimensions and L2 normalization.
 */
export async function callGeminiEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY secret in Supabase dashboard');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const body = {
    model: `models/${GEMINI_EMBEDDING_MODEL}`,
    content: { parts: [{ text: text.slice(0, 2048) }] },
    taskType: 'RETRIEVAL_QUERY',
    outputDimensionality: EMBEDDING_DIMENSIONALITY,
  };

  return callWithRetry(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini Embedding error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const values: number[] = data?.embedding?.values || [];
    return l2Normalize(values);
  });
}

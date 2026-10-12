/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { callGeminiEmbedding, callGeminiGenerate, GEMINI_EMBEDDING_MODEL, GEMINI_TEXT_MODEL } from '../_shared/gemini.ts';
import { supabaseQuery } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const result = {
    ok: true,
    timestamp: new Date().toISOString(),
    database: {
      reachable: false,
      indexed_documents: 0,
      latency_ms: 0,
      error: null as string | null,
    },
    gemini: {
      reachable: false,
      model: GEMINI_TEXT_MODEL,
      error: null as string | null,
    },
    embedding: {
      reachable: false,
      model: GEMINI_EMBEDDING_MODEL,
      error: null as string | null,
    },
  };

  // 1. Check Database Reachability & Document Count
  const dbStart = performance.now();
  try {
    const dbRes = await supabaseQuery('source_documents?select=count', {
      headers: { Prefer: 'count=exact' },
    });
    result.database.latency_ms = Math.round(performance.now() - dbStart);

    if (dbRes.ok) {
      result.database.reachable = true;
      const countHeader = dbRes.headers.get('content-range');
      if (countHeader) {
        const parts = countHeader.split('/');
        result.database.indexed_documents = parseInt(parts[1] || '0', 10) || 0;
      } else {
        const data = await dbRes.json();
        result.database.indexed_documents = Array.isArray(data) ? data.length : 0;
      }
    } else {
      result.database.error = `HTTP ${dbRes.status}: ${await dbRes.text()}`;
      result.ok = false;
    }
  } catch (err: unknown) {
    result.database.latency_ms = Math.round(performance.now() - dbStart);
    result.database.error = err instanceof Error ? err.message : String(err);
    result.ok = false;
  }

  // 2. Check Gemini Text Generation
  try {
    const pingText = await callGeminiGenerate('Reply with one word: pong');
    if (pingText && pingText.trim().length > 0) {
      result.gemini.reachable = true;
    } else {
      result.gemini.error = 'Empty response from Gemini';
      result.ok = false;
    }
  } catch (err: unknown) {
    result.gemini.error = err instanceof Error ? err.message : String(err);
    result.ok = false;
  }

  // 3. Check Embedding Model
  try {
    const embeddingVec = await callGeminiEmbedding('Health probe test');
    if (Array.isArray(embeddingVec) && embeddingVec.length > 0) {
      result.embedding.reachable = true;
    } else {
      result.embedding.error = 'Invalid embedding vector returned';
      result.ok = false;
    }
  } catch (err: unknown) {
    result.embedding.error = err instanceof Error ? err.message : String(err);
    result.ok = false;
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
});

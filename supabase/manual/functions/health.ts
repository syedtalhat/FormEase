// ==============================================================================
// Self-Contained Edge Function: health
// Generated for direct copy-paste into the Supabase Dashboard Edge Functions Editor.
// All shared helpers (CORS, Gemini, Database) are bundled in this single file.
// ==============================================================================

// supabase/functions/_shared/cors.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS"
};
function handleCors(req) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

// supabase/functions/_shared/config.ts
var GEMINI_TEXT_MODEL = (typeof Deno !== "undefined" ? Deno.env.get("GEMINI_TEXT_MODEL") : "") || "gemini-3.8-flash";
var GEMINI_EMBEDDING_MODEL = (typeof Deno !== "undefined" ? Deno.env.get("GEMINI_EMBEDDING_MODEL") : "") || "gemini-embedding-2-preview";
var EMBEDDING_DIMENSIONALITY = 768;
var RATE_LIMIT_WINDOW_MS = 60 * 1e3;
var MAX_RETRY_ATTEMPTS = 2;
var INITIAL_BACKOFF_MS = 500;

// supabase/functions/_shared/gemini.ts
function l2Normalize(vec) {
  const norm = Math.hypot(...vec);
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}
async function callWithRetry(fn) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateOrServer = err instanceof Error && (err.message.includes("429") || err.message.includes("500") || err.message.includes("503") || err.message.includes("ResourceExhausted"));
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
async function callGeminiGenerate(prompt, systemInstruction) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY secret in Supabase dashboard");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }
  return callWithRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  });
}
async function callGeminiEmbedding(text) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY secret in Supabase dashboard");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const body = {
    model: `models/${GEMINI_EMBEDDING_MODEL}`,
    content: { parts: [{ text: text.slice(0, 2048) }] },
    taskType: "RETRIEVAL_QUERY",
    outputDimensionality: EMBEDDING_DIMENSIONALITY
  };
  return callWithRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini Embedding error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const values = data?.embedding?.values || [];
    return l2Normalize(values);
  });
}

// supabase/functions/_shared/supabase.ts
function getSupabaseEnv() {
  const url = (typeof Deno !== "undefined" ? Deno.env.get("SUPABASE_URL") : "") || "";
  const serviceKey = (typeof Deno !== "undefined" ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") : "") || "";
  return { url, serviceKey };
}
async function supabaseQuery(path, options = {}) {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${path.replace(/^\//, "")}`;
  const headers = new Headers(options.headers || {});
  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(endpoint, {
    ...options,
    headers
  });
}

// supabase/functions/health/index.ts
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const result = {
    ok: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    database: {
      reachable: false,
      indexed_documents: 0,
      latency_ms: 0,
      error: null
    },
    gemini: {
      reachable: false,
      model: GEMINI_TEXT_MODEL,
      error: null
    },
    embedding: {
      reachable: false,
      model: GEMINI_EMBEDDING_MODEL,
      error: null
    }
  };
  const dbStart = performance.now();
  try {
    const dbRes = await supabaseQuery("source_documents?select=count", {
      headers: { Prefer: "count=exact" }
    });
    result.database.latency_ms = Math.round(performance.now() - dbStart);
    if (dbRes.ok) {
      result.database.reachable = true;
      const countHeader = dbRes.headers.get("content-range");
      if (countHeader) {
        const parts = countHeader.split("/");
        result.database.indexed_documents = parseInt(parts[1] || "0", 10) || 0;
      } else {
        const data = await dbRes.json();
        result.database.indexed_documents = Array.isArray(data) ? data.length : 0;
      }
    } else {
      result.database.error = `HTTP ${dbRes.status}: ${await dbRes.text()}`;
      result.ok = false;
    }
  } catch (err) {
    result.database.latency_ms = Math.round(performance.now() - dbStart);
    result.database.error = err instanceof Error ? err.message : String(err);
    result.ok = false;
  }
  try {
    const pingText = await callGeminiGenerate("Reply with one word: pong");
    if (pingText && pingText.trim().length > 0) {
      result.gemini.reachable = true;
    } else {
      result.gemini.error = "Empty response from Gemini";
      result.ok = false;
    }
  } catch (err) {
    result.gemini.error = err instanceof Error ? err.message : String(err);
    result.ok = false;
  }
  try {
    const embeddingVec = await callGeminiEmbedding("Health probe test");
    if (Array.isArray(embeddingVec) && embeddingVec.length > 0) {
      result.embedding.reachable = true;
    } else {
      result.embedding.error = "Invalid embedding vector returned";
      result.ok = false;
    }
  } catch (err) {
    result.embedding.error = err instanceof Error ? err.message : String(err);
    result.ok = false;
  }
  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

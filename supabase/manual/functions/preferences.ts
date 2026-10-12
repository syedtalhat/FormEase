// ==============================================================================
// Self-Contained Edge Function: preferences
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

// supabase/functions/_shared/auth.ts
async function requireAuthUser(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Missing or malformed Authorization header. Bearer token required." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    };
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const { url, serviceKey } = getSupabaseEnv();
  if (url && serviceKey) {
    try {
      const userRes = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: serviceKey
        }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData?.id) {
          return {
            user: {
              id: userData.id,
              email: userData.email,
              role: userData.role
            }
          };
        }
      }
    } catch (_e) {
    }
  }
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decodedJson = atob(payloadBase64);
      const claims = JSON.parse(decodedJson);
      if (claims?.sub) {
        return {
          user: {
            id: claims.sub,
            email: claims.email,
            role: claims.role
          }
        };
      }
    }
  } catch (_e) {
  }
  return {
    errorResponse: new Response(
      JSON.stringify({ error: "Invalid or expired authentication token." }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  };
}

// supabase/functions/preferences/index.ts
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const authResult = await requireAuthUser(req);
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }
  const userId = authResult.user.id;
  try {
    if (req.method === "GET") {
      const userRes = await supabaseQuery(`users?id=eq.${userId}&select=default_language&limit=1`);
      if (userRes.ok) {
        const rows = await userRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return new Response(
            JSON.stringify({ default_language: rows[0].default_language || "en" }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
      }
      return new Response(JSON.stringify({ default_language: "en" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (req.method === "POST" || req.method === "PUT") {
      const { default_language = "en" } = await req.json();
      if (!["en", "hi", "mr"].includes(default_language)) {
        return new Response(
          JSON.stringify({ error: "Invalid language. Supported: en, hi, mr." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      const upsertRes = await supabaseQuery("users?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          id: userId,
          default_language
        })
      });
      if (!upsertRes.ok) {
        throw new Error(`Failed to update preferences: ${await upsertRes.text()}`);
      }
      return new Response(
        JSON.stringify({
          success: true,
          default_language
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

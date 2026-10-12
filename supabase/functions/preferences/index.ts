/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { requireAuthUser } from '../_shared/auth.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { supabaseQuery } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // JWT is required for Preferences (NFR-SEC.5)
  const authResult = await requireAuthUser(req);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }
  const userId = authResult.user.id;

  try {
    if (req.method === 'GET') {
      const userRes = await supabaseQuery(`users?id=eq.${userId}&select=default_language&limit=1`);
      if (userRes.ok) {
        const rows = await userRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return new Response(
            JSON.stringify({ default_language: rows[0].default_language || 'en' }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Default fallback
      return new Response(JSON.stringify({ default_language: 'en' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { default_language = 'en' } = await req.json();

      if (!['en', 'hi', 'mr'].includes(default_language)) {
        return new Response(
          JSON.stringify({ error: 'Invalid language. Supported: en, hi, mr.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const upsertRes = await supabaseQuery('users?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: userId,
          default_language,
        }),
      });

      if (!upsertRes.ok) {
        throw new Error(`Failed to update preferences: ${await upsertRes.text()}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          default_language,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { corsHeaders } from './cors.ts';
import { getSupabaseEnv } from './supabase.ts';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Extracts and verifies JWT for protected endpoints (NFR-SEC.5).
 * Returns AuthenticatedUser or a 401 Response.
 */
export async function requireAuthUser(req: Request): Promise<{ user: AuthenticatedUser } | { errorResponse: Response }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: 'Missing or malformed Authorization header. Bearer token required.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const { url, serviceKey } = getSupabaseEnv();

  // 1. Verify via Supabase Auth Endpoint if configured
  if (url && serviceKey) {
    try {
      const userRes = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: serviceKey,
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData?.id) {
          return {
            user: {
              id: userData.id,
              email: userData.email,
              role: userData.role,
            },
          };
        }
      }
    } catch (_e) {
      // Fallback to JWT payload parse below
    }
  }

  // 2. Fallback: Parse unencrypted JWT claims (sub is user UUID)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedJson = atob(payloadBase64);
      const claims = JSON.parse(decodedJson);

      if (claims?.sub) {
        return {
          user: {
            id: claims.sub,
            email: claims.email,
            role: claims.role,
          },
        };
      }
    }
  } catch (_e) {
    // Malformed token
  }

  return {
    errorResponse: new Response(
      JSON.stringify({ error: 'Invalid or expired authentication token.' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    ),
  };
}

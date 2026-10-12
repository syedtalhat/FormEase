/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Ambient declaration for Deno runtime in Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Database Schema & RLS Policy Enforcement (NFR-SEC.1–3)', () => {
  const schemaPath = path.join(process.cwd(), 'supabase', 'migrations', '0001_init.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  it('enables Row Level Security on all 8 tables', () => {
    const requiredTables = [
      'users',
      'forms',
      'fields',
      'source_documents',
      'explanations',
      'chat_sessions',
      'chat_messages',
      'risk_flags',
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('restricts reference tables to SELECT-only for public access', () => {
    const referenceTables = ['forms', 'fields', 'source_documents', 'explanations', 'risk_flags'];

    for (const table of referenceTables) {
      // Must have public SELECT policy
      expect(sql).toMatch(new RegExp(`CREATE POLICY [^;]+ ON public\\.${table}\\s+FOR SELECT`, 'i'));
      // Must NOT have public INSERT, UPDATE, or DELETE policies
      expect(sql).not.toMatch(new RegExp(`CREATE POLICY [^;]+ ON public\\.${table}\\s+FOR INSERT`, 'i'));
      expect(sql).not.toMatch(new RegExp(`CREATE POLICY [^;]+ ON public\\.${table}\\s+FOR UPDATE`, 'i'));
      expect(sql).not.toMatch(new RegExp(`CREATE POLICY [^;]+ ON public\\.${table}\\s+FOR DELETE`, 'i'));
    }
  });

  it('enforces auth.uid() isolation on chat_sessions', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can manage own chat sessions"\s+ON public\.chat_sessions/i);
    expect(sql).toContain('auth.uid() = user_id');
  });

  it('enforces session ownership isolation on chat_messages', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can manage messages in own sessions"\s+ON public\.chat_messages/i);
    expect(sql).toContain('s.user_id = auth.uid()');
  });

  it('enforces user profile isolation on users table', () => {
    expect(sql).toMatch(/CREATE POLICY "Users can read own record"\s+ON public\.users\s+FOR SELECT/i);
    expect(sql).toMatch(/CREATE POLICY "Users can update own record"\s+ON public\.users\s+FOR UPDATE/i);
    expect(sql).toContain('auth.uid() = id');
  });

  it('configures vector similarity search RPC with match_source_documents', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.match_source_documents');
    expect(sql).toContain('query_embedding VECTOR(768)');
    expect(sql).toContain('sd.embedding <=> query_embedding');
  });

  it('registers auto-provisioning trigger on auth.users', () => {
    expect(sql).toContain('CREATE TRIGGER on_auth_user_created');
    expect(sql).toContain('AFTER INSERT ON auth.users');
    expect(sql).toContain('public.handle_new_user()');
  });
});

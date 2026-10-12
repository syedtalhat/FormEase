/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { SupportedLanguage } from '../i18n';

// Zod schemas for runtime validation per Section 9 and Section 13
export const ExplanationSchema = z.object({
  summary: z.string(), // <= 15 words
  text: z.string(),
  source_label: z.enum(['page', 'official', 'ai']),
  source_url: z.string().optional(),
  source_excerpt: z.string().optional(),
  confidence: z.number().optional(),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

export const FieldStructureSchema = z.object({
  field_key: z.string(),
  label: z.string(),
  input_type: z.string(),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  page_help: z.string().optional(),
});
export type FieldStructure = z.infer<typeof FieldStructureSchema>;

export const RiskFlagSchema = z.object({
  flag_type: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  description_key: z.string(),
  field_key: z.string().optional(),
  meta: z.record(z.string(), z.string()).optional(),
});
export type RiskFlag = z.infer<typeof RiskFlagSchema>;

export const AnalyzeFormRequestSchema = z.object({
  page_url: z.string(),
  form_action: z.string(),
  form_title: z.string().optional(),
  language: z.enum(['en', 'hi', 'mr']),
  fields: z.array(FieldStructureSchema),
});
export type AnalyzeFormRequest = z.infer<typeof AnalyzeFormRequestSchema>;

export const AnalyzeFormResponseSchema = z.object({
  fields: z.array(
    FieldStructureSchema.extend({
      risk_tag: z.enum(['required', 'optional', 'unusual']),
      explanation: ExplanationSchema,
    })
  ),
  risk_flags: z.array(RiskFlagSchema),
});
export type AnalyzeFormResponse = z.infer<typeof AnalyzeFormResponseSchema>;

export const ChatRequestSchema = z.object({
  session_id: z.string().optional(),
  focused_field_key: z.string().optional(),
  completed_field_keys: z.array(z.string()),
  language: z.enum(['en', 'hi', 'mr']),
  message: z.string(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  reply: z.string(),
  session_id: z.string(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const PreferencesSchema = z.object({
  default_language: z.enum(['en', 'hi', 'mr']),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export interface BackendHealthResult {
  ok: boolean;
  timestamp: string;
  database: {
    reachable: boolean;
    indexed_documents: number;
    latency_ms: number;
    error: string | null;
  };
  gemini: {
    reachable: boolean;
    model: string;
    error: string | null;
  };
  embedding: {
    reachable: boolean;
    model: string;
    error: string | null;
  };
}

/**
 * ApiClient contract per Section 9.
 */
export interface ApiClient {
  analyzeForm(req: AnalyzeFormRequest): Promise<AnalyzeFormResponse>;
  explainField(req: { field_key: string; form_key: string; language: SupportedLanguage }): Promise<Explanation>;
  chat(req: ChatRequest): Promise<ChatResponse>;
  getPreferences(): Promise<Preferences>;
  setPreferences(p: Preferences): Promise<void>;
  checkHealth(): Promise<BackendHealthResult>;
}

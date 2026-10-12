/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { SupportedLanguage } from '../i18n';
import { SessionState } from '../session/types';
import {
  AnalyzeFormRequest,
  AnalyzeFormResponse,
  AnalyzeFormResponseSchema,
  BackendHealthResult,
  ChatRequest,
  ChatResponse,
  ChatResponseSchema,
  Explanation,
  ExplanationSchema,
} from '../api/types';

// ============================================================================
// Message Schemas (MV3 Messaging Contract)
// ============================================================================

export const SupportedLanguageSchema = z.enum(['en', 'hi', 'mr']);

export const AnalyzeFormPayloadSchema = z.object({
  page_url: z.string(),
  form_action: z.string().optional(),
  form_title: z.string().optional(),
  language: SupportedLanguageSchema,
  fields: z.array(z.any()),
});

export const ExplainFieldPayloadSchema = z.object({
  field_key: z.string(),
  form_key: z.string(),
  language: SupportedLanguageSchema,
});

export const ChatPayloadSchema = z.object({
  message: z.string(),
  language: SupportedLanguageSchema,
  focused_field_key: z.string().optional(),
  completed_field_keys: z.array(z.string()).default([]),
});

export const MirrorTabStatePayloadSchema = z.object({
  tabId: z.number().optional(),
  state: z.any(),
});

export const InjectScriptPayloadSchema = z.object({
  tabId: z.number(),
});

export const SetTabLanguagePayloadSchema = z.object({
  language: SupportedLanguageSchema,
});

// Discriminated message schemas
export const ExtensionMessageSchema = z.discriminatedUnion('type', [
  // Content / Popup -> Background
  z.object({ type: z.literal('PING') }),
  z.object({ type: z.literal('ANALYZE_FORM'), payload: AnalyzeFormPayloadSchema }),
  z.object({ type: z.literal('EXPLAIN_FIELD'), payload: ExplainFieldPayloadSchema }),
  z.object({ type: z.literal('CHAT'), payload: ChatPayloadSchema }),
  z.object({ type: z.literal('HEALTH_CHECK') }),
  z.object({ type: z.literal('MIRROR_TAB_STATE'), payload: MirrorTabStatePayloadSchema }),
  z.object({ type: z.literal('INJECT_CONTENT_SCRIPT'), payload: InjectScriptPayloadSchema }),
  z.object({ type: z.literal('OPEN_OPTIONS') }),
  z.object({ type: z.literal('OPEN_ONBOARDING') }),
  z.object({ type: z.literal('GET_CURRENT_TAB') }),

  // Popup / Background -> Content
  z.object({ type: z.literal('TOGGLE_OVERLAY') }),
  z.object({ type: z.literal('ACTIVATE_OVERLAY') }),
  z.object({ type: z.literal('DEACTIVATE_OVERLAY') }),
  z.object({ type: z.literal('SET_TAB_LANGUAGE'), payload: SetTabLanguagePayloadSchema }),
  z.object({ type: z.literal('GET_TAB_STATE') }),
]);

export type ExtensionMessage = z.infer<typeof ExtensionMessageSchema>;

export interface ExtensionMessageResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Type-safe helper to send messages via chrome.runtime.sendMessage
 */
export async function sendRuntimeMessage<T = unknown>(
  message: ExtensionMessage
): Promise<ExtensionMessageResponse<T>> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    throw new Error('chrome.runtime.sendMessage is not available in current environment.');
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ExtensionMessageResponse<T>) => {
      const err = chrome.runtime.lastError;
      if (err) {
        resolve({ ok: false, error: err.message });
      } else {
        resolve(response || { ok: false, error: 'Empty response received.' });
      }
    });
  });
}

/**
 * Type-safe helper to send messages to a specific tab via chrome.tabs.sendMessage
 */
export async function sendTabMessage<T = unknown>(
  tabId: number,
  message: ExtensionMessage
): Promise<ExtensionMessageResponse<T>> {
  if (typeof chrome === 'undefined' || !chrome.tabs?.sendMessage) {
    throw new Error('chrome.tabs.sendMessage is not available in current environment.');
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: ExtensionMessageResponse<T>) => {
      const err = chrome.runtime.lastError;
      if (err) {
        resolve({ ok: false, error: err.message });
      } else {
        resolve(response || { ok: false, error: 'Empty response received.' });
      }
    });
  });
}

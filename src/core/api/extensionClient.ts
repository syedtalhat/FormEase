/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApiClient,
  AnalyzeFormRequest,
  AnalyzeFormResponse,
  AnalyzeFormResponseSchema,
  ChatRequest,
  ChatResponse,
  ChatResponseSchema,
  Explanation,
  ExplanationSchema,
  Preferences,
  BackendHealthResult,
} from './types';
import { sendRuntimeMessage } from '../messaging';

/**
 * ExtensionApiClient for the Content Script.
 * STRICT PRIVACY REQUIREMENT:
 * The content script NEVER makes direct network calls (fetch) and NEVER holds auth tokens.
 * All backend communications are routed through chrome.runtime.sendMessage to the
 * background service worker.
 */
export class ExtensionApiClient implements ApiClient {
  async checkHealth(): Promise<BackendHealthResult> {
    const res = await sendRuntimeMessage<BackendHealthResult>({
      type: 'HEALTH_CHECK',
    });
    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Backend health check failed');
    }
    return res.data;
  }

  async analyzeForm(req: AnalyzeFormRequest): Promise<AnalyzeFormResponse> {
    const res = await sendRuntimeMessage<unknown>({
      type: 'ANALYZE_FORM',
      payload: {
        page_url: req.page_url,
        form_action: req.form_action,
        form_title: req.form_title,
        language: req.language,
        fields: req.fields,
      },
    });

    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Form analysis failed');
    }

    return AnalyzeFormResponseSchema.parse(res.data);
  }

  async explainField(req: {
    field_key: string;
    form_key: string;
    language: 'en' | 'hi' | 'mr';
  }): Promise<Explanation> {
    const res = await sendRuntimeMessage<unknown>({
      type: 'EXPLAIN_FIELD',
      payload: req,
    });

    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Field explanation failed');
    }

    return ExplanationSchema.parse(res.data);
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const res = await sendRuntimeMessage<unknown>({
      type: 'CHAT',
      payload: {
        message: req.message,
        language: req.language,
        focused_field_key: req.focused_field_key,
        completed_field_keys: req.completed_field_keys || [],
      },
    });

    if (!res.ok || !res.data) {
      throw new Error(res.error || 'Chat query failed');
    }

    return ChatResponseSchema.parse(res.data);
  }

  async getPreferences(): Promise<Preferences> {
    return { default_language: 'en' };
  }

  async setPreferences(_p: Preferences): Promise<void> {
    // Preferences handled in background / storage
  }
}

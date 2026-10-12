/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLanguage } from '../i18n';

export type SessionStateType =
  | 'idle'
  | 'scanning'
  | 'analyzing'
  | 'ready'
  | 'fieldFocused'
  | 'chatOpen'
  | 'error'
  | 'deactivated';

export interface FieldItem {
  field_key: string;
  label: string;
  input_type: string;
  required: boolean;
  risk_tag: 'required' | 'optional' | 'unusual';
  placeholder?: string;
  options?: string[];
  page_help?: string;
  explanation?: {
    summary: string;
    text: string;
    source_label: 'page' | 'official' | 'ai';
    source_url?: string;
    source_excerpt?: string;
    confidence?: number;
  };
}

export interface RiskFlagItem {
  flag_type: string;
  severity: 'high' | 'medium' | 'low';
  description_key: string;
  field_key?: string;
}

export interface SessionContext {
  language: SupportedLanguage;
  fields: FieldItem[];
  riskFlags: RiskFlagItem[];
  focusedFieldId?: string;
  errorKind?: 'no_form' | 'network';
  speaking?: boolean;
}

export interface SessionState {
  current: SessionStateType;
  context: SessionContext;
}

export type SessionEvent =
  | { type: 'ACTIVATE' }
  | { type: 'EXTRACTION_DONE'; fields?: FieldItem[] }
  | { type: 'NO_FORM_FOUND' }
  | { type: 'ANALYSIS_DONE'; fields: FieldItem[]; riskFlags: RiskFlagItem[] }
  | { type: 'API_FAILED' }
  | { type: 'FIELD_FOCUS'; fieldId: string }
  | { type: 'FIELD_BLUR' }
  | { type: 'OPEN_CHAT'; fieldId?: string }
  | { type: 'ASK_IN_CHAT'; fieldId?: string }
  | { type: 'CLOSE_CHAT' }
  | { type: 'DOM_MUTATED' }
  | { type: 'RETRY' }
  | { type: 'DISMISS' }
  | { type: 'SET_LANGUAGE'; language: SupportedLanguage }
  | { type: 'SET_SPEAKING'; speaking: boolean }
  | { type: 'DEACTIVATE' }
  | { type: 'TAB_CLOSED' };

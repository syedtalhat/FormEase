/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'hi' | 'mr';

export type SourceProvenance =
  | 'From this page'
  | 'From official source'
  | "AI's general knowledge";

export type FieldRiskTag = 'required' | 'optional' | 'unusual';

export interface ExtractedField {
  id: string;
  fieldKey: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  ariaDescribedby?: string;
  pageHelpText?: string;
  isSensitiveBlocked?: boolean;
  boundingRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  };
}

export interface FormStructure {
  formId: string;
  pageUrl: string;
  actionUrl: string;
  title: string;
  domain: string;
  isHttps: boolean;
  fields: ExtractedField[];
}

export interface RiskFlag {
  id: string;
  formId: string;
  fieldId?: string;
  flagType:
    | 'DOMAIN_MISMATCH'
    | 'INSECURE_HTTP'
    | 'SUSPICIOUS_OTP_REQUEST'
    | 'SUSPICIOUS_NATIONAL_ID'
    | 'UNUSUAL_FIELD';
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface FieldExplanation {
  id: string;
  fieldId: string;
  fieldKey: string;
  language: Language;
  summary: string; // 1-line summary (approx ≤15 words)
  fullExplanation: string;
  sourceLabel: SourceProvenance;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceExcerpt?: string;
  confidence: number;
  riskTag: FieldRiskTag;
  riskReason?: string;
}

export type SessionState =
  | 'idle'
  | 'scanning'
  | 'analyzing'
  | 'ready'
  | 'field_focused'
  | 'chat_open'
  | 'error'
  | 'deactivated';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  focusedFieldId?: string;
  focusedFieldLabel?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  formId: string;
  startedAt: string;
  messages: ChatMessage[];
}

export interface UserPreferences {
  userId: string;
  email: string;
  defaultLanguage: Language;
  speechRate: number;
  autoExplainOnFocus: boolean;
  highContrast: boolean;
}

export interface SourceDocument {
  id: string;
  formId: string;
  title: string;
  url: string;
  contentText: string;
  category: string;
  indexedAt: string;
}

export interface AnalyzeFormResponse {
  formId: string;
  domain: string;
  isHttps: boolean;
  riskFlags: RiskFlag[];
  fields: {
    field: ExtractedField;
    riskTag: FieldRiskTag;
    explanation: FieldExplanation;
  }[];
}

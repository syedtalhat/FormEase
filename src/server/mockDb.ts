/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ChatSession, ExtractedField, FieldExplanation, Language, RiskFlag, UserPreferences } from '../types';
import { DEMO_SOURCE_DOCUMENTS } from './ragDocs';

export interface DbForm {
  id: string;
  domain: string;
  pageUrlPattern: string;
  title: string;
  lastIndexedAt: string;
}

export interface DbUser {
  id: string;
  email: string;
  defaultLanguage: Language;
  createdAt: string;
}

class MockDatabase {
  users: Map<string, DbUser> = new Map([
    [
      'user-default',
      {
        id: 'user-default',
        email: 'student@example.org',
        defaultLanguage: 'en',
        createdAt: new Date().toISOString(),
      },
    ],
  ]);

  forms: Map<string, DbForm> = new Map([
    [
      'form-scholarship',
      {
        id: 'form-scholarship',
        domain: 'scholarships.gov.in',
        pageUrlPattern: '/apply/post-matric-2026',
        title: 'State Post-Matric Scholarship Scheme 2026',
        lastIndexedAt: new Date().toISOString(),
      },
    ],
    [
      'form-bank-kyc',
      {
        id: 'form-bank-kyc',
        domain: 'secure-banking.org',
        pageUrlPattern: '/portal/re-kyc-update',
        title: 'Bank Customer Re-KYC Update Portal',
        lastIndexedAt: new Date().toISOString(),
      },
    ],
    [
      'form-fellowship',
      {
        id: 'form-fellowship',
        domain: 'fellowship-council.res.in',
        pageUrlPattern: '/portal/fellowship-application',
        title: 'National Merit Fellowship for Doctoral Research',
        lastIndexedAt: new Date().toISOString(),
      },
    ],
    [
      'form-phishing',
      {
        id: 'form-phishing',
        domain: 'expressbill-quickpay.xyz',
        pageUrlPattern: '/pay/urgent-clearance',
        title: 'ExpressBill Portal (Unsecured Test Gateway)',
        lastIndexedAt: new Date().toISOString(),
      },
    ],
  ]);

  fields: Map<string, ExtractedField> = new Map();
  explanations: Map<string, FieldExplanation> = new Map();
  sourceDocuments = DEMO_SOURCE_DOCUMENTS;
  chatSessions: Map<string, ChatSession> = new Map();
  riskFlags: RiskFlag[] = [];

  preferences: UserPreferences = {
    userId: 'user-default',
    email: 'student@example.org',
    defaultLanguage: 'en',
    speechRate: 1.0,
    autoExplainOnFocus: true,
    highContrast: false,
  };

  logRiskFlags(flags: RiskFlag[]): void {
    this.riskFlags.push(...flags);
  }

  saveChatTurn(sessionId: string, userMsg: string, aiMsg: string, focusedFieldId?: string): void {
    let session = this.chatSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId: 'user-default',
        formId: 'active-form',
        startedAt: new Date().toISOString(),
        messages: [],
      };
      this.chatSessions.set(sessionId, session);
    }

    session.messages.push({
      id: `msg-${Date.now()}-u`,
      sessionId,
      role: 'user',
      content: userMsg,
      focusedFieldId,
      createdAt: new Date().toISOString(),
    });

    session.messages.push({
      id: `msg-${Date.now()}-a`,
      sessionId,
      role: 'assistant',
      content: aiMsg,
      focusedFieldId,
      createdAt: new Date().toISOString(),
    });
  }

  getRecentChat(sessionId: string): ChatMessage[] {
    return this.chatSessions.get(sessionId)?.messages || [];
  }
}

export const db = new MockDatabase();

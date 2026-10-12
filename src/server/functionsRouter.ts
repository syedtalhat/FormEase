/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { GEMINI_MODEL } from './geminiService';
import { db } from './mockDb';
import { DEMO_SOURCE_DOCUMENTS } from './ragDocs';

export const functionsRouter = Router();

// 1. GET /functions/v1/health
functionsRouter.get('/health', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasGemini = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    database: {
      reachable: true,
      indexed_documents: DEMO_SOURCE_DOCUMENTS.length,
      latency_ms: 8,
      error: null,
    },
    gemini: {
      reachable: hasGemini,
      model: GEMINI_MODEL,
      error: hasGemini ? null : 'GEMINI_API_KEY not configured or placeholder',
    },
    embedding: {
      reachable: hasGemini,
      model: 'text-embedding-004',
      error: hasGemini ? null : 'GEMINI_API_KEY not configured or placeholder',
    },
  });
});

// 2. POST /functions/v1/analyze-form
functionsRouter.post('/analyze-form', (req, res) => {
  try {
    const { page_url = '', form_action = '', fields = [] } = req.body;
    const isLocalhost = page_url.includes('localhost') || page_url.includes('127.0.0.1');

    const risk_flags: Array<{
      flag_type: string;
      severity: 'high' | 'medium' | 'low';
      description_key: string;
      field_key?: string;
      meta?: Record<string, string>;
    }> = [];

    // Protocol check
    if (page_url.startsWith('http:') && !isLocalhost) {
      risk_flags.push({
        flag_type: 'insecure_transmission',
        severity: 'medium',
        description_key: 'insecure_http_warning',
      });
    }

    // Action mismatch check
    if (form_action && form_action.startsWith('http')) {
      try {
        const pageHost = new URL(page_url).hostname;
        const actionHost = new URL(form_action).hostname;
        if (pageHost && actionHost && pageHost !== actionHost) {
          risk_flags.push({
            flag_type: 'domain_spoof',
            severity: 'high',
            description_key: 'domain_mismatch_warning',
            meta: { pageHost, actionHost },
          });
        }
      } catch (_e) {
        // ignore
      }
    }

    const analyzedFields = fields.map((f: {
      field_key: string;
      label: string;
      input_type: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
      page_help?: string;
    }) => {
      const combined = `${f.label || ''} ${f.field_key || ''}`.toLowerCase();
      let risk_tag: 'required' | 'optional' | 'unusual' = f.required ? 'required' : 'optional';

      if (combined.includes('otp') || combined.includes('cvv') || combined.includes('atm pin')) {
        risk_tag = 'unusual';
        risk_flags.push({
          flag_type: 'credential_harvesting',
          severity: 'high',
          description_key: 'credential_harvesting_detected',
          field_key: f.field_key,
        });
      }

      // Check official docs grounding
      const matchedDoc = DEMO_SOURCE_DOCUMENTS.find(
        (doc) => combined.includes('aadhaar') || combined.includes('income') || combined.includes('kyc')
      );

      let explanation;
      if (f.page_help && f.page_help.trim().length > 10) {
        explanation = {
          summary: `Official guidance for ${f.label || f.field_key}.`,
          text: f.page_help,
          source_label: 'page' as const,
          source_excerpt: f.page_help.slice(0, 100),
          confidence: 0.95,
        };
      } else if (matchedDoc) {
        explanation = {
          summary: `Verified regulatory guideline for ${f.label || f.field_key}.`,
          text: matchedDoc.contentText,
          source_label: 'official' as const,
          source_url: matchedDoc.url,
          source_excerpt: matchedDoc.title,
          confidence: 0.92,
        };
      } else {
        explanation = {
          summary: `Plain language guidance for ${f.label || f.field_key}.`,
          text: `Enter your ${f.label || f.field_key} carefully as requested on the form.`,
          source_label: 'ai' as const,
          confidence: 0.85,
        };
      }

      return {
        ...f,
        risk_tag,
        explanation,
      };
    });

    res.json({
      fields: analyzedFields,
      risk_flags,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// 3. POST /functions/v1/explain-field
functionsRouter.post('/explain-field', (req, res) => {
  const { field_key = 'field', label = 'Field', page_help } = req.body;
  if (page_help) {
    return res.json({
      summary: `Page guidance for ${label}.`,
      text: page_help,
      source_label: 'page',
      source_excerpt: page_help.slice(0, 80),
      confidence: 0.95,
    });
  }

  const matchedDoc = DEMO_SOURCE_DOCUMENTS.find((d) =>
    field_key.toLowerCase().includes('aadhaar') || label.toLowerCase().includes('income')
  );

  if (matchedDoc) {
    return res.json({
      summary: `Official requirement for ${label}.`,
      text: matchedDoc.contentText,
      source_label: 'official',
      source_url: matchedDoc.url,
      source_excerpt: matchedDoc.title,
      confidence: 0.9,
    });
  }

  res.json({
    summary: `Guidance for ${label}.`,
    text: `Please enter valid information for ${label}.`,
    source_label: 'ai',
    confidence: 0.85,
  });
});

// 4. POST /functions/v1/chat
functionsRouter.post('/chat', (req, res) => {
  const { message = '', session_id = crypto.randomUUID(), focused_field_key } = req.body;
  const reply = focused_field_key
    ? `Regarding "${focused_field_key}": This field is needed for verification. You can find this on your official documents.`
    : `Hello! I am here to help you complete this form safely. Feel free to ask about any field.`;

  res.json({
    reply,
    session_id,
  });
});

// 5. GET/POST /functions/v1/preferences
functionsRouter.get('/preferences', (_req, res) => {
  res.json({ default_language: db.preferences.defaultLanguage || 'en' });
});

functionsRouter.post('/preferences', (req, res) => {
  const { default_language } = req.body;
  if (default_language) {
    db.preferences.defaultLanguage = default_language;
  }
  res.json({ success: true, default_language: db.preferences.defaultLanguage });
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { ExtractedField, Language } from '../types';
import { generateChatResponse } from './chatService';
import { clearExplanationCache, getOrGenerateExplanation } from './explanationService';
import { db } from './mockDb';
import { analyzeFormRisks } from './riskAnalyzer';

export const apiRouter = Router();

// Process 3.0 & 4.0: Analyze Form Structure
apiRouter.post('/analyze-form', async (req, res) => {
  try {
    const { page_url, action_url, form_structure, language = 'en' } = req.body;
    const fields: ExtractedField[] = form_structure || [];
    const pageUrl: string = page_url || 'https://scholarships.gov.in/apply';
    const actionUrl: string = action_url || '';
    const selectedLanguage: Language = language;

    // Verify redaction guarantee FR-REDACT.2: Ensure NO field has typed '.value'
    for (const f of fields) {
      if ((f as unknown as { value?: unknown }).value !== undefined) {
        delete (f as unknown as { value?: unknown }).value;
      }
    }

    // Process 3.0: Classify Risk and Field Tags
    const { riskFlags, fieldTags } = analyzeFormRisks(pageUrl, actionUrl, fields);
    db.logRiskFlags(riskFlags);

    // Process 4.0: Generate / Retrieve Explanations
    const analyzedFields = await Promise.all(
      fields.map(async (field) => {
        const tagInfo = fieldTags.get(field.id) || { tag: field.required ? 'required' : 'optional' };
        const explanation = await getOrGenerateExplanation(
          field,
          tagInfo.tag,
          tagInfo.reason,
          selectedLanguage
        );
        return {
          field,
          riskTag: tagInfo.tag,
          riskReason: tagInfo.reason,
          explanation,
        };
      })
    );

    let domain = '';
    let isHttps = true;
    try {
      const parsed = new URL(pageUrl);
      domain = parsed.hostname;
      isHttps = parsed.protocol === 'https:';
    } catch {
      domain = 'local-portal';
    }

    res.json({
      formId: `form-${domain.replace(/[^a-zA-Z0-9]/g, '-')}`,
      domain,
      isHttps,
      riskFlags,
      fields: analyzedFields,
    });
  } catch (error) {
    console.error('Error analyzing form:', error);
    res.status(500).json({ error: 'Failed to analyze form structure.' });
  }
});

// Process 4.0: Single Field Explanation (e.g. on language change)
apiRouter.post('/explain-field', async (req, res) => {
  try {
    const { field, risk_tag = 'required', risk_reason, language = 'en' } = req.body;
    if (!field) {
      return res.status(400).json({ error: 'Field details are required.' });
    }

    const explanation = await getOrGenerateExplanation(
      field,
      risk_tag,
      risk_reason,
      language
    );

    res.json({ explanation });
  } catch (error) {
    console.error('Error explaining field:', error);
    res.status(500).json({ error: 'Failed to explain field.' });
  }
});

// Process 6.0: Context-Aware Chat
apiRouter.post('/chat', async (req, res) => {
  try {
    const {
      session_id = 'session-default',
      form_id = 'form-scholarship',
      form_title = 'Scholarship Portal',
      focused_field,
      all_fields,
      completed_fields = [],
      message,
      language = 'en',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const history = db.getRecentChat(session_id);

    const reply = await generateChatResponse({
      formId: form_id,
      formTitle: form_title,
      focusedField: focused_field,
      allFields: all_fields,
      completedFieldNames: completed_fields,
      history,
      userMessage: message,
      language,
    });

    db.saveChatTurn(session_id, message, reply, focused_field?.id);

    res.json({
      reply,
      sessionId: session_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: 'Chat service error.' });
  }
});

// Process 7.0: User Preferences
apiRouter.get('/preferences/:userId', (req, res) => {
  res.json(db.preferences);
});

apiRouter.put('/preferences/:userId', (req, res) => {
  const { default_language, speech_rate, auto_explain_on_focus, high_contrast } = req.body;
  if (default_language) db.preferences.defaultLanguage = default_language;
  if (typeof speech_rate === 'number') db.preferences.speechRate = speech_rate;
  if (typeof auto_explain_on_focus === 'boolean') {
    db.preferences.autoExplainOnFocus = auto_explain_on_focus;
  }
  if (typeof high_contrast === 'boolean') {
    db.preferences.highContrast = high_contrast;
  }
  res.json(db.preferences);
});

// Diagnostics & ERD inspector data
apiRouter.get('/erd-status', (req, res) => {
  res.json({
    forms: Array.from(db.forms.values()),
    sourceDocuments: db.sourceDocuments,
    riskFlagsLogged: db.riskFlags,
    chatSessionsCount: db.chatSessions.size,
    currentUser: db.users.get('user-default'),
  });
});

apiRouter.post('/clear-cache', (req, res) => {
  clearExplanationCache();
  res.json({ success: true, message: 'Explanation cache cleared.' });
});

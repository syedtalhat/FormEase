/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ExtractedField, Language } from '../types';
import { getGeminiClient, GEMINI_MODEL } from './geminiService';

export interface ChatRequestContext {
  formId: string;
  formTitle: string;
  focusedField?: ExtractedField;
  allFields?: ExtractedField[];
  completedFieldNames?: string[];
  history: ChatMessage[];
  userMessage: string;
  language: Language;
}

export async function generateChatResponse(ctx: ChatRequestContext): Promise<string> {
  const gemini = getGeminiClient();

  const fieldLabel = ctx.focusedField?.label || 'General Form Assistance';
  const fieldType = ctx.focusedField?.type || 'text';
  const languageName = ctx.language === 'hi' ? 'Hindi' : ctx.language === 'mr' ? 'Marathi' : 'English';

  // Cap recent conversation history at last 6 turns (FR-CHAT.3, NFR-SCALE.2)
  const recentHistory = ctx.history.slice(-6);

  if (gemini) {
    try {
      const systemInstruction = `You are FormAssist, a patient, warm, and humble older-sibling companion helping someone complete confusing paperwork.
Tone: Calm, clear, empathetic, respectful, and never bureaucratic.
Current Form: "${ctx.formTitle || ctx.formId}"
Active Focused Field: "${fieldLabel}" (Type: ${fieldType})
Target Response Language: ${languageName}
Completed fields so far: ${ctx.completedFieldNames?.join(', ') || 'None yet'}

Guidelines:
1. Always reference the active focused field when relevant.
2. Give actionable, gentle advice (e.g. which document to look in, what to do if they don't have the number, or how to avoid disqualification).
3. Keep answers concise (under 80 words) and directly helpful.
4. Output in natural ${languageName} script.`;

      const contents = [
        ...recentHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [{ text: ctx.userMessage }],
        },
      ];

      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      if (response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch {
      // Fall through to contextual fallback
    }
  }

  // Empathetic fallback response
  return getFallbackChatResponse(ctx.userMessage, fieldLabel, ctx.language);
}

function getFallbackChatResponse(message: string, fieldLabel: string, language: Language): string {
  const msgLower = message.toLowerCase();

  if (language === 'hi') {
    if (msgLower.includes('don\'t know') || msgLower.includes('पता नहीं') || msgLower.includes('नहीं है')) {
      return `चिंता न करें। "${fieldLabel}" के लिए आप अपने राशन कार्ड, आय प्रमाण पत्र या आधार कार्ड की प्रति देख सकते हैं। यदि आपके पास यह संख्या अभी उपलब्ध नहीं है, तो आप अपने नजदीकी जन सेवा केंद्र या कॉलेज प्रशासनिक कार्यालय से भी संपर्क कर सकते हैं।`;
    }
    return `"${fieldLabel}" के संबंध में: कृपया सुनिश्चित करें कि यह आपके आधिकारिक दस्तावेजों से मेल खाता हो। यदि आपको किसी विशिष्ट दस्तावेज के बारे में संदेह है, तो बेझिझक पूछें।`;
  }

  if (language === 'mr') {
    if (msgLower.includes('don\'t know') || msgLower.includes('माहित नाही')) {
      return `काळजी करू नका. "${fieldLabel}" साठी तुम्ही तुमचे उत्पन्न प्रमाणपत्र, रेशन कार्ड किंवा आधार कार्ड तपासू शकता. माहिती लगेच उपलब्ध नसल्यास कॉलेजच्या प्रशासकीय कक्षाची मदत घेता येईल.`;
    }
    return `"${fieldLabel}" बाबत: कृपया आपल्या अधिकृत कागदपत्रांवर नमूद माहितीच येथे नोंदवा. काही अडचण असल्यास नक्की विचारा.`;
  }

  if (msgLower.includes('don\'t know') || msgLower.includes('not sure') || msgLower.includes('missing')) {
    return `Don't worry! For "${fieldLabel}", check your official certificate or passbook. If you don't have the exact figure right now, save your progress or check with your institution's help desk before submitting.`;
  }

  return `Regarding "${fieldLabel}": Make sure the details match your official certificate or government ID. Let me know if you need to know which document has this number!`;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { classifyRisk } from '../risk/classifier';
import {
  ApiClient,
  AnalyzeFormRequest,
  AnalyzeFormResponse,
  ChatRequest,
  ChatResponse,
  Explanation,
  Preferences,
} from './types';

// In-memory canned explanations covering all 3 source labels across en, hi, and mr
const CANNED_EXPLANATIONS: Record<
  string,
  Record<'en' | 'hi' | 'mr', Explanation>
> = {
  annual_family_income: {
    en: {
      summary: 'Combined gross annual income of both parents before taxes.',
      text: 'Enter total yearly earnings from salary, agriculture, or trade. Must be supported by a Tahsildar revenue certificate and be under ₹2,50,000 for full fee waiver.',
      source_label: 'official',
      source_url: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
      source_excerpt:
        'Gross annual income of applicant parents/guardians must not exceed INR 2,50,000 per financial annum.',
      confidence: 0.98,
    },
    hi: {
      summary: 'कर कटौती से पहले माता-पिता की संयुक्त वार्षिक कुल आय।',
      text: 'परिवार के सभी कमाने वाले सदस्यों की कुल वार्षिक आय दर्ज करें। तहसीलदार द्वारा जारी आय प्रमाण पत्र होना अनिवार्य है और पूर्ण शुल्क छूट के लिए यह ₹2,50,000 से कम होनी चाहिए।',
      source_label: 'official',
      source_url: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
      source_excerpt:
        'आवेदक के माता-पिता की सकल वार्षिक आय प्रति वित्तीय वर्ष ₹2,50,000 से अधिक नहीं होनी चाहिए।',
      confidence: 0.98,
    },
    mr: {
      summary: 'कर वजा करण्यापूर्वी आई-वडिलांचे एकूण वार्षिक एकत्रित उत्पन्न.',
      text: 'कुटुंबातील सर्व सदस्यांचे नोकरी किंवा व्यवसायातील वार्षिक उत्पन्न येथे नोंदवा. तहसीलदारांचे वैध उत्पन्न प्रमाणपत्र आवश्यक असून पूर्ण शुल्क माफीसाठी उत्पन्न ₹२,५०,००० पेक्षा कमी असावे.',
      source_label: 'official',
      source_url: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
      source_excerpt:
        'अर्जदाराच्या पालकांचे एकूण वार्षिक उत्पन्न प्रति आर्थिक वर्ष ₹२,५०,००० पेक्षा जास्त नसावे.',
      confidence: 0.98,
    },
  },
  domicile_certificate_no: {
    en: {
      summary: 'Official state residence certificate registration number.',
      text: 'The serial or barcode number printed on your state residence certificate. It verifies that you have lived in the state for the mandatory qualifying duration.',
      source_label: 'official',
      source_url: 'https://scholarships.gov.in/guidelines/domicile-rules.pdf',
      source_excerpt:
        'Candidates must hold a permanent domicile certificate of the home state issued on or after April 2021.',
      confidence: 0.96,
    },
    hi: {
      summary: 'राज्य अधिवास (मूल निवास) प्रमाण पत्र की पंजीकरण संख्या।',
      text: 'आपके मूल निवास प्रमाण पत्र पर छपा क्रमांक या बारकोड नंबर। यह प्रमाणित करता है कि आप अनिवार्य अवधि से इस राज्य के स्थायी निवासी हैं।',
      source_label: 'official',
      source_url: 'https://scholarships.gov.in/guidelines/domicile-rules.pdf',
      confidence: 0.96,
    },
    mr: {
      summary: 'राज्य अधिवास (डोमिसिल) प्रमाणपत्राचा नोंदणी क्रमांक.',
      text: 'तुमच्या रहिवासी दाखल्यावर असलेला बारकोड किंवा अनुक्रमांक. तुम्ही संबंधित राज्याचे अधिकृत व कायमस्वरूपी रहिवासी असल्याचे हे सिद्ध करते.',
      source_label: 'official',
      source_url: 'https://scholarships.gov.in/guidelines/domicile-rules.pdf',
      confidence: 0.96,
    },
  },
  bank_ifsc_code: {
    en: {
      summary: '11-character code identifying your specific bank branch.',
      text: 'Printed on your cheque book or passbook first page. Must correspond to an active, individual savings account seeded with your Aadhaar for direct DBT transfer.',
      source_label: 'page',
      confidence: 0.92,
    },
    hi: {
      summary: 'आपकी बैंक शाखा की पहचान करने वाला 11-अक्षरों का कोड।',
      text: 'यह आपकी पासबुक के पहले पन्ने या चेकबुक पर मुद्रित होता है। छात्रवृत्ति की सीधी राशि (DBT) पाने के लिए खाता आधार कार्ड से लिंक होना चाहिए।',
      source_label: 'page',
      confidence: 0.92,
    },
    mr: {
      summary: 'तुमच्या बँकेच्या शाखेचा ११ अक्षरी ओळख संकेतांक (IFSC).',
      text: 'तुमच्या बँक पासबुकच्या पहिल्या पानावर किंवा धनादेशावर हा कोड असतो. थेट लाभ हस्तांतरण (DBT) द्वारे पैसे जमा होण्यासाठी हा कोड आवश्यक आहे.',
      source_label: 'page',
      confidence: 0.92,
    },
  },
  one_time_password_otp: {
    en: {
      summary: 'Temporary verification code sent to your phone.',
      text: 'Never share OTPs on unsolicited forms or third-party gateways. Legitimate portals only request OTPs during explicit customer logins or confirmed bank payments.',
      source_label: 'ai',
      confidence: 0.88,
    },
    hi: {
      summary: 'आपके मोबाइल पर प्राप्त एक बार का अस्थायी सुरक्षा कोड।',
      text: 'किसी भी तीसरे पक्ष के फॉर्म पर ओटीपी कभी दर्ज न करें। आधिकारिक बैंक केवल तभी ओटीपी मांगते हैं जब आप स्वयं लेन-देन या लॉगिन कर रहे हों।',
      source_label: 'ai',
      confidence: 0.88,
    },
    mr: {
      summary: 'तुमच्या मोबाइलवर आलेला तात्पुरता पडताळणी क्रमांक (OTP).',
      text: 'अनोळखी किंवा संशयास्पद फॉर्मवर ओटीपी कधीही टाकू नका. अधिकृत बँका केवळ प्रत्यक्ष व्यवहाराच्या वेळीच ओटीपी मागतात.',
      source_label: 'ai',
      confidence: 0.88,
    },
  },
};

export class MockApiClient implements ApiClient {
  public failureInjected: boolean = false;
  private preferences: Preferences = { default_language: 'en' };

  private async delay(ms: number = 400): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  public setFailureInjected(fail: boolean): void {
    this.failureInjected = fail;
  }

  async analyzeForm(req: AnalyzeFormRequest): Promise<AnalyzeFormResponse> {
    await this.delay(500);

    if (this.failureInjected) {
      throw new Error('Injected API Failure: Simulated network timeout or backend unreachable.');
    }

    // Run risk classification
    const riskResult = classifyRisk({
      pageUrl: req.page_url,
      formAction: req.form_action,
      fields: req.fields as any,
    });

    const enrichedFields = req.fields.map((f) => {
      const risk_tag = riskResult.tagsByFieldKey[f.field_key] || (f.required ? 'required' : 'optional');
      const canned = CANNED_EXPLANATIONS[f.field_key]?.[req.language];

      const explanation: Explanation = canned || {
        summary: `Official entry for ${f.label.toLowerCase()}.`,
        text: `Please enter accurate details for this question. Ensure the information matches your official supporting certificates.`,
        source_label: f.page_help ? 'page' : 'ai',
        confidence: 0.85,
      };

      return {
        ...f,
        risk_tag,
        explanation,
      };
    });

    return {
      fields: enrichedFields,
      risk_flags: riskResult.flags,
    };
  }

  async explainField(req: {
    field_key: string;
    form_key: string;
    language: 'en' | 'hi' | 'mr';
  }): Promise<Explanation> {
    await this.delay(300);

    if (this.failureInjected) {
      throw new Error('Injected API Failure.');
    }

    const canned = CANNED_EXPLANATIONS[req.field_key]?.[req.language];
    if (canned) return canned;

    return {
      summary: `Guidance for ${req.field_key}.`,
      text: `Please verify this information against your official registration documents.`,
      source_label: 'ai',
      confidence: 0.85,
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    await this.delay(450);

    if (this.failureInjected) {
      throw new Error('Injected API Failure.');
    }

    const fieldNote = req.focused_field_key ? `about ${req.focused_field_key}` : 'general form filling';
    let reply = `You are asking ${fieldNote}: Make sure this matches your official records or certificates. Let me know if you need to know which document to check!`;

    if (req.language === 'hi') {
      reply = `आप ${fieldNote} के संबंध में पूछ रहे हैं: कृपया सुनिश्चित करें कि यह आपके आधिकारिक दस्तावेजों से मेल खाता हो। यदि आपको किसी विशिष्ट प्रमाण पत्र के बारे में संदेह है, तो बेझिझक पूछें।`;
    } else if (req.language === 'mr') {
      reply = `तुम्ही ${fieldNote} बाबत विचारणा करत आहात: ही माहिती आपल्या अधिकृत कागदपत्रांशी जुळणारी असल्याची खात्री करा. कोणतीही शंका असल्यास नक्की विचारा.`;
    }

    return {
      reply,
      session_id: req.session_id || `session-${Date.now()}`,
    };
  }

  async getPreferences(): Promise<Preferences> {
    return { ...this.preferences };
  }

  async setPreferences(p: Preferences): Promise<void> {
    this.preferences = { ...p };
  }

  async checkHealth(): Promise<import('./types').BackendHealthResult> {
    await this.delay(100);
    return {
      ok: !this.failureInjected,
      timestamp: new Date().toISOString(),
      database: {
        reachable: !this.failureInjected,
        indexed_documents: 2,
        latency_ms: 12,
        error: this.failureInjected ? 'Injected Mock DB Disconnected' : null,
      },
      gemini: {
        reachable: !this.failureInjected,
        model: 'gemini-3.5-flash (Simulated Mock)',
        error: null,
      },
      embedding: {
        reachable: !this.failureInjected,
        model: 'gemini-embedding-001 (Simulated Mock)',
        error: null,
      },
    };
  }
}

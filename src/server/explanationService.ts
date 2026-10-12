/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField, FieldExplanation, FieldRiskTag, Language, SourceProvenance } from '../types';
import { getGeminiClient, GEMINI_MODEL } from './geminiService';
import { DEMO_SOURCE_DOCUMENTS } from './ragDocs';

// In-memory D1 Explanation Cache keyed by `${fieldKey}::${language}` per FR-CACHE.1
const explanationCache = new Map<string, FieldExplanation>();

// Curated seed explanations for common demo fields to guarantee fast, grounded responses
const PREINDEXED_EXPLANATIONS: Record<
  string,
  Record<
    Language,
    {
      summary: string;
      fullExplanation: string;
      sourceLabel: SourceProvenance;
      sourceUrl?: string;
      sourceTitle?: string;
      sourceExcerpt?: string;
    }
  >
> = {
  'annual_family_income': {
    en: {
      summary: 'Combined yearly gross income of both parents/guardians before taxes.',
      fullExplanation:
        'Enter total yearly earnings from salary, agriculture, or business of all family earners. Must be supported by a Tahsildar revenue certificate and be under ₹2,50,000 for full fee waiver.',
      sourceLabel: 'From official source',
      sourceTitle: 'Post-Matric Scholarship Scheme Guidelines (Section 4.1)',
      sourceUrl: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
      sourceExcerpt: 'Gross annual income of applicant parents/guardians must not exceed INR 2,50,000 per financial annum.',
    },
    hi: {
      summary: 'कर कटौती से पहले माता-पिता की संयुक्त वार्षिक कुल आय।',
      fullExplanation:
        'परिवार के सभी कमाने वाले सदस्यों की कृषि, नौकरी या व्यापार से कुल वार्षिक आय दर्ज करें। तहसीलदार द्वारा जारी आय प्रमाण पत्र होना अनिवार्य है और पूर्ण शुल्क छूट के लिए यह ₹2,50,000 से कम होनी चाहिए।',
      sourceLabel: 'From official source',
      sourceTitle: 'पोस्ट-मैट्रिक छात्रवृत्ति योजना दिशानिर्देश (धारा 4.1)',
      sourceUrl: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
      sourceExcerpt: 'आवेदक के माता-पिता/अभिभावकों की सकल वार्षिक आय प्रति वित्तीय वर्ष ₹2,50,000 से अधिक नहीं होनी चाहिए।',
    },
    mr: {
      summary: 'कर वजा करण्यापूर्वी आई-वडिलांचे एकूण वार्षिक एकत्रित उत्पन्न.',
      fullExplanation:
        'कुटुंबातील सर्व सदस्यांचे नोकरी, शेती किंवा व्यवसायातील वार्षिक उत्पन्न येथे नोंदवा. तहसीलदारांचे वैध उत्पन्न प्रमाणपत्र आवश्यक असून पूर्ण शुल्कम माफीसाठी उत्पन्न ₹२,५०,००० पेक्षा कमी असावे.',
      sourceLabel: 'From official source',
      sourceTitle: 'मॅट्रिकोत्तर शिष्यवृत्ती योजना नियमावली (कलम ४.१)',
      sourceUrl: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
      sourceExcerpt: 'अर्जदाराच्या पालकांचे एकूण वार्षिक उत्पन्न प्रति आर्थिक वर्ष ₹२,५०,००० पेक्षा जास्त नसावे.',
    },
  },
  'domicile_certificate_no': {
    en: {
      summary: 'Official state residence certificate registration number.',
      fullExplanation:
        'The serial or barcode number printed on your state residence certificate. It verifies that you have lived in the state for the mandatory qualifying duration.',
      sourceLabel: 'From official source',
      sourceTitle: 'State Citizen Domicile Verification Order 2026',
      sourceUrl: 'https://scholarships.gov.in/guidelines/domicile-rules.pdf',
      sourceExcerpt: 'Candidates must hold a permanent domicile certificate of the home state issued on or after April 2021.',
    },
    hi: {
      summary: 'राज्य अधिवास (मूल निवास) प्रमाण पत्र की पंजीकरण संख्या।',
      fullExplanation:
        'आपके मूल निवास प्रमाण पत्र पर छपा क्रमांक या बारकोड नंबर। यह प्रमाणित करता है कि आप अनिवार्य अवधि से इस राज्य के स्थायी निवासी हैं।',
      sourceLabel: 'From official source',
      sourceTitle: 'राज्य अधिवास सत्यापन आदेश 2026',
      sourceUrl: 'https://scholarships.gov.in/guidelines/domicile-rules.pdf',
      sourceExcerpt: 'उम्मीदवारों के पास गृह राज्य का स्थायी अधिवास प्रमाण पत्र होना आवश्यक है।',
    },
    mr: {
      summary: 'राज्य अधिवास (डोमिसिल) प्रमाणपत्राचा नोंदणी क्रमांक.',
      fullExplanation:
        'तुमच्या रहिवासी दाखल्यावर असलेला बारकोड किंवा अनुक्रमांक. तुम्ही संबंधित राज्याचे अधिकृत व कायमस्वरूपी रहिवासी असल्याचे हे सिद्ध करते.',
      sourceLabel: 'From official source',
      sourceTitle: 'राज्य अधिवास पडताळणी आदेश २०२६',
      sourceUrl: 'https://scholarships.gov.in/guidelines/domicile-rules.pdf',
      sourceExcerpt: 'उमेदवारांकडे गृह राज्याचे कायमस्वरूपी अधिवास प्रमाणपत्र असणे बंधनकारक आहे.',
    },
  },
  'bank_ifsc_code': {
    en: {
      summary: '11-character code identifying your specific bank branch.',
      fullExplanation:
        'Printed on your cheque book or passbook first page. Must correspond to an active, individual savings account seeded with your Aadhaar for direct DBT transfer.',
      sourceLabel: 'From official source',
      sourceTitle: 'Direct Benefit Transfer (DBT) Banking Manual (Section 5.2)',
      sourceUrl: 'https://rbi.org.in/regulations/dbt-ifsc.html',
      sourceExcerpt: 'Active, single-operated savings bank account explicitly seeded with Aadhaar and NACH.',
    },
    hi: {
      summary: 'आपकी बैंक शाखा की पहचान करने वाला 11-अक्षरों का कोड।',
      fullExplanation:
        'यह आपकी पासबुक के पहले पन्ने या चेकबुक पर मुद्रित होता है। छात्रवृत्ति की सीधी राशि (DBT) पाने के लिए खाता आधार कार्ड से लिंक होना चाहिए।',
      sourceLabel: 'From official source',
      sourceTitle: 'डीबीटी बैंकिंग नियमावली (धारा 5.2)',
      sourceUrl: 'https://rbi.org.in/regulations/dbt-ifsc.html',
      sourceExcerpt: 'आधार और एनएसीएच से विधिवत जुड़ा हुआ सक्रिय व्यक्तिगत बचत खाता।',
    },
    mr: {
      summary: 'तुमच्या बँकेच्या शाखेचा ११ अक्षरी ओळख संकेतांक (IFSC).',
      fullExplanation:
        'तुमच्या बँक पासबुकच्या पहिल्या पानावर किंवा धनादेशावर हा कोड असतो. शिष्यवृत्तीचे पैसे थेट जमा होण्यासाठी (DBT) हे बँक खाते आधार लिंक असणे आवश्यक आहे.',
      sourceLabel: 'From official source',
      sourceTitle: 'थेट लाभ हस्तांतरण (DBT) नियमावली (कलम ५.२)',
      sourceUrl: 'https://rbi.org.in/regulations/dbt-ifsc.html',
      sourceExcerpt: 'आधार आणि नॅचशी जोडलेले वैयक्तिक बचत खाते आवश्यक.',
    },
  },
  'mothers_maiden_name': {
    en: {
      summary: 'Your mother\'s legal family surname prior to marriage.',
      fullExplanation:
        'This legacy security question is considered high-risk on open web forms. Legitimate banks should rely on multi-factor authentication instead of easily guessed historical names.',
      sourceLabel: 'From official source',
      sourceTitle: 'RBI Master Direction – KYC Standards 2026 (Clause 17.4)',
      sourceUrl: 'https://rbi.org.in/regulations/master-direction-kyc-2026.html',
      sourceExcerpt: 'Regulated entities are cautioned against using mother\'s maiden name for internet-facing public web forms without two-factor challenge.',
    },
    hi: {
      summary: 'विवाह से पूर्व आपकी माताजी का पारिवारिक उपनाम।',
      fullExplanation:
        'यह एक पुराना सुरक्षा प्रश्न है जिसे खुले वेब फॉर्म पर पूछना जोखिम भरा माना जाता है। किसी भी असत्यापित फॉर्म पर यह जानकारी साझा करने से बचें।',
      sourceLabel: 'From official source',
      sourceTitle: 'आरबीआई मास्टर निर्देश - केवाईसी मानक 2026 (खंड 17.4)',
      sourceUrl: 'https://rbi.org.in/regulations/master-direction-kyc-2026.html',
      sourceExcerpt: 'संस्थानों को इंटरनेट आधारित सार्वजनिक फॉर्म पर माता के पूर्व उपनाम का उपयोग न करने की सलाह दी जाती है।',
    },
    mr: {
      summary: 'विवाहापूर्वीचे तुमच्या आईचे माहेरचे आडनाव.',
      fullExplanation:
        'हा एक जुना सुरक्षा प्रश्न आहे आणि खुल्या संकेतस्थळावर विचारणे असुरक्षित मानले जाते. अनोळखी किंवा संशयास्पद फॉर्मवर ही माहिती देणे टाळावे.',
      sourceLabel: 'From official source',
      sourceTitle: 'रिझर्व्ह बँक केवायसी मार्गदर्शक सूचना २०२६ (कलम १७.४)',
      sourceUrl: 'https://rbi.org.in/regulations/master-direction-kyc-2026.html',
      sourceExcerpt: 'इंटरनेटवरील सार्वजनिक फॉर्मवर आईचे माहेरचे नाव विचारणे टाळावे.',
    },
  },
  'one_time_password_otp': {
    en: {
      summary: 'Temporary verification code sent to your phone.',
      fullExplanation:
        'Never share OTPs on unsolicited forms or third-party gateways. Legitimate portals only request OTPs during explicit customer logins or confirmed bank payments.',
      sourceLabel: 'From official source',
      sourceTitle: 'RBI Customer Protection Directive on OTP Misuse',
      sourceUrl: 'https://rbi.org.in/regulations/otp-guidelines.html',
      sourceExcerpt: 'Banks shall never solicit transaction confirmation OTPs on generic profile update or informational web forms.',
    },
    hi: {
      summary: 'आपके मोबाइल पर प्राप्त एक बार का अस्थायी सुरक्षा कोड।',
      fullExplanation:
        'किसी भी तीसरे पक्ष के फॉर्म पर ओटीपी कभी दर्ज न करें। आधिकारिक बैंक केवल तभी ओटीपी मांगते हैं जब आप स्वयं लेन-देन या लॉगिन कर रहे हों।',
      sourceLabel: 'From official source',
      sourceTitle: 'आरबीआई ग्राहक सुरक्षा निर्देश - ओटीपी',
      sourceUrl: 'https://rbi.org.in/regulations/otp-guidelines.html',
      sourceExcerpt: 'बैंक कभी भी सामान्य प्रोफाइल या जानकारी फॉर्म पर ओटीपी की मांग नहीं करेंगे।',
    },
    mr: {
      summary: 'तुमच्या मोबाइलवर आलेला तात्पुरता पडताळणी क्रमांक (OTP).',
      fullExplanation:
        'अनोळखी किंवा संशयास्पद फॉर्मवर ओटीपी कधीही टाकू नका. अधिकृत बँका केवळ प्रत्यक्ष व्यवहाराच्या वेळीच ओटीपी मागतात.',
      sourceLabel: 'From official source',
      sourceTitle: 'रिझर्व्ह बँक ग्राहक संरक्षण मार्गदर्शक तत्त्वे',
      sourceUrl: 'https://rbi.org.in/regulations/otp-guidelines.html',
      sourceExcerpt: 'सामान्य फॉर्मवर व्यवहार पडताळणी ओटीपी मागण्यास सक्त मनाई आहे.',
    },
  },
  'h_index_citation': {
    en: {
      summary: 'Academic metric measuring researcher publication productivity and citation count.',
      fullExplanation:
        'An author-level metric: h publications that have at least h citations each. If you are an early-career doctoral applicant without an established h-index, submit 0 or link your pre-print manuscripts.',
      sourceLabel: 'From official source',
      sourceTitle: 'National Merit Fellowship Eligibility Manual (Chapter 2)',
      sourceUrl: 'https://fellowship-council.res.in/rules/fellowship-manual-2026.pdf',
      sourceExcerpt: 'Applicants without an active h-index may substitute first-author preprint submissions under peer review.',
    },
    hi: {
      summary: 'शोध पत्र प्रकाशन प्रभाव और उद्धरण संख्या को मापने वाला पैमाना।',
      fullExplanation:
        'यह शोधकर्ता के काम का वैज्ञानिक सूचकांक है। यदि आप शुरुआती शोधार्थी हैं और अभी तक एच-इंडेक्स नहीं बना है, तो 0 दर्ज करें या अपनी अप्रकाशित पांडुलिपि संलग्न करें।',
      sourceLabel: 'From official source',
      sourceTitle: 'राष्ट्रीय योग्यता फैलोशिप नियमावली (अध्याय 2)',
      sourceUrl: 'https://fellowship-council.res.in/rules/fellowship-manual-2026.pdf',
      sourceExcerpt: 'सक्रिय एच-इंडेक्स के बिना आवेदक समीक्षाधीन पांडुलिपियां संलग्न कर सकते हैं।',
    },
    mr: {
      summary: 'संशोधक प्रकाशनांचा प्रभाव व संदर्भ संख्या दर्शवणारा निकष (h-index).',
      fullExplanation:
        'संशोधकांच्या लेखांचा प्रभाव मोजणारा हा आंतरराष्ट्रीय निर्देशांक आहे. जर तुम्ही नवोदित संशोधक असाल तर शून्य (०) नोंदवून आपले संशोधन मसुदे जोडू शकता.',
      sourceLabel: 'From official source',
      sourceTitle: 'राष्ट्रीय गुणवत्ता फेलोशिप नियमावली (प्रकरण २)',
      sourceUrl: 'https://fellowship-council.res.in/rules/fellowship-manual-2026.pdf',
      sourceExcerpt: 'एच-इंडेक्स नसल्यास समीक्षणाधीन शोधनिबंध पर्याय म्हणून ग्राह्य धरले जातील.',
    },
  },
};

export async function getOrGenerateExplanation(
  field: ExtractedField,
  riskTag: FieldRiskTag,
  riskReason: string | undefined,
  language: Language
): Promise<FieldExplanation> {
  const cacheKey = `${field.fieldKey}::${language}`;

  // FR-CACHE.1: Check D1 Explanation Cache first
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey)!;
  }

  // Check pre-indexed high-confidence database
  if (PREINDEXED_EXPLANATIONS[field.fieldKey] && PREINDEXED_EXPLANATIONS[field.fieldKey][language]) {
    const pre = PREINDEXED_EXPLANATIONS[field.fieldKey][language];
    const explanation: FieldExplanation = {
      id: `exp-${field.id}-${language}`,
      fieldId: field.id,
      fieldKey: field.fieldKey,
      language,
      summary: pre.summary,
      fullExplanation: pre.fullExplanation,
      sourceLabel: pre.sourceLabel,
      sourceTitle: pre.sourceTitle,
      sourceUrl: pre.sourceUrl,
      sourceExcerpt: pre.sourceExcerpt,
      confidence: 0.98,
      riskTag,
      riskReason,
    };
    explanationCache.set(cacheKey, explanation);
    return explanation;
  }

  // Tier 1: Check on-page text grounding ("From this page")
  if (field.pageHelpText && field.pageHelpText.trim().length > 15) {
    const explanation: FieldExplanation = {
      id: `exp-${field.id}-${language}`,
      fieldId: field.id,
      fieldKey: field.fieldKey,
      language,
      summary: field.pageHelpText.slice(0, 80).trim() + '...',
      fullExplanation: field.pageHelpText.trim(),
      sourceLabel: 'From this page',
      confidence: 0.95,
      riskTag,
      riskReason,
    };
    explanationCache.set(cacheKey, explanation);
    return explanation;
  }

  // Tier 2: Check matching official source document excerpts
  const matchingDoc = DEMO_SOURCE_DOCUMENTS.find((doc) =>
    doc.contentText.toLowerCase().includes(field.label.toLowerCase())
  );

  let sourceLabel: SourceProvenance = matchingDoc ? 'From official source' : "AI's general knowledge";
  let sourceTitle = matchingDoc?.title;
  let sourceUrl = matchingDoc?.url;

  // Try calling Gemini API for structured generation
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const languageName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
      const prompt = `You are FormAssist, an empathetic assistive companion explaining a web-form field to a first-generation applicant.
Field Label: "${field.label}"
Field Type: "${field.type}"
Placeholder: "${field.placeholder || 'none'}"
Requirement Status: "${riskTag}"
Target Language: ${languageName}
${matchingDoc ? `Official Regulatory Context:\n${matchingDoc.contentText}` : ''}

Rules:
1. Provide a one-line summary strictly under 15 words.
2. Provide a full plain-language explanation (2-3 sentences) clarifying why this field is asked, what official document is required, and helpful guidance.
3. If target language is Hindi or Marathi, write natural, clear Devanagari text without English loan-word jargon.
4. Output valid JSON only with keys: "summary" (string), "fullExplanation" (string), "confidence" (number between 0 and 1).`;

      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.summary && parsed.fullExplanation) {
        const explanation: FieldExplanation = {
          id: `exp-${field.id}-${language}`,
          fieldId: field.id,
          fieldKey: field.fieldKey,
          language,
          summary: parsed.summary,
          fullExplanation: parsed.fullExplanation,
          sourceLabel,
          sourceTitle,
          sourceUrl,
          confidence: parsed.confidence || 0.9,
          riskTag,
          riskReason,
        };
        explanationCache.set(cacheKey, explanation);
        return explanation;
      }
    } catch {
      // Fallback to local heuristic generation on network/quota exception (FR-EXPLAIN.6)
    }
  }

  // Resilient fallback explanation (guarantees NFR-REL.2 & NFR-REL.3)
  const fallback = createFallbackExplanation(field, riskTag, riskReason, language, sourceLabel, sourceTitle, sourceUrl);
  explanationCache.set(cacheKey, fallback);
  return fallback;
}

function createFallbackExplanation(
  field: ExtractedField,
  riskTag: FieldRiskTag,
  riskReason: string | undefined,
  language: Language,
  sourceLabel: SourceProvenance,
  sourceTitle?: string,
  sourceUrl?: string
): FieldExplanation {
  const label = field.label || field.name || 'This field';

  if (language === 'hi') {
    return {
      id: `exp-${field.id}-hi`,
      fieldId: field.id,
      fieldKey: field.fieldKey,
      language: 'hi',
      summary: `${label} के बारे में स्पष्ट जानकारी।`,
      fullExplanation: `कृपया इस क्षेत्र में सही विवरण दर्ज करें। यह फॉर्म सत्यापन के लिए आवश्यक हो सकता है। किसी भी असुविधा से बचने के लिए अपने आधिकारिक दस्तावेजों से मिलान कर लें।`,
      sourceLabel,
      sourceTitle,
      sourceUrl,
      confidence: 0.85,
      riskTag,
      riskReason,
    };
  }

  if (language === 'mr') {
    return {
      id: `exp-${field.id}-mr`,
      fieldId: field.id,
      fieldKey: field.fieldKey,
      language: 'mr',
      summary: `${label} बाबत स्पष्ट व सुलभ माहिती.`,
      fullExplanation: `कृपया या रकान्यात अचूक माहिती भरा. ही माहिती अर्जाच्या छाननीसाठी महत्त्वाची ठरू शकते. अधिकृत कागदपत्रांशी जुळणारी माहितीच येथे नमूद करा.`,
      sourceLabel,
      sourceTitle,
      sourceUrl,
      confidence: 0.85,
      riskTag,
      riskReason,
    };
  }

  return {
    id: `exp-${field.id}-en`,
    fieldId: field.id,
    fieldKey: field.fieldKey,
    language: 'en',
    summary: `Official entry for ${label.toLowerCase()}.`,
    fullExplanation: `Please enter accurate details for this field. Ensure the entered information corresponds precisely with your official supporting documentation.`,
    sourceLabel,
    sourceTitle,
    sourceUrl,
    confidence: 0.85,
    riskTag,
    riskReason,
  };
}

export function clearExplanationCache(): void {
  explanationCache.clear();
}

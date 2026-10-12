/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField, FieldRiskTag, RiskFlag } from '../types';

// Banking / Verified Financial domain patterns
const BANKING_DOMAINS = [
  'rbi.org.in',
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'secure-banking.org',
  'bank.gov.in',
];

// National ID allowlist patterns (government portals)
const NATIONAL_ID_ALLOWED_DOMAINS = [
  'gov.in',
  'uidai.gov.in',
  'incometax.gov.in',
  'scholarships.gov.in',
  'nic.in',
  'fellowship-council.res.in',
];

export function analyzeFormRisks(
  pageUrl: string,
  actionUrl: string,
  fields: ExtractedField[]
): {
  riskFlags: RiskFlag[];
  fieldTags: Map<string, { tag: FieldRiskTag; reason?: string }>;
} {
  const flags: RiskFlag[] = [];
  const fieldTags = new Map<string, { tag: FieldRiskTag; reason?: string }>();

  let pageDomain = '';
  let isHttps = true;
  try {
    const parsedPage = new URL(pageUrl);
    pageDomain = parsedPage.hostname.toLowerCase();
    isHttps = parsedPage.protocol === 'https:';
  } catch {
    pageDomain = 'unknown-domain';
    isHttps = false;
  }

  // FR-RISK.2: Insecure HTTP check
  if (!isHttps && !pageUrl.startsWith('http://localhost') && !pageUrl.startsWith('http://127.0.0.1')) {
    flags.push({
      id: `risk-insecure-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      formId: pageDomain,
      flagType: 'INSECURE_HTTP',
      description: 'This page is using an unencrypted HTTP connection. Any details you type can be intercepted by third parties.',
      severity: 'high',
      createdAt: new Date().toISOString(),
    });
  }

  // FR-RISK.1: Form action domain mismatch check
  if (actionUrl && actionUrl.trim() !== '') {
    try {
      const parsedAction = new URL(actionUrl, pageUrl);
      const actionDomain = parsedAction.hostname.toLowerCase();
      if (
        actionDomain !== pageDomain &&
        !pageDomain.endsWith(`.${actionDomain}`) &&
        !actionDomain.endsWith(`.${pageDomain}`) &&
        !actionUrl.startsWith('/')
      ) {
        flags.push({
          id: `risk-mismatch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          formId: pageDomain,
          flagType: 'DOMAIN_MISMATCH',
          description: `Form data will be submitted to "${actionDomain}" which is different from this website ("${pageDomain}"). Verify recipient legitimacy.`,
          severity: 'high',
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Ignored if invalid URL
    }
  }

  const isRecognizedBank = BANKING_DOMAINS.some(
    (b) => pageDomain === b || pageDomain.endsWith(`.${b}`)
  );
  const isAllowedNationalIdDomain = NATIONAL_ID_ALLOWED_DOMAINS.some(
    (d) => pageDomain === d || pageDomain.endsWith(`.${d}`)
  );

  // Analyze each field
  for (const field of fields) {
    const labelLower = (field.label || '').toLowerCase();
    const nameLower = (field.name || '').toLowerCase();
    const typeLower = (field.type || '').toLowerCase();
    const placeholderLower = (field.placeholder || '').toLowerCase();
    const combined = `${labelLower} ${nameLower} ${placeholderLower}`;

    let isUnusual = false;
    let reason = '';

    // Check for OTP / CVV / PIN solicitations
    const isOtpOrCvv =
      combined.includes('otp') ||
      combined.includes('one time password') ||
      combined.includes('cvv') ||
      combined.includes('cvc') ||
      combined.includes('atm pin') ||
      combined.includes('card verification');

    if (isOtpOrCvv && !isRecognizedBank) {
      isUnusual = true;
      reason = 'Requesting an OTP or card verification number on a non-banking website is unusual and risky.';
      flags.push({
        id: `risk-otp-${field.id}`,
        formId: pageDomain,
        fieldId: field.id,
        flagType: 'SUSPICIOUS_OTP_REQUEST',
        description: `Field "${field.label}" asks for OTP/CVV on an unverified financial site.`,
        severity: 'high',
        createdAt: new Date().toISOString(),
      });
    }

    // Check for National ID (Aadhaar, SSN, PAN) outside allowlist
    const isNationalId =
      combined.includes('aadhaar') ||
      combined.includes('pan card') ||
      combined.includes('pan number') ||
      combined.includes('social security') ||
      combined.includes('ssn') ||
      combined.includes('voter id');

    if (isNationalId && !isAllowedNationalIdDomain && !isRecognizedBank) {
      isUnusual = true;
      reason = 'This site asks for sensitive government identity numbers without an accredited official domain.';
      flags.push({
        id: `risk-id-${field.id}`,
        formId: pageDomain,
        fieldId: field.id,
        flagType: 'SUSPICIOUS_NATIONAL_ID',
        description: `Field "${field.label}" requests sensitive national identity credentials.`,
        severity: 'medium',
        createdAt: new Date().toISOString(),
      });
    }

    // Check for unusual biometric / mother's maiden name / secret answer fields
    if (combined.includes("mother's maiden") || combined.includes('secret question') || combined.includes('atm pin')) {
      isUnusual = true;
      reason = 'Requesting mother\'s maiden name or secret question answers is an outdated, high-risk security practice.';
      flags.push({
        id: `risk-secret-${field.id}`,
        formId: pageDomain,
        fieldId: field.id,
        flagType: 'UNUSUAL_FIELD',
        description: `Field "${field.label}" requests personal security questions susceptible to social engineering.`,
        severity: 'medium',
        createdAt: new Date().toISOString(),
      });
    }

    if (isUnusual) {
      fieldTags.set(field.id, { tag: 'unusual', reason });
    } else if (field.required) {
      fieldTags.set(field.id, { tag: 'required' });
    } else {
      fieldTags.set(field.id, { tag: 'optional' });
    }
  }

  return { riskFlags: flags, fieldTags };
}

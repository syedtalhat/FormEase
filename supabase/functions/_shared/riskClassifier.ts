/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RiskFlag {
  flag_type: string;
  severity: 'high' | 'medium' | 'low';
  description_key: string;
  field_key?: string;
  meta?: Record<string, string>;
}

export type FieldRiskTag = 'required' | 'optional' | 'unusual';

export interface ExtractedFieldInput {
  field_key: string;
  label: string;
  input_type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  page_help?: string;
}

export interface ClassifyRiskInput {
  pageUrl: string;
  formAction: string;
  fields: ExtractedFieldInput[];
}

export interface ClassifyRiskResult {
  flags: RiskFlag[];
  tagsByFieldKey: Record<string, FieldRiskTag>;
}

const BANK_DOMAIN_ALLOWLIST = [
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'kotak.com',
  'nationalbank.in',
  'secure-banking.org',
  'rbi.org.in',
  'npci.org.in',
];

const NATIONAL_ID_ALLOWLIST = [
  'uidai.gov.in',
  'incometax.gov.in',
  'tin-nsdl.com',
  'nvsp.in',
  'eci.gov.in',
  'scholarships.gov.in',
  'passportindia.gov.in',
  'myaadhaar.uidai.gov.in',
];

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    const parts = host.split('.');
    if (parts.length >= 2) {
      // Return second-level domain if .co.in / .gov.in
      if (parts.length >= 3 && (parts[parts.length - 2] === 'co' || parts[parts.length - 2] === 'gov')) {
        return parts.slice(-3).join('.');
      }
      return parts.slice(-2).join('.');
    }
    return host;
  } catch {
    return urlStr.toLowerCase();
  }
}

/**
 * Pure risk classification function implementing Process 3.0 (FR-RISK.1–5).
 */
export function classifyRisk({
  pageUrl,
  formAction,
  fields,
}: ClassifyRiskInput): ClassifyRiskResult {
  const flags: RiskFlag[] = [];
  const tagsByFieldKey: Record<string, FieldRiskTag> = {};

  const pageDomain = extractDomain(pageUrl);
  const actionDomain = formAction ? extractDomain(formAction) : pageDomain;

  // Check Protocol
  let isHttps = true;
  try {
    const parsed = new URL(pageUrl);
    isHttps = parsed.protocol === 'https:';
  } catch {
    isHttps = true;
  }

  const isLocalhost =
    pageUrl.includes('localhost') || pageUrl.includes('127.0.0.1') || pageUrl.startsWith('file:');

  // Rule 1: Non-HTTPS page (FR-RISK.2) -> Medium severity
  if (!isHttps && !isLocalhost) {
    flags.push({
      flag_type: 'insecure_transmission',
      severity: 'medium',
      description_key: 'insecure_http_warning',
    });
  }

  // Rule 2: Form action domain mismatch (FR-RISK.1) -> High severity
  if (
    formAction &&
    formAction.trim() !== '' &&
    actionDomain &&
    pageDomain &&
    actionDomain !== pageDomain
  ) {
    flags.push({
      flag_type: 'domain_spoof',
      severity: 'high',
      description_key: 'domain_mismatch_warning',
      meta: { domain: actionDomain, pageDomain },
    });
  }

  const isBankDomain = BANK_DOMAIN_ALLOWLIST.some(
    (b) => pageDomain === b || pageDomain.endsWith(`.${b}`)
  );

  const isNationalIdAllowed = NATIONAL_ID_ALLOWLIST.some(
    (allowed) => pageDomain === allowed || pageDomain.endsWith(`.${allowed}`)
  );

  for (const field of fields) {
    const labelLower = (field.label || '').toLowerCase();
    const keyLower = (field.field_key || '').toLowerCase();
    const combined = `${labelLower} ${keyLower}`;

    let isUnusual = false;

    // Rule 3: OTP / CVV / PIN requested on non-banking domain (FR-RISK.3) -> High severity
    const isOtpOrCvv =
      combined.includes('otp') ||
      combined.includes('one time password') ||
      combined.includes('cvv') ||
      combined.includes('cvc') ||
      combined.includes('pin') ||
      combined.includes('card verification') ||
      combined.includes('netbanking password');

    if (isOtpOrCvv && !isBankDomain) {
      isUnusual = true;
      flags.push({
        flag_type: 'credential_harvesting',
        severity: 'high',
        description_key: 'credential_harvesting_detected',
        field_key: field.field_key,
        meta: { field_label: field.label },
      });
    }

    // Rule 4: National ID requested outside allowlist -> Medium severity
    const isNationalId =
      combined.includes('aadhaar') ||
      combined.includes('pan card') ||
      combined.includes('pan number') ||
      combined.includes('voter id') ||
      combined.includes('social security');

    if (isNationalId && !isNationalIdAllowed && !isBankDomain) {
      isUnusual = true;
      flags.push({
        flag_type: 'suspicious_id_request',
        severity: 'medium',
        description_key: 'suspicious_id_collection_warning',
        field_key: field.field_key,
      });
    }

    if (isUnusual) {
      tagsByFieldKey[field.field_key] = 'unusual';
    } else if (field.required) {
      tagsByFieldKey[field.field_key] = 'required';
    } else {
      tagsByFieldKey[field.field_key] = 'optional';
    }
  }

  return { flags, tagsByFieldKey };
}

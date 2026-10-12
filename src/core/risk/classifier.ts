/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDomain } from 'tldts';
import { BANK_DOMAIN_ALLOWLIST, NATIONAL_ID_ALLOWLIST } from '../config';
import { ExtractedFieldStructure } from '../extract/types';

export interface RiskFlag {
  flag_type: 'DOMAIN_MISMATCH' | 'INSECURE_HTTP' | 'SUSPICIOUS_OTP_REQUEST' | 'SUSPICIOUS_NATIONAL_ID';
  severity: 'high' | 'medium' | 'low';
  description_key: string;
  field_key?: string;
  meta?: Record<string, string>;
}

export type FieldRiskTag = 'required' | 'optional' | 'unusual';

export interface ClassifyRiskInput {
  pageUrl: string;
  formAction: string;
  fields: ExtractedFieldStructure[];
}

export interface ClassifyRiskResult {
  flags: RiskFlag[];
  tagsByFieldKey: Record<string, FieldRiskTag>;
}

/**
 * Pure risk classification function implementing Process 3.0 (FR-RISK.1–5).
 * Uses registrable domain comparison (via tldts) so subdomains do not trigger false mismatches.
 */
export function classifyRisk({
  pageUrl,
  formAction,
  fields,
}: ClassifyRiskInput): ClassifyRiskResult {
  const flags: RiskFlag[] = [];
  const tagsByFieldKey: Record<string, FieldRiskTag> = {};

  const pageRegistrable = getDomain(pageUrl) || extractHostname(pageUrl);
  const actionRegistrable = getDomain(formAction) || extractHostname(formAction);

  // Check protocol
  let isHttps = true;
  try {
    const parsed = new URL(pageUrl);
    isHttps = parsed.protocol === 'https:';
  } catch {
    isHttps = true;
  }

  // Exempt local dev addresses from insecure HTTP flag
  const isLocalhost =
    pageUrl.includes('localhost') || pageUrl.includes('127.0.0.1') || pageUrl.startsWith('file:');

  // Rule 1: Non-HTTPS page (FR-RISK.2) -> Medium severity
  if (!isHttps && !isLocalhost) {
    flags.push({
      flag_type: 'INSECURE_HTTP',
      severity: 'medium',
      description_key: 'risk_insecure_http',
    });
  }

  // Rule 2: Form action domain mismatch (FR-RISK.1) -> High severity
  if (
    formAction &&
    formAction.trim() !== '' &&
    actionRegistrable &&
    pageRegistrable &&
    actionRegistrable !== pageRegistrable
  ) {
    flags.push({
      flag_type: 'DOMAIN_MISMATCH',
      severity: 'high',
      description_key: 'risk_cross_domain',
      meta: { domain: actionRegistrable },
    });
  }

  // Check if page domain is an allowlisted bank
  const isBankDomain = BANK_DOMAIN_ALLOWLIST.some(
    (b) => pageRegistrable === b || pageRegistrable.endsWith(`.${b}`)
  );

  // Check if page domain is on national ID allowlist
  const isNationalIdAllowed = NATIONAL_ID_ALLOWLIST.some(
    (allowed) => pageRegistrable === allowed || pageRegistrable.endsWith(`.${allowed}`)
  );

  // Analyze each field
  for (const field of fields) {
    const labelLower = field.label.toLowerCase();
    const nameLower = field.name.toLowerCase();
    const combined = `${labelLower} ${nameLower}`;

    let isUnusual = false;

    // Rule 3: OTP / CVV / PIN requested on non-banking domain (FR-RISK.3) -> High severity
    const isOtpOrCvv =
      combined.includes('otp') ||
      combined.includes('one time password') ||
      combined.includes('cvv') ||
      combined.includes('cvc') ||
      combined.includes('atm pin') ||
      combined.includes('card verification');

    if (isOtpOrCvv && !isBankDomain) {
      isUnusual = true;
      flags.push({
        flag_type: 'SUSPICIOUS_OTP_REQUEST',
        severity: 'high',
        description_key: 'risk_otp_non_bank',
        field_key: field.field_key,
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
        flag_type: 'SUSPICIOUS_NATIONAL_ID',
        severity: 'medium',
        description_key: 'risk_national_id',
        field_key: field.field_key,
      });
    }

    // Tag precedence: unusual > required > optional (FR-RISK.4)
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

function extractHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
}

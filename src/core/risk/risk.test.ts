/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { classifyRisk } from './classifier';

describe('Risk Classifier (Process 3.0 — FR-RISK.1–5)', () => {
  it('correctly uses registrable domains: subdomains of the same domain are NOT flagged as mismatch', () => {
    const result = classifyRisk({
      pageUrl: 'https://www.scholarships.example.gov.in/apply',
      formAction: 'https://forms.scholarships.example.gov.in/submit',
      fields: [],
    });

    const mismatch = result.flags.find((f) => f.flag_type === 'DOMAIN_MISMATCH');
    expect(mismatch).toBeUndefined();
  });

  it('flags cross-domain form action with high severity (FR-RISK.1)', () => {
    const result = classifyRisk({
      pageUrl: 'http://scholarship-fee-pay.example.com',
      formAction: 'https://pay-verify.example.net/submit',
      fields: [],
    });

    const mismatch = result.flags.find((f) => f.flag_type === 'DOMAIN_MISMATCH');
    expect(mismatch).toBeDefined();
    expect(mismatch?.severity).toBe('high');
  });

  it('flags non-HTTPS page with medium severity (FR-RISK.2)', () => {
    const result = classifyRisk({
      pageUrl: 'http://public-portal.example.org/form',
      formAction: 'http://public-portal.example.org/submit',
      fields: [],
    });

    const insecure = result.flags.find((f) => f.flag_type === 'INSECURE_HTTP');
    expect(insecure).toBeDefined();
    expect(insecure?.severity).toBe('medium');
  });

  it('flags OTP field on non-bank domain with high severity and tags field unusual (FR-RISK.3, FR-RISK.4)', () => {
    const result = classifyRisk({
      pageUrl: 'https://registration-portal.example.com/step1',
      formAction: 'https://registration-portal.example.com/step2',
      fields: [
        {
          field_key: 'mobile_otp',
          name: 'mobile_otp',
          label: '6-digit SMS OTP',
          label_source: 'label_for',
          input_type: 'text',
          required: true,
          sensitive: true,
        },
      ],
    });

    const otpFlag = result.flags.find((f) => f.flag_type === 'SUSPICIOUS_OTP_REQUEST');
    expect(otpFlag).toBeDefined();
    expect(otpFlag?.severity).toBe('high');
    expect(result.tagsByFieldKey['mobile_otp']).toBe('unusual');
  });

  it('enforces tag precedence: unusual > required > optional', () => {
    const result = classifyRisk({
      pageUrl: 'https://portal.example.com',
      formAction: 'https://portal.example.com/save',
      fields: [
        {
          field_key: 'name',
          name: 'name',
          label: 'Applicant Name',
          label_source: 'label_for',
          input_type: 'text',
          required: true,
          sensitive: false,
        },
        {
          field_key: 'nickname',
          name: 'nickname',
          label: 'Nickname',
          label_source: 'label_for',
          input_type: 'text',
          required: false,
          sensitive: false,
        },
        {
          field_key: 'card_cvv',
          name: 'card_cvv',
          label: 'Card CVV',
          label_source: 'label_for',
          input_type: 'text',
          required: false,
          sensitive: true,
        },
      ],
    });

    expect(result.tagsByFieldKey['name']).toBe('required');
    expect(result.tagsByFieldKey['nickname']).toBe('optional');
    expect(result.tagsByFieldKey['card_cvv']).toBe('unusual');
  });
});

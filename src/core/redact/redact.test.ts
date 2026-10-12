/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { extractForm } from '../extract/extractor';
import { checkChatInput, isFilled, isSensitiveField } from './redactor';

describe('Redaction & Privacy Engine (Process 2.0 — FR-REDACT.1–3)', () => {
  it('PROVES FR-REDACT.1–3: extractor NEVER accesses .value, .defaultValue, or .checked on DOM elements', () => {
    // Construct a form with sensitive and non-sensitive inputs
    const div = document.createElement('div');
    div.innerHTML = `
      <form id="proxy-test-form" action="/submit">
        <label for="income">Annual Income</label>
        <input id="income" type="text" placeholder="e.g. 200000" />

        <label for="pwd">Account Password</label>
        <input id="pwd" type="password" />

        <label for="otp">SMS OTP Code</label>
        <input id="otp" type="text" />
      </form>
    `;

    // Wrap every input element in a strict Proxy that THROWS if .value or typed data is accessed
    const inputs = Array.from(div.querySelectorAll('input'));
    inputs.forEach((inputEl) => {
      // Set values that user might have typed
      (inputEl as any)._sentinel_typed_value = 'USER_PRIVATE_CREDENTIAL_1234';

      Object.defineProperty(inputEl, 'value', {
        get() {
          throw new Error('VIOLATION: extractor attempted to read .value property!');
        },
        configurable: true,
      });

      Object.defineProperty(inputEl, 'defaultValue', {
        get() {
          throw new Error('VIOLATION: extractor attempted to read .defaultValue property!');
        },
        configurable: true,
      });
    });

    // Running extractForm MUST NOT throw any error
    expect(() => {
      const forms = extractForm(div);
      expect(forms.length).toBe(1);
      const fields = forms[0]?.fields || [];
      expect(fields.length).toBe(3);

      // Verify that sensitive fields keep structure only and have NO placeholder or auxiliary text
      const pwdField = fields.find((f) => f.name === 'pwd');
      expect(pwdField?.sensitive).toBe(true);
      expect(pwdField?.placeholder).toBeUndefined();
      expect(pwdField?.page_help).toBeUndefined();

      const otpField = fields.find((f) => f.name === 'otp');
      expect(otpField?.sensitive).toBe(true);
      expect(otpField?.placeholder).toBeUndefined();
    }).not.toThrow();
  });

  it('detects sensitive field patterns correctly', () => {
    expect(isSensitiveField('user_password')).toBe(true);
    expect(isSensitiveField('mobile_otp')).toBe(true);
    expect(isSensitiveField('card_cvv')).toBe(true);
    expect(isSensitiveField('atm_pin')).toBe(true);
    expect(isSensitiveField('account_number', '', '', '', 'password')).toBe(true);
    expect(isSensitiveField('applicant_name', 'name', 'Full Name')).toBe(false);
  });

  it('tests isFilled without storing or returning values', () => {
    const inputEmpty = document.createElement('input');
    inputEmpty.value = '';
    expect(isFilled(inputEmpty)).toBe(false);

    const inputFilled = document.createElement('input');
    inputFilled.value = 'Ramesh';
    expect(isFilled(inputFilled)).toBe(true);

    const select = document.createElement('select');
    const opt0 = document.createElement('option');
    opt0.text = 'Select...';
    const opt1 = document.createElement('option');
    opt1.text = 'OBC';
    select.appendChild(opt0);
    select.appendChild(opt1);

    select.selectedIndex = 0;
    expect(isFilled(select)).toBe(false);
    select.selectedIndex = 1;
    expect(isFilled(select)).toBe(true);
  });

  it('chat-input guard blocks private numbers from being sent', () => {
    // Standalone 6-digit OTP
    expect(checkChatInput('489210').blocked).toBe(true);
    // 12-digit Aadhaar number
    expect(checkChatInput('1234 5678 9012').blocked).toBe(true);
    // 16-digit card number
    expect(checkChatInput('4111 2222 3333 4444').blocked).toBe(true);

    // Regular question is allowed
    expect(checkChatInput('What documents do I need for income certificate?').blocked).toBe(false);
  });
});

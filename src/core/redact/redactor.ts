/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Sensitive detection pattern per Section 8.2 (matches underscore, hyphen, boundary)
export const SENSITIVE_PATTERN =
  /(pass(word)?|(?:^|[\W_])otp(?:$|[\W_])|one.?time|cvv|cvc|(?:^|[\W_])pin(?:$|[\W_])|mpin|card.?number|security.?code|verification.?code)/i;

export function isSensitiveField(
  name: string = '',
  id: string = '',
  label: string = '',
  ariaLabel: string = '',
  type: string = ''
): boolean {
  if (type.toLowerCase() === 'password') return true;
  return (
    SENSITIVE_PATTERN.test(name) ||
    SENSITIVE_PATTERN.test(id) ||
    SENSITIVE_PATTERN.test(label) ||
    SENSITIVE_PATTERN.test(ariaLabel)
  );
}

/**
 * Checks if a field element has content without recording or returning the value.
 * Section 8.2: Only function allowed to look at emptiness; never called on sensitive fields.
 */
export function isFilled(el: Element): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();

  // For select
  if (tag === 'select') {
    const sel = el as HTMLSelectElement;
    return sel.selectedIndex > 0;
  }

  // For checkbox or radio
  if (el.getAttribute('type') === 'checkbox' || el.getAttribute('type') === 'radio') {
    return (el as HTMLInputElement).checked;
  }

  // For standard input/textarea without reading the full text content
  const inp = el as HTMLInputElement;
  const val = inp.value;
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * Section 8.2 Chat guard: blocks private numbers from being pasted into chat.
 */
export function checkChatInput(text: string): { blocked: boolean; warning?: string } {
  const trimmed = text.trim();

  // Check 4-8 digit OTP alone
  if (/^\d{4,8}$/.test(trimmed)) {
    return {
      blocked: true,
      warning: "Please don't type private numbers or OTPs here.",
    };
  }

  // Check 12-digit Aadhaar pattern
  if (/^\d{4}\s?\d{4}\s?\d{4}$/.test(trimmed)) {
    return {
      blocked: true,
      warning: "Please don't type private identity numbers here.",
    };
  }

  // Check 16-digit card number pattern
  if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(trimmed)) {
    return {
      blocked: true,
      warning: "Please don't type card or account numbers here.",
    };
  }

  return { blocked: false };
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtractedField, FormStructure } from '../../types';

// Sensitive fields patterns to block entirely per FR-REDACT.1
const SENSITIVE_PATTERN = /(password|otp|cvv|cvc|pin|card_verification|security_code)/i;

/**
 * Extracts form structure from DOM adhering strictly to:
 * - FR-EXTRACT.1–4 (DOM scan, label precedence, action/url capture)
 * - FR-REDACT.1–3 (Local redaction: NEVER reads or returns .value, blocks sensitive fields)
 */
export function extractFormsFromDocument(doc: Document | Element): FormStructure[] {
  const formElements = Array.from(doc.querySelectorAll('form'));
  const results: FormStructure[] = [];

  const pageUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/fixtures/scholarship-form.html';
  let domain = 'localhost';
  let isHttps = false;
  try {
    const urlObj = new URL(pageUrl);
    domain = urlObj.hostname;
    isHttps = urlObj.protocol === 'https:';
  } catch {
    // fallback
  }

  // If no <form> element exists, scan body for inputs
  const rootElement = doc instanceof Document ? doc.body : doc;
  const formsToScan: (HTMLFormElement | Element)[] =
    formElements.length > 0 ? formElements : [rootElement];

  formsToScan.forEach((formEl, index) => {
    const formId = (formEl as HTMLElement).id || `form-${index + 1}`;
    const actionUrl = (formEl as HTMLFormElement).action || '';
    const title =
      (formEl.querySelector('h1, h2, h3, .header')?.textContent || '').trim() ||
      (doc.querySelector('title')?.textContent || '').trim() ||
      `Web Form ${index + 1}`;

    const inputElements = Array.from(
      formEl.querySelectorAll('input, select, textarea')
    ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];

    const extractedFields: ExtractedField[] = [];

    inputElements.forEach((el, fieldIndex) => {
      const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();

      // Exclude hidden, submit, reset, and button controls
      if (['submit', 'reset', 'button', 'hidden', 'image'].includes(type)) {
        return;
      }

      const id = el.id || `field-${formId}-${fieldIndex}`;
      const name = el.name || id;

      // Check for sensitive fields to enforce FR-REDACT.1
      const isSensitive =
        type === 'password' ||
        SENSITIVE_PATTERN.test(name) ||
        SENSITIVE_PATTERN.test(id) ||
        SENSITIVE_PATTERN.test(el.getAttribute('autocomplete') || '');

      // FR-EXTRACT.2: Resolve label using strict precedence
      const label = resolveFieldLabel(el, doc);

      // Resolve on-page descriptive help text (Tier 1 grounding)
      const pageHelpText = resolveHelpText(el, doc);

      // Generate a normalized fieldKey for caching (e.g. 'annual_family_income')
      const fieldKey = normalizeFieldKey(id, name, label);

      // Get element bounding rectangle for anchoring injected overlay tags
      let boundingRect: ExtractedField['boundingRect'] = undefined;
      try {
        const rect = el.getBoundingClientRect();
        boundingRect = {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom + window.scrollY,
          right: rect.right + window.scrollX,
        };
      } catch {
        // Fallback in headless environment
      }

      // Collect options if select element
      let options: string[] | undefined = undefined;
      if (el.tagName.toLowerCase() === 'select') {
        const selectEl = el as HTMLSelectElement;
        options = Array.from(selectEl.options)
          .map((o) => o.text.trim())
          .filter((t) => t && !t.includes('Select'));
      }

      // STRICT PRIVACY (FR-REDACT.1–3):
      // Notice: `el.value` is NEVER accessed or stored anywhere in this object.
      extractedFields.push({
        id,
        fieldKey,
        name,
        type: isSensitive ? 'sensitive_excluded' : type,
        label,
        placeholder: el.getAttribute('placeholder') || undefined,
        required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
        options,
        ariaDescribedby: el.getAttribute('aria-describedby') || undefined,
        pageHelpText,
        isSensitiveBlocked: isSensitive,
        boundingRect,
      });
    });

    if (extractedFields.length > 0) {
      results.push({
        formId,
        pageUrl,
        actionUrl,
        title,
        domain,
        isHttps,
        fields: extractedFields,
      });
    }
  });

  return results;
}

/**
 * FR-EXTRACT.2: Resolve label using precedence:
 * 1. associated <label for="...">
 * 2. aria-label
 * 3. aria-describedby
 * 4. nearest preceding text node
 * 5. placeholder
 */
function resolveFieldLabel(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  doc: Document | Element
): string {
  // 1. Associated <label for="id">
  if (el.id) {
    const labelFor = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (labelFor && labelFor.textContent?.trim()) {
      return cleanLabelText(labelFor.textContent);
    }
  }

  // Check enclosing <label>
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    return cleanLabelText(parentLabel.textContent);
  }

  // 2. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return cleanLabelText(ariaLabel);
  }

  // 3. aria-labelledby
  const ariaLabelledby = el.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const labelledbyEl = doc.querySelector(`#${CSS.escape(ariaLabelledby)}`);
    if (labelledbyEl && labelledbyEl.textContent?.trim()) {
      return cleanLabelText(labelledbyEl.textContent);
    }
  }

  // 4. Nearest preceding text node or sibling label
  let prev = el.previousElementSibling;
  while (prev) {
    if (prev.tagName.toLowerCase() === 'label' && prev.textContent?.trim()) {
      return cleanLabelText(prev.textContent);
    }
    prev = prev.previousElementSibling;
  }

  // 5. Placeholder
  const placeholder = el.getAttribute('placeholder');
  if (placeholder && placeholder.trim()) {
    return cleanLabelText(placeholder);
  }

  // Fallback to name or id formatted cleanly
  const fallback = el.name || el.id || 'Form Field';
  return fallback
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveHelpText(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  doc: Document | Element
): string | undefined {
  const describedby = el.getAttribute('aria-describedby');
  if (describedby) {
    const hintEl = doc.querySelector(`#${CSS.escape(describedby)}`);
    if (hintEl && hintEl.textContent?.trim()) {
      return hintEl.textContent.trim();
    }
  }

  // Check next sibling with class hint/help
  const next = el.nextElementSibling;
  if (next && (next.classList.contains('field-hint') || next.classList.contains('field-help'))) {
    return next.textContent?.trim();
  }

  return undefined;
}

function cleanLabelText(text: string): string {
  return text
    .replace(/\*/g, '')
    .replace(/\(req(uired)?\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFieldKey(id: string, name: string, label: string): string {
  const combined = (id || name || label).toLowerCase();
  if (combined.includes('income')) return 'annual_family_income';
  if (combined.includes('domicile')) return 'domicile_certificate_no';
  if (combined.includes('ifsc')) return 'bank_ifsc_code';
  if (combined.includes('bank_account') || combined.includes('account_no')) return 'bank_account_no';
  if (combined.includes('aadhaar')) return 'aadhaar_number';
  if (combined.includes('maiden')) return 'mothers_maiden_name';
  if (combined.includes('otp')) return 'one_time_password_otp';
  if (combined.includes('h_index') || combined.includes('h-index')) return 'h_index_citation';
  if (combined.includes('pan')) return 'pan_number';
  if (combined.includes('name')) return 'applicant_name';
  if (combined.includes('category') || combined.includes('caste')) return 'social_category';

  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

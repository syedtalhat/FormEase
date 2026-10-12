/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INCLUDE_FORMLESS_INPUTS } from '../config';
import { isSensitiveField } from '../redact/redactor';
import { ExtractedFieldStructure, ExtractedFormStructure, LabelSource } from './types';

export interface ExtractOptions {
  includeFormless?: boolean;
  pageUrl?: string;
}

/**
 * Extracts form structure from DOM following Process 1.0 (FR-EXTRACT.1–4) & Process 2.0 (FR-REDACT.1–3).
 * PRIVACY GUARANTEE: This function NEVER accesses .value, .defaultValue, .checked,
 * .selectedIndex, or textarea textContent.
 *
 * ROBUSTNESS NOTE: Cross-Origin iFrames (SRS §2.5, §8.3):
 * Per Chrome MV3 sandbox boundaries and the W3C Same-Origin Policy, cross-origin iframes
 * hosted inside third-party domains cannot be traversed by the content script.
 * Any attempt to access `iframe.contentDocument` on a cross-origin iframe throws
 * a SecurityError DOMException. FormAssist explicitly ignores cross-origin iframes
 * without throwing, and only extracts forms belonging to the current document context.
 */
export function extractForm(
  root: Document | Element,
  options: ExtractOptions = {}
): ExtractedFormStructure[] {
  const includeFormless = options.includeFormless ?? INCLUDE_FORMLESS_INPUTS;
  const pageUrl =
    options.pageUrl ||
    (typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/fixtures/scholarship.html');

  const doc = root.ownerDocument || (root as Document);

  // Safely collect forms, ignoring cross-origin iframe traps
  let formElements: HTMLFormElement[] = [];
  try {
    formElements = Array.from(root.querySelectorAll('form'));
  } catch (_e) {
    // Graceful fallback for disconnected nodes
  }

  const formsToScan: (HTMLFormElement | Element)[] =
    formElements.length > 0
      ? formElements
      : includeFormless
      ? [root instanceof Document ? root.body || root : root]
      : [];

  const results: ExtractedFormStructure[] = [];

  formsToScan.forEach((formEl, fIdx) => {
    const rawAction = formEl.getAttribute('action') || '';
    let formAction = rawAction;
    try {
      formAction = new URL(rawAction, pageUrl).href;
    } catch {
      formAction = rawAction;
    }

    const formId = formEl.id || `form-${fIdx + 1}`;
    const formTitle =
      (formEl.querySelector('h1, h2, h3, .form-title')?.textContent || '').trim() ||
      (doc.querySelector('title')?.textContent || '').trim() ||
      `Web Form ${fIdx + 1}`;

    const rawControls = Array.from(
      formEl.querySelectorAll('input, select, textarea')
    ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];

    const fields: ExtractedFieldStructure[] = [];
    const radioGroupsProcessed = new Set<string>();

    for (const el of rawControls) {
      const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();

      // Skip non-data controls
      if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) {
        continue;
      }

      // Group radios / checkboxes by name into single logical field
      if (type === 'radio' && el.name) {
        if (radioGroupsProcessed.has(el.name)) continue;
        radioGroupsProcessed.add(el.name);

        const fieldset = el.closest('fieldset');
        const legend = fieldset?.querySelector('legend');
        const groupLabel = legend?.textContent?.trim() || el.name;

        const isSensitive = isSensitiveField(el.name, el.id, groupLabel, '', type);
        const fieldKey = generateFieldKey(groupLabel, 'radio', el.name);

        fields.push({
          field_key: fieldKey,
          name: el.name,
          label: groupLabel,
          label_source: legend ? 'label_for' : 'fallback_name',
          input_type: 'radio',
          required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
          sensitive: isSensitive,
          anchorElement: (fieldset || el) as HTMLElement,
        });
        continue;
      }

      const id = el.id || '';
      const name = el.name || id;

      // Label resolution per strict precedence (FR-EXTRACT.2)
      const { label, source } = resolveLabel(el, formEl, doc);

      const isSensitive = isSensitiveField(
        name,
        id,
        label,
        el.getAttribute('aria-label') || '',
        type
      );

      const isRequired =
        el.hasAttribute('required') ||
        el.getAttribute('aria-required') === 'true';

      const fieldKey = generateFieldKey(label, type, name || id);

      // Extract auxiliary information only for NON-sensitive fields
      let placeholder: string | undefined = undefined;
      let optionsList: string[] | undefined = undefined;
      let pageHelp: string | undefined = undefined;

      if (!isSensitive) {
        placeholder = el.getAttribute('placeholder') || undefined;

        if (el.tagName.toLowerCase() === 'select') {
          const selectEl = el as HTMLSelectElement;
          optionsList = Array.from(selectEl.options)
            .map((opt) => opt.text.trim())
            .filter((t) => t.length > 0 && !t.toLowerCase().includes('select'))
            .slice(0, 50); // Cap 50 options
        }

        // Help text resolution: adjacent or aria-describedby, max 300 chars
        // Drop help text if aria-invalid="true" because error text may echo user input
        const isInvalid = el.getAttribute('aria-invalid') === 'true';
        if (!isInvalid) {
          pageHelp = resolvePageHelp(el, formEl, doc);
        }
      }

      fields.push({
        field_key: fieldKey,
        name,
        label,
        label_source: source,
        input_type: isSensitive ? 'password' : type,
        required: isRequired,
        sensitive: isSensitive,
        placeholder,
        options: optionsList,
        page_help: pageHelp,
        anchorElement: el as HTMLElement,
      });
    }

    if (fields.length > 0) {
      results.push({
        form_id: formId,
        form_title: formTitle,
        form_action: formAction,
        page_url: pageUrl,
        fields,
      });
    }
  });

  return results;
}

/**
 * Label precedence resolution (FR-EXTRACT.2):
 * 1. <label for>
 * 2. wrapping <label>
 * 3. aria-label
 * 4. aria-labelledby
 * 5. aria-describedby text
 * 6. nearest preceding text node
 * 7. placeholder
 * 8. fallback to name
 */
function resolveLabel(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  scope: Element,
  doc: Document
): { label: string; source: LabelSource } {
  const container = el.form || scope || doc;

  // 1. <label for="...">
  if (el.id) {
    const escaped = CSS.escape(el.id);
    const labelFor = container.querySelector(`label[for="${escaped}"]`) || doc.querySelector(`label[for="${escaped}"]`);
    if (labelFor && labelFor.textContent?.trim()) {
      return { label: cleanLabel(labelFor.textContent), source: 'label_for' };
    }
  }

  // 2. wrapping <label>
  const wrapping = el.closest('label');
  if (wrapping && wrapping.textContent?.trim()) {
    return { label: cleanLabel(wrapping.textContent), source: 'wrapping_label' };
  }

  // 3. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return { label: cleanLabel(ariaLabel), source: 'aria_label' };
  }

  // 4. aria-labelledby
  const ariaLabelledby = el.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const escaped = CSS.escape(ariaLabelledby);
    const ref = container.querySelector(`#${escaped}`) || doc.querySelector(`#${escaped}`);
    if (ref && ref.textContent?.trim()) {
      return { label: cleanLabel(ref.textContent), source: 'aria_labelledby' };
    }
  }

  // 5. aria-describedby
  const ariaDescribedby = el.getAttribute('aria-describedby');
  if (ariaDescribedby) {
    const escaped = CSS.escape(ariaDescribedby);
    const desc = container.querySelector(`#${escaped}`) || doc.querySelector(`#${escaped}`);
    if (desc && desc.textContent?.trim()) {
      return { label: cleanLabel(desc.textContent), source: 'aria_describedby' };
    }
  }

  // 6. nearest preceding text node / unassociated label
  let prev = el.previousElementSibling;
  while (prev) {
    const tag = prev.tagName.toLowerCase();
    if (['span', 'p'].includes(tag) && prev.textContent?.trim()) {
      return { label: cleanLabel(prev.textContent), source: 'preceding_text' };
    }
    // Only use preceding label if it does NOT target another input
    if (tag === 'label' && (!prev.hasAttribute('for') || prev.getAttribute('for') === el.id) && prev.textContent?.trim()) {
      return { label: cleanLabel(prev.textContent), source: 'preceding_text' };
    }
    // Stop looking backwards if we encounter another input or form control
    if (['input', 'select', 'textarea'].includes(tag)) {
      break;
    }
    prev = prev.previousElementSibling;
  }

  // 7. placeholder
  const placeholder = el.getAttribute('placeholder');
  if (placeholder && placeholder.trim()) {
    return { label: cleanLabel(placeholder), source: 'placeholder' };
  }

  // 8. fallback name or id
  const fallback = el.name || el.id || 'Field';
  return {
    label: cleanLabel(fallback.replace(/[_-]/g, ' ')),
    source: 'fallback_name',
  };
}

function resolvePageHelp(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  scope: Element,
  doc: Document
): string | undefined {
  const container = el.form || scope || doc;
  const describedby = el.getAttribute('aria-describedby');
  if (describedby) {
    const escaped = CSS.escape(describedby);
    const h = container.querySelector(`#${escaped}`) || doc.querySelector(`#${escaped}`);
    if (h && h.textContent?.trim()) {
      return h.textContent.trim().slice(0, 300);
    }
  }

  const next = el.nextElementSibling;
  if (next && (next.classList.contains('field-hint') || next.classList.contains('field-help'))) {
    return next.textContent?.trim().slice(0, 300);
  }

  return undefined;
}

function cleanLabel(text: string): string {
  return text
    .replace(/\*/g, '')
    .replace(/\(req(uired)?\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFieldKey(label: string, type: string, name: string): string {
  const base = `${label.toLowerCase()} ${type} ${name.toLowerCase()}`
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (base.includes('income')) return 'annual_family_income';
  if (base.includes('domicile')) return 'domicile_certificate_no';
  if (base.includes('ifsc')) return 'bank_ifsc_code';
  if (base.includes('otp')) return 'one_time_password_otp';
  if (base.includes('aadhaar')) return 'aadhaar_number';
  if (base.includes('pan')) return 'pan_number';

  return base || 'field';
}

/**
 * Debounced MutationObserver for dynamic multi-step forms (FR-EXTRACT.3).
 */
export function observeForm(
  root: Document | Element,
  onChange: () => void,
  debounceMs: number = 400
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      onChange();
    }, debounceMs);
  });

  observer.observe(root instanceof Document ? root.body || root : root, {
    childList: true,
    subtree: true,
  });

  return () => {
    if (timer) clearTimeout(timer);
    observer.disconnect();
  };
}

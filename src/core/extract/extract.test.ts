/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { extractForm } from './extractor';

describe('Form Extractor (Process 1.0 — FR-EXTRACT.1–4)', () => {
  it('strictly obeys label precedence: label[for] > aria-label > aria-describedby > placeholder', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <form id="test-form" action="/submit">
        <!-- 1. label for wins over aria-label and placeholder -->
        <label for="inp-1">Label For Text</label>
        <input id="inp-1" aria-label="Aria Label Text" placeholder="Placeholder Text" />

        <!-- 2. aria-label wins over placeholder when no label tag -->
        <input id="inp-2" aria-label="Aria Wins" placeholder="Placeholder Secondary" />

        <!-- 3. placeholder is used when nothing else exists -->
        <input id="inp-3" placeholder="Placeholder Only" />
      </form>
    `;

    const forms = extractForm(div);
    expect(forms.length).toBe(1);
    const fields = forms[0]?.fields || [];
    expect(fields.length).toBe(3);

    expect(fields[0]?.label).toBe('Label For Text');
    expect(fields[0]?.label_source).toBe('label_for');

    expect(fields[1]?.label).toBe('Aria Wins');
    expect(fields[1]?.label_source).toBe('aria_label');

    expect(fields[2]?.label).toBe('Placeholder Only');
    expect(fields[2]?.label_source).toBe('placeholder');
  });

  it('groups radio inputs with the same name into a single logical field using legend', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <form id="radio-form" action="/submit">
        <fieldset>
          <legend>Citizenship Status</legend>
          <label><input type="radio" name="citizenship" value="citizen" /> Citizen</label>
          <label><input type="radio" name="citizenship" value="resident" /> Resident</label>
          <label><input type="radio" name="citizenship" value="other" /> Other</label>
        </fieldset>
      </form>
    `;

    const forms = extractForm(div);
    expect(forms.length).toBe(1);
    const fields = forms[0]?.fields || [];
    expect(fields.length).toBe(1);
    expect(fields[0]?.label).toBe('Citizenship Status');
    expect(fields[0]?.input_type).toBe('radio');
  });

  it('skips non-data buttons, submit, reset, and hidden inputs', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <form id="btn-form" action="/submit">
        <input type="hidden" name="csrf" value="secret" />
        <input type="text" id="username" placeholder="Username" />
        <button type="submit">Submit</button>
        <input type="reset" value="Reset" />
        <input type="button" value="Click" />
      </form>
    `;

    const forms = extractForm(div);
    const fields = forms[0]?.fields || [];
    expect(fields.length).toBe(1);
    expect(fields[0]?.name).toBe('username');
  });

  it('resolves relative action against pageUrl and honors form boundaries', () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <form id="action-form" action="/api/apply">
        <input id="q1" placeholder="Question 1" />
      </form>
      <!-- Formless input outside form should be ignored by default -->
      <input id="outside" placeholder="Outside Form" />
    `;

    const forms = extractForm(div, { pageUrl: 'https://scholarships.example.gov.in/portal/form' });
    expect(forms.length).toBe(1);
    expect(forms[0]?.form_action).toBe('https://scholarships.example.gov.in/api/apply');
    expect(forms[0]?.fields.length).toBe(1);
  });
});

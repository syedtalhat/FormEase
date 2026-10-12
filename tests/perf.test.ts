/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { extractForm } from '../src/core/extract/extractor';
import { extractFormsFromDocument } from '../src/extension/content/extractor';

describe('Performance SLA Verification (NFR-PERF.3)', () => {
  let htmlContent: string;

  beforeEach(() => {
    const fixturePath = path.join(process.cwd(), 'fixtures', 'large-50-field-form.html');
    htmlContent = fs.readFileSync(fixturePath, 'utf-8');
    document.body.innerHTML = htmlContent;
  });

  it('detects 50 interactive fields from complex civic form fixture', () => {
    const forms = extractForm(document);
    expect(forms.length).toBe(1);

    const form = forms[0];
    expect(form.fields.length).toBe(50);
  });

  it('measures NFR-PERF.3: detect + extract <= 1.0 s (1000 ms) for 50 fields', () => {
    // Benchmark 10 iterations to eliminate cold-start jitter
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      const extracted = extractForm(document);
      const t1 = performance.now();

      expect(extracted[0].fields.length).toBe(50);
      durations.push(t1 - t0);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);

    console.log(
      `[NFR-PERF.3 Benchmark] 50-field detection: avg=${avgDuration.toFixed(
        2
      )}ms, max=${maxDuration.toFixed(2)}ms (SLA target: <= 1000ms)`
    );

    // Hard assertion on strict NFR-PERF.3 SLA target of 1000 ms
    expect(maxDuration).toBeLessThanOrEqual(1000);
    // Real execution is typically < 50ms in happy-dom / Chromium V8
    expect(avgDuration).toBeLessThan(200);
  });

  it('content extractor (MV3) also detects and sanitizes all 50 fields under SLA', () => {
    const t0 = performance.now();
    const forms = extractFormsFromDocument(document);
    const t1 = performance.now();

    const duration = t1 - t0;
    expect(forms.length).toBe(1);
    expect(forms[0].fields.length).toBe(50);
    expect(duration).toBeLessThanOrEqual(1000);

    // Verify none of the 50 fields expose .value
    for (const field of forms[0].fields) {
      expect((field as any).value).toBeUndefined();
    }
  });
});

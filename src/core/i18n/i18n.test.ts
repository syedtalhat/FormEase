/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import enCatalog from './en.json';
import hiCatalog from './hi.json';
import mrCatalog from './mr.json';

describe('i18n Key Parity & Catalog Integrity', () => {
  it('ensures every key in en.json exists in hi.json and mr.json', () => {
    const enKeys = Object.keys(enCatalog).sort();

    // Filter out _comment metadata from comparison
    const hiKeys = Object.keys(hiCatalog).filter((k) => k !== '_comment');
    const mrKeys = Object.keys(mrCatalog).filter((k) => k !== '_comment');

    const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
    const missingInMr = enKeys.filter((k) => !mrKeys.includes(k));

    expect(missingInHi, `Keys missing in hi.json: ${missingInHi.join(', ')}`).toEqual([]);
    expect(missingInMr, `Keys missing in mr.json: ${missingInMr.join(', ')}`).toEqual([]);
  });

  it('contains top comment for machine drafting in Hindi and Marathi catalogs per Section 11', () => {
    expect((hiCatalog as any)._comment).toContain('Machine-drafted — needs native-speaker review');
    expect((mrCatalog as any)._comment).toContain('Machine-drafted — needs native-speaker review');
  });
});

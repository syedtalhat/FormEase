/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import enCatalog from './en.json';
import hiCatalog from './hi.json';
import mrCatalog from './mr.json';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export type I18nKey = keyof typeof enCatalog;

const catalogs: Record<SupportedLanguage, Record<string, string>> = {
  en: enCatalog,
  hi: hiCatalog,
  mr: mrCatalog,
};

export function t(
  key: I18nKey,
  language: SupportedLanguage = 'en',
  vars?: Record<string, string | number>
): string {
  const catalog = catalogs[language] || catalogs.en;
  let text = catalog[key] || catalogs.en[key] || (key as string);

  if (vars) {
    Object.entries(vars).forEach(([k, val]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
    });
  }

  return text;
}

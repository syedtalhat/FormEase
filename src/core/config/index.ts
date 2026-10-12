/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Model constants in single place per NFR-MAIN.1 and Section 12
export const GEMINI_TEXT_MODEL =
  (typeof process !== 'undefined' && process.env?.GEMINI_TEXT_MODEL) || 'gemini-3.5-flash';

export const GEMINI_EMBEDDING_MODEL =
  (typeof process !== 'undefined' && process.env?.GEMINI_EMBEDDING_MODEL) || 'gemini-embedding-001';

export const EMBEDDING_DIMENSIONS = 768;

// Extractor options per Section 8.1
export const INCLUDE_FORMLESS_INPUTS = false;

// Redactor fill-state transmission per Section 8.2
export const SEND_COMPLETION_STATE = true;

// Section 8.3 allowlists: Curated example entries with domain matching
export const BANK_DOMAIN_ALLOWLIST = [
  'rbi.org.in',
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'secure-banking.org',
  'bank.gov.in',
  'nationalbank.in',
];

export const NATIONAL_ID_ALLOWLIST = [
  'gov.in',
  'nic.in',
  'uidai.gov.in',
  'incometax.gov.in',
  'scholarships.gov.in',
  'fellowships.res.in',
  'example.gov.in',
];

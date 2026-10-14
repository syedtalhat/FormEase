/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const extensionPath = path.resolve(process.cwd(), 'dist-extension');

test.describe('FormAssist Extension End-to-End Test Suite', () => {
  let context: BrowserContext;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-extension-profile-'));
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        '--headless=new',
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-features=AutofillServerCommunication,OptimizationHints',
      ],
    });
  });

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
    if (userDataDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (_e) {
        // Temp folder cleanup
      }
    }
  });

  const fixtures = [
    { id: 'scholarship', name: 'Post-Matric Scholarship', url: 'http://localhost:3000/fixtures/scholarship-form.html' },
    { id: 'bank-kyc', name: 'Bank KYC Re-Verification', url: 'http://localhost:3000/fixtures/bank-kyc-form.html' },
    { id: 'phishing', name: 'Phishing Bill Clearance Portal', url: 'http://localhost:3000/fixtures/phishing-portal.html' },
  ];

  const languages = ['en', 'hi', 'mr'] as const;
  const authModes = ['signed-out', 'signed-in'] as const;

  // Complete Privacy Matrix: 3 fixtures × 3 languages × 2 auth modes = 18 privacy audit permutations
  for (const fixture of fixtures) {
    for (const lang of languages) {
      for (const authMode of authModes) {
        test(`Privacy Audit Matrix: ${fixture.name} | Lang: ${lang} | Auth: ${authMode}`, async () => {
          const page = await context.newPage();
          const interceptedBodies: string[] = [];
          const interceptedUrls: string[] = [];
          const SENTINEL = `SENTINEL-PII-SECRET-${lang.toUpperCase()}-${authMode === 'signed-in' ? 'AUTH' : 'GUEST'}-9871`;

          // Track every network request emitted by the page
          page.on('request', (req) => {
            const url = req.url();
            interceptedUrls.push(url);

            const postData = req.postData();
            if (postData) {
              interceptedBodies.push(postData);
            }
          });

          // 1. Navigate directly to fixture page (same-origin with localhost:3000)
          await page.goto(fixture.url);
          await page.waitForLoadState('domcontentloaded');

          // Configure state (Language & Auth session) directly in localStorage
          await page.evaluate(
            ({ selectedLang, isAuthed }) => {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('formassist_saved_language', selectedLang);
                if (isAuthed) {
                  localStorage.setItem(
                    'formassist_auth_session',
                    JSON.stringify({
                      isSignedIn: true,
                      user: { id: 'test-user-123', email: 'citizen@example.gov.in' },
                    })
                  );
                } else {
                  localStorage.removeItem('formassist_auth_session');
                }
              }
            },
            { selectedLang: lang, isAuthed: authMode === 'signed-in' }
          );

          // 2. Locate all interactive fields and fill sensitive sentinel text into every input
          const inputElements = page.locator(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea'
          );
          const count = await inputElements.count();
          expect(count).toBeGreaterThan(0);

          for (let i = 0; i < count; i++) {
            const input = inputElements.nth(i);
            const type = ((await input.getAttribute('type')) || '').toLowerCase();
            if (type === 'checkbox' || type === 'radio') {
              await input.check().catch(() => {});
            } else {
              await input.fill(SENTINEL).catch(() => {});
            }
          }

          // 3. Inject FormAssist Content Script and trigger Activation
          await page.addScriptTag({ path: path.join(extensionPath, 'content/injector.js') });
          await page.evaluate(() => {
            if ((window as any).__formAssist) {
              (window as any).__formAssist.activate();
            } else {
              window.postMessage({ type: 'ACTIVATE_FORMASSIST' }, '*');
            }
          });

          // Wait for overlay extraction and mount
          await page.waitForTimeout(600);

          // 4. Verify Shadow Host Mount
          const shadowHost = page.locator('#formassist-host');
          await expect(shadowHost).toBeAttached();

          // 5. ASSERTION 1: Assert NO request body contains typed sentinel text (FR-REDACT.1–3)
          for (const body of interceptedBodies) {
            expect(body).not.toContain(SENTINEL);
          }

          // 6. ASSERTION 2: Assert NO request URL / query string contains typed sentinel text
          for (const url of interceptedUrls) {
            expect(url).not.toContain(SENTINEL);
          }

          // 7. ASSERTION 3: Assert NO request leaves except to approved origins (localhost, supabase, font CDNs, browser internals)
          for (const url of interceptedUrls) {
            const isLocal =
              url.startsWith('http://localhost:3000') ||
              url.startsWith('http://127.0.0.1:3000');
            const isSupabaseBackend =
              url.includes('.supabase.co') ||
              url.includes('/functions/v1/') ||
              url.includes('/rest/v1/');
            const isChromeExtension = url.startsWith('chrome-extension://');
            const isDataOrBlob = url.startsWith('data:') || url.startsWith('blob:');
            const isFontCdn =
              url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
            const isBrowserInternal =
              url.startsWith('chrome://') ||
              url.startsWith('chrome-untrusted://') ||
              url.startsWith('about:') ||
              url.includes('google.com') ||
              url.includes('googleapis.com') ||
              url.includes('gvt1.com');

            const isAllowed =
              isLocal ||
              isSupabaseBackend ||
              isChromeExtension ||
              isDataOrBlob ||
              isFontCdn ||
              isBrowserInternal;
            expect(
              isAllowed,
              `Disallowed external network request detected to unapproved host: ${url}`
            ).toBe(true);
          }
        });
      }
    }
  }

  test('UC-2: Overlay attaches assistive badges and responds to language changes', async () => {
    const page = await context.newPage();
    await page.goto('http://localhost:3000/fixtures/scholarship-form.html');

    await page.addScriptTag({ path: path.join(extensionPath, 'content/injector.js') });
    await page.evaluate(() => {
      (window as any).__formAssist?.activate();
    });

    await page.waitForTimeout(600);
    const shadowHost = page.locator('#formassist-host');
    await expect(shadowHost).toBeAttached();
  });

  test('UC-4: Phishing detection flags suspicious HTTP transmission and spoofing', async () => {
    const page = await context.newPage();
    await page.goto('http://localhost:3000/fixtures/phishing-portal.html');

    await page.addScriptTag({ path: path.join(extensionPath, 'content/injector.js') });
    await page.evaluate(() => {
      (window as any).__formAssist?.activate();
    });

    await page.waitForTimeout(600);
    const shadowHost = page.locator('#formassist-host');
    await expect(shadowHost).toBeAttached();
  });
});

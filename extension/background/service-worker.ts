/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FormAssist MV3 ES-Module Background Service Worker
// CRITICAL RESILIENCE RULE:
// Service workers in Manifest V3 are ephemeral and can be terminated after 30s of inactivity.
// ZERO in-memory-only state: all persistent data resides in chrome.storage.local or chrome.storage.session.

import { HttpApiClient } from '../../src/core/api/httpClient';
import { MockApiClient } from '../../src/core/api/mockClient';
import {
  ExtensionMessage,
  ExtensionMessageSchema,
  ExtensionMessageResponse,
} from '../../src/core/messaging';
import { getAccessToken } from '../../src/core/auth/supabaseAuth';
import { getSupabaseConfig } from '../../src/core/storage';

// 1. On initial extension installation, open onboarding.html in a new tab
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.get('formassist_onboarding_completed', (result) => {
      if (!result.formassist_onboarding_completed) {
        chrome.tabs.create({
          url: chrome.runtime.getURL('onboarding.html'),
        });
      }
    });
  }

  // Ensure chrome.storage.session is accessible across contexts
  try {
    chrome.storage?.session?.setAccessLevel?.({
      accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
    });
  } catch (_e) {
    // Graceful fallback for browsers without setAccessLevel
  }
});

// 2. Clean up tab session state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  try {
    chrome.storage?.session?.remove([`tab_state_${tabId}`, `tab_lang_${tabId}`]);
  } catch (_e) {
    // Ignore error on shutdown
  }
});

// Helper to resolve the appropriate ApiClient
async function resolveApiClient() {
  const config = await getSupabaseConfig();
  const apiMode =
    (typeof process !== 'undefined' && process.env?.VITE_API_MODE) ||
    'mock';

  if (apiMode === 'live' && config.url) {
    return new HttpApiClient(config.url, config.anonKey, null, getAccessToken);
  }
  return new MockApiClient();
}

// 3. Central message dispatcher with Zod validation
chrome.runtime.onMessage.addListener(
  (rawMessage: unknown, sender: chrome.runtime.MessageSender, sendResponse: (res: ExtensionMessageResponse) => void) => {
    // Validate message payload against the Zod schema contract
    const parsed = ExtensionMessageSchema.safeParse(rawMessage);
    if (!parsed.success) {
      sendResponse({
        ok: false,
        error: `Invalid message contract: ${parsed.error.message}`,
      });
      return false;
    }

    const message = parsed.data;

    // Handle PING
    if (message.type === 'PING') {
      sendResponse({ ok: true, data: { status: 'pong', version: '1.0.0' } });
      return false;
    }

    // Handle OPEN_OPTIONS
    if (message.type === 'OPEN_OPTIONS') {
      chrome.runtime.openOptionsPage();
      sendResponse({ ok: true });
      return false;
    }

    // Handle OPEN_ONBOARDING
    if (message.type === 'OPEN_ONBOARDING') {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
      sendResponse({ ok: true });
      return false;
    }

    // Handle GET_CURRENT_TAB
    if (message.type === 'GET_CURRENT_TAB') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        sendResponse({
          ok: true,
          data: {
            id: activeTab?.id,
            url: activeTab?.url,
          },
        });
      });
      return true;
    }

    // Handle INJECT_CONTENT_SCRIPT (Programmatic injection per NFR-PRIV.2)
    if (message.type === 'INJECT_CONTENT_SCRIPT') {
      const tabId = message.payload.tabId;
      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: ['content/injector.js'],
        },
        (injectionResults) => {
          const err = chrome.runtime.lastError;
          if (err) {
            sendResponse({ ok: false, error: err.message });
          } else {
            sendResponse({ ok: true, data: injectionResults });
          }
        }
      );
      return true;
    }

    // Handle MIRROR_TAB_STATE (Mirrors content script session state to chrome.storage.session)
    if (message.type === 'MIRROR_TAB_STATE') {
      const tabId = sender.tab?.id ?? message.payload.tabId;
      if (tabId) {
        chrome.storage?.session?.set({
          [`tab_state_${tabId}`]: message.payload.state,
        });
      }
      sendResponse({ ok: true });
      return false;
    }

    // Handle HEALTH_CHECK
    if (message.type === 'HEALTH_CHECK') {
      resolveApiClient()
        .then((client) => client.checkHealth())
        .then((result) => sendResponse({ ok: true, data: result }))
        .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
      return true;
    }

    // Handle ANALYZE_FORM (Edge function call with Authorization header proxy)
    if (message.type === 'ANALYZE_FORM') {
      resolveApiClient()
        .then((client) => client.analyzeForm(message.payload as any))
        .then((result) => sendResponse({ ok: true, data: result }))
        .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
      return true;
    }

    // Handle EXPLAIN_FIELD
    if (message.type === 'EXPLAIN_FIELD') {
      resolveApiClient()
        .then((client) => client.explainField(message.payload as any))
        .then((result) => sendResponse({ ok: true, data: result }))
        .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
      return true;
    }

    // Handle CHAT
    if (message.type === 'CHAT') {
      resolveApiClient()
        .then((client) => client.chat(message.payload as any))
        .then((result) => sendResponse({ ok: true, data: result }))
        .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
      return true;
    }

    return false;
  }
);

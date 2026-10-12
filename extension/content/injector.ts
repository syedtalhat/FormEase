/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import inlinedStyles from '../../src/index.css?inline';
import { ExtensionApiClient } from '../../src/core/api/extensionClient';
import { extractForm, observeForm } from '../../src/core/extract';
import { SupportedLanguage } from '../../src/core/i18n';
import { ExtensionMessage } from '../../src/core/messaging';
import { INITIAL_SESSION_STATE, sessionReducer } from '../../src/core/session/reducer';
import { SessionEvent, SessionState } from '../../src/core/session/types';
import { mountOverlay, OverlayHandle } from '../../src/overlay-mount/mountOverlay';

// Content Script state
let overlayHandle: OverlayHandle | null = null;
let sessionState: SessionState = { ...INITIAL_SESSION_STATE };
let disconnectObserver: (() => void) | null = null;
let cleanupFocusListeners: (() => void) | null = null;
const fieldElementsMap = new Map<string, HTMLElement>();
const apiClient = new ExtensionApiClient();

/**
 * Mirrors active per-tab session state to background & chrome.storage.session
 */
function mirrorSessionState() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'MIRROR_TAB_STATE',
        payload: { state: sessionState },
      });
    }
  } catch (_e) {
    // Service worker may be momentarily idle
  }
}

function dispatchSessionEvent(event: SessionEvent) {
  sessionState = sessionReducer(sessionState, event);
  overlayHandle?.updateState(sessionState);
  mirrorSessionState();
}

/**
 * Sets up focusin / focusout listeners on host page to track Field Focus state
 */
function setupFocusListeners() {
  if (cleanupFocusListeners) {
    cleanupFocusListeners();
  }

  const handleFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    for (const [key, el] of fieldElementsMap.entries()) {
      if (el === target || el.contains(target)) {
        dispatchSessionEvent({ type: 'FIELD_FOCUS', fieldId: key });
        return;
      }
    }
  };

  const handleFocusOut = () => {
    dispatchSessionEvent({ type: 'FIELD_BLUR' });
  };

  document.addEventListener('focusin', handleFocusIn, true);
  document.addEventListener('focusout', handleFocusOut, true);

  cleanupFocusListeners = () => {
    document.removeEventListener('focusin', handleFocusIn, true);
    document.removeEventListener('focusout', handleFocusOut, true);
  };
}

/**
 * Activates FormAssist overlay on the host document
 */
async function activateOverlay() {
  if (overlayHandle) {
    return;
  }

  // 1. Mount Shadow DOM Overlay with inlined styles
  overlayHandle = mountOverlay(
    document,
    {
      onFocusField: (fieldKey) => dispatchSessionEvent({ type: 'FIELD_FOCUS', fieldId: fieldKey }),
      onBlurField: () => dispatchSessionEvent({ type: 'FIELD_BLUR' }),
      onOpenChat: (fieldKey) => dispatchSessionEvent({ type: 'OPEN_CHAT', fieldId: fieldKey }),
      onCloseChat: () => dispatchSessionEvent({ type: 'CLOSE_CHAT' }),
      onSendMessage: async (msg) => {
        try {
          const chatRes = await apiClient.chat({
            message: msg,
            language: sessionState.context.language,
            focused_field_key: sessionState.context.focusedFieldId,
            completed_field_keys: [],
          });
          overlayHandle?.updateChat(
            [
              { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: Date.now() },
              { id: crypto.randomUUID(), role: 'assistant', content: chatRes.reply, timestamp: Date.now() },
            ],
            false
          );
        } catch (_err) {
          // Chat error handled in UI
        }
      },
      onRetry: () => {
        dispatchSessionEvent({ type: 'RETRY' });
        runScanAndAnalysis();
      },
      onDismiss: () => {
        deactivateOverlay();
      },
      onLanguageChange: (lang: SupportedLanguage) => {
        dispatchSessionEvent({ type: 'SET_LANGUAGE', language: lang });
        runScanAndAnalysis();
      },
    },
    {
      inlinedStyles,
      initialLanguage: sessionState.context.language,
      simulatedPageUrl: window.location.href,
      isSignedIn: true,
    }
  );

  setupFocusListeners();
  await runScanAndAnalysis();

  // Wire MutationObserver for dynamic multi-step forms (FR-EXTRACT.3)
  if (!disconnectObserver) {
    disconnectObserver = observeForm(
      document,
      () => {
        runScanAndAnalysis(true);
      },
      400
    );
  }
}

/**
 * Scans host DOM and sends redacted metadata to background service worker
 */
async function runScanAndAnalysis(isIncremental = false) {
  if (!isIncremental) {
    dispatchSessionEvent({ type: 'ACTIVATE' });
  }

  // 1. Extract Form Structure (FR-EXTRACT.1–4)
  // PRIVACY GUARANTEE: Never accesses .value, .defaultValue, or text inputs
  const forms = extractForm(document, { includeFormless: true });
  if (!forms || forms.length === 0 || forms[0].fields.length === 0) {
    dispatchSessionEvent({ type: 'EXTRACTION_DONE' });
    dispatchSessionEvent({
      type: 'ANALYSIS_DONE',
      fields: [],
      riskFlags: [],
    });
    return;
  }

  const targetForm = forms[0];

  // Map anchors for tooltip / floating badge positioning
  fieldElementsMap.clear();
  const anchorMap = new Map<string, HTMLElement>();
  targetForm.fields.forEach((f) => {
    if (f.anchorElement) {
      anchorMap.set(f.field_key, f.anchorElement);
      fieldElementsMap.set(f.field_key, f.anchorElement);
    }
  });
  overlayHandle?.setAnchorElements(anchorMap);

  dispatchSessionEvent({ type: 'EXTRACTION_DONE' });

  // 2. Transmit redacted metadata to background service worker via Chrome runtime messaging
  try {
    const res = await apiClient.analyzeForm({
      page_url: window.location.href,
      form_action: targetForm.form_action,
      form_title: targetForm.form_title,
      language: sessionState.context.language,
      fields: targetForm.fields,
    });

    dispatchSessionEvent({
      type: 'ANALYSIS_DONE',
      fields: res.fields as any,
      riskFlags: res.risk_flags as any,
    });
  } catch (_err) {
    dispatchSessionEvent({ type: 'API_FAILED' });
  }
}

/**
 * Deactivates and cleanly removes FormAssist shadow host completely from DOM
 */
function deactivateOverlay() {
  if (disconnectObserver) {
    disconnectObserver();
    disconnectObserver = null;
  }

  if (cleanupFocusListeners) {
    cleanupFocusListeners();
    cleanupFocusListeners = null;
  }

  if (overlayHandle) {
    overlayHandle.unmount();
    overlayHandle = null;
  }

  const host = document.getElementById('formassist-host');
  if (host) {
    host.remove();
  }

  sessionState = { ...INITIAL_SESSION_STATE, current: 'idle' };
  mirrorSessionState();
}

// Cleanup completely on tab navigation / close
window.addEventListener('beforeunload', () => {
  deactivateOverlay();
});

// Listen for messages from popup or background
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((rawMessage: unknown, _sender, sendResponse) => {
    const message = rawMessage as ExtensionMessage;

    if (message.type === 'TOGGLE_OVERLAY') {
      if (overlayHandle) {
        deactivateOverlay();
      } else {
        activateOverlay();
      }
      sendResponse({ ok: true, active: !!overlayHandle });
      return true;
    }

    if (message.type === 'ACTIVATE_OVERLAY') {
      activateOverlay();
      sendResponse({ ok: true, active: true });
      return true;
    }

    if (message.type === 'DEACTIVATE_OVERLAY') {
      deactivateOverlay();
      sendResponse({ ok: true, active: false });
      return true;
    }

    if (message.type === 'SET_TAB_LANGUAGE') {
      dispatchSessionEvent({
        type: 'SET_LANGUAGE',
        language: message.payload.language,
      });
      runScanAndAnalysis();
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'GET_TAB_STATE') {
      sendResponse({ ok: true, data: sessionState });
      return true;
    }

    return false;
  });
}

// Window message listener for DOM-based testing / programmatic activation
window.addEventListener('message', (ev) => {
  if (ev.data?.type === 'ACTIVATE_FORMASSIST' || ev.data?.type === 'ACTIVATE_OVERLAY') {
    activateOverlay();
  } else if (ev.data?.type === 'DEACTIVATE_FORMASSIST' || ev.data?.type === 'DEACTIVATE_OVERLAY') {
    deactivateOverlay();
  }
});

// Expose safe activation hooks on window for test harness
(window as any).__formAssist = {
  activate: activateOverlay,
  deactivate: deactivateOverlay,
  getState: () => sessionState,
};

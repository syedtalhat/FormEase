/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { SupportedLanguage } from '../core/i18n';
import { SessionState } from '../core/session/types';
import { ChatMessageItem } from '../surfaces/overlay/ChatPanel';
import { OverlayRoot } from '../surfaces/overlay/OverlayRoot';

export interface MountOverlayOptions {
  simulatedPageUrl?: string;
  initialLanguage?: SupportedLanguage;
  isSignedIn?: boolean;
  inlinedStyles?: string;
}

export interface OverlayHandle {
  updateState: (state: SessionState) => void;
  updateChat: (messages: ChatMessageItem[], isLoading: boolean) => void;
  updateLanguage: (lang: SupportedLanguage) => void;
  setAnchorElements: (anchors: Map<string, HTMLElement>) => void;
  unmount: () => void;
}

export interface OverlayCallbacks {
  onFocusField: (fieldKey: string) => void;
  onBlurField: () => void;
  onOpenChat: (fieldKey?: string) => void;
  onCloseChat: () => void;
  onSendMessage: (msg: string) => void;
  onRetry: () => void;
  onDismiss: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

/**
 * Mounts the FormAssist isolated overlay into the host document via Shadow DOM.
 * Follows strict MV3 encapsulation rules from Section 4.
 */
export function mountOverlay(
  targetDoc: Document,
  callbacks: OverlayCallbacks,
  options: MountOverlayOptions = {}
): OverlayHandle {
  const hostId = 'formassist-host';

  // 1. Remove any previous instance completely
  const existing = targetDoc.getElementById(hostId);
  if (existing) {
    existing.remove();
  }

  // 2. Inject font-face rules into host document <head> (idempotent, Section 4)
  const fontStyleId = 'formassist-fonts';
  if (!targetDoc.getElementById(fontStyleId)) {
    const fontStyle = targetDoc.createElement('style');
    fontStyle.id = fontStyleId;
    fontStyle.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Mukta:wght@400;500;600&display=swap');
    `;
    targetDoc.head?.appendChild(fontStyle);
  }

  // 3. Create host element attached to documentElement or body with max z-index and isolated transform
  const hostElement = targetDoc.createElement('div');
  hostElement.id = hostId;
  hostElement.style.cssText =
    'position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 2147483647 !important; transform: none !important; filter: none !important; perspective: none !important; margin: 0 !important; padding: 0 !important; border: none !important;';

  const mountParent = targetDoc.documentElement || targetDoc.body;
  mountParent.appendChild(hostElement);

  // 4. Attach Shadow DOM
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // 5. Inject overlay styles inside shadow root
  const shadowStyle = targetDoc.createElement('style');
  const baseShadowCss = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Mukta:wght@400;500;600&display=swap');
    .font-body { font-family: 'Mukta', system-ui, sans-serif; }
    .font-display { font-family: 'Baloo 2', system-ui, sans-serif; }
  `;
  shadowStyle.textContent = options.inlinedStyles
    ? `${baseShadowCss}\n${options.inlinedStyles}`
    : baseShadowCss;
  shadowRoot.appendChild(shadowStyle);

  // 6. Create React container inside shadow root
  const reactContainer = targetDoc.createElement('div');
  reactContainer.id = 'formassist-shadow-container';
  shadowRoot.appendChild(reactContainer);

  const root: Root = createRoot(reactContainer);

  // Internal mutable state for the live React instance
  let currentState: SessionState = {
    current: 'ready',
    context: {
      language: options.initialLanguage || 'en',
      fields: [],
      riskFlags: [],
    },
  };
  let currentMessages: ChatMessageItem[] = [];
  let currentLoading = false;
  let currentAnchors = new Map<string, HTMLElement>();

  function render() {
    root.render(
      <OverlayRoot
        sessionState={currentState}
        chatMessages={currentMessages}
        isChatLoading={currentLoading}
        isSignedIn={options.isSignedIn ?? true}
        anchorElements={currentAnchors}
        onFocusField={callbacks.onFocusField}
        onBlurField={callbacks.onBlurField}
        onOpenChat={callbacks.onOpenChat}
        onCloseChat={callbacks.onCloseChat}
        onSendMessage={callbacks.onSendMessage}
        onRetry={callbacks.onRetry}
        onDismiss={callbacks.onDismiss}
        onLanguageChange={callbacks.onLanguageChange}
      />
    );
  }

  render();

  return {
    updateState: (newState: SessionState) => {
      currentState = newState;
      render();
    },
    updateChat: (messages: ChatMessageItem[], isLoading: boolean) => {
      currentMessages = messages;
      currentLoading = isLoading;
      render();
    },
    updateLanguage: (lang: SupportedLanguage) => {
      currentState = {
        ...currentState,
        context: {
          ...currentState.context,
          language: lang,
        },
      };
      render();
    },
    setAnchorElements: (anchors: Map<string, HTMLElement>) => {
      currentAnchors = anchors;
      render();
    },
    unmount: () => {
      root.unmount();
      hostElement.remove();
    },
  };
}

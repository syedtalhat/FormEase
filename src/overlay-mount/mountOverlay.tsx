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
  const existing = targetDoc.getElementById(hostId);
  if (existing) {
    existing.remove();
  }

  const fontUrl = (packageName: string, filename: string) => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(`fonts/${filename}`);
    }
    return `/node_modules/@fontsource/${packageName}/files/${filename}`;
  };
  const fontFaces = [
    ['Baloo 2', 600, 'baloo-2', 'baloo-2-latin-600-normal.woff2', 'U+0000-024F,U+1E00-1EFF,U+20A0-20CF'],
    ['Baloo 2', 600, 'baloo-2', 'baloo-2-devanagari-600-normal.woff2', 'U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20B9,U+25CC'],
    ['Baloo 2', 800, 'baloo-2', 'baloo-2-latin-800-normal.woff2', 'U+0000-024F,U+1E00-1EFF,U+20A0-20CF'],
    ['Baloo 2', 800, 'baloo-2', 'baloo-2-devanagari-800-normal.woff2', 'U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20B9,U+25CC'],
    ['Mukta', 400, 'mukta', 'mukta-latin-400-normal.woff2', 'U+0000-024F,U+1E00-1EFF,U+20A0-20CF'],
    ['Mukta', 400, 'mukta', 'mukta-devanagari-400-normal.woff2', 'U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20B9,U+25CC'],
    ['Mukta', 500, 'mukta', 'mukta-latin-500-normal.woff2', 'U+0000-024F,U+1E00-1EFF,U+20A0-20CF'],
    ['Mukta', 500, 'mukta', 'mukta-devanagari-500-normal.woff2', 'U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20B9,U+25CC'],
    ['Mukta', 600, 'mukta', 'mukta-latin-600-normal.woff2', 'U+0000-024F,U+1E00-1EFF,U+20A0-20CF'],
    ['Mukta', 600, 'mukta', 'mukta-devanagari-600-normal.woff2', 'U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20B9,U+25CC'],
  ]
    .map(([family, weight, packageName, filename, range]) =>
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${fontUrl(String(packageName), String(filename))}') format('woff2');unicode-range:${range};}`
    )
    .join('\n');

  const hostElement = targetDoc.createElement('div');
  hostElement.id = hostId;
  hostElement.style.cssText =
    'position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 2147483647 !important; transform: none !important; filter: none !important; perspective: none !important; margin: 0 !important; padding: 0 !important; border: none !important;';

  const mountParent = targetDoc.documentElement || targetDoc.body;
  mountParent.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  const shadowStyle = targetDoc.createElement('style');
  const baseShadowCss = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    ${fontFaces}
    .font-body { font-family: 'Mukta', system-ui, sans-serif; }
    .font-display { font-family: 'Baloo 2', system-ui, sans-serif; }
  `;
  shadowStyle.textContent = options.inlinedStyles
    ? `${baseShadowCss}\n${options.inlinedStyles}`
    : baseShadowCss;
  shadowRoot.appendChild(shadowStyle);

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

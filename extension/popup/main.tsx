/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupRoot } from '../../src/surfaces/popup/PopupRoot';
import { SupportedLanguage } from '../../src/core/i18n';
import { SessionState } from '../../src/core/session/types';
import { INITIAL_SESSION_STATE } from '../../src/core/session/reducer';
import {
  getAuthSession,
  getSavedLanguage,
  setSavedLanguage,
  getTabSessionState,
} from '../../src/core/storage';
import '../../src/index.css';

const PopupApp: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [profileEmail, setProfileEmail] = useState<string | undefined>();
  const [sessionState, setSessionState] = useState<SessionState>(INITIAL_SESSION_STATE);
  const [activeDomain, setActiveDomain] = useState('');
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Sync active tab domain & session state
  const loadTabState = useCallback(async (tabId: number) => {
    const state = await getTabSessionState(tabId);
    if (state) {
      setSessionState(state);
    }
  }, []);

  useEffect(() => {
    // 1. Load saved auth & language
    getAuthSession().then((session) => {
      setIsSignedIn(session.isSignedIn);
      setProfileEmail(session.user?.email);
    });
    getSavedLanguage().then((lang) => {
      setSessionState((prev) => ({
        ...prev,
        context: { ...prev.context, language: lang },
      }));
    });

    // 2. Query active tab
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          setActiveTabId(tab.id);
          if (tab.url) {
            try {
              setActiveDomain(new URL(tab.url).hostname);
            } catch {
              // keep fallback
            }
          }
          loadTabState(tab.id);

          // Ping content script to get live state if already injected
          chrome.tabs.sendMessage(tab.id, { type: 'GET_TAB_STATE' }, (res) => {
            if (res?.ok && res.data) {
              setSessionState(res.data);
            }
          });
        }
      });
    }

    // 3. Listen to chrome.storage.session changes for live tab updates
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const storageListener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
        if (area === 'session' && activeTabId) {
          const tabKey = `tab_state_${activeTabId}`;
          if (changes[tabKey]?.newValue) {
            setSessionState(changes[tabKey].newValue as SessionState);
          }
        }
      };
      chrome.storage.onChanged.addListener(storageListener);
      return () => {
        chrome.storage.onChanged.removeListener(storageListener);
      };
    }
  }, [activeTabId, loadTabState]);

  // Programmatic content script injection (NFR-PRIV.2) & overlay activation
  const handleActivate = async () => {
    if (!activeTabId || typeof chrome === 'undefined') return;

    setSessionState((prev) => ({ ...prev, current: 'scanning' }));

    // Inject content script programmatically on user action
    chrome.scripting.executeScript(
      {
        target: { tabId: activeTabId },
        files: ['content/injector.js'],
      },
      () => {
        // Send ACTIVATE_OVERLAY to injected content script
        chrome.tabs.sendMessage(activeTabId, { type: 'ACTIVATE_OVERLAY' }, (_res) => {
          chrome.runtime.lastError; // clear error if already running
        });
      }
    );
  };

  const handleDeactivate = () => {
    if (!activeTabId || typeof chrome === 'undefined') return;

    chrome.tabs.sendMessage(activeTabId, { type: 'DEACTIVATE_OVERLAY' }, (_res) => {
      chrome.runtime.lastError;
    });
    setSessionState((prev) => ({ ...prev, current: 'idle' }));
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSavedLanguage(lang);
    setSessionState((prev) => ({
      ...prev,
      context: { ...prev.context, language: lang },
    }));
    if (activeTabId && typeof chrome !== 'undefined') {
      chrome.tabs.sendMessage(activeTabId, {
        type: 'SET_TAB_LANGUAGE',
        payload: { language: lang },
      });
    }
  };

  const handleOpenSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  };

  const handleOpenOnboarding = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    } else {
      window.open('onboarding.html', '_blank');
    }
  };

  return (
    <div className="w-[360px]">
      <PopupRoot
        isSignedIn={isSignedIn}
        profileEmail={profileEmail}
        sessionState={sessionState}
        activeDomain={activeDomain}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onLanguageChange={handleLanguageChange}
        onOpenChat={() => {}}
        onOpenSettings={handleOpenSettings}
        onOpenOnboarding={handleOpenOnboarding}
        onRetry={() => {
          setSessionState((prev) => ({ ...prev, current: 'scanning' }));
          handleActivate();
        }}
        onDismiss={() => {
          handleDeactivate();
        }}
      />
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<PopupApp />);
}

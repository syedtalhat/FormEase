/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsPage } from '../../src/surfaces/options/SettingsPage';
import { SupportedLanguage } from '../../src/core/i18n';
import '../../src/index.css';

const OptionsApp: React.FC = () => {
  const [lang, setLang] = useState<SupportedLanguage>('en');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['formassist_lang'], (res) => {
        if (res.formassist_lang) {
          setLang(res.formassist_lang as SupportedLanguage);
        }
      });
    }
  }, []);

  const handleSaveLanguage = (newLang: SupportedLanguage) => {
    setLang(newLang);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ formassist_lang: newLang });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <SettingsPage
        savedLanguage={lang}
        onSaveLanguage={handleSaveLanguage}
        onSignOut={() => {}}
        onDeleteChatHistory={() => {}}
      />
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<OptionsApp />);
}

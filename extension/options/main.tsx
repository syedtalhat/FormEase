/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsPage } from '../../src/surfaces/options/SettingsPage';
import { SupportedLanguage } from '../../src/core/i18n';
import { getAuthSession, getSavedLanguage, setAuthSession, setSavedLanguage } from '../../src/core/storage';
import '../../src/index.css';

const OptionsApp: React.FC = () => {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    getAuthSession().then((session) => setUserEmail(session.user?.email));
    getSavedLanguage().then(setLang);
  }, []);

  const handleSaveLanguage = (newLang: SupportedLanguage) => {
    setLang(newLang);
    void setSavedLanguage(newLang);
  };

  const handleSignOut = () => {
    void setAuthSession({ isSignedIn: false });
    setUserEmail(undefined);
  };

  return (
    <SettingsPage
      userEmail={userEmail}
      savedLanguage={lang}
      onSaveLanguage={handleSaveLanguage}
      onSignOut={handleSignOut}
      onDeleteChatHistory={() => {}}
    />
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<OptionsApp />);
}

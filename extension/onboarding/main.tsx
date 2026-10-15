/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingRoot } from '../../src/surfaces/onboarding/OnboardingRoot';
import { SupportedLanguage } from '../../src/core/i18n';
import { setAuthSession, setSavedLanguage } from '../../src/core/storage';
import '../../src/index.css';

const OnboardingApp: React.FC = () => {
  const handleComplete = async (session: { signedIn: boolean; language: SupportedLanguage }) => {
    await setSavedLanguage(session.language);
    await setAuthSession({ isSignedIn: session.signedIn });
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({
        formassist_onboarding_completed: true,
      }, () => window.close());
      return;
    }
    localStorage.setItem('formassist_onboarding_completed', 'true');
    window.close();
  };

  return (
    <div className="min-h-screen w-full">
      <OnboardingRoot onComplete={handleComplete} />
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<OnboardingApp />);
}

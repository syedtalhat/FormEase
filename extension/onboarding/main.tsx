/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingRoot } from '../../src/surfaces/onboarding/OnboardingRoot';
import { SupportedLanguage } from '../../src/core/i18n';
import '../../src/index.css';

const OnboardingApp: React.FC = () => {
  const handleComplete = (session: { signedIn: boolean; language: SupportedLanguage }) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({
        formassist_auth: session.signedIn,
        formassist_lang: session.language,
      });
    }
    // Close tab or redirect to complete screen
    alert(`Setup complete! Language saved as ${session.language.toUpperCase()}. You can now use FormAssist on any supported form.`);
    window.close();
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <OnboardingRoot onComplete={handleComplete} />
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<OnboardingApp />);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { SessionState } from '../../core/session/types';
import { PopupError } from './PopupError';
import { PopupIdle } from './PopupIdle';
import { PopupReady } from './PopupReady';
import { PopupSignedOut } from './PopupSignedOut';
import { PopupWorking } from './PopupWorking';

interface PopupRootProps {
  isSignedIn: boolean;
  sessionState: SessionState;
  activeDomain?: string;
  loadingLanguage?: SupportedLanguage | null;
  onActivate: () => void;
  onDeactivate: () => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
  onRetry: () => void;
  onDismiss: () => void;
  onShowWarning?: () => void;
}

export const PopupRoot: React.FC<PopupRootProps> = ({
  isSignedIn,
  sessionState,
  activeDomain = 'scholarships.gov.in',
  loadingLanguage,
  onActivate,
  onDeactivate,
  onLanguageChange,
  onOpenChat,
  onOpenSettings,
  onOpenOnboarding,
  onRetry,
  onDismiss,
  onShowWarning,
}) => {
  const { current, context } = sessionState;

  // 1. Signed-out state (p1)
  if (!isSignedIn) {
    return (
      <PopupSignedOut
        activeDomain={activeDomain}
        onSignIn={onOpenOnboarding}
        onCreateAccount={onOpenOnboarding}
      />
    );
  }

  // 2. Error state
  if (current === 'error') {
    return (
      <PopupError
        errorKind={context.errorKind}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    );
  }

  // 3. Idle or deactivated
  if (current === 'idle' || current === 'deactivated') {
    return (
      <PopupIdle
        hostname={activeDomain}
        language={context.language}
        onLanguageChange={onLanguageChange}
        onActivate={onActivate}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  // 4. Scanning or Analyzing (p3)
  if (current === 'scanning' || current === 'analyzing') {
    return (
      <PopupWorking
        currentStep={current === 'scanning' ? 1 : 2}
        fieldsCount={context.fields.length}
        onDeactivate={onDeactivate}
      />
    );
  }

  // 5. Ready / FieldFocused / ChatOpen (p4)
  const officialCount = context.fields.filter(
    (f) => f.explanation?.source_label === 'official'
  ).length;

  const highestRisk = context.riskFlags.find((f) => f.severity === 'high');

  return (
    <PopupReady
      fieldsCount={context.fields.length}
      officialSourceCount={officialCount}
      riskCount={context.riskFlags.length}
      highestRiskDescription={
        highestRisk
          ? highestRisk.description_key === 'risk_cross_domain'
            ? 'Answers will be sent to a different website.'
            : highestRisk.description_key === 'risk_otp_non_bank'
            ? 'Requesting an OTP on an unverified site is unusual.'
            : 'Unsecured connection detected.'
          : undefined
      }
      language={context.language}
      loadingLanguage={loadingLanguage}
      onLanguageChange={onLanguageChange}
      onOpenChat={onOpenChat}
      onShowWarning={onShowWarning}
      onDeactivate={onDeactivate}
    />
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { RiskFlag } from '../../core/risk/classifier';
import { SessionState } from '../../core/session/types';
import { ChatMessageItem, ChatPanel } from './ChatPanel';
import { ErrorCard } from './ErrorCard';
import { FieldTag } from './FieldTag';
import { ProgressCard } from './ProgressCard';
import { RiskBanner } from './RiskBanner';
import { Tooltip, TooltipExplanationData } from './Tooltip';

export interface OverlayRootProps {
  sessionState: SessionState;
  formTitle?: string;
  chatMessages: ChatMessageItem[];
  isChatLoading?: boolean;
  isSignedIn?: boolean;
  anchorElements?: Map<string, HTMLElement>;
  onFocusField: (fieldKey: string) => void;
  onBlurField: () => void;
  onOpenChat: (fieldKey?: string) => void;
  onCloseChat: () => void;
  onSendMessage: (msg: string) => void;
  onRetry: () => void;
  onDismiss: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const OverlayRoot: React.FC<OverlayRootProps> = ({
  sessionState,
  formTitle,
  chatMessages,
  isChatLoading,
  isSignedIn = true,
  anchorElements = new Map(),
  onFocusField,
  onBlurField,
  onOpenChat,
  onCloseChat,
  onSendMessage,
  onRetry,
  onDismiss,
  onLanguageChange,
}) => {
  const [riskBannerDismissed, setRiskBannerDismissed] = useState(false);
  const { current, context } = sessionState;

  // Active focused field
  const focusedField = context.fields.find((f) => f.field_key === context.focusedFieldId);

  // Tooltip data
  const tooltipData: TooltipExplanationData | null = focusedField
    ? {
        field_key: focusedField.field_key,
        field_label: focusedField.label,
        risk_tag: focusedField.risk_tag,
        summary: focusedField.explanation?.summary || `Note for ${focusedField.label}.`,
        text: focusedField.explanation?.text || 'Verify with supporting documents.',
        source_label: focusedField.explanation?.source_label || 'ai',
        source_url: focusedField.explanation?.source_url,
        source_excerpt: focusedField.explanation?.source_excerpt,
        confidence: focusedField.explanation?.confidence,
      }
    : null;

  const showTooltip = current === 'fieldFocused' && tooltipData;
  const showChat = current === 'chatOpen';
  const showProgress = current === 'scanning' || current === 'analyzing';
  const showError = current === 'error';

  const anchorEl = focusedField ? anchorElements.get(focusedField.field_key) : null;

  return (
    <div
      id="formassist-overlay-root"
      className="fixed inset-0 pointer-events-none z-[2147483647] overflow-visible font-body"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
      }}
    >
      {/* Top Risk Banner (d6) */}
      {!riskBannerDismissed && (
        <div className="pointer-events-auto flex justify-center w-full px-4">
          <RiskBanner
            flags={context.riskFlags as RiskFlag[]}
            language={context.language}
            onDismiss={() => setRiskBannerDismissed(true)}
          />
        </div>
      )}

      {/* Floating Tooltip (d3 / d4) */}
      {showTooltip && (
        <div className="pointer-events-auto">
          <Tooltip
            data={tooltipData}
            anchorEl={anchorEl}
            language={context.language}
            onAskInChat={() => onOpenChat(focusedField?.field_key)}
            onClose={onBlurField}
          />
        </div>
      )}

      {/* Slide-in Contextual Chat Panel (d7) */}
      {showChat && (
        <div className="pointer-events-auto">
          <ChatPanel
            formTitle={formTitle}
            focusedFieldLabel={focusedField?.label}
            language={context.language}
            messages={chatMessages}
            isSignedIn={isSignedIn}
            isLoading={isChatLoading}
            onSendMessage={onSendMessage}
            onClose={onCloseChat}
            onLanguageChange={onLanguageChange}
          />
        </div>
      )}

      {/* Progress Card (d1) */}
      {showProgress && (
        <div className="pointer-events-auto">
          <ProgressCard
            currentStep={current === 'scanning' ? 1 : 2}
            fieldsCount={context.fields.length}
          />
        </div>
      )}

      {/* Error Card */}
      {showError && (
        <div className="pointer-events-auto">
          <ErrorCard
            errorKind={context.errorKind}
            onRetry={onRetry}
            onDismiss={onDismiss}
          />
        </div>
      )}
    </div>
  );
};

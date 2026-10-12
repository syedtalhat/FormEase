/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ExtractedField,
  FieldExplanation,
  Language,
  RiskFlag,
  SessionState,
} from '../../types';
import { ChatDrawer } from '../components/ChatDrawer';
import { FieldTooltip } from '../components/FieldTooltip';
import { RiskBanner } from '../components/RiskBanner';

export interface OverlayShadowRootProps {
  formTitle: string;
  fields: {
    field: ExtractedField;
    explanation: FieldExplanation;
  }[];
  riskFlags: RiskFlag[];
  activeFieldId: string | null;
  state: SessionState;
  language: Language;
  onFocusField: (fieldId: string) => void;
  onBlurField: () => void;
  onOpenChat: (fieldId?: string) => void;
  onCloseChat: () => void;
  onSendMessage: (msg: string) => Promise<void>;
  chatMessages: {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    focusedFieldId?: string;
    focusedFieldLabel?: string;
    createdAt: string;
  }[];
  isChatLoading: boolean;
}

export const OverlayShadowRoot: React.FC<OverlayShadowRootProps> = ({
  formTitle,
  fields,
  riskFlags,
  activeFieldId,
  state,
  language,
  onFocusField,
  onBlurField,
  onOpenChat,
  onCloseChat,
  onSendMessage,
  chatMessages,
  isChatLoading,
}) => {
  const [riskBannerDismissed, setRiskBannerDismissed] = useState(false);

  // Active focused field
  const activeItem = fields.find((item) => item.field.id === activeFieldId);
  const focusedField = activeItem?.field;

  const showTooltip =
    state === 'field_focused' && activeItem && activeItem.explanation;

  const showChat = state === 'chat_open';

  return (
    <div
      id="formassist-overlay-container"
      className="pointer-events-none fixed inset-0 z-[2147483640] overflow-visible font-sans"
      style={{
        fontFamily: "'Mukta', system-ui, sans-serif",
      }}
    >
      {/* Risk Alert Banner (FR-UI.4) */}
      {!riskBannerDismissed && riskFlags.some((f) => f.severity === 'high') && (
        <div className="pointer-events-auto fixed top-2 left-0 right-0 z-[9990] px-4 flex justify-center">
          <RiskBanner
            flags={riskFlags}
            onDismiss={() => setRiskBannerDismissed(true)}
          />
        </div>
      )}

      {/* Floating Active Field Tooltip (FR-UI.2) */}
      {showTooltip && (
        <div
          className="pointer-events-auto fixed z-[9995] animate-scaleIn"
          style={{
            // Compute anchor position near target or default comfortable viewport coordinates
            top: activeItem.field.boundingRect
              ? Math.max(70, Math.min(window.innerHeight - 340, activeItem.field.boundingRect.top + 36))
              : '25%',
            left: activeItem.field.boundingRect
              ? Math.max(20, Math.min(window.innerWidth - 400, activeItem.field.boundingRect.left))
              : '25%',
          }}
        >
          <FieldTooltip
            explanation={activeItem.explanation}
            fieldLabel={activeItem.field.label}
            language={language}
            onAskInChat={() => onOpenChat(activeItem.field.id)}
            onClose={onBlurField}
          />
        </div>
      )}

      {/* Context-Aware Chat Drawer (FR-CHAT.1–4) */}
      {showChat && (
        <div className="pointer-events-auto">
          <ChatDrawer
            formTitle={formTitle}
            focusedField={focusedField}
            allFields={fields.map((f) => f.field)}
            completedFields={[]}
            language={language}
            onClose={onCloseChat}
            onSendMessage={onSendMessage}
            messages={chatMessages}
            isLoading={isChatLoading}
          />
        </div>
      )}
    </div>
  );
};

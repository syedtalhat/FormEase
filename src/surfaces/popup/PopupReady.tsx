/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface PopupReadyProps {
  fieldsCount: number;
  officialSourceCount: number;
  riskCount: number;
  highestRiskDescription?: string;
  language: SupportedLanguage;
  loadingLanguage?: SupportedLanguage | null;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenChat: () => void;
  onShowWarning?: () => void;
  onDeactivate: () => void;
}

export const PopupReady: React.FC<PopupReadyProps> = ({
  fieldsCount,
  officialSourceCount,
  riskCount,
  highestRiskDescription,
  language,
  loadingLanguage,
  onLanguageChange,
  onOpenChat,
  onShowWarning,
  onDeactivate,
}) => {
  return (
    <div
      className="w-[360px] bg-surface-page text-text-primary rounded-2xl border border-border-subtle shadow-xl overflow-hidden font-body"
      style={{ width: '360px' }}
    >
      {/* Header */}
      <div className="bg-primary-container text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-display font-bold text-sm">
              FA
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">FormAssist</h1>
              <span className="text-[11px] text-primary-tint font-medium">On for this page</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDeactivate}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors"
          >
            Turn off
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Language switcher with live loading state (UC-4) */}
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>Language</span>
            {loadingLanguage && (
              <span className="text-primary-container animate-pulse">
                Updating to {loadingLanguage === 'hi' ? 'हिन्दी' : loadingLanguage === 'mr' ? 'मराठी' : 'English'}…
              </span>
            )}
          </div>
          <SegmentedControl
            options={[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'mr', label: 'मराठी' },
            ]}
            value={language}
            loadingValue={loadingLanguage}
            onChange={onLanguageChange}
          />
        </div>

        {/* Stats Card */}
        <div className="bg-surface-card rounded-xl p-3.5 border border-border-subtle shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Questions explained:</span>
            <span className="font-bold text-text-primary">{fieldsCount} questions</span>
          </div>

          {officialSourceCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-source-official font-semibold bg-source-official-bg p-2 rounded-lg">
              <Icon name="verified" className="w-4 h-4 shrink-0" />
              <span>Official guidance matched for {officialSourceCount} questions</span>
            </div>
          )}

          {riskCount > 0 && (
            <div className="p-2.5 bg-tag-unusual-bg border border-tag-unusual/30 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-tag-unusual">
                <span className="flex items-center gap-1.5">
                  <Icon name="warning" className="w-4 h-4" />
                  <span>{riskCount} needs a closer look</span>
                </span>
                {onShowWarning && (
                  <button
                    type="button"
                    onClick={onShowWarning}
                    className="underline text-[11px] hover:text-[#5C2B00]"
                  >
                    Show warning
                  </button>
                )}
              </div>
              {highestRiskDescription && (
                <p className="text-[11px] text-[#5C2B00] leading-snug">
                  {highestRiskDescription}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA (52px height) */}
        <Button variant="primary" size="lg" fullWidth onClick={onOpenChat}>
          <div className="flex items-center gap-2">
            <Icon name="chat" className="w-5 h-5" />
            <span>Ask a question</span>
          </div>
        </Button>
      </div>

      {/* Footer */}
      <div className="bg-surface-muted text-text-secondary px-4 py-2 border-t border-border-subtle text-[11px] flex items-center justify-between">
        <span>Click any field to see its note</span>
        <Icon name="info" className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface PopupIdleProps {
  hostname: string;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onActivate: () => void;
  onOpenSettings: () => void;
}

export const PopupIdle: React.FC<PopupIdleProps> = ({
  hostname,
  language,
  onLanguageChange,
  onActivate,
  onOpenSettings,
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
            <h1 className="font-display font-bold text-lg leading-tight">FormAssist</h1>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10"
            aria-label="Settings"
          >
            <Icon name="settings" className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-primary-tint/90">
          Ready to explain difficult questions on this form
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Host Info */}
        <div className="bg-surface-card rounded-xl p-3.5 border border-border-subtle shadow-xs">
          <div className="text-xs text-text-secondary">You&apos;re on</div>
          <div className="text-sm font-bold text-text-primary truncate">{hostname}</div>
        </div>

        {/* Language selector (this visit only) */}
        <div className="bg-surface-card rounded-xl p-3.5 border border-border-subtle shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-secondary">Language for this visit</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-primary-container hover:underline text-[11px] font-medium"
            >
              Change saved language
            </button>
          </div>

          <SegmentedControl
            options={[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'mr', label: 'मराठी' },
            ]}
            value={language}
            onChange={onLanguageChange}
          />
        </div>

        {/* Primary CTA (52px height) */}
        <Button variant="primary" size="lg" fullWidth onClick={onActivate}>
          Explain this page&apos;s form
        </Button>
      </div>

      {/* Footer Privacy Stamp */}
      <div className="bg-source-official-bg text-source-official px-4 py-2 border-t border-source-official/20 flex items-center gap-1.5 text-[11px] font-semibold">
        <Icon name="verified" className="w-3.5 h-3.5 shrink-0" />
        <span>Only the questions are read — never your answers.</span>
      </div>
    </div>
  );
};

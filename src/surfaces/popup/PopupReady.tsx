/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface PopupReadyProps {
  fieldsCount: number;
  officialSourceCount: number;
  riskCount: number;
  highestRiskDescription?: string;
  profileEmail?: string;
  language: SupportedLanguage;
  loadingLanguage?: SupportedLanguage | null;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenChat: () => void;
  onShowWarning?: () => void;
  onDeactivate: () => void;
  onOpenSettings: () => void;
}

export const PopupReady: React.FC<PopupReadyProps> = ({
  fieldsCount,
  officialSourceCount,
  riskCount,
  highestRiskDescription,
  profileEmail,
  language,
  loadingLanguage,
  onLanguageChange,
  onOpenChat,
  onShowWarning,
  onDeactivate,
  onOpenSettings,
}) => {
  return (
    <div
      className="w-[360px] bg-surface-page text-text-primary rounded-2xl border border-border-subtle shadow-floating overflow-hidden font-body"
      style={{ width: '360px' }}
    >
      <header className="flex min-h-16 items-center justify-between border-b border-border-subtle bg-surface-card px-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container font-display text-xl font-bold text-white">
            F<span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-marigold" />
          </span>
          <h1 className="font-display text-xl font-bold leading-tight text-primary">FormAssist</h1>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t('popup_account_settings', language)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-tint font-display text-lg font-bold text-primary hover:ring-2 hover:ring-primary-container focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
        >
          {profileEmail ? profileEmail.charAt(0).toUpperCase() : <Icon name="person" className="h-5 w-5" />}
        </button>
      </header>

      <main className="space-y-3 px-5 py-5">
        <section className="flex min-h-12 items-center justify-between rounded-xl bg-surface-card px-3.5">
          <span className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <Icon name="check_circle" className="h-5 w-5 text-source-official" />
            {t('popup_active', language)}
          </span>
          <button
            type="button"
            onClick={onDeactivate}
            className="min-h-11 rounded-lg px-2 text-sm font-semibold text-text-secondary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
          >
            {t('deactivate', language)}
          </button>
        </section>

        <section className="flex items-center gap-3 rounded-xl bg-surface-card p-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Icon name="check_circle" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-6 text-text-primary">
              {t('popup_ready_summary', language, { count: fieldsCount })}
            </p>
            <p className="text-sm leading-5 text-text-secondary">
              {officialSourceCount > 0
                ? t('popup_official_count', language, { count: officialSourceCount })
                : t('popup_official_none', language)}
            </p>
          </div>
        </section>

        {riskCount > 0 && (
          <section className="space-y-1.5 rounded-xl border border-tag-unusual/20 bg-tag-unusual-bg p-3 text-tag-unusual">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Icon name="warning" className="h-4 w-4 shrink-0" />
                {t('popup_risk_count', language, { count: riskCount })}
              </p>
              {onShowWarning && (
                <button
                  type="button"
                  onClick={onShowWarning}
                  className="min-h-11 shrink-0 rounded px-1 text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-tag-unusual"
                >
                  {t('popup_show_warning', language)}
                </button>
              )}
            </div>
            {highestRiskDescription && <p className="text-sm leading-5">{highestRiskDescription}</p>}
          </section>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={onOpenChat}>
          <span className="flex items-center gap-2">
            <Icon name="chat" className="h-5 w-5" />
            {t('popup_ask_question', language)}
          </span>
        </Button>

        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm font-semibold text-text-secondary">
            <span>{t('popup_language', language)}</span>
            {loadingLanguage && (
              <span className="text-xs text-primary" aria-live="polite">
                {t('popup_updating_language', language, {
                  language: loadingLanguage === 'hi' ? 'हिन्दी' : loadingLanguage === 'mr' ? 'मराठी' : 'English',
                })}
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
          <p className="rounded-lg bg-primary-tint px-3.5 py-3 text-sm leading-5 text-text-primary">
            {t('popup_language_explanation', language)}
          </p>
        </section>
      </main>

      <footer className="flex min-h-12 items-center justify-center gap-2 border-t border-border-subtle bg-surface-card px-4 text-sm font-medium text-text-secondary">
        <Icon name="lock" className="h-4 w-4 shrink-0" />
        <span>{t('popup_answers_stay_local', language)}</span>
      </footer>
    </div>
  );
};

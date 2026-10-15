/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface PopupIdleProps {
  hostname: string;
  profileEmail?: string;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onActivate: () => void;
  onOpenSettings: () => void;
}

export const PopupIdle: React.FC<PopupIdleProps> = ({
  hostname,
  profileEmail,
  language,
  onLanguageChange,
  onActivate,
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

      <main className="space-y-5 px-5 py-6">
        <section className="space-y-1">
          <h2 className="font-display text-[28px] font-bold leading-9 text-text-primary">
            {t('popup_welcome_back', language)}
          </h2>
          <p className="text-base leading-6 text-text-secondary">
            {t('popup_open_form_to_begin', language)}
          </p>
        </section>

        <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-card p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-source-page-bg text-source-page">
            <Icon name="language" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-text-secondary">{t('popup_you_are_on', language)}</p>
            <p className="truncate text-base font-bold text-text-primary">
              {hostname || t('popup_this_tab', language)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onActivate}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-5 font-body text-base font-bold text-white shadow-xs transition-colors hover:bg-primary-pressed focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container focus-visible:ring-offset-2"
        >
          <Icon name="chat" className="h-5 w-5" />
          {t('activate', language)}
        </button>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase text-text-secondary">{t('popup_language', language)}</h3>
          <SegmentedControl
            options={[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'mr', label: 'मराठी' },
            ]}
            value={language}
            onChange={onLanguageChange}
          />
          <p className="text-sm leading-5 text-text-secondary">{t('popup_saved_lang_hint', language)}</p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-11 text-left text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
          >
            {t('popup_change_saved_lang', language)}
          </button>
        </section>
      </main>

      <footer className="flex min-h-12 items-center justify-center gap-2 border-t border-border-subtle bg-surface-card px-4 text-sm font-medium text-text-secondary">
        <Icon name="lock" className="h-4 w-4 shrink-0 text-source-official" />
        <span>{t('popup_answers_stay_local', language)}</span>
      </footer>
    </div>
  );
};

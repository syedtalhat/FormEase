/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { t } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface PopupSignedOutProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
  onActivate: () => void;
}

export const PopupSignedOut: React.FC<PopupSignedOutProps> = ({
  onSignIn,
  onCreateAccount,
  onActivate,
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
          onClick={onSignIn}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
        >
          {t('popup_sign_in')}
        </button>
      </header>

      <main className="space-y-5 px-5 py-6">
        <section className="space-y-2">
          <h2 className="font-display text-[28px] font-bold leading-9 text-text-primary">
            {t('popup_understand_form')}
          </h2>
          <p className="text-base leading-6 text-text-secondary">{t('popup_intro')}</p>
        </section>

        <Button variant="primary" size="lg" fullWidth onClick={onActivate}>
          <span className="flex items-center gap-2">
            <Icon name="visibility" className="h-5 w-5" />
            {t('activate')}
          </span>
        </Button>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">{t('popup_language')}</h3>
          <SegmentedControl
            size="sm"
            value="en"
            onChange={() => undefined}
            options={[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी', locked: true },
              { id: 'mr', label: 'मराठी', locked: true },
            ]}
          />
          <p className="text-sm leading-5 text-text-secondary">{t('popup_locked_lang')}</p>
        </section>

        <section className="space-y-2 rounded-xl border border-border-subtle bg-surface-card p-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('popup_without_account')}</h3>
          <p className="text-sm leading-5 text-text-secondary">{t('popup_guest_note')}</p>
          <Button variant="secondary" size="md" fullWidth onClick={onCreateAccount}>
            {t('onboarding_create_account')}
          </Button>
        </section>
      </main>

      <footer className="flex min-h-12 items-center gap-2 border-t border-border-subtle bg-surface-card px-5 text-sm font-medium text-text-secondary">
        <Icon name="lock" className="h-4 w-4 shrink-0" />
        <span>{t('popup_answers_stay_local')}</span>
      </footer>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { StepItem, Stepper } from '../../ui/Stepper';

interface PopupWorkingProps {
  currentStep: 1 | 2 | 3;
  fieldsCount?: number;
  language: SupportedLanguage;
  onDeactivate: () => void;
}

export const PopupWorking: React.FC<PopupWorkingProps> = ({
  currentStep,
  fieldsCount = 0,
  language,
  onDeactivate,
}) => {
  const steps: StepItem[] = [
    {
      id: 1,
      label: t('popup_step1', language),
      status: currentStep > 1 ? 'completed' : 'in_progress',
      detail: currentStep > 1
        ? t('popup_step1_done', language, { count: fieldsCount })
        : t('popup_scanning_fields', language),
    },
    {
      id: 2,
      label: t('popup_step2', language),
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending',
      detail: currentStep === 2 ? t('popup_reviewing_safety', language) : undefined,
    },
    {
      id: 3,
      label: t('popup_step3', language),
      status: currentStep === 3 ? 'in_progress' : 'pending',
      detail: currentStep === 3 ? t('popup_matching_terms', language) : undefined,
    },
  ];
  const activeTitle = steps[currentStep - 1].label;

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
          <div>
            <h1 className="font-display text-xl font-bold leading-tight text-primary">FormAssist</h1>
            <p className="text-xs font-semibold uppercase text-text-secondary">{t('popup_helper_active', language)}</p>
          </div>
        </div>
        <span role="status" aria-label={t('popup_working', language)} className="h-3 w-3 rounded-full bg-primary-container animate-pulse" />
      </header>

      <main className="space-y-5 px-5 py-6">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="rounded-full bg-primary-tint px-3 py-1 font-semibold text-primary">
              {t('popup_step_indicator', language, { step: currentStep })}
            </span>
            <span>{t('popup_analysis_progress', language)}</span>
          </div>
          <h2 className="font-display text-2xl font-bold leading-8 text-text-primary">{activeTitle}</h2>
        </section>

        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-xs">
          <Stepper steps={steps} />
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-primary-tint p-3 text-sm leading-5 text-primary">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('popup_progress_privacy', language)}</span>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-marigold" />
            {t('popup_working', language)}
          </span>
          <Button variant="ghost" size="sm" onClick={onDeactivate}>{t('deactivate', language)}</Button>
        </div>
      </main>

      <footer className="flex min-h-12 items-center justify-center gap-2 border-t border-border-subtle bg-surface-muted px-4 text-xs font-medium text-text-secondary">
        <Icon name="lock" className="h-4 w-4 shrink-0" />
        <span>{t('popup_answers_stay_local', language)}</span>
      </footer>
    </div>
  );
};

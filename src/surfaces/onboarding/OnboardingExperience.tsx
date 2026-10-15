/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SourceChip } from '../../ui/SourceChip';

interface OnboardingExperienceProps {
  onComplete: (userSession: { signedIn: boolean; language: SupportedLanguage }) => void;
}

const languageOptions: { id: SupportedLanguage; label: string; sampleKey: 'onboarding_o2_english_sample' | 'onboarding_o2_hindi_sample' | 'onboarding_o2_marathi_sample' }[] = [
  { id: 'en', label: 'English', sampleKey: 'onboarding_o2_english_sample' },
  { id: 'hi', label: 'हिन्दी', sampleKey: 'onboarding_o2_hindi_sample' },
  { id: 'mr', label: 'मराठी', sampleKey: 'onboarding_o2_marathi_sample' },
];

export const OnboardingExperience: React.FC<OnboardingExperienceProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('hi');
  const [authMode, setAuthMode] = useState<'create' | 'signin'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const copy = (key: Parameters<typeof t>[0], vars?: Record<string, string | number>) => t(key, 'en', vars);
  const stepName = [
    'onboarding_step_welcome',
    'onboarding_step_language',
    'onboarding_step_privacy',
    'onboarding_step_account',
  ][step - 1] as Parameters<typeof t>[0];

  const handleAccountSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setPasswordError(copy('onboarding_password_error'));
      return;
    }
    setPasswordError('');
    onComplete({ signedIn: true, language: selectedLanguage });
  };

  const handleContinueGuest = () => onComplete({ signedIn: false, language: 'en' });

  return (
    <main className="mx-auto my-7 grid min-h-[min(980px,84vh)] w-[calc(100%-56px)] max-w-[1480px] grid-cols-1 overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-sm lg:grid-cols-[5fr_7fr]">
      <section className="flex min-w-0 flex-col justify-between bg-surface-container-lowest p-7 sm:p-10 xl:px-14">
        <div className="flex flex-col gap-7">
          {step === 1 && (
            <div className="mb-1 flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container text-white shadow-sm">
                <Icon name="article" className="h-6 w-6" />
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-marigold" />
              </div>
              <div>
                <div className="font-display text-title-2 font-semibold text-primary-container">FormAssist</div>
                <div className="font-caption text-text-secondary">{copy('onboarding_brand_subtitle')}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 font-caption text-text-secondary">
              <span>{copy('onboarding_step_of', { step })}</span>
              {step !== 1 && <span className="text-primary">{copy(stepName)}</span>}
            </div>
            <div className="grid grid-cols-4 gap-1.5" aria-label={copy('onboarding_step_of', { step })}>
              {[1, 2, 3, 4].map((item) => <span key={item} className={`h-1.5 rounded-full ${item <= step ? 'bg-primary-container' : 'bg-surface-muted'}`} />)}
            </div>
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h1 className="font-display text-display-mobile text-text-primary sm:text-display">{copy('onboarding_o1_title')}</h1>
              <p className="max-w-[46ch] font-body text-body-lg text-text-secondary">{copy('onboarding_o1_desc')}</p>
              <div className="inline-flex min-h-10 self-start items-center gap-2 rounded-full bg-surface-muted px-3 text-caption text-text-secondary">
                <Icon name="language" className="h-4 w-4 text-primary-container" />
                <span>English · हिंदी · मराठी</span>
              </div>
              <div className="space-y-3">
                <Button className="h-[52px] w-full" onClick={() => setStep(2)}>
                  <span className="flex items-center gap-2">{copy('onboarding_get_started')}<Icon name="arrow_forward" className="h-5 w-5" /></span>
                </Button>
                <button type="button" onClick={() => { setAuthMode('signin'); setStep(4); }} className="min-h-11 w-full rounded-lg px-3 font-body text-body-strong text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container">
                  {copy('onboarding_existing_account')}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-title-1 text-text-primary">{copy('onboarding_o2_title')}</h1>
                <p lang="hi" className="mt-2 font-body text-body-lg text-text-secondary">{copy('onboarding_o2_hi_question')}</p>
                <p lang="mr" className="font-body text-body-lg text-text-secondary">{copy('onboarding_o2_mr_question')}</p>
              </div>
              <div role="radiogroup" aria-label={copy('onboarding_o2_title')} className="space-y-3">
                {languageOptions.map((option) => (
                  <button key={option.id} type="button" role="radio" aria-checked={selectedLanguage === option.id} onClick={() => setSelectedLanguage(option.id)} className={`flex min-h-[88px] w-full items-center justify-between gap-4 rounded-xl px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container ${selectedLanguage === option.id ? 'bg-primary-tint' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                    <span className="min-w-0">
                      <span lang={option.id} className="block font-body text-body-strong text-text-primary">{option.label}</span>
                      <span lang={option.id} className="mt-1 block truncate font-body text-caption text-text-secondary">{copy(option.sampleKey)}</span>
                    </span>
                    <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selectedLanguage === option.id ? 'bg-primary-container text-white' : 'text-text-disabled'}`}>
                      <Icon name={selectedLanguage === option.id ? 'check_circle' : 'radio_button_unchecked'} className="h-5 w-5" />
                    </span>
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-2 font-caption text-text-secondary"><Icon name="info" className="h-4 w-4" />{copy('onboarding_language_change_anytime')}</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary"><Icon name="lock" className="h-6 w-6" /></span>
                  <span className="rounded-full bg-source-official-bg px-3 py-1 font-caption font-semibold text-source-official">{copy('onboarding_o3_read_heading')}</span>
                </div>
                <h1 className="font-display text-title-1 text-primary sm:text-[34px] sm:leading-[40px]">{copy('onboarding_o3_title')}</h1>
                <p className="font-body text-body-lg text-text-secondary">{copy('onboarding_o3_desc')}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h2 className="mb-3 flex items-center gap-2 font-display text-title-2 text-text-primary"><Icon name="check_circle" className="h-5 w-5 text-source-official" />{copy('onboarding_o3_read_heading')}</h2>
                  <ul className="space-y-2 font-body text-body-default text-text-primary">
                    {[1, 2, 3, 4, 5].map((index) => <li key={index} className="flex gap-2"><Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-source-official" /><span>{copy(`onboarding_o3_read_list_${index}` as Parameters<typeof t>[0])}</span></li>)}
                  </ul>
                </div>
                <div>
                  <h2 className="mb-3 flex items-center gap-2 font-display text-title-2 text-text-primary"><Icon name="close" className="h-5 w-5 text-text-secondary" />{copy('onboarding_o3_never_heading')}</h2>
                  <ul className="space-y-2 font-body text-body-default text-text-secondary">
                    {[1, 2, 3, 4].map((index) => <li key={index} className="flex gap-2"><span className="mt-0.5 w-4 shrink-0 text-center">−</span><span>{copy(`onboarding_o3_never_list_${index}` as Parameters<typeof t>[0])}</span></li>)}
                  </ul>
                </div>
              </div>
              <p className="flex items-center gap-2 pt-2 font-caption text-text-secondary"><Icon name="info" className="h-4 w-4 text-primary" />{copy('onboarding_o3_footer')}</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-title-1 text-text-primary">{copy('onboarding_o4_title')}</h1>
                <p className="font-body text-body-lg text-text-secondary">{copy('onboarding_o4_subtitle')}</p>
              </div>
              <div role="tablist" aria-label={copy('onboarding_o4_title')} className="flex gap-1 rounded-xl bg-surface-muted p-1">
                {(['create', 'signin'] as const).map((mode) => (
                  <button key={mode} type="button" role="tab" aria-selected={authMode === mode} onClick={() => setAuthMode(mode)} className={`min-h-11 flex-1 rounded-lg px-3 font-body text-body-strong focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container ${authMode === mode ? 'bg-primary-container text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                    {mode === 'create' ? copy('onboarding_create_account') : copy('onboarding_sign_in')}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2.5 font-body text-body-default">
                <span className="flex items-center gap-2"><Icon name="language" className="h-5 w-5 text-primary-container" />{copy('onboarding_your_language')} <strong lang={selectedLanguage}>{languageOptions.find((option) => option.id === selectedLanguage)?.label}</strong></span>
                <button type="button" onClick={() => setStep(2)} className="min-h-11 rounded-lg px-2 font-body text-caption font-semibold text-tag-unusual underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container">{copy('onboarding_change')}</button>
              </div>
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <label className="block space-y-1.5 font-body text-body-strong">
                  <span>{copy('onboarding_email')}</span>
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy('onboarding_email_placeholder')} className="h-[52px] w-full rounded-xl border border-border-subtle bg-white px-4 font-body text-body-default font-normal text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container" />
                </label>
                <label className="block space-y-1.5 font-body text-body-strong">
                  <span>{copy('onboarding_password')}</span>
                  <span className="relative block">
                    <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="h-[52px] w-full rounded-xl border border-border-subtle bg-white px-4 pr-20 font-body text-body-default font-normal text-text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 rounded-lg px-3 font-body text-caption font-semibold text-text-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container">{copy(showPassword ? 'onboarding_hide' : 'onboarding_show')}</button>
                  </span>
                  {passwordError ? <span role="alert" className="block font-caption text-danger">{passwordError}</span> : <span className="flex items-center gap-1 font-caption font-normal text-text-secondary"><Icon name="info" className="h-4 w-4" />{copy('onboarding_password_help')}</span>}
                </label>
                <Button type="submit" className="h-[52px] w-full">
                  <span className="flex items-center gap-2">{copy(authMode === 'create' ? 'onboarding_create_account' : 'onboarding_sign_in')}<Icon name="arrow_forward" className="h-5 w-5" /></span>
                </Button>
              </form>
              <div className="flex items-center gap-3 font-caption text-text-secondary"><span className="h-px flex-1 bg-border-subtle" />{copy('onboarding_or')}<span className="h-px flex-1 bg-border-subtle" /></div>
              <div className="space-y-2 text-center">
                <button type="button" onClick={handleContinueGuest} className="min-h-[52px] w-full rounded-xl bg-surface-container-low px-4 font-body text-body-strong text-text-primary hover:bg-surface-container focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container">{copy('onboarding_continue_guest')}</button>
                <p className="font-caption text-text-secondary">{copy('onboarding_guest_note')}</p>
              </div>
            </div>
          )}
        </div>

        {step !== 1 && step !== 4 && (
          <nav className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" size="md" onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}><span className="flex items-center gap-2"><Icon name="arrow_back" className="h-5 w-5" />{copy('onboarding_back')}</span></Button>
            <Button size="md" onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}><span className="flex items-center gap-2">{copy('onboarding_continue')}<Icon name="arrow_forward" className="h-5 w-5" /></span></Button>
          </nav>
        )}

        <p className="mt-8 flex items-center gap-2 font-caption text-text-secondary"><Icon name="shield" className="h-5 w-5 text-source-official" />{copy('onboarding_privacy_note')}</p>
      </section>

      <aside className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-primary-tint p-6 sm:p-10 lg:p-14">
        {step === 3 ? (
          <div className="w-full max-w-[540px] rounded-xl bg-white p-6 shadow-floating sm:p-8">
            <div className="mb-8 flex items-center justify-between border-b border-border-subtle pb-5">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-primary"><Icon name="article" className="h-5 w-5" /></span><span className="space-y-2"><span className="block h-3 w-32 rounded-full bg-surface-container-highest" /><span className="block h-2 w-20 rounded-full bg-surface-container" /></span></div>
              <Icon name="verified" className="h-7 w-7 text-source-official" />
            </div>
            <div className="space-y-4">
              {[1, 2].map((item) => <div key={item} className="space-y-2"><div className="rounded bg-accent-wash px-2 py-1 font-caption text-text-primary">{copy('onboarding_o3_preview_question')}</div><div className="relative flex h-14 items-center overflow-hidden rounded-lg bg-surface-container-low px-4"><span className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 7px, #6B7B85 7px 8px)' }} /><span className="relative font-body text-body-default tracking-widest text-text-secondary">••••••••••••</span><span className="relative ml-auto flex items-center gap-1 rounded-full bg-white px-2 py-1 font-caption text-text-secondary"><Icon name="lock" className="h-4 w-4 text-primary" />{copy('onboarding_o3_preview_private')}</span></div></div>)}
              <div className="flex items-center justify-between rounded-xl bg-primary-tint p-4 font-caption"><span>{copy('onboarding_o3_preview_read')}</span><span>{copy('onboarding_o3_preview_untouched')}</span></div>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 font-caption text-text-secondary"><Icon name="shield" className="h-5 w-5 text-primary" />{copy('onboarding_privacy_note')}</p>
          </div>
        ) : (
          <div className="w-full max-w-[580px] space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-surface-dim" /><span className="h-3 w-3 rounded-full bg-surface-dim" /><span className="h-3 w-3 rounded-full bg-surface-dim" /><span className="ml-2 font-caption text-text-secondary">{copy('onboarding_preview_page')}</span></div>
              <div className="space-y-3 rounded-xl border border-border-subtle p-5">
                <div className="flex items-center justify-between gap-3"><span className="font-body text-body-strong">{copy('onboarding_preview_field')}</span><span className="rounded-full bg-primary-tint px-3 py-1 font-caption text-tag-required">{copy('onboarding_preview_required')}</span></div>
                <div className="flex h-12 items-center rounded-xl bg-surface-container-low px-4 font-body text-body-default text-text-disabled">{copy('onboarding_preview_input')}</div>
              </div>
            </div>
            <div className="ml-auto w-full max-w-[460px] rounded-xl bg-white p-5 shadow-floating">
              <div className="mb-3 flex items-center gap-2 font-body text-body-strong text-primary"><Icon name="article" className="h-5 w-5" />{copy('onboarding_preview_note_title')}</div>
              <p lang={step === 2 ? selectedLanguage : 'en'} className="mb-4 font-body text-body-lg text-text-primary">{step === 2 ? copy(languageOptions.find((option) => option.id === selectedLanguage)!.sampleKey) : copy('onboarding_preview_note')}</p>
              <SourceChip type="page" language={step === 2 ? selectedLanguage : 'en'} />
            </div>
            <p className="flex items-center justify-center gap-2 font-caption text-text-secondary"><Icon name="visibility" className="h-5 w-5 text-primary" />{copy(step === 2 ? 'onboarding_live_preview' : 'onboarding_preview_caption')}</p>
          </div>
        )}
      </aside>
    </main>
  );
};
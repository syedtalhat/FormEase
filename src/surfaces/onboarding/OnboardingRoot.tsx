/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { IllustrativeSample } from './IllustrativeSample';

interface OnboardingRootProps {
  onComplete: (userSession: { signedIn: boolean; language: SupportedLanguage }) => void;
}

export const LegacyOnboardingRoot: React.FC<OnboardingRootProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  // Account form state for Step 4
  const [authMode, setAuthMode] = useState<'create' | 'signin'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    setPasswordError('');
    onComplete({ signedIn: true, language: selectedLanguage });
  };

  const handleContinueGuest = () => {
    // English only, chat not saved per FR-ACC.3
    onComplete({ signedIn: false, language: 'en' });
  };

  return (
    <div className="max-w-5xl mx-auto my-8 bg-surface-card rounded-3xl border border-border-subtle shadow-md overflow-hidden font-body text-text-primary">
      {/* Top Progress Banner */}
      <div className="bg-primary text-white p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-display font-bold text-lg">
            FA
          </div>
          <div>
            <span className="font-display font-bold text-xl block leading-tight">FormAssist</span>
            <span className="text-xs text-primary-tint">
              Step {step} of 4: {
                step === 1 ? 'Welcome' :
                step === 2 ? 'Choose Language' :
                step === 3 ? 'Privacy & Data' : 'Account'
              }
            </span>
          </div>
        </div>

        {/* Stepper dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? 'w-6 bg-white'
                  : s < step
                  ? 'w-2 bg-white/80'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-12 min-h-[500px]">
        {/* Left Column: Flow Content */}
        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6">
          {/* STEP 1: Welcome (O1) */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="type-title-1 text-primary-container">
                A patient companion for confusing paperwork.
              </h2>
              <p className="type-body-default text-text-secondary leading-relaxed">
                FormAssist sits beside forms to explain hard terms and highlight risks. It works like a calm, patient older sibling guiding you through confusing questions.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-surface-page border border-border-subtle flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary-container flex items-center justify-center shrink-0">
                    <Icon name="article" className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">Source-Grounded Notes</h3>
                    <p className="text-xs text-text-secondary leading-normal">
                      Every note is checked against official guidelines or clearly labeled when based on general AI knowledge.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-page border border-border-subtle flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-tag-unusual-bg text-tag-unusual flex items-center justify-center shrink-0">
                    <Icon name="warning" className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">Risk Spotting</h3>
                    <p className="text-xs text-text-secondary leading-normal">
                      Alerts you if an unverified website asks for OTPs, CVVs, or secret questions outside official banking.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-page border border-border-subtle flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-source-official-bg text-source-official flex items-center justify-center shrink-0">
                    <Icon name="chat" className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">Context-Aware Chat</h3>
                    <p className="text-xs text-text-secondary leading-normal">
                      Ask questions anytime. FormAssist automatically knows which question you are currently filling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Language Selection (O2) */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="type-title-1 text-primary-container">
                Choose your language
              </h2>
              <p className="type-body-default text-text-secondary leading-relaxed">
                FormAssist provides complete explanations and text-to-speech audio in your preferred language.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { id: 'en' as const, label: 'English', native: 'English', desc: 'Clear, plain administrative guidance' },
                  { id: 'hi' as const, label: 'Hindi', native: 'हिन्दी', desc: 'सहज एवं सरल प्रशासनिक शब्दावली' },
                  { id: 'mr' as const, label: 'Marathi', native: 'मराठी', desc: 'सोपी आणि स्पष्ट मराठी भाषेतील मदत' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLanguage(item.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedLanguage === item.id
                        ? 'border-primary-container bg-primary-tint ring-2 ring-primary-container/20'
                        : 'border-border-subtle bg-surface-card hover:bg-surface-page'
                    }`}
                  >
                    <div>
                      <div className="font-display font-bold text-base text-text-primary">
                        {item.native} <span className="text-xs font-normal text-text-secondary">({item.label})</span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">{item.desc}</div>
                    </div>
                    {selectedLanguage === item.id && (
                      <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center">
                        <Icon name="check" className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Privacy & Local Redaction (O3) */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="type-title-1 text-primary-container">
                We never read what you type into forms
              </h2>
              <p className="type-body-default text-text-secondary leading-relaxed">
                FormAssist only works on a page after you turn it on. We are built on strict local privacy boundaries.
              </p>

              <div className="space-y-4 pt-1">
                {/* What we read & send */}
                <div className="p-4 rounded-xl bg-source-official-bg border border-source-official/20 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-source-official flex items-center gap-1.5">
                    <Icon name="check_circle" className="w-4 h-4" />
                    <span>We read &amp; send</span>
                  </div>
                  <ul className="space-y-1 text-xs text-text-primary list-disc list-inside">
                    <li>Question text</li>
                    <li>Type of question (number, date, choice)</li>
                    <li>The website address</li>
                    <li>Messages you write in the FormAssist chat</li>
                    <li>Which questions you have already filled in (yes or no only — never what you wrote)</li>
                  </ul>
                </div>

                {/* What we never read */}
                <div className="p-4 rounded-xl bg-danger-bg border border-danger/20 space-y-2">
                  <div className="font-bold text-xs uppercase tracking-wider text-danger flex items-center gap-1.5">
                    <Icon name="close" className="w-4 h-4" />
                    <span>We never read or send</span>
                  </div>
                  <ul className="space-y-1 text-xs text-text-primary list-disc list-inside">
                    <li>Anything you type into the form</li>
                    <li>Passwords, OTPs, card numbers, PINs</li>
                    <li>Your name, number or documents</li>
                    <li>Anything from other tabs</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Account (O4) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h2 className="type-title-2 text-primary-container">
                  {authMode === 'create' ? 'Create your account' : 'Sign in to FormAssist'}
                </h2>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'create' ? 'signin' : 'create')}
                  className="text-xs text-primary-container font-semibold hover:underline"
                >
                  {authMode === 'create' ? 'Already have an account? Sign in' : 'New? Create account'}
                </button>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.org"
                    required
                    className="w-full h-11 px-3 text-sm border border-border-strong rounded-xl outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-primary">
                      Password (min 8 characters)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-text-secondary flex items-center gap-1"
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="w-3.5 h-3.5" />
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full h-11 px-3 text-sm border border-border-strong rounded-xl outline-none focus:ring-2 focus:ring-primary-container"
                  />
                  {passwordError && (
                    <p className="text-xs text-danger mt-1">{passwordError}</p>
                  )}
                </div>

                <Button variant="primary" size="lg" fullWidth type="submit">
                  {authMode === 'create' ? 'Create account & Get started' : 'Sign in & Get started'}
                </Button>
              </form>

              <div className="pt-3 border-t border-border-subtle text-center">
                <button
                  type="button"
                  onClick={handleContinueGuest}
                  className="text-xs text-text-secondary hover:text-text-primary underline font-medium"
                >
                  Continue without an account (English only, chat not saved)
                </button>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="ghost"
                size="md"
                onClick={() => setStep((step - 1) as any)}
              >
                <div className="flex items-center gap-1.5">
                  <Icon name="arrow_back" className="w-4 h-4" />
                  <span>Back</span>
                </div>
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep((step + 1) as any)}
              >
                <div className="flex items-center gap-1.5">
                  <span>Continue</span>
                  <Icon name="arrow_forward" className="w-4 h-4" />
                </div>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Right Column: Static Illustrative Sample */}
        <div className="md:col-span-5 bg-surface-muted p-6 border-l border-border-subtle flex items-center justify-center">
          <div className="w-full max-w-sm">
            <IllustrativeSample language={selectedLanguage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export { OnboardingExperience as OnboardingRoot } from './OnboardingExperience';

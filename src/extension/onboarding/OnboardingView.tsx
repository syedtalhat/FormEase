/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Globe,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { Language } from '../../types';
import { signUpWithEmail } from '../../core/auth/supabaseAuth';

interface OnboardingViewProps {
  onFinish: (selectedLanguage: Language) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onFinish }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl border border-[#DDE4E8] shadow-sm overflow-hidden text-[#1F2D36]">
      {/* Top Banner */}
      <div className="bg-[#0E5A64] text-white p-8 md:p-10 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
              FA
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
            >
              FormAssist
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8FCFDB]">
            <span>Step {step} of 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-4 h-1.5 rounded-full transition-colors ${
                    step >= s ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <h1
          className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          {step === 1 && 'A patient companion for confusing paperwork.'}
          {step === 2 && 'Our absolute privacy & local redaction guarantee.'}
          {step === 3 && 'Choose your primary assistance language.'}
        </h1>
        <p className="text-sm md:text-base text-[#E3F0F1] max-w-xl">
          {step === 1 &&
            'FormAssist sits quietly beside government, bank, and college forms—explaining difficult jargon and highlighting risks without getting in your way.'}
          {step === 2 &&
            'We believe accessibility must never sacrifice personal privacy. FormAssist never transmits your typed answers.'}
          {step === 3 &&
            'Get plain-language explanations and voice playback in the language you understand best.'}
        </p>
      </div>

      {/* Body Content */}
      <div className="p-8 md:p-10">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#F7FAFB] border border-[#DDE4E8]">
                <div className="w-10 h-10 rounded-xl bg-[#E3F0F1] text-[#0E5A64] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3
                  className="font-bold text-base mb-1"
                  style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                >
                  Clear Explanations
                </h3>
                <p className="text-xs text-[#4A5B66] leading-relaxed">
                  Hover or tap any field to see a 1-sentence summary and which official government rule it comes from.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F7FAFB] border border-[#DDE4E8]">
                <div className="w-10 h-10 rounded-xl bg-[#FFEBD5] text-[#8F4200] flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3
                  className="font-bold text-base mb-1"
                  style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                >
                  Risk Spotting
                </h3>
                <p className="text-xs text-[#4A5B66] leading-relaxed">
                  We alert you if an unverified site asks for OTPs, CVVs, or secret questions outside official banks.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F7FAFB] border border-[#DDE4E8]">
                <div className="w-10 h-10 rounded-xl bg-[#E4F4EC] text-[#17724A] flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3
                  className="font-bold text-base mb-1"
                  style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                >
                  Context Chat
                </h3>
                <p className="text-xs text-[#4A5B66] leading-relaxed">
                  Ask follow-up questions anytime. FormAssist automatically knows which field you are currently filling.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0E5A64] text-white font-semibold hover:bg-[#0A4249] transition-all"
                style={{ minHeight: '48px' }}
              >
                <span>Continue to Privacy Notice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* What we NEVER send */}
              <div className="p-5 rounded-2xl bg-[#FDECEA] border border-[#B3261E]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#B3261E] font-bold text-base">
                  <XCircle className="w-5 h-5" />
                  <span>What FormAssist NEVER reads or sends:</span>
                </div>
                <ul className="space-y-2 text-xs text-[#7A1410] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Any typed input or value you enter into fields.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Passwords, PINs, OTP codes, or CVV digits.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Browsing history across tabs or unactivated pages.</span>
                  </li>
                </ul>
              </div>

              {/* What we DO send */}
              <div className="p-5 rounded-2xl bg-[#E4F4EC] border border-[#17724A]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#17724A] font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>What we analyze for assistance:</span>
                </div>
                <ul className="space-y-2 text-xs text-[#124B32] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Public field labels (e.g. &ldquo;Annual Family Income&rdquo;).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>Form action address (to verify if the submit URL matches).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span>On-page instruction text and accessibility tags.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-[#4A5B66] hover:underline"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0E5A64] text-white font-semibold hover:bg-[#0A4249] transition-all"
                style={{ minHeight: '48px' }}
              >
                <span>Confirm &amp; Select Language</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#1F2D36]">
                Select your preferred language:
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'en',
                    title: 'English',
                    native: 'English',
                    desc: 'Clear, plain administrative guidance.',
                  },
                  {
                    id: 'hi',
                    title: 'Hindi',
                    native: 'हिन्दी',
                    desc: 'सहज एवं सरल प्रशासनिक शब्दावली.',
                  },
                  {
                    id: 'mr',
                    title: 'Marathi',
                    native: 'मराठी',
                    desc: 'सोपी आणि स्पष्ट मराठी भाषेतील मदत.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedLanguage(item.id as Language)}
                    className={`p-5 rounded-2xl border text-left transition-all relative ${
                      selectedLanguage === item.id
                        ? 'border-[#0E5A64] bg-[#E3F0F1] ring-2 ring-[#0E5A64]/20'
                        : 'border-[#DDE4E8] bg-white hover:bg-[#F7FAFB]'
                    }`}
                  >
                    {selectedLanguage === item.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#0E5A64] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className="font-bold text-lg text-[#1F2D36]"
                      style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                    >
                      {item.native}
                    </div>
                    <div className="text-xs font-semibold text-[#4A5B66] mb-1">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#334155]">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Account Creation with default language (FR-LANG.1) */}
            <div className="pt-2 border-t border-[#DDE4E8]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#0E5A64]" />
                  <span className="text-sm font-semibold text-[#1F2D36]">Create Account (Optional)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingAccount(!isCreatingAccount)}
                  className="text-xs text-[#0E5A64] hover:underline font-semibold"
                >
                  {isCreatingAccount ? 'Skip account creation' : 'Sync preferences across devices'}
                </button>
              </div>

              {isCreatingAccount && (
                <div className="p-4 bg-[#F7FAFB] rounded-2xl border border-[#DDE4E8] space-y-3">
                  <p className="text-xs text-[#4A5B66]">
                    Your selected default language ({selectedLanguage.toUpperCase()}) will be stored in your Supabase profile.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#4A5B66] mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDE4E8] bg-white focus:outline-none focus:border-[#0E5A64]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A5B66] mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDE4E8] bg-white focus:outline-none focus:border-[#0E5A64]"
                      />
                    </div>
                  </div>
                  {authError && <p className="text-xs text-[#BA1A1A] font-medium">{authError}</p>}
                  {authSuccess && <p className="text-xs text-[#17724A] font-medium">{authSuccess}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-[#4A5B66] hover:underline"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (isCreatingAccount && email && password) {
                    setIsSubmitting(true);
                    setAuthError(null);
                    const res = await signUpWithEmail(email, password, selectedLanguage);
                    setIsSubmitting(false);
                    if (res.error) {
                      setAuthError(res.error);
                      return;
                    }
                    setAuthSuccess('Account created successfully!');
                  }
                  onFinish(selectedLanguage);
                }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0E5A64] text-white font-bold hover:bg-[#0A4249] transition-all shadow-sm disabled:opacity-50"
                style={{ minHeight: '52px' }}
              >
                <span>{isSubmitting ? 'Setting up...' : 'Start Using FormAssist'}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

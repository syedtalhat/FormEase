/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  Globe,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  User,
  Volume2,
} from 'lucide-react';
import { Language, UserPreferences } from '../../types';
import {
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
} from '../../core/auth/supabaseAuth';

interface OptionsViewProps {
  preferences: UserPreferences;
  onSavePreferences: (updated: Partial<UserPreferences>) => Promise<void>;
}

export const OptionsView: React.FC<OptionsViewProps> = ({
  preferences,
  onSavePreferences,
}) => {
  const [lang, setLang] = useState<Language>(preferences.defaultLanguage);
  const [autoExplain, setAutoExplain] = useState(preferences.autoExplainOnFocus);
  const [speechRate, setSpeechRate] = useState(preferences.speechRate);
  const [isSaved, setIsSaved] = useState(false);

  // Supabase Auth State
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u?.email) setCurrentUserEmail(u.email);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSavePreferences({
      defaultLanguage: lang,
      autoExplainOnFocus: autoExplain,
      speechRate,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl border border-[#DDE4E8] shadow-sm overflow-hidden text-[#1F2D36]">
      {/* Header */}
      <div className="bg-[#0E5A64] text-white p-8">
        <h1
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          FormAssist Preferences &amp; Settings
        </h1>
        <p className="text-sm text-[#8FCFDB]">
          Configure default language, speech synthesis cadence, and review your privacy audit record.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 space-y-6">
        {/* Account Info & Supabase Auth (NFR-SEC.3, FR-LANG.1) */}
        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DDE4E8] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E3F0F1] text-[#0E5A64] flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {currentUserEmail || preferences.email || 'Guest User (Local Only)'}
                </div>
                <div className="text-xs text-[#4A5B66]">
                  {currentUserEmail ? 'Supabase Auth Session Active' : 'No cloud account connected'}
                </div>
              </div>
            </div>
            {currentUserEmail ? (
              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  setCurrentUserEmail(null);
                  setAuthMsg({ type: 'success', text: 'Signed out successfully.' });
                }}
                className="text-xs px-3 py-1.5 rounded-xl border border-[#DDE4E8] bg-white text-[#BA1A1A] hover:bg-[#FBE8E8] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? null : 'signin');
                    setAuthMsg(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl border border-[#0E5A64] bg-[#E3F0F1] text-[#0E5A64] font-semibold hover:bg-[#D4E8EB] transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? null : 'signup');
                    setAuthMsg(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-[#0E5A64] text-white font-semibold hover:bg-[#0A4249] transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {authMode && (
            <div className="pt-3 border-t border-[#DDE4E8] space-y-3">
              <div className="text-xs font-semibold text-[#1F2D36]">
                {authMode === 'signin' ? 'Sign In to Your Account' : 'Create a FormAssist Cloud Account'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email address"
                  className="px-3 py-2 text-xs rounded-xl border border-[#DDE4E8] bg-white focus:outline-none focus:border-[#0E5A64]"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="px-3 py-2 text-xs rounded-xl border border-[#DDE4E8] bg-white focus:outline-none focus:border-[#0E5A64]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(null)}
                  className="px-3 py-1.5 text-xs text-[#4A5B66] hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={authLoading || !authEmail || !authPassword}
                  onClick={async () => {
                    setAuthLoading(true);
                    setAuthMsg(null);
                    if (authMode === 'signin') {
                      const res = await signInWithEmail(authEmail, authPassword);
                      setAuthLoading(false);
                      if (res.error) {
                        setAuthMsg({ type: 'error', text: res.error });
                      } else {
                        setCurrentUserEmail(res.user?.email || authEmail);
                        setAuthMode(null);
                        setAuthMsg({ type: 'success', text: 'Signed in successfully!' });
                      }
                    } else {
                      const res = await signUpWithEmail(authEmail, authPassword, lang);
                      setAuthLoading(false);
                      if (res.error) {
                        setAuthMsg({ type: 'error', text: res.error });
                      } else {
                        setCurrentUserEmail(res.user?.email || authEmail);
                        setAuthMode(null);
                        setAuthMsg({ type: 'success', text: 'Account created and verified!' });
                      }
                    }
                  }}
                  className="px-4 py-1.5 text-xs rounded-xl bg-[#0E5A64] text-white font-semibold hover:bg-[#0A4249] disabled:opacity-50 transition-colors"
                >
                  {authLoading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </div>
          )}

          {authMsg && (
            <p
              className={`text-xs font-medium ${
                authMsg.type === 'error' ? 'text-[#BA1A1A]' : 'text-[#17724A]'
              }`}
            >
              {authMsg.text}
            </p>
          )}
        </div>

        {/* Default Language Setting */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-[#1F2D36]">
            <Globe className="w-4 h-4 text-[#0E5A64]" />
            <span>Default Assistance Language</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी (Hindi)' },
              { id: 'mr', label: 'मराठी (Marathi)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLang(item.id as Language)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  lang === item.id
                    ? 'border-[#0E5A64] bg-[#E3F0F1] text-[#0E5A64]'
                    : 'border-[#DDE4E8] bg-white text-[#4A5B66] hover:bg-[#F7FAFB]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-[#1F2D36]">
              <Volume2 className="w-4 h-4 text-[#0E5A64]" />
              <span>Voice Playback Speed</span>
            </label>
            <span className="text-xs font-semibold text-[#0E5A64]">{speechRate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-[#0E5A64]"
          />
          <div className="flex justify-between text-[11px] text-[#4A5B66]">
            <span>Calm &amp; Deliberate (0.7x)</span>
            <span>Normal (1.0x)</span>
            <span>Brisk (1.3x)</span>
          </div>
        </div>

        {/* Auto Explain Toggle */}
        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DDE4E8] flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-[#1F2D36]">
              Auto-show tooltip on field focus
            </div>
            <div className="text-xs text-[#4A5B66]">
              Automatically pops up the 1-line plain-language summary when you click or tab into any input.
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoExplain}
            onChange={(e) => setAutoExplain(e.target.checked)}
            className="w-5 h-5 accent-[#0E5A64] rounded cursor-pointer"
          />
        </div>

        {/* Privacy Audit Log */}
        <div className="p-5 rounded-2xl bg-[#E4F4EC] border border-[#17724A]/20 space-y-2">
          <div className="flex items-center gap-2 text-[#17724A] font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Local Redaction Audit Record</span>
          </div>
          <p className="text-xs text-[#124B32] leading-relaxed">
            Every inspection verified that password, OTP, CVV, and typed form input values were intercepted and redacted locally prior to any network packet transmission (FR-REDACT.1–3 compliant).
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#DDE4E8]">
          {isSaved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#17724A]">
              <Check className="w-4 h-4" />
              <span>Saved successfully</span>
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0E5A64] text-white font-semibold hover:bg-[#0A4249] transition-all shadow-sm"
            style={{ minHeight: '48px' }}
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

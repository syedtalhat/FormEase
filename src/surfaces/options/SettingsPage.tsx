/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { tts } from '../../core/tts';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { SegmentedControl } from '../../ui/SegmentedControl';

interface SettingsPageProps {
  userEmail?: string;
  savedLanguage: SupportedLanguage;
  onSaveLanguage: (lang: SupportedLanguage) => void;
  onSignOut?: () => void;
  onDeleteChatHistory?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  userEmail = 'student@example.org',
  savedLanguage,
  onSaveLanguage,
  onSignOut,
  onDeleteChatHistory,
}) => {
  const [lang, setLang] = useState<SupportedLanguage>(savedLanguage);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean>(true);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [chatDeleted, setChatDeleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Real voice check per Section 6
  useEffect(() => {
    const checkVoice = () => {
      const state = tts.checkVoiceAvailability(lang);
      setVoiceAvailable(state.available);
    };

    checkVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoice;
    }
  }, [lang]);

  const handleTestVoice = () => {
    if (isPlayingVoice) {
      tts.stop();
      setIsPlayingVoice(false);
    } else {
      const rate = speed === 'slow' ? 0.8 : speed === 'fast' ? 1.2 : 1.0;
      const sampleText =
        lang === 'hi'
          ? 'यह फॉर्मअसिस्ट की आवाज का एक नमूना है।'
          : lang === 'mr'
          ? 'हा फॉर्मअसिस्टच्या आवाजाचा नमुना आहे.'
          : 'This is a sample of the FormAssist voice.';

      tts.speak(
        sampleText,
        lang,
        rate,
        () => setIsPlayingVoice(false)
      );
      setIsPlayingVoice(true);
    }
  };

  const handleSave = () => {
    onSaveLanguage(lang);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDeleteChat = () => {
    if (onDeleteChatHistory) onDeleteChatHistory();
    setChatDeleted(true);
    setTimeout(() => setChatDeleted(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto my-8 bg-surface-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden font-body text-text-primary">
      {/* Header */}
      <div className="bg-primary text-white p-6 md:p-8">
        <h1 className="font-display font-bold text-2xl tracking-tight mb-1">
          FormAssist Settings
        </h1>
        <p className="text-xs text-primary-tint/90">
          Preferences for your assistive form marginal companion
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Account Row */}
        <div className="p-4 rounded-xl bg-surface-page border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-xs text-text-secondary">Signed in as</div>
            <div className="font-bold text-sm text-text-primary">{userEmail}</div>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs text-danger font-semibold hover:underline"
            >
              Sign out
            </button>
          )}
        </div>

        {/* Section: Language & Voice (per Section 5 corrections) */}
        <div className="space-y-4">
          <h2 className="type-title-2 text-primary-container border-b border-border-subtle pb-2">
            Language &amp; Voice
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Default Assistance Language
            </label>
            <SegmentedControl
              options={[
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिन्दी' },
                { id: 'mr', label: 'मराठी' },
              ]}
              value={lang}
              onChange={setLang}
            />
          </div>

          {/* Voice availability & test */}
          <div className="p-4 rounded-xl bg-surface-page border border-border-subtle space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Speech synthesis status:</span>
              {voiceAvailable ? (
                <span className="text-source-official font-semibold flex items-center gap-1">
                  <Icon name="check_circle" className="w-3.5 h-3.5" />
                  <span>{lang.toUpperCase()} voice available</span>
                </span>
              ) : (
                <span className="text-danger font-semibold">
                  No {lang === 'hi' ? 'Hindi' : lang === 'mr' ? 'Marathi' : 'English'} voice found on this computer
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Speed:</span>
                <div className="flex bg-surface-muted p-0.5 rounded-lg text-xs">
                  {(['slow', 'normal', 'fast'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium ${
                        speed === s ? 'bg-white text-primary-container font-bold shadow-xs' : 'text-text-secondary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestVoice}
              >
                <div className="flex items-center gap-1.5">
                  <Icon name={isPlayingVoice ? 'stop' : 'volume_up'} className="w-3.5 h-3.5" />
                  <span>{isPlayingVoice ? 'Stop' : 'Listen'}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Section: Privacy Review */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h2 className="type-title-2 text-primary-container">Privacy</h2>
            <button
              type="button"
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="text-xs text-primary-container font-semibold hover:underline"
            >
              {showPrivacyDetails ? 'Hide details' : 'See what FormAssist reads and never reads'}
            </button>
          </div>

          {showPrivacyDetails && (
            <div className="p-4 rounded-xl bg-surface-page border border-border-subtle space-y-3 text-xs leading-relaxed animate-fadeIn">
              <p className="font-semibold text-text-primary">
                FormAssist operates exclusively on top of target web forms.
              </p>
              <ul className="space-y-1 text-text-secondary list-disc list-inside">
                <li>We read only public form questions, types, and on-page descriptions.</li>
                <li>We never inspect, record, or transmit typed values, passwords, OTPs, or credit card numbers.</li>
                <li>Redaction is enforced locally at extraction time before any network call.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Section: Chat Management */}
        <div className="p-4 rounded-xl bg-surface-page border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-text-primary">Chat History</div>
            <div className="text-xs text-text-secondary">
              Removes saved question history from your account.
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDeleteChat}>
            <div className="flex items-center gap-1 text-danger">
              <Icon name="delete" className="w-3.5 h-3.5" />
              <span>{chatDeleted ? 'Deleted' : 'Delete my chat history'}</span>
            </div>
          </Button>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
          {isSaved && (
            <span className="text-xs font-bold text-source-official flex items-center gap-1">
              <Icon name="check" className="w-3.5 h-3.5" />
              <span>Preferences saved</span>
            </span>
          )}
          <Button variant="primary" size="md" onClick={handleSave}>
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

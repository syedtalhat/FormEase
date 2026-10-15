/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
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
  userEmail,
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
  const [activeSection, setActiveSection] = useState('general');
  const extensionVersion = typeof chrome !== 'undefined' && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest().version
    : undefined;

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
        t('settings_voice_sample', lang);

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

  const navigateTo = (section: string) => {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-surface-page font-body text-text-primary">
      <header className="sticky top-0 z-20 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface-card px-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container font-display text-xl font-bold text-white">
            F<span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-marigold" />
          </span>
          <div>
            <p className="font-display text-xl font-bold leading-6 text-primary">FormAssist</p>
            <p className="text-sm text-text-secondary">{t('onboarding_brand_subtitle', lang)}</p>
          </div>
        </div>
        <nav aria-label={t('settings_sections', lang)} className="flex max-w-full items-center gap-1 overflow-x-auto">
          {[
            ['general', t('settings_general', lang)],
            ['privacy', t('settings_privacy', lang)],
            ['voice', t('settings_language_voice', lang)],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => navigateTo(id)}
              aria-current={activeSection === id ? 'page' : undefined}
              className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container ${
                activeSection === id ? 'bg-primary-container text-white' : 'text-text-primary hover:bg-surface-muted'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigateTo('account')}
            aria-label={t('settings_account', lang)}
            className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
          >
            <Icon name="person" className="h-5 w-5" />
          </button>
        </nav>
      </header>

      <div className="grid min-h-[calc(100vh-72px)] md:grid-cols-[296px_minmax(0,1fr)]">
        <aside className="hidden flex-col border-r border-border-subtle bg-surface-muted px-4 py-7 md:flex">
          <p className="px-2 text-xs font-semibold uppercase text-text-secondary">{t('settings_configuration', lang)}</p>
          <nav aria-label={t('settings_configuration', lang)} className="mt-4 space-y-1">
            {[
              ['general', t('settings_general', lang), 'settings'],
              ['privacy', t('settings_privacy', lang), 'shield'],
              ['voice', t('settings_language_voice', lang), 'language'],
              ['history', t('settings_history', lang), 'article'],
            ].map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                aria-current={activeSection === id ? 'page' : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container ${
                  activeSection === id ? 'bg-primary-container text-white' : 'text-text-primary hover:bg-surface-page'
                }`}
              >
                <Icon name={icon as 'settings' | 'shield' | 'language' | 'article'} className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl bg-surface-page p-4 text-sm text-text-secondary">
            <p className="font-semibold text-text-primary">FormAssist</p>
            {extensionVersion && <p>{t('settings_extension_version', lang, { version: extensionVersion })}</p>}
          </div>
        </aside>

        <main className="min-w-0 px-5 py-8 md:px-8">
          <div className="mx-auto max-w-[740px] space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold leading-10">{t('settings_title', lang)}</h1>
              <p className="mt-1 text-base leading-6 text-text-secondary">{t('settings_subtitle', lang)}</p>
            </div>

            <section id="general" className="scroll-mt-24 space-y-5">
              <div id="account" className="scroll-mt-24 space-y-3">
                <h2 className="font-display text-xl font-semibold">{t('settings_account', lang)}</h2>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint font-display text-lg font-bold text-primary">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : <Icon name="person" className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className="text-sm text-text-secondary">{t('settings_signed_in_as', lang)}</p>
                      <p className="text-base font-semibold">{userEmail || t('settings_guest', lang)}</p>
                    </div>
                  </div>
                  {onSignOut && (
                    <Button variant="secondary" size="sm" onClick={onSignOut}>
                      {t('settings_sign_out', lang)}
                    </Button>
                  )}
                </div>
              </div>

              <hr className="border-border-subtle" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">{t('settings_saved_language', lang)}</h2>
                  <span className="rounded-full bg-primary-tint px-3 py-1 text-sm font-semibold text-primary">{t('settings_default_start', lang)}</span>
                </div>
                <SegmentedControl
                  options={[
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'हिन्दी' },
                    { id: 'mr', label: 'मराठी' },
                  ]}
                  value={lang}
                  onChange={setLang}
                  className="max-w-[520px]"
                />
                <p className="max-w-[620px] text-base leading-6 text-text-secondary">{t('settings_saved_language_help', lang)}</p>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary">
                    <Icon name="visibility" className="h-4 w-4" />
                    {t('settings_preview_label', lang)}
                  </p>
                  <p className="mt-2 text-lg font-medium">{t('settings_preview_question', lang)}</p>
                  <p className="mt-1 text-sm text-text-secondary">{t('settings_preview_translation', lang)}</p>
                </div>
              </div>
            </section>

            <hr className="border-border-subtle" />

            <section id="voice" className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-xl font-semibold">{t('settings_voice', lang)}</h2>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="secondary" size="md" onClick={handleTestVoice}>
                  <span className="flex items-center gap-2">
                    <Icon name={isPlayingVoice ? 'stop' : 'volume_up'} className="h-5 w-5" />
                    {isPlayingVoice ? t('stop', lang) : t('listen', lang)}
                  </span>
                </Button>
                <span className={`flex items-center gap-2 text-sm font-medium ${voiceAvailable ? 'text-source-official' : 'text-danger'}`}>
                  <Icon name={voiceAvailable ? 'check_circle' : 'info'} className="h-4 w-4" />
                  {voiceAvailable
                    ? t('settings_voice_available', lang, { language: lang === 'hi' ? 'हिन्दी' : lang === 'mr' ? 'मराठी' : 'English' })
                    : t('settings_voice_unavailable', lang, { language: lang === 'hi' ? 'हिन्दी' : lang === 'mr' ? 'मराठी' : 'English' })}
                </span>
              </div>
              <div className="max-w-[380px] space-y-2">
                <p className="text-sm font-semibold">{t('settings_speaking_speed', lang)}</p>
                <SegmentedControl
                  options={[
                    { id: 'slow', label: t('settings_speed_slow', lang) },
                    { id: 'normal', label: t('settings_speed_normal', lang) },
                    { id: 'fast', label: t('settings_speed_fast', lang) },
                  ]}
                  value={speed}
                  onChange={setSpeed}
                  size="sm"
                />
              </div>
            </section>

            <hr className="border-border-subtle" />

            <section id="privacy" className="scroll-mt-24 space-y-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <Icon name="lock" className="h-5 w-5" />
                {t('settings_privacy', lang)}
              </h2>
              <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
                <p className="text-base leading-6">{t('settings_privacy_intro', lang)}</p>
                <button
                  type="button"
                  onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                  aria-expanded={showPrivacyDetails}
                  className="mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
                >
                  {t(showPrivacyDetails ? 'settings_privacy_hide' : 'settings_privacy_show', lang)}
                  <Icon name={showPrivacyDetails ? 'expand_less' : 'open_in_new'} className="h-4 w-4" />
                </button>
                {showPrivacyDetails && (
                  <div className="mt-3 space-y-2 border-t border-border-subtle pt-3 text-sm leading-5 text-text-secondary">
                    <p>{t('settings_privacy_details_intro', lang)}</p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>{t('settings_privacy_reads', lang)}</li>
                      <li>{t('settings_privacy_never_reads', lang)}</li>
                      <li>{t('settings_privacy_other_tabs', lang)}</li>
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section id="history" className="scroll-mt-24 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-card p-4">
                <div>
                  <h2 className="text-base font-bold">{t('settings_history', lang)}</h2>
                  <p className="mt-1 max-w-md text-sm leading-5 text-text-secondary">{t('settings_history_description', lang)}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleDeleteChat}>
                  <span className="flex items-center gap-2 text-danger">
                    <Icon name="delete" className="h-4 w-4" />
                    {chatDeleted ? t('settings_deleted', lang) : t('settings_delete_chat', lang)}
                  </span>
                </Button>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle pt-5">
              {isSaved && (
                <span role="status" className="flex items-center gap-2 text-sm font-semibold text-source-official">
                  <Icon name="check" className="h-4 w-4" />
                  {t('settings_saved', lang)}
                </span>
              )}
              <Button variant="primary" size="md" onClick={handleSave}>{t('settings_save', lang)}</Button>
            </div>

            {extensionVersion && (
              <p className="text-right text-sm text-text-secondary">
                {t('settings_extension_version', lang, { version: extensionVersion })}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

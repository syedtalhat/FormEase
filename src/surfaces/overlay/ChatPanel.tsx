/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
import { checkChatInput } from '../../core/redact/redactor';
import { Icon } from '../../ui/Icon';
import { SourceChip, SourceLabelType } from '../../ui/SourceChip';
import { tts } from '../../core/tts';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  focused_field_label?: string;
  timestamp: number;
  source_label?: SourceLabelType;
  source_url?: string;
}

interface ChatPanelProps {
  formTitle?: string;
  focusedFieldLabel?: string;
  language: SupportedLanguage;
  messages: ChatMessageItem[];
  isSignedIn?: boolean;
  isLoading?: boolean;
  onSendMessage: (msg: string) => void | Promise<void>;
  onClose: () => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  formTitle = 'Web Form Assistance',
  focusedFieldLabel,
  language,
  messages,
  isSignedIn = true,
  isLoading = false,
  onSendMessage,
  onClose,
  onLanguageChange,
}) => {
  const [input, setInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const originFocusRef = useRef<HTMLElement | null>(null);

  if (!originFocusRef.current && typeof document !== 'undefined') {
    originFocusRef.current = document.activeElement as HTMLElement;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const closePanel = () => {
    onClose();
    window.setTimeout(() => originFocusRef.current?.focus({ preventScroll: true }), 0);
  };

  // Escape key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sendQuestion = async (text: string) => {
    if (!text.trim() || isLoading || isSending) return;
    setSendError(false);
    setLastQuestion(text);
    setIsSending(true);
    try {
      await onSendMessage(text);
    } catch {
      setSendError(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isSending) return;

    const guard = checkChatInput(input);
    if (guard.blocked) {
      setWarning(t('chat_sensitive_warning', language));
      return;
    }

    setWarning(null);
    const text = input.trim();
    setInput('');
    await sendQuestion(text);
  };

  const handleQuickQuestion = (q: string) => {
    if (isLoading || isSending) return;
    void sendQuestion(q);
  };

  const handleListen = (message: ChatMessageItem) => {
    if (speakingMessageId === message.id) {
      tts.stop();
      setSpeakingMessageId(null);
      return;
    }
    const started = tts.speak(message.content, language, 1, () => setSpeakingMessageId(null));
    setSpeakingMessageId(started ? message.id : null);
  };

  const locale = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
  const firstMessageDate = messages[0] ? new Date(messages[0].timestamp) : new Date();
  const now = new Date();
  const isToday = firstMessageDate.toDateString() === now.toDateString();
  const dateLabel = isToday
    ? t('chat_today', language)
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(firstMessageDate);
  const followUps = [
    t('chat_followup_meaning', language),
    t('why_asking', language),
    t('chat_followup_dont_know', language),
  ];
  const formatTime = (timestamp: number) =>
    new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(timestamp);

  const renderMessage = (message: ChatMessageItem) => {
    const isUser = message.role === 'user';
    return (
      <article key={message.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser && message.focused_field_label && (
          <span className="mb-1 max-w-[88%] truncate px-2 text-xs text-text-secondary">
            {t('chat_message_about', language, { field: message.focused_field_label })}
          </span>
        )}
        <div
          className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${
            isUser
              ? 'rounded-br-sm bg-primary-container text-white'
              : 'rounded-bl-sm border border-border-subtle bg-surface-card text-text-primary shadow-xs'
          }`}
        >
          {message.content}
          {isUser && (
            <time className="mt-1 block text-right text-xs text-primary-tint" dateTime={new Date(message.timestamp).toISOString()}>
              {formatTime(message.timestamp)}
            </time>
          )}
        </div>
        {!isUser && (
          <div className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-3">
            <SourceChip
              type={message.source_label || 'ai'}
              url={message.source_url}
              language={language}
              showCaption
            />
            <button
              type="button"
              onClick={() => handleListen(message)}
              aria-label={t(speakingMessageId === message.id ? 'stop' : 'listen', language)}
              title={t(speakingMessageId === message.id ? 'stop' : 'listen', language)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
            >
              <Icon name={speakingMessageId === message.id ? 'stop' : 'volume_up'} className="h-5 w-5" />
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div
      role="complementary"
      aria-label={t('chat_panel_label', language)}
      className="fixed right-0 top-0 z-[2147483647] flex h-dvh min-h-screen w-full flex-col overflow-hidden border-l border-border-subtle bg-surface-page font-body text-text-primary shadow-panel animate-slideLeft min-[1024px]:w-[400px] max-[1023px]:rounded-none min-[1024px]:rounded-l-2xl"
    >
      <header className="space-y-3 border-b border-border-subtle bg-surface-card px-4 py-3">
        <div className="flex min-h-12 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container font-display text-xl font-bold text-white">
              F<span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-marigold" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold leading-6 text-text-primary">{t('chat_title', language)}</h1>
              <p className="truncate text-sm text-text-secondary">{t('chat_subtitle', language)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onLanguageChange && (
              <select
                aria-label={t('popup_language', language)}
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
                className="h-11 max-w-[118px] rounded-full bg-surface-muted px-3 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            )}
            <button
              type="button"
              onClick={closePanel}
              aria-label={t('chat_close', language)}
              title={t('chat_close', language)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[68px] items-center gap-3 rounded-xl bg-primary-tint px-3.5 py-2.5 text-primary">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-card">
            <Icon name="auto_awesome" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase">{t('chat_asking_about_label', language)}</p>
            <p className="truncate text-sm font-bold">{focusedFieldLabel || t('chat_this_form', language)}</p>
          </div>
        </div>

        {!isSignedIn && (
          <div className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-page px-3 text-sm text-text-secondary">
            <span>{t('chat_unsigned_notice', language)}</span>
            <Icon name="lock" className="h-4 w-4 shrink-0 text-text-disabled" />
          </div>
        )}
      </header>

      <div aria-live="polite" aria-relevant="additions text" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex min-h-full flex-col gap-4">
          <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
            <span className="h-px flex-1 bg-border-subtle" />
            <time dateTime={firstMessageDate.toISOString()}>{dateLabel}</time>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>
          <div className="space-y-3">
            {messages.map(renderMessage)}
          </div>
          {(isLoading || isSending) && (
            <div className="flex w-fit items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-3.5 py-3 text-sm text-text-secondary" role="status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
              <span>{t('chat_typing', language)}</span>
            </div>
          )}
          {sendError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-bg p-3 text-sm text-danger" role="alert">
              <span>{t('chat_send_error', language)}</span>
              <button
                type="button"
                onClick={() => void sendQuestion(lastQuestion)}
                className="min-h-11 shrink-0 rounded-lg px-3 font-semibold underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-danger"
              >
                {t('retry', language)}
              </button>
            </div>
          )}
          <section className="mt-auto space-y-2 pt-2">
            <h2 className="text-xs font-semibold uppercase text-text-secondary">{t('chat_helpful_followups', language)}</h2>
            <div className="flex flex-wrap gap-2">
              {followUps.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading || isSending}
                  className="min-h-11 rounded-full border border-border-subtle bg-surface-muted px-3.5 text-sm text-text-primary hover:bg-primary-tint disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container"
                >
                  {question}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-2 border-t border-border-subtle bg-surface-card px-4 pb-3 pt-3"
      >
        {warning && (
          <div className="flex items-center gap-2 rounded-lg bg-danger-bg p-2 text-sm font-semibold text-danger" role="alert">
            <Icon name="warning" className="h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <div className="flex min-h-[56px] items-center gap-2 rounded-2xl border border-border-strong bg-surface-page p-1.5 focus-within:ring-[3px] focus-within:ring-primary-container">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (warning) setWarning(null);
            }}
            aria-label={t('chat_input_label', language)}
            placeholder={t('chat_input_placeholder', language)}
            className="min-w-0 flex-1 bg-transparent px-3 text-base text-text-primary placeholder:text-text-secondary outline-none font-body"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isSending}
            aria-label={t('chat_send', language)}
            title={t('chat_send', language)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-white hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary-container focus-visible:ring-offset-2"
          >
            <Icon name="send" className="h-5 w-5" />
          </button>
        </div>
        <p className="flex items-start gap-2 px-1 text-xs leading-4 text-text-secondary">
          <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t('chat_privacy_note', language)}</span>
        </p>
      </form>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { checkChatInput } from '../../core/redact/redactor';
import { Icon } from '../../ui/Icon';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  focused_field_label?: string;
  timestamp: number;
}

interface ChatPanelProps {
  formTitle?: string;
  focusedFieldLabel?: string;
  language: SupportedLanguage;
  messages: ChatMessageItem[];
  isSignedIn?: boolean;
  isLoading?: boolean;
  onSendMessage: (msg: string) => void;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Escape key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check chat guard (Section 8.2)
    const guard = checkChatInput(input);
    if (guard.blocked) {
      setWarning(guard.warning || "Please don't type private numbers here.");
      return;
    }

    setWarning(null);
    const text = input.trim();
    setInput('');
    onSendMessage(text);
  };

  const handleQuickQuestion = (q: string) => {
    if (isLoading) return;
    onSendMessage(q);
  };

  return (
    <div
      role="complementary"
      aria-label="FormAssist Chat Panel"
      className="fixed top-0 right-0 h-full w-[400px] max-w-[92vw] bg-surface-page border-l border-border-subtle z-[2147483647] flex flex-col justify-between font-body text-text-primary shadow-panel animate-slideLeft"
      style={{
        borderRadius: '20px 0 0 20px',
      }}
    >
      {/* Header */}
      <div className="p-4 bg-surface-card border-b border-border-subtle rounded-tl-[20px] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-container text-white flex items-center justify-center font-display font-bold text-sm shadow-sm">
              FA
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-primary-container leading-tight">
                FormAssist Companion
              </h2>
              <p className="text-[11px] text-text-secondary truncate max-w-[220px]">
                {formTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onLanguageChange && (
              <div className="flex bg-surface-muted p-0.5 rounded-lg text-xs font-semibold mr-1">
                {(['en', 'hi', 'mr'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onLanguageChange(l)}
                    className={`px-1.5 py-0.5 rounded ${
                      language === l
                        ? 'bg-white text-primary-container font-bold shadow-xs'
                        : 'text-text-secondary'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat panel"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-muted transition-colors"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FR-CHAT.1: Persistent Asking about chip */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            focusedFieldLabel
              ? 'bg-primary-tint text-primary-container border border-primary-container/30'
              : 'bg-surface-muted text-text-secondary border border-border-subtle'
          }`}
        >
          <Icon name="auto_awesome" className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            Asking about:{' '}
            <span className="underline font-bold">
              {focusedFieldLabel || 'General form questions'}
            </span>
          </span>
        </div>

        {/* FR-ACC.3: Signed out notice */}
        {!isSignedIn && (
          <div className="text-[11px] text-text-secondary bg-surface-page px-2.5 py-1 rounded-lg border border-border-subtle flex items-center justify-between">
            <span>Chat is not saved. Sign in to keep it.</span>
            <Icon name="lock" className="w-3 h-3 text-text-disabled" />
          </div>
        )}
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.length === 0 ? (
          <div className="text-center py-6 px-3 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-tint text-primary-container flex items-center justify-center">
              <Icon name="chat" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-text-primary">
                How can I help you fill this?
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mt-1 max-w-xs mx-auto">
                Ask about required certificates, where to find numbers, or what confusing questions mean.
              </p>
            </div>

            {/* Quick suggestion chips */}
            <div className="space-y-1.5 text-left pt-2">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Suggested questions:
              </span>
              {[
                'Where do I find this certificate or document?',
                "What if I don't have this exact number right now?",
                'Is this question mandatory for fee exemption?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left p-2.5 rounded-xl border border-border-subtle bg-surface-card hover:bg-primary-tint/40 text-xs text-text-primary transition-colors flex items-center justify-between"
                >
                  <span className="line-clamp-2">{q}</span>
                  <Icon name="arrow_forward" className="w-3.5 h-3.5 text-primary-container shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.focused_field_label && msg.role === 'user' && (
                <span className="text-[10px] text-text-secondary mb-0.5 px-1 font-medium">
                  re: {msg.focused_field_label}
                </span>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-container text-white rounded-tr-xs'
                    : 'bg-surface-card border border-border-subtle text-text-primary rounded-tl-xs shadow-xs'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-surface-card border border-border-subtle rounded-2xl w-fit text-xs text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
            <span>Finding official guidance…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-surface-card border-t border-border-subtle rounded-bl-[20px] space-y-1.5"
      >
        {warning && (
          <div className="text-xs text-danger font-semibold bg-danger-bg p-2 rounded-lg flex items-center gap-1.5">
            <Icon name="warning" className="w-3.5 h-3.5 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-surface-page rounded-xl p-1.5 border border-border-strong focus-within:ring-2 focus-within:ring-primary-container">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (warning) setWarning(null);
            }}
            placeholder={
              focusedFieldLabel
                ? `Ask a question about ${focusedFieldLabel}…`
                : 'Ask a question…'
            }
            className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-disabled outline-none font-body"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="w-10 h-10 rounded-lg bg-primary-container text-white flex items-center justify-center hover:bg-primary-pressed disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Icon name="send" className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage, ExtractedField, Language } from '../../types';
import { speechService } from '../speech';

interface ChatDrawerProps {
  formTitle: string;
  focusedField?: ExtractedField;
  allFields: ExtractedField[];
  completedFields: string[];
  language: Language;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  formTitle,
  focusedField,
  language,
  onClose,
  onSendMessage,
  messages,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    await onSendMessage(msg);
  };

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;
    await onSendMessage(question);
  };

  const handleSpeak = (msgId: string, content: string) => {
    if (playingMessageId === msgId) {
      speechService.stop();
      setPlayingMessageId(null);
    } else {
      speechService.speak(
        content,
        language,
        () => setPlayingMessageId(msgId),
        () => setPlayingMessageId(null)
      );
    }
  };

  const fieldLabel = focusedField?.label || 'General Form Advice';

  // Quick prompt suggestions based on active field
  const quickQuestions = [
    `Where do I find this certificate or document?`,
    `What if I don't have this exact number right now?`,
    `Is this field mandatory for fee waiver?`,
  ];

  return (
    <div
      role="complementary"
      aria-label="FormAssist Chat Panel"
      className="fixed top-0 right-0 h-full w-[400px] max-w-[92vw] bg-[#F7FAFB] border-l border-[#CBD5DB] z-[9999] flex flex-col justify-between text-[#1F2D36]"
      style={{
        borderRadius: '20px 0 0 20px',
        boxShadow: '-8px 0 32px rgba(14, 90, 100, 0.20), -1px 0 0 #CBD5DB',
      }}
    >
      {/* Header */}
      <div className="p-4 bg-white border-b border-[#DDE4E8] rounded-tl-[20px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0E5A64] text-white flex items-center justify-center font-bold shadow-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3
                className="font-bold text-base text-[#0E5A64] leading-tight"
                style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
              >
                FormAssist Companion
              </h3>
              <p className="text-[11px] text-[#4A5B66] truncate max-w-[240px]">
                {formTitle || 'Web Form Assistance'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat panel"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A5B66] hover:bg-[#ECEFF1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FR-CHAT.1: Persistent Field Selected Banner */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{
            backgroundColor: focusedField ? '#E3F0F1' : '#ECEFF1',
            color: focusedField ? '#0E5A64' : '#4A5B66',
            border: focusedField ? '1.5px solid #0E5A64' : '1px solid #DDE4E8',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            Field Selected: <span className="underline">{fieldLabel}</span>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.length === 0 ? (
          <div className="text-center py-6 px-3">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#E3F0F1] text-[#0E5A64] flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4
              className="font-bold text-[#1F2D36] text-[15px] mb-1"
              style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
            >
              How can I help you fill this?
            </h4>
            <p className="text-xs text-[#4A5B66] leading-relaxed mb-4">
              I can explain confusing terms, tell you which official document to check, or clarify eligibility criteria in your chosen language.
            </p>

            <div className="space-y-1.5 text-left">
              <p className="text-[11px] font-semibold text-[#4A5B66] uppercase tracking-wider mb-1">
                Suggested Questions
              </p>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickQuestion(q)}
                  className="w-full text-left p-2.5 rounded-xl border border-[#DDE4E8] bg-white hover:bg-[#E3F0F1]/50 text-xs text-[#1F2D36] flex items-center justify-between group transition-all"
                >
                  <span className="line-clamp-2">{q}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0E5A64] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
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
              {msg.focusedFieldLabel && msg.role === 'user' && (
                <span className="text-[10px] text-[#4A5B66] mb-0.5 px-1 font-medium">
                  re: {msg.focusedFieldLabel}
                </span>
              )}
              <div
                className={`max-w-[88%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0E5A64] text-white rounded-tr-sm'
                    : 'bg-white border border-[#DDE4E8] text-[#1F2D36] rounded-tl-sm shadow-sm'
                }`}
              >
                <div>{msg.content}</div>
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#F1F4F5] text-[11px] text-[#4A5B66]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#0E5A64]" />
                      <span>FormAssist AI</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className="p-1 hover:text-[#0E5A64] rounded transition-colors"
                      title="Read aloud"
                    >
                      {playingMessageId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#B3261E] animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white border border-[#DDE4E8] rounded-2xl w-fit text-xs text-[#4A5B66]">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E5A64] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E5A64] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E5A64] animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>Finding official guidance...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-[#DDE4E8] rounded-bl-[20px]"
      >
        <div className="flex items-center gap-2 bg-[#F1F4F5] rounded-xl p-1.5 border border-[#DDE4E8] focus-within:border-[#0E5A64] focus-within:ring-2 focus-within:ring-[#0E5A64]/20 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask about ${fieldLabel}...`}
            className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-[#1F2D36] placeholder-[#8A98A1] outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            className="w-9 h-9 rounded-lg bg-[#0E5A64] text-white flex items-center justify-center hover:bg-[#0A4249] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

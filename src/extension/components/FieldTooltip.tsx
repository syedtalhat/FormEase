/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Volume2, VolumeX, X } from 'lucide-react';
import { FieldExplanation, Language } from '../../types';
import { speechService } from '../speech';
import { ProvenanceFrame } from './ProvenanceFrame';
import { StatusChip } from './StatusChip';

interface FieldTooltipProps {
  explanation: FieldExplanation;
  fieldLabel: string;
  language: Language;
  onAskInChat: () => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  explanation,
  fieldLabel,
  language,
  onAskInChat,
  onClose,
  style,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const textToRead = expanded
        ? `${fieldLabel}. ${explanation.summary} ${explanation.fullExplanation}`
        : `${fieldLabel}. ${explanation.summary}`;

      speechService.speak(
        textToRead,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="tooltip-title"
      className="bg-white rounded-2xl border border-[#DDE4E8] text-[#1F2D36] p-4 text-sm z-[9999] transition-all"
      style={{
        width: '360px',
        maxWidth: '92vw',
        boxShadow: '0 1px 2px rgba(31, 45, 54, 0.18), 0 8px 24px rgba(14, 90, 100, 0.18)',
        ...style,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[#F1F4F5]">
        <div className="flex-1 pr-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4
              id="tooltip-title"
              className="font-bold text-[#1F2D36] text-[15px] leading-snug line-clamp-2"
              style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
            >
              {fieldLabel}
            </h4>
            <StatusChip tag={explanation.riskTag} />
          </div>
          {explanation.riskReason && (
            <div className="text-[11px] font-medium text-[#8F4200] bg-[#FFEBD5] px-2 py-0.5 rounded-md mt-1">
              {explanation.riskReason}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleSpeech}
            aria-label={isSpeaking ? 'Stop speech' : 'Read explanation aloud'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0E5A64] hover:bg-[#E3F0F1] transition-colors"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 text-[#B3261E] animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tooltip"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A5B66] hover:bg-[#ECEFF1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1-Line Summary (Always visible, ≤ 15 words) */}
      <div className="text-[13px] text-[#1F2D36] leading-relaxed mb-2 font-medium">
        {explanation.summary}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#F1F4F5] animate-fadeIn">
          <p className="text-xs text-[#334155] leading-relaxed mb-2">
            {explanation.fullExplanation}
          </p>

          <ProvenanceFrame
            sourceLabel={explanation.sourceLabel}
            title={explanation.sourceTitle}
            url={explanation.sourceUrl}
            excerpt={explanation.sourceExcerpt}
            confidence={explanation.confidence}
          />
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#F1F4F5] text-xs">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 font-semibold text-[#0E5A64] hover:underline py-1.5 px-2 rounded-md hover:bg-[#E3F0F1]/50"
        >
          <span>{expanded ? 'Less' : 'More'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={onAskInChat}
          className="inline-flex items-center gap-1.5 font-semibold bg-[#0E5A64] hover:bg-[#0A4249] text-white px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
          style={{ minHeight: '36px' }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask in chat</span>
        </button>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { SupportedLanguage } from '../../core/i18n';
import { tts } from '../../core/tts';
import { Icon } from '../../ui/Icon';
import { SourceChip, SourceLabelType } from '../../ui/SourceChip';
import { TagPill, TagType } from '../../ui/TagPill';

export interface TooltipExplanationData {
  field_key: string;
  field_label: string;
  risk_tag: TagType;
  summary: string;
  text: string;
  source_label: SourceLabelType;
  source_url?: string;
  source_excerpt?: string;
  confidence?: number;
}

interface TooltipProps {
  data: TooltipExplanationData;
  anchorEl?: HTMLElement | null;
  language: SupportedLanguage;
  onAskInChat: () => void;
  onClose: () => void;
  initialExpanded?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  data,
  anchorEl,
  language,
  onAskInChat,
  onClose,
  initialExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 100, y: 100 });

  // Floating-UI positioning relative to anchorEl with autoUpdate
  useEffect(() => {
    if (!anchorEl || !tooltipRef.current) return;

    const updatePosition = () => {
      if (!anchorEl || !tooltipRef.current) return;
      computePosition(anchorEl, tooltipRef.current, {
        placement: 'bottom-start',
        middleware: [offset(8), flip(), shift({ padding: 12 })],
      }).then(({ x, y }) => {
        setCoords({ x, y });
      });
    };

    // autoUpdate handles scroll, window resize, sticky ancestors, and layout shift
    const cleanup = autoUpdate(anchorEl, tooltipRef.current, updatePosition);
    return cleanup;
  }, [anchorEl, expanded]);

  // Keyboard accessibility: Escape closes tooltip and returns focus to anchor element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        anchorEl?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, anchorEl]);

  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      tts.stop();
      setIsSpeaking(false);
    } else {
      const textToRead = expanded
        ? `${data.field_label}. ${data.summary} ${data.text}`
        : `${data.field_label}. ${data.summary}`;

      tts.speak(
        textToRead,
        language,
        1.0,
        () => setIsSpeaking(false)
      );
      setIsSpeaking(true);
    }
  };

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-labelledby="tooltip-title"
      className="fixed z-[2147483647] bg-surface-card rounded-2xl border border-border-subtle shadow-floating font-body text-text-primary p-4 w-[360px] max-w-[92vw] transition-all"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-surface-muted pb-2.5 mb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              id="tooltip-title"
              className="font-display font-bold text-base text-text-primary leading-tight"
            >
              {data.field_label}
            </h3>
            <TagPill type={data.risk_tag} />
          </div>
          <SourceChip
            type={data.source_label}
            url={data.source_url}
            showCaption={!expanded}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close note"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-surface-muted transition-colors shrink-0"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      {/* 1-Line Summary (NFR-USA.3: <= ~15 words) */}
      <p className="text-sm text-text-primary leading-relaxed font-medium mb-3">
        {data.summary}
      </p>

      {/* Expanded details (d4) */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-surface-muted">
          <p className="text-xs text-text-secondary leading-relaxed">
            {data.text}
          </p>

          {data.source_excerpt && (
            <div className="p-3 bg-surface-page rounded-xl border border-border-subtle text-xs text-text-primary leading-relaxed">
              <span className="font-semibold block text-text-secondary mb-1">The source says:</span>
              <span className="italic">&ldquo;{data.source_excerpt}&rdquo;</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-muted text-xs">
        <div className="flex items-center gap-2">
          {/* TTS Listen / Stop */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isSpeaking
                ? 'bg-danger-bg text-danger'
                : 'text-primary-container hover:bg-primary-tint'
            }`}
          >
            <Icon name={isSpeaking ? 'stop' : 'volume_up'} className="w-4 h-4" />
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          {/* More / Less Toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-primary-container font-semibold hover:underline px-2 py-1.5 rounded-lg"
          >
            <span>{expanded ? 'Less' : 'More'}</span>
            <Icon name={expanded ? 'expand_less' : 'expand_more'} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ask in chat */}
        <button
          type="button"
          onClick={onAskInChat}
          className="inline-flex items-center gap-1.5 bg-primary-container text-white px-3.5 py-1.5 rounded-xl font-semibold hover:bg-primary-pressed transition-all shadow-xs"
        >
          <Icon name="chat" className="w-3.5 h-3.5" />
          <span>Ask in chat</span>
        </button>
      </div>
    </div>
  );
};

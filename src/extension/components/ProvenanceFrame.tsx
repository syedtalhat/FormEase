/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { SourceProvenance } from '../../types';

interface ProvenanceFrameProps {
  sourceLabel: SourceProvenance;
  title?: string;
  url?: string;
  excerpt?: string;
  confidence?: number;
}

export const ProvenanceFrame: React.FC<ProvenanceFrameProps> = ({
  sourceLabel,
  title,
  url,
  excerpt,
}) => {
  if (sourceLabel === 'From official source') {
    return (
      <div
        className="rounded-xl p-3 my-2 text-xs"
        style={{
          border: '2px solid #17724A',
          backgroundColor: '#E4F4EC',
          color: '#124B32',
        }}
      >
        <div className="flex items-center justify-between font-semibold mb-1">
          <div className="flex items-center gap-1.5 text-[#17724A]">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>From official source</span>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#17724A] hover:underline"
            >
              <span>View rule</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        {title && <div className="font-medium text-[#17724A] text-xs mb-1">{title}</div>}
        {excerpt && (
          <div className="text-[11px] leading-relaxed text-[#1F2D36] bg-white/70 p-2 rounded-lg border border-[#17724A]/20">
            &ldquo;{excerpt}&rdquo;
          </div>
        )}
      </div>
    );
  }

  if (sourceLabel === 'From this page') {
    return (
      <div
        className="rounded-xl p-3 my-2 text-xs"
        style={{
          border: '1.5px solid #2A5DA8',
          backgroundColor: '#E6EEFA',
          color: '#1A3E75',
        }}
      >
        <div className="flex items-center gap-1.5 font-semibold text-[#2A5DA8] mb-1">
          <FileText className="w-4 h-4 stroke-[2.2]" />
          <span>From this page</span>
        </div>
        <p className="text-[11px] text-[#1F2D36] leading-relaxed">
          Grounding extracted directly from the form&apos;s on-page descriptions and accessibility annotations.
        </p>
      </div>
    );
  }

  // AI Knowledge fallback
  return (
    <div
      className="rounded-xl p-3 my-2 text-xs"
      style={{
        border: '1.5px dashed #5E479B',
        backgroundColor: '#EFEBFA',
        color: '#432E75',
      }}
    >
      <div className="flex items-center gap-1.5 font-semibold text-[#5E479B] mb-1">
        <Sparkles className="w-4 h-4 stroke-[2.2]" />
        <span>AI&apos;s general knowledge</span>
      </div>
      <p className="text-[11px] text-[#1F2D36] leading-relaxed">
        Synthesized interpretation. Verified official document indexing is pending for this domain.
      </p>
    </div>
  );
};

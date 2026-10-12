/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage } from '../../core/i18n';
import { Icon } from '../../ui/Icon';
import { SourceChip } from '../../ui/SourceChip';
import { TagPill } from '../../ui/TagPill';

interface IllustrativeSampleProps {
  language: SupportedLanguage;
}

export const IllustrativeSample: React.FC<IllustrativeSampleProps> = ({ language }) => {
  const sampleNote = {
    en: {
      summary: 'Combined yearly gross income of both parents before taxes.',
      source: 'From official source (Section 4.1)',
      advice: 'Must be supported by a Tahsildar revenue certificate.',
    },
    hi: {
      summary: 'कर कटौती से पहले माता-पिता की संयुक्त वार्षिक कुल आय।',
      source: 'आधिकारिक नियम (धारा 4.1)',
      advice: 'तहसीलदार द्वारा जारी आय प्रमाण पत्र होना अनिवार्य है।',
    },
    mr: {
      summary: 'कर वजा करण्यापूर्वी आई-वडिलांचे एकूण वार्षिक एकत्रित उत्पन्न.',
      source: 'अधिकृत नियमावली (कलम ४.१)',
      advice: 'तहसीलदारांचे वैध उत्पन्न प्रमाणपत्र आवश्यक आहे.',
    },
  }[language];

  return (
    <div className="bg-surface-page p-6 rounded-2xl border border-border-subtle font-body shadow-xs">
      <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Illustrative Form Example</span>
        <span className="text-[11px] text-primary-container font-bold">Marginal companion</span>
      </div>

      {/* Simulated host form field */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            Annual Family Income (INR) <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] font-semibold text-primary-container bg-primary-tint px-2 py-0.5 rounded-full">
            ⓘ See description
          </span>
        </div>
        <div className="w-full h-10 border border-slate-300 rounded-lg bg-slate-50 flex items-center px-3 text-xs text-slate-400">
          e.g. 180000
        </div>
      </div>

      {/* FormAssist Marginal Note Floating Card */}
      <div
        className="bg-white rounded-2xl border border-border-subtle p-4 shadow-floating text-xs space-y-2.5 relative border-l-4 border-l-primary-container"
      >
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm text-text-primary font-display">
            Annual Family Income
          </div>
          <TagPill type="required" />
        </div>

        <p className="text-xs text-text-primary leading-relaxed font-medium">
          {sampleNote.summary}
        </p>

        <p className="text-[11px] text-text-secondary leading-normal">
          {sampleNote.advice}
        </p>

        <div className="pt-2 border-t border-surface-muted flex items-center justify-between">
          <SourceChip type="official" showCaption={false} />
          <div className="flex items-center gap-1 text-primary-container font-semibold text-xs">
            <Icon name="volume_up" className="w-4 h-4" />
            <span>Listen</span>
          </div>
        </div>
      </div>
    </div>
  );
};

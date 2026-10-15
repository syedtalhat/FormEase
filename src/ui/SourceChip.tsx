/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, t } from '../core/i18n';
import { Icon } from './Icon';

export type SourceLabelType = 'page' | 'official' | 'ai';

interface SourceChipProps {
  type: SourceLabelType;
  url?: string;
  className?: string;
  showCaption?: boolean;
  language?: SupportedLanguage;
}

export const SourceChip: React.FC<SourceChipProps> = ({
  type,
  url,
  className = '',
  showCaption = true,
  language = 'en',
}) => {
  if (type === 'official') {
    return (
      <div className={`inline-flex flex-col gap-0.5 ${className}`}>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-source-official-bg text-source-official border border-source-official/20">
          <Icon name="verified" className="w-3.5 h-3.5" />
          <span>{t('source_from_official', language)}</span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="ml-1 inline-flex items-center hover:underline opacity-80"
              aria-label={t('source_open_document', language)}
            >
              <Icon name="open_in_new" className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-source-page-bg text-source-page border border-source-page/20 ${className}`}>
        <Icon name="article" className="w-3.5 h-3.5" />
        <span>{t('source_from_page', language)}</span>
      </div>
    );
  }

  // AI Knowledge: clearly indicates less certainty
  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-source-ai-bg text-source-ai border border-dashed border-source-ai/40">
        <Icon name="auto_awesome" className="w-3.5 h-3.5" />
        <span>{t('source_ai_general', language)}</span>
      </div>
      {showCaption && (
        <span className="text-[10px] text-text-secondary pl-1 font-body">
          {t('source_not_checked', language)}
        </span>
      )}
    </div>
  );
};

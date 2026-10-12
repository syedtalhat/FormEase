/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, t } from '../../core/i18n';
import { RiskFlag } from '../../core/risk/classifier';
import { Icon } from '../../ui/Icon';

interface RiskBannerProps {
  flags: RiskFlag[];
  language?: SupportedLanguage;
  onDismiss: () => void;
}

export const RiskBanner: React.FC<RiskBannerProps> = ({
  flags,
  language = 'en',
  onDismiss,
}) => {
  const highFlags = flags.filter((f) => f.severity === 'high');
  if (highFlags.length === 0) return null;

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="mx-auto my-3 max-w-[960px] w-[95%] p-4 rounded-2xl flex items-start justify-between gap-3 text-sm z-[2147483645] bg-danger-bg border-[1.5px] border-danger text-[#7A1410] shadow-alert font-body animate-slideDown"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-danger text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Icon name="warning" className="w-5 h-5 text-white" />
        </div>

        <div className="space-y-1.5">
          <div className="font-display font-bold text-base text-[#93000A] leading-tight">
            {t('risk_banner_title', language)}
          </div>

          <div className="space-y-1 text-xs text-[#5C0A07] leading-relaxed">
            {flags.map((flag, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    flag.severity === 'high'
                      ? 'bg-danger text-white'
                      : 'bg-tag-unusual text-white'
                  }`}
                >
                  {flag.severity}
                </span>
                <span>
                  {t(flag.description_key as any, language, flag.meta)}
                </span>
              </div>
            ))}
          </div>

          {/* Mandatory microcopy principle per Section 5 */}
          <p className="text-[11px] text-[#7A1410] font-semibold pt-1">
            {t('risk_banner_disclaimer', language)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss security notice"
        className="text-[#93000A] hover:bg-danger/10 p-1.5 rounded-lg transition-colors shrink-0"
      >
        <Icon name="close" className="w-4 h-4" />
      </button>
    </aside>
  );
};

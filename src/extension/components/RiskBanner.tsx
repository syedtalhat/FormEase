/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { RiskFlag } from '../../types';

interface RiskBannerProps {
  flags: RiskFlag[];
  onDismiss: () => void;
}

export const RiskBanner: React.FC<RiskBannerProps> = ({ flags, onDismiss }) => {
  const highFlags = flags.filter((f) => f.severity === 'high');
  if (highFlags.length === 0) return null;

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="mx-auto my-3 max-w-[960px] w-[95%] p-4 rounded-2xl flex items-start justify-between gap-3 text-sm z-[9990] animate-slideDown"
      style={{
        backgroundColor: '#FDECEA',
        border: '1.5px solid #B3261E',
        color: '#7A1410',
        boxShadow: '0 12px 32px rgba(179, 38, 30, 0.18), 0 1px 2px rgba(31, 45, 54, 0.18)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#B3261E] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div
            className="font-bold text-[15px] leading-tight text-[#93000A] mb-1"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            FormAssist Security Warning
          </div>
          <div className="space-y-1 text-xs text-[#5C0A07] leading-relaxed">
            {highFlags.map((flag, idx) => (
              <div key={flag.id || idx} className="flex items-start gap-1.5">
                <span className="font-semibold">•</span>
                <span>{flag.description}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#7A1410] mt-1.5 font-medium">
            FormAssist advises verifying the official web address before typing any confidential credentials.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss risk alert"
        className="text-[#93000A] hover:bg-[#FFDAD6] p-1.5 rounded-lg transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};

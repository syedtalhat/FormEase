/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  MessageSquare,
  Power,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Language, SessionState } from '../../types';
import { getCurrentUser } from '../../core/auth/supabaseAuth';

interface PopupViewProps {
  isEnabled: boolean;
  state: SessionState;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onToggleEnabled: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  fieldsCount: number;
  riskCount: number;
  currentDomain: string;
}

export const PopupView: React.FC<PopupViewProps> = ({
  isEnabled,
  state,
  language,
  onLanguageChange,
  onToggleEnabled,
  onOpenChat,
  onOpenSettings,
  fieldsCount,
  riskCount,
  currentDomain,
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u?.email) setUserEmail(u.email);
    });
  }, []);
  return (
    <div
      className="w-[360px] bg-[#F7FAFB] text-[#1F2D36] border border-[#DDE4E8] rounded-2xl shadow-xl overflow-hidden font-sans"
      style={{ fontFamily: "'Mukta', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-[#0E5A64] text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              FA
            </div>
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
            >
              FormAssist
            </h1>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
            v1.0 MV3
          </span>
        </div>
        <p className="text-xs text-[#8FCFDB]">
          Accessible form companion &amp; privacy-first overlay
        </p>
      </div>

      {/* Main Controls */}
      <div className="p-4 space-y-4">
        {/* Toggle Switch */}
        <div className="bg-white rounded-xl p-3.5 border border-[#DDE4E8] flex items-center justify-between shadow-xs">
          <div>
            <div className="font-semibold text-sm text-[#1F2D36]">Enable on this page</div>
            <div className="text-xs text-[#4A5B66] truncate max-w-[200px]">
              {currentDomain || 'Current web form'}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleEnabled}
            aria-label="Toggle FormAssist on this page"
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              isEnabled ? 'bg-[#0E5A64]' : 'bg-[#DDE4E8]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5 ${
                isEnabled ? 'left-6.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-xl p-3.5 border border-[#DDE4E8] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4A5B66] mb-2 uppercase tracking-wide">
            <Globe className="w-3.5 h-3.5" />
            <span>Assistance Language</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'mr', label: 'मराठी' },
            ].map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onLanguageChange(l.id as Language)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                  language === l.id
                    ? 'bg-[#E3F0F1] border-[#0E5A64] text-[#0E5A64]'
                    : 'bg-[#F7FAFB] border-[#DDE4E8] text-[#4A5B66] hover:bg-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page Status Card */}
        <div className="bg-white rounded-xl p-3.5 border border-[#DDE4E8] text-xs space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#4A5B66]">Extension State:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#0E5A64] bg-[#E3F0F1] px-2 py-0.5 rounded-full capitalize">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E5A64] animate-pulse" />
              {state.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#4A5B66]">Detected Form Fields:</span>
            <span className="font-semibold text-[#1F2D36]">
              {isEnabled ? `${fieldsCount} fields tagged` : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#4A5B66]">Risk Flags:</span>
            {riskCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[#8F4200] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {riskCount} flagged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#17724A] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zero risks
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenChat}
            disabled={!isEnabled}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0E5A64] text-white text-xs font-semibold hover:bg-[#0A4249] disabled:opacity-40 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open Companion</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#6B7B85] text-[#1F2D36] text-xs font-semibold hover:bg-white transition-colors"
          >
            <span>Preferences</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer Privacy Stamp & Account Badge */}
      <div className="bg-[#E4F4EC] text-[#17724A] px-4 py-2 border-t border-[#17724A]/20 flex items-center justify-between text-[11px] font-medium">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Redaction Active</span>
        </span>
        <span className="text-[10px] text-[#0E5A64] font-semibold truncate max-w-[140px]">
          {userEmail ? userEmail : 'Guest (Local)'}
        </span>
      </div>
    </div>
  );
};

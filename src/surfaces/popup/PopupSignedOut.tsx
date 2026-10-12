/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

interface PopupSignedOutProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
  activeDomain?: string;
}

export const PopupSignedOut: React.FC<PopupSignedOutProps> = ({
  onSignIn,
  onCreateAccount,
  activeDomain = 'scholarships.gov.in',
}) => {
  return (
    <div
      className="w-[360px] bg-surface-page text-text-primary rounded-2xl border border-border-subtle shadow-xl overflow-hidden font-body"
      style={{ width: '360px' }}
    >
      {/* Brand Header */}
      <div className="bg-primary-container text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-display font-bold text-sm">
              FA
            </div>
            <h1 className="font-display font-bold text-lg leading-tight">FormAssist</h1>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
            v1.0
          </span>
        </div>
        <p className="text-xs text-primary-tint/90">
          Patient assistance for official web paperwork
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Domain note */}
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle text-xs">
          <span className="text-text-secondary">Active website: </span>
          <span className="font-semibold text-text-primary">{activeDomain}</span>
        </div>

        {/* Locked Languages per p1 */}
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <Icon name="language" className="w-3.5 h-3.5" />
            <span>Assistance Languages</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <div className="py-2 px-1 rounded-lg border border-primary-container bg-primary-tint text-primary-container font-bold text-center">
              English
            </div>
            <div className="py-2 px-1 rounded-lg border border-border-subtle bg-surface-page text-text-disabled flex items-center justify-center gap-1">
              <Icon name="lock" className="w-3 h-3 text-text-disabled" />
              <span>हिन्दी</span>
            </div>
            <div className="py-2 px-1 rounded-lg border border-border-subtle bg-surface-page text-text-disabled flex items-center justify-center gap-1">
              <Icon name="lock" className="w-3 h-3 text-text-disabled" />
              <span>मराठी</span>
            </div>
          </div>

          <p className="text-[11px] text-text-secondary leading-snug">
            Sign in to use हिन्दी and मराठी explanations and save your chat questions.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2 pt-1">
          <Button variant="primary" size="lg" fullWidth onClick={onCreateAccount}>
            Create account
          </Button>
          <Button variant="secondary" size="md" fullWidth onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      </div>

      {/* Privacy Guarantee Stamp */}
      <div className="bg-source-official-bg text-source-official px-4 py-2.5 border-t border-source-official/20 flex items-center gap-1.5 text-[11px] font-semibold">
        <Icon name="verified" className="w-3.5 h-3.5 shrink-0" />
        <span>Only questions are read — never your answers.</span>
      </div>
    </div>
  );
};

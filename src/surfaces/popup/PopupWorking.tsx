/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { StepItem, Stepper } from '../../ui/Stepper';

interface PopupWorkingProps {
  currentStep: 1 | 2 | 3;
  fieldsCount?: number;
  onDeactivate: () => void;
}

export const PopupWorking: React.FC<PopupWorkingProps> = ({
  currentStep,
  fieldsCount = 0,
  onDeactivate,
}) => {
  const steps: StepItem[] = [
    {
      id: 1,
      label: 'Reading the form',
      status: currentStep > 1 ? 'completed' : 'in_progress',
      detail: currentStep > 1 ? `${fieldsCount} questions identified` : 'Scanning fields…',
    },
    {
      id: 2,
      label: 'Checking for anything unusual',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending',
      detail: currentStep === 2 ? 'Reviewing request safety…' : undefined,
    },
    {
      id: 3,
      label: 'Writing simple explanations',
      status: currentStep === 3 ? 'in_progress' : 'pending',
      detail: currentStep === 3 ? 'Matching plain terms…' : undefined,
    },
  ];

  return (
    <div
      className="w-[360px] bg-surface-page text-text-primary rounded-2xl border border-border-subtle shadow-xl overflow-hidden font-body"
      style={{ width: '360px' }}
    >
      <div className="bg-primary-container text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-display font-bold text-sm">
              FA
            </div>
            <h1 className="font-display font-bold text-lg leading-tight">Working…</h1>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-marigold animate-ping" />
        </div>
        <p className="text-xs text-primary-tint/90">
          Analyzing questions and official guidelines
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs">
          <Stepper steps={steps} />
        </div>

        <div className="p-3 bg-surface-muted rounded-xl text-xs text-text-secondary flex items-start gap-2">
          <Icon name="verified" className="w-4 h-4 text-source-official shrink-0 mt-0.5" />
          <span>Only the form&apos;s questions are read — never your answers.</span>
        </div>

        <Button variant="secondary" size="md" fullWidth onClick={onDeactivate}>
          Turn off
        </Button>
      </div>
    </div>
  );
};

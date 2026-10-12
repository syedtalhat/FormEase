/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Icon } from '../../ui/Icon';
import { StepItem, Stepper } from '../../ui/Stepper';

interface ProgressCardProps {
  currentStep: 1 | 2 | 3;
  fieldsCount?: number;
  onDismiss?: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  currentStep,
  fieldsCount = 0,
  onDismiss,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const steps: StepItem[] = [
    {
      id: 1,
      label: 'Reading the form',
      status: currentStep > 1 ? 'completed' : 'in_progress',
      detail: currentStep > 1 ? `${fieldsCount} questions identified` : undefined,
    },
    {
      id: 2,
      label: 'Checking for anything unusual',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending',
    },
    {
      id: 3,
      label: 'Writing simple explanations',
      status: currentStep === 3 ? 'in_progress' : 'pending',
    },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[2147483647] bg-surface-card rounded-2xl border border-border-subtle shadow-floating font-body text-text-primary p-4 w-[320px] max-w-[90vw] animate-slideUp"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-xs">
            FA
          </div>
          <span className="font-display font-bold text-sm text-primary-container">
            FormAssist Working…
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:bg-surface-muted"
            aria-label={collapsed ? 'Expand progress' : 'Collapse progress'}
          >
            <Icon name={collapsed ? 'expand_less' : 'expand_more'} className="w-4 h-4" />
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="w-6 h-6 rounded flex items-center justify-center text-text-secondary hover:bg-surface-muted"
              aria-label="Dismiss progress"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3">
          <Stepper steps={steps} />
          <p className="text-[11px] text-text-secondary italic pt-1 border-t border-surface-muted">
            Only questions are read — never your answers.
          </p>
        </div>
      )}
    </div>
  );
};

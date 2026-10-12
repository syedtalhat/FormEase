/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from './Icon';

export interface StepItem {
  id: number;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  detail?: string;
}

interface StepperProps {
  steps: StepItem[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, className = '' }) => {
  return (
    <div className={`space-y-3 font-body ${className}`}>
      {steps.map((step, idx) => {
        const isDone = step.status === 'completed';
        const isCurrent = step.status === 'in_progress';

        return (
          <div key={step.id} className="flex items-start gap-3">
            {/* Step indicator */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                isDone
                  ? 'bg-source-official text-white'
                  : isCurrent
                  ? 'bg-primary-container text-white ring-4 ring-primary-tint'
                  : 'bg-surface-muted text-text-disabled'
              }`}
            >
              {isDone ? (
                <Icon name="check" className="w-3.5 h-3.5" />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>

            {/* Label and detail */}
            <div className="flex-1">
              <div
                className={`text-sm leading-snug ${
                  isDone
                    ? 'text-text-primary font-medium'
                    : isCurrent
                    ? 'text-primary-container font-semibold'
                    : 'text-text-disabled'
                }`}
              >
                {step.label}
              </div>
              {step.detail && (
                <div className="text-xs text-text-secondary mt-0.5">
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

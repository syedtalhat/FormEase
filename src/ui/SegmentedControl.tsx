/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  locked?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  loadingValue?: T | null;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  loadingValue,
  disabled = false,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={`bg-surface-muted p-1 rounded-xl flex items-center gap-1 select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const isLoading = loadingValue === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || opt.locked}
            onClick={() => !opt.locked && onChange(opt.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 font-body font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-container ${
              size === 'sm' ? 'py-1 px-2 text-xs min-h-[36px]' : 'py-2 px-3 text-sm min-h-[44px]'
            } ${
              isSelected
                ? 'bg-surface-card text-primary-container shadow-xs font-bold'
                : 'text-text-secondary hover:text-text-primary'
            } ${opt.locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span>{opt.label}</span>
            {isLoading && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping inline-block" />
            )}
          </button>
        );
      })}
    </div>
  );
}

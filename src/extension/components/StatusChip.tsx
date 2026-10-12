/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FieldRiskTag } from '../../types';

interface StatusChipProps {
  tag: FieldRiskTag;
  labelOverride?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ tag, labelOverride }) => {
  if (tag === 'unusual') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: '#FFEBD5',
          color: '#8F4200',
          minHeight: '28px',
        }}
      >
        <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{labelOverride || 'Unusual request'}</span>
      </span>
    );
  }

  if (tag === 'optional') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: '#ECEFF1',
          color: '#4A5B66',
          minHeight: '28px',
        }}
      >
        <span className="w-2 h-2 rounded-full border border-[#4A5B66]" />
        <span>{labelOverride || 'Optional'}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: '#E3F0F1',
        color: '#0E5A64',
        minHeight: '28px',
      }}
    >
      <span className="w-2 h-2 rounded-full bg-[#0E5A64]" />
      <span>{labelOverride || 'Required'}</span>
    </span>
  );
};

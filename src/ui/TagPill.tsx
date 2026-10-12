/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Icon } from './Icon';

export type TagType = 'required' | 'optional' | 'unusual';

interface TagPillProps {
  type: TagType;
  label?: string;
  className?: string;
}

export const TagPill: React.FC<TagPillProps> = ({ type, label, className = '' }) => {
  if (type === 'unusual') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold min-h-[32px] bg-tag-unusual-bg text-tag-unusual ${className}`}
      >
        <Icon name="warning" className="w-3.5 h-3.5" />
        <span>{label || 'Unusual'}</span>
      </span>
    );
  }

  if (type === 'optional') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold min-h-[32px] bg-surface-muted text-tag-optional ${className}`}
      >
        <span className="w-2 h-2 rounded-full border border-tag-optional inline-block" />
        <span>{label || 'Optional'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold min-h-[32px] bg-primary-tint text-tag-required ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-tag-required inline-block" />
      <span>{label || 'Required'}</span>
    </span>
  );
};

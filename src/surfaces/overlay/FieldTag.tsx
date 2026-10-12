/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TagPill, TagType } from '../../ui/TagPill';

interface FieldTagProps {
  fieldKey: string;
  tagType: TagType;
  label?: string;
  onClick: () => void;
  className?: string;
}

export const FieldTag: React.FC<FieldTagProps> = ({
  tagType,
  label,
  onClick,
  className = '',
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex items-center gap-1.5 cursor-pointer select-none font-body text-xs font-semibold rounded-full p-0.5 pr-2 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container ${className}`}
      aria-label={`View FormAssist note: ${tagType}`}
    >
      <TagPill type={tagType} label={label} />
    </div>
  );
};

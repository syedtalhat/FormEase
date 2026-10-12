/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

interface ErrorCardProps {
  errorKind?: 'no_form' | 'network';
  onRetry: () => void;
  onDismiss: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  errorKind = 'network',
  onRetry,
  onDismiss,
}) => {
  const isNoForm = errorKind === 'no_form';

  const title = isNoForm ? 'No form fields found' : "Couldn't get explanations";
  const desc = isNoForm
    ? 'FormAssist looked across this page but did not find standard form fields to explain.'
    : 'Unable to connect to the explanation service. Please check your internet connection.';

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-[2147483647] bg-surface-card rounded-2xl border border-danger shadow-floating p-4 w-[340px] max-w-[90vw] font-body text-text-primary animate-slideUp space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-danger text-white flex items-center justify-center shrink-0">
          <Icon name="warning" className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="font-display font-bold text-sm text-danger leading-tight">{title}</h4>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">{desc}</p>
        </div>
      </div>

      {/* NFR-REL.1: Retry and Dismiss always present and operational */}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-muted">
        <Button variant="danger" size="sm" onClick={onRetry} className="flex-1">
          <div className="flex items-center gap-1.5">
            <Icon name="refresh" className="w-3.5 h-3.5" />
            <span>Retry</span>
          </div>
        </Button>
        <Button variant="secondary" size="sm" onClick={onDismiss} className="flex-1">
          Dismiss
        </Button>
      </div>
    </div>
  );
};

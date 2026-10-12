/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

interface PopupErrorProps {
  errorKind?: 'no_form' | 'network';
  onRetry: () => void;
  onDismiss: () => void;
}

export const PopupError: React.FC<PopupErrorProps> = ({
  errorKind = 'network',
  onRetry,
  onDismiss,
}) => {
  const isNoForm = errorKind === 'no_form';

  const title = isNoForm ? 'No form found' : 'Could not load explanations';
  const message = isNoForm
    ? 'FormAssist did not find any form fields on this page to explain.'
    : 'We could not connect to get simple explanations. Please check your connection and try again.';

  return (
    <div
      className="w-[360px] bg-surface-page text-text-primary rounded-2xl border border-border-subtle shadow-xl overflow-hidden font-body"
      style={{ width: '360px' }}
    >
      <div className="bg-danger text-white p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-display font-bold text-sm">
            <Icon name="warning" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">{title}</h1>
            <span className="text-xs text-danger-bg opacity-90">Please choose how to proceed</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs text-xs text-text-secondary leading-relaxed">
          {message}
        </div>

        {/* NFR-REL.1: Both Retry and Dismiss buttons must always be present and functional */}
        <div className="space-y-2">
          <Button variant="primary" size="lg" fullWidth onClick={onRetry}>
            <div className="flex items-center gap-2">
              <Icon name="refresh" className="w-4 h-4" />
              <span>Retry</span>
            </div>
          </Button>

          <Button variant="secondary" size="md" fullWidth onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};

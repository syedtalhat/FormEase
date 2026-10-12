/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SessionState } from '../types';

export interface StateMachineListener {
  (newState: SessionState, previousState: SessionState, payload?: unknown): void;
}

export class FormAssistStateMachine {
  private currentState: SessionState = 'idle';
  private focusedFieldId: string | null = null;
  private errorMessage: string | null = null;
  private listeners: Set<StateMachineListener> = new Set();
  private history: { from: SessionState; to: SessionState; timestamp: number; reason?: string }[] = [];

  constructor(initialState: SessionState = 'idle') {
    this.currentState = initialState;
    this.history.push({
      from: 'idle',
      to: initialState,
      timestamp: Date.now(),
      reason: 'Initialization',
    });
  }

  public getState(): SessionState {
    return this.currentState;
  }

  public getFocusedFieldId(): string | null {
    return this.focusedFieldId;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getHistory() {
    return [...this.history];
  }

  public subscribe(listener: StateMachineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private transition(to: SessionState, reason?: string, payload?: unknown): boolean {
    const from = this.currentState;
    if (from === to && to !== 'field_focused' && to !== 'chat_open') {
      return false;
    }

    this.currentState = to;
    this.history.push({ from, to, timestamp: Date.now(), reason });
    this.listeners.forEach((listener) => {
      try {
        listener(to, from, payload);
      } catch (err) {
        console.error('State machine listener error:', err);
      }
    });
    return true;
  }

  // Trigger: User activates extension on page (clicks toolbar icon or sandbox toggle)
  public activate(): void {
    if (this.currentState === 'idle' || this.currentState === 'deactivated' || this.currentState === 'error') {
      this.errorMessage = null;
      this.transition('scanning', 'User activated extension');
    }
  }

  // Trigger: DOM extraction completed
  public extractionComplete(fieldsCount: number): void {
    if (this.currentState === 'scanning') {
      if (fieldsCount > 0) {
        this.transition('analyzing', `Extracted ${fieldsCount} form fields`);
      } else {
        this.errorMessage = 'No form fields detected on this page.';
        this.transition('error', 'Zero fields detected');
      }
    }
  }

  // Trigger: Explanations and risk tags received from backend
  public analysisComplete(): void {
    if (this.currentState === 'analyzing') {
      this.errorMessage = null;
      this.transition('ready', 'Form analysis and risk classification complete');
    }
  }

  // Trigger: User focuses a field or clicks inline badge
  public focusField(fieldId: string): void {
    this.focusedFieldId = fieldId;
    if (this.currentState === 'ready') {
      this.transition('field_focused', `Focused field ${fieldId}`, { fieldId });
    } else if (this.currentState === 'chat_open') {
      // In chat mode, updating focus stays in chat mode but notifies listeners
      this.transition('chat_open', `Updated chat field context to ${fieldId}`, { fieldId });
    }
  }

  // Trigger: Field blurred or clicked outside
  public blurField(): void {
    this.focusedFieldId = null;
    if (this.currentState === 'field_focused') {
      this.transition('ready', 'Field blurred');
    }
  }

  // Trigger: User opens chat or taps "Ask in chat"
  public openChat(fieldId?: string): void {
    if (fieldId) {
      this.focusedFieldId = fieldId;
    }
    if (
      this.currentState === 'ready' ||
      this.currentState === 'field_focused' ||
      this.currentState === 'chat_open'
    ) {
      this.transition('chat_open', 'Chat drawer opened', { fieldId: this.focusedFieldId });
    }
  }

  // Trigger: User closes chat drawer
  public closeChat(): void {
    if (this.currentState === 'chat_open') {
      this.transition('ready', 'Chat drawer closed');
    }
  }

  // Trigger: MutationObserver detects new dynamic fields
  public dynamicFieldsDetected(): void {
    if (this.currentState === 'ready' || this.currentState === 'field_focused') {
      this.transition('scanning', 'MutationObserver: New dynamic fields detected');
    }
  }

  // Trigger: Network or Gemini API failure
  public fail(message: string): void {
    this.errorMessage = message;
    this.transition('error', `Failure: ${message}`);
  }

  // Trigger: User retries from Error state (NFR-REL.1)
  public retry(): void {
    if (this.currentState === 'error') {
      this.errorMessage = null;
      this.transition('scanning', 'User initiated retry');
    }
  }

  // Trigger: User dismisses error state (NFR-REL.1)
  public dismiss(): void {
    if (this.currentState === 'error') {
      this.errorMessage = null;
      this.transition('idle', 'User dismissed error state');
    }
  }

  // Trigger: Explicit deactivation or tab closed
  public deactivate(): void {
    this.focusedFieldId = null;
    this.transition('deactivated', 'Extension deactivated');
  }

  // Reset back to idle (for testing/workbench)
  public resetToIdle(): void {
    this.focusedFieldId = null;
    this.errorMessage = null;
    this.transition('idle', 'Workbench reset to idle');
  }
}

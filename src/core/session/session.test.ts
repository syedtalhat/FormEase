/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { INITIAL_SESSION_STATE, sessionReducer } from './reducer';
import { SessionEvent, SessionState, SessionStateType } from './types';

describe('Figure 2 Session State Machine Reducer', () => {
  it('walks the primary happy path: idle -> scanning -> analyzing -> ready -> fieldFocused -> chatOpen', () => {
    let state = INITIAL_SESSION_STATE;
    expect(state.current).toBe('idle');

    // 1. Activate
    state = sessionReducer(state, { type: 'ACTIVATE' });
    expect(state.current).toBe('scanning');

    // 2. Extraction complete
    state = sessionReducer(state, { type: 'EXTRACTION_DONE' });
    expect(state.current).toBe('analyzing');

    // 3. Analysis complete
    state = sessionReducer(state, {
      type: 'ANALYSIS_DONE',
      fields: [
        {
          field_key: 'income',
          label: 'Annual Family Income',
          input_type: 'number',
          required: true,
          risk_tag: 'required',
        },
      ],
      riskFlags: [],
    });
    expect(state.current).toBe('ready');
    expect(state.context.fields.length).toBe(1);

    // 4. User focuses a field
    state = sessionReducer(state, { type: 'FIELD_FOCUS', fieldId: 'income' });
    expect(state.current).toBe('fieldFocused');
    expect(state.context.focusedFieldId).toBe('income');

    // 5. Ask in chat
    state = sessionReducer(state, { type: 'ASK_IN_CHAT' });
    expect(state.current).toBe('chatOpen');
    expect(state.context.focusedFieldId).toBe('income');

    // 6. User focuses another field while chat is open (self-loop)
    state = sessionReducer(state, { type: 'FIELD_FOCUS', fieldId: 'domicile' });
    expect(state.current).toBe('chatOpen');
    expect(state.context.focusedFieldId).toBe('domicile');

    // 7. Close chat
    state = sessionReducer(state, { type: 'CLOSE_CHAT' });
    expect(state.current).toBe('ready');

    // 8. Dynamic field mutation (dashed blue arrow in Fig 2)
    state = sessionReducer(state, { type: 'DOM_MUTATED' });
    expect(state.current).toBe('scanning');
  });

  it('guarantees NFR-REL.1: Error state always allows both Retry and Dismiss', () => {
    // Failure in scanning (no form found)
    let state: SessionState = { ...INITIAL_SESSION_STATE, current: 'scanning' };
    state = sessionReducer(state, { type: 'NO_FORM_FOUND' });
    expect(state.current).toBe('error');
    expect(state.context.errorKind).toBe('no_form');

    // Retry path -> goes back to scanning
    const retried = sessionReducer(state, { type: 'RETRY' });
    expect(retried.current).toBe('scanning');

    // Dismiss path -> goes back to idle
    const dismissed = sessionReducer(state, { type: 'DISMISS' });
    expect(dismissed.current).toBe('idle');

    // Failure in analyzing (API failed)
    let stateAnalyzing: SessionState = { ...INITIAL_SESSION_STATE, current: 'analyzing' };
    stateAnalyzing = sessionReducer(stateAnalyzing, { type: 'API_FAILED' });
    expect(stateAnalyzing.current).toBe('error');
    expect(stateAnalyzing.context.errorKind).toBe('network');

    const retried2 = sessionReducer(stateAnalyzing, { type: 'RETRY' });
    expect(retried2.current).toBe('scanning');
    const dismissed2 = sessionReducer(stateAnalyzing, { type: 'DISMISS' });
    expect(dismissed2.current).toBe('idle');
  });

  it('verifies UC-4: Language switch does not change state', () => {
    const state: SessionState = {
      ...INITIAL_SESSION_STATE,
      current: 'ready',
      context: { ...INITIAL_SESSION_STATE.context, language: 'en' },
    };

    const next = sessionReducer(state, { type: 'SET_LANGUAGE', language: 'hi' });
    expect(next.current).toBe('ready');
    expect(next.context.language).toBe('hi');
  });

  it('ignores illegal transitions and preserves state unchanged', () => {
    const table: { from: SessionStateType; illegalEvent: SessionEvent }[] = [
      { from: 'idle', illegalEvent: { type: 'ANALYSIS_DONE', fields: [], riskFlags: [] } },
      { from: 'idle', illegalEvent: { type: 'FIELD_FOCUS', fieldId: 'test' } },
      { from: 'scanning', illegalEvent: { type: 'CLOSE_CHAT' } },
      { from: 'ready', illegalEvent: { type: 'EXTRACTION_DONE' } },
      { from: 'error', illegalEvent: { type: 'FIELD_BLUR' } },
    ];

    table.forEach(({ from, illegalEvent }) => {
      const state: SessionState = { ...INITIAL_SESSION_STATE, current: from };
      const next = sessionReducer(state, illegalEvent);
      expect(next.current).toBe(from);
    });
  });
});

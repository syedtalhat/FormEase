/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SessionEvent, SessionState } from './types';

export const INITIAL_SESSION_STATE: SessionState = {
  current: 'idle',
  context: {
    language: 'en',
    fields: [],
    riskFlags: [],
    speaking: false,
  },
};

/**
 * Pure state machine reducer implementing Figure 2 / SRS Section 6.
 * All invalid transitions are no-ops returning the previous state.
 */
export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  // Cross-cutting event: SET_LANGUAGE (UC-4: does not change state)
  if (event.type === 'SET_LANGUAGE') {
    return {
      ...state,
      context: {
        ...state.context,
        language: event.language,
      },
    };
  }

  // Cross-cutting event: SET_SPEAKING
  if (event.type === 'SET_SPEAKING') {
    return {
      ...state,
      context: {
        ...state.context,
        speaking: event.speaking,
      },
    };
  }

  // Deactivation: from ready / fieldFocused / chatOpen
  if (event.type === 'TAB_CLOSED' || event.type === 'DEACTIVATE') {
    if (
      state.current === 'ready' ||
      state.current === 'fieldFocused' ||
      state.current === 'chatOpen' ||
      state.current === 'idle' ||
      state.current === 'error'
    ) {
      return {
        ...state,
        current: 'deactivated',
        context: {
          ...state.context,
          focusedFieldId: undefined,
          speaking: false,
        },
      };
    }
    return state;
  }

  switch (state.current) {
    case 'idle':
      if (event.type === 'ACTIVATE') {
        return {
          ...state,
          current: 'scanning',
          context: {
            ...state.context,
            errorKind: undefined,
          },
        };
      }
      return state;

    case 'scanning':
      if (event.type === 'EXTRACTION_DONE') {
        return {
          ...state,
          current: 'analyzing',
          context: {
            ...state.context,
            fields: event.fields || state.context.fields,
          },
        };
      }
      if (event.type === 'NO_FORM_FOUND') {
        return {
          ...state,
          current: 'error',
          context: {
            ...state.context,
            errorKind: 'no_form',
          },
        };
      }
      return state;

    case 'analyzing':
      if (event.type === 'ANALYSIS_DONE') {
        return {
          ...state,
          current: 'ready',
          context: {
            ...state.context,
            fields: event.fields,
            riskFlags: event.riskFlags,
            errorKind: undefined,
          },
        };
      }
      if (event.type === 'API_FAILED') {
        return {
          ...state,
          current: 'error',
          context: {
            ...state.context,
            errorKind: 'network',
          },
        };
      }
      return state;

    case 'ready':
      if (event.type === 'FIELD_FOCUS') {
        return {
          ...state,
          current: 'fieldFocused',
          context: {
            ...state.context,
            focusedFieldId: event.fieldId,
          },
        };
      }
      if (event.type === 'OPEN_CHAT') {
        return {
          ...state,
          current: 'chatOpen',
          context: {
            ...state.context,
            focusedFieldId: event.fieldId || state.context.focusedFieldId,
          },
        };
      }
      if (event.type === 'DOM_MUTATED') {
        return {
          ...state,
          current: 'scanning',
        };
      }
      return state;

    case 'fieldFocused':
      if (event.type === 'FIELD_BLUR') {
        return {
          ...state,
          current: 'ready',
          context: {
            ...state.context,
            focusedFieldId: undefined,
            speaking: false,
          },
        };
      }
      if (event.type === 'ASK_IN_CHAT') {
        return {
          ...state,
          current: 'chatOpen',
          context: {
            ...state.context,
            focusedFieldId: event.fieldId || state.context.focusedFieldId,
          },
        };
      }
      if (event.type === 'FIELD_FOCUS') {
        return {
          ...state,
          context: {
            ...state.context,
            focusedFieldId: event.fieldId,
          },
        };
      }
      return state;

    case 'chatOpen':
      if (event.type === 'FIELD_FOCUS') {
        // Self-loop: updates focusedFieldId in context without leaving chatOpen
        return {
          ...state,
          context: {
            ...state.context,
            focusedFieldId: event.fieldId,
          },
        };
      }
      if (event.type === 'CLOSE_CHAT') {
        return {
          ...state,
          current: 'ready',
        };
      }
      return state;

    case 'error':
      if (event.type === 'RETRY') {
        return {
          ...state,
          current: 'scanning',
          context: {
            ...state.context,
            errorKind: undefined,
          },
        };
      }
      if (event.type === 'DISMISS') {
        return {
          ...state,
          current: 'idle',
          context: {
            ...state.context,
            errorKind: undefined,
          },
        };
      }
      return state;

    case 'deactivated':
      if (event.type === 'ACTIVATE') {
        return {
          ...state,
          current: 'scanning',
        };
      }
      return state;

    default:
      return state;
  }
}

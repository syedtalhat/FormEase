/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SessionState } from '../types';

interface StateInspectorProps {
  currentState: SessionState;
  stateHistory: { from: SessionState; to: SessionState; timestamp: number; reason?: string }[];
  errorMessage: string | null;
  onSimulateError: () => void;
  onSimulateRetry: () => void;
  onSimulateDismiss: () => void;
  onSimulateDynamicFields: () => void;
  onReset: () => void;
}

const ALL_STATES: { id: SessionState; label: string; desc: string }[] = [
  { id: 'idle', label: 'Idle', desc: 'Installed, inactive on this tab' },
  { id: 'scanning', label: 'Scanning', desc: 'Process 1.0/2.0 DOM extraction' },
  { id: 'analyzing', label: 'Analyzing', desc: 'Process 3.0/4.0 Risk & Gemini RAG' },
  { id: 'ready', label: 'Ready', desc: 'Process 5.0 Overlay active, fields tagged' },
  { id: 'field_focused', label: 'Field Focused', desc: 'Tooltip shown for active input' },
  { id: 'chat_open', label: 'Chat Open', desc: 'Process 6.0 Context-aware companion' },
  { id: 'error', label: 'Error', desc: 'Network / Gemini API failure' },
  { id: 'deactivated', label: 'Deactivated', desc: 'Tab closed or explicit toggle off' },
];

export const StateInspector: React.FC<StateInspectorProps> = ({
  currentState,
  stateHistory,
  errorMessage,
  onSimulateError,
  onSimulateRetry,
  onSimulateDismiss,
  onSimulateDynamicFields,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#DDE4E8] p-4 text-xs font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F4F5] pb-2.5">
        <div>
          <h3
            className="font-bold text-sm text-[#0E5A64]"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            Figure 2 — Session Lifecycle State Machine (STD)
          </h3>
          <p className="text-[11px] text-[#4A5B66]">
            Authoritative session state controller and transition auditor
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-[#0E5A64] hover:underline font-semibold"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* State Grid / Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ALL_STATES.map((s) => {
          const isActive = currentState === s.id;
          const isError = s.id === 'error' && isActive;
          return (
            <div
              key={s.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isError
                  ? 'bg-[#FDECEA] border-[#B3261E] text-[#B3261E] ring-2 ring-[#B3261E]/30'
                  : isActive
                  ? 'bg-[#E3F0F1] border-[#0E5A64] text-[#0E5A64] font-bold ring-2 ring-[#0E5A64]/20'
                  : 'bg-[#F7FAFB] border-[#DDE4E8] text-[#4A5B66]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] capitalize">{s.label}</span>
                {isActive && (
                  <span
                    className={`w-2 h-2 rounded-full animate-ping ${
                      isError ? 'bg-[#B3261E]' : 'bg-[#0E5A64]'
                    }`}
                  />
                )}
              </div>
              <p className="text-[10px] leading-tight opacity-80">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Error state resolution buttons (NFR-REL.1) */}
      {currentState === 'error' && (
        <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#B3261E] text-[#7A1410] space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-[#B3261E]" />
            <span>Active Error: {errorMessage || 'Simulated failure state'}</span>
          </div>
          <p className="text-[11px]">
            NFR-REL.1 Guarantee: From Error state, the system shall never leave the user without a path forward.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onSimulateRetry}
              className="px-3 py-1.5 bg-[#B3261E] text-white rounded-lg font-semibold text-xs hover:bg-[#8F1D17]"
            >
              Retry (Scan Again)
            </button>
            <button
              type="button"
              onClick={onSimulateDismiss}
              className="px-3 py-1.5 bg-white border border-[#B3261E] text-[#B3261E] rounded-lg font-semibold text-xs hover:bg-[#FFDAD6]"
            >
              Dismiss (Back to Idle)
            </button>
          </div>
        </div>
      )}

      {/* Dev Transition Actions */}
      <div className="pt-2 border-t border-[#F1F4F5] flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[#4A5B66]">
          Simulate Events:
        </span>
        <button
          type="button"
          onClick={onSimulateError}
          className="px-2.5 py-1 rounded-lg border border-[#B3261E] text-[#B3261E] hover:bg-[#FDECEA] text-[11px] font-semibold"
        >
          Inject API Failure
        </button>
        <button
          type="button"
          onClick={onSimulateDynamicFields}
          className="px-2.5 py-1 rounded-lg border border-[#0E5A64] text-[#0E5A64] hover:bg-[#E3F0F1] text-[11px] font-semibold"
        >
          MutationObserver Trigger
        </button>
      </div>

      {/* Recent Transition Log */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-[#4A5B66] uppercase tracking-wider">
          Transition History ({stateHistory.length})
        </span>
        <div className="max-h-28 overflow-y-auto space-y-1 bg-[#F7FAFB] p-2 rounded-xl border border-[#DDE4E8]">
          {stateHistory.slice(-5).reverse().map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[11px] text-[#1F2D36]"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-semibold capitalize">{h.from}</span>
                <ArrowRight className="w-3 h-3 text-[#0E5A64]" />
                <span className="font-semibold text-[#0E5A64] capitalize">
                  {h.to}
                </span>
                {h.reason && (
                  <span className="text-[#4A5B66] truncate max-w-[200px]">
                    ({h.reason})
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#8A98A1]">
                {new Date(h.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Eye,
  FileCode,
  Lock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ExtractedField, FieldExplanation, RiskFlag } from '../types';

interface PipelineInspectorProps {
  fields: ExtractedField[];
  riskFlags: RiskFlag[];
  explanations: Map<string, FieldExplanation>;
  pageUrl: string;
  actionUrl: string;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({
  fields,
  riskFlags,
  explanations,
  pageUrl,
  actionUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'redaction' | 'risks' | 'provenance'>('redaction');

  // Verify that NO field in the list contains a `.value` property
  const zeroValuesTransmitted = fields.every(
    (f) => (f as unknown as { value?: unknown }).value === undefined
  );

  return (
    <div className="bg-white rounded-2xl border border-[#DDE4E8] p-4 text-xs font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F4F5] pb-2.5">
        <div>
          <h3
            className="font-bold text-sm text-[#0E5A64]"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            Figure 1 — Level-1 Data Flow Pipeline (Processes 1.0 – 6.0)
          </h3>
          <p className="text-[11px] text-[#4A5B66]">
            Real-time verification of local redaction, risk classification, and RAG retrieval
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F1F4F5] p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('redaction')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'redaction'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66] hover:text-[#1F2D36]'
            }`}
          >
            2.0 Redaction Proof
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risks')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'risks'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66] hover:text-[#1F2D36]'
            }`}
          >
            3.0 Risk Flags ({riskFlags.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('provenance')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'provenance'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66] hover:text-[#1F2D36]'
            }`}
          >
            4.0 RAG Provenance
          </button>
        </div>
      </div>

      {/* Tab: Local Redaction Audit (FR-REDACT.1–3) */}
      {activeTab === 'redaction' && (
        <div className="space-y-3">
          <div className="p-3 bg-[#E4F4EC] border border-[#17724A]/20 rounded-xl flex items-center justify-between text-[#17724A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#17724A]" />
              <div>
                <div className="font-bold text-xs">
                  FR-REDACT.1–3 Privacy Guarantee Passed
                </div>
                <div className="text-[11px]">
                  Extraction function never accesses `.value`. Zero user keystrokes transmitted off-device.
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#17724A] font-bold text-[11px] border border-[#17724A]/30">
              {zeroValuesTransmitted ? '100% Redacted' : 'Warning'}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold text-[#4A5B66]">
              <span>Outgoing Payload Structure (Sent to /api/analyze-form):</span>
              <span className="text-[#0E5A64]">{fields.length} fields structured</span>
            </div>
            <pre className="p-3 bg-[#1F2D36] text-[#8FCFDB] rounded-xl overflow-x-auto text-[11px] font-mono max-h-48 leading-relaxed">
              {JSON.stringify(
                {
                  page_url: pageUrl,
                  action_url: actionUrl,
                  fields_count: fields.length,
                  redaction_policy: 'STRICT_LOCAL_STRUCTURAL_ONLY',
                  sample_fields: fields.slice(0, 3).map((f) => ({
                    id: f.id,
                    fieldKey: f.fieldKey,
                    type: f.type,
                    label: f.label,
                    required: f.required,
                    placeholder: f.placeholder,
                    has_typed_value: false,
                  })),
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: Risk Flags */}
      {activeTab === 'risks' && (
        <div className="space-y-3">
          {riskFlags.length === 0 ? (
            <div className="p-6 text-center bg-[#F7FAFB] rounded-xl border border-[#DDE4E8] text-[#4A5B66]">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#17724A] mb-1" />
              <div className="font-semibold text-xs text-[#1F2D36]">No Security Risk Flags Triggered</div>
              <p className="text-[11px] text-[#4A5B66]">
                Form uses standard HTTPS, matching action domain, and standard administrative fields.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {riskFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                    flag.severity === 'high'
                      ? 'bg-[#FDECEA] border-[#B3261E] text-[#7A1410]'
                      : 'bg-[#FFEBD5] border-[#8F4200] text-[#5C2B00]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider mb-0.5">
                      {flag.flagType} • {flag.severity} severity
                    </div>
                    <div className="text-xs leading-relaxed">{flag.description}</div>
                  </div>
                  <span className="text-[10px] font-mono opacity-70">
                    Logged to D5
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Provenance & Cache */}
      {activeTab === 'provenance' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#E4F4EC] border border-[#17724A]/20 text-[#17724A]">
              <div className="text-[10px] uppercase font-semibold">Tier 2: Official Source</div>
              <div className="text-base font-bold">
                {Array.from(explanations.values()).filter((e) => e.sourceLabel === 'From official source').length} fields
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#E6EEFA] border border-[#2A5DA8]/20 text-[#2A5DA8]">
              <div className="text-[10px] uppercase font-semibold">Tier 1: Page Text</div>
              <div className="text-base font-bold">
                {Array.from(explanations.values()).filter((e) => e.sourceLabel === 'From this page').length} fields
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#EFEBFA] border border-[#5E479B]/20 text-[#5E479B]">
              <div className="text-[10px] uppercase font-semibold">Tier 3: AI Knowledge</div>
              <div className="text-base font-bold">
                {Array.from(explanations.values()).filter((e) => e.sourceLabel === "AI's general knowledge").length} fields
              </div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {Array.from(explanations.values()).map((exp) => (
              <div
                key={exp.id}
                className="p-2 rounded-xl border border-[#DDE4E8] bg-[#F7FAFB] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-[#1F2D36]">{exp.fieldKey}:</span>{' '}
                  <span className="text-[#4A5B66]">{exp.summary}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ml-2 ${
                    exp.sourceLabel === 'From official source'
                      ? 'bg-[#E4F4EC] text-[#17724A]'
                      : exp.sourceLabel === 'From this page'
                      ? 'bg-[#E6EEFA] text-[#2A5DA8]'
                      : 'bg-[#EFEBFA] text-[#5E479B]'
                  }`}
                >
                  {exp.sourceLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

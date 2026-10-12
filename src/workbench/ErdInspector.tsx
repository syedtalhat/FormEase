/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, FileText, MessageSquare, Shield, Users } from 'lucide-react';
import { DEMO_SOURCE_DOCUMENTS } from '../server/ragDocs';

export const ErdInspector: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<
    'forms' | 'source_documents' | 'chat_sessions' | 'users'
  >('source_documents');

  return (
    <div className="bg-white rounded-2xl border border-[#DDE4E8] p-4 text-xs font-sans space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F1F4F5] pb-2.5">
        <div>
          <h3
            className="font-bold text-sm text-[#0E5A64]"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
          >
            Figure 3 — Supabase Entity-Relationship Model (ERD)
          </h3>
          <p className="text-[11px] text-[#4A5B66]">
            Live schema relations: users, forms, fields, source_documents (pgvector), chat_sessions
          </p>
        </div>

        <div className="flex bg-[#F1F4F5] p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setSelectedEntity('source_documents')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedEntity === 'source_documents'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66]'
            }`}
          >
            source_documents
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntity('forms')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedEntity === 'forms'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66]'
            }`}
          >
            forms &amp; fields
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntity('chat_sessions')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedEntity === 'chat_sessions'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66]'
            }`}
          >
            chat_sessions
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntity('users')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedEntity === 'users'
                ? 'bg-white text-[#0E5A64] shadow-xs'
                : 'text-[#4A5B66]'
            }`}
          >
            users
          </button>
        </div>
      </div>

      {selectedEntity === 'source_documents' && (
        <div className="space-y-2">
          <div className="text-[11px] text-[#4A5B66] font-medium">
            Pre-indexed documents for vector similarity search (pgvector 768-dim embeddings):
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {DEMO_SOURCE_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl border border-[#17724A]/30 bg-[#E4F4EC]/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#17724A]">{doc.title}</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded text-[#17724A] font-medium border border-[#17724A]/20">
                    {doc.category}
                  </span>
                </div>
                <div className="text-[11px] text-[#1F2D36] line-clamp-2">
                  {doc.contentText}
                </div>
                <div className="text-[10px] text-[#4A5B66] font-mono">
                  FK: form_id = {doc.formId} • URL: {doc.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEntity === 'forms' && (
        <div className="space-y-2">
          <div className="p-3 rounded-xl border border-[#DDE4E8] bg-[#F7FAFB] space-y-1">
            <div className="font-bold text-xs text-[#0E5A64]">
              form-scholarship (scholarships.gov.in)
            </div>
            <p className="text-[11px] text-[#4A5B66]">
              Has 5 extracted fields: applicant_name, domicile_certificate_no, annual_family_income, bank_ifsc_code, aadhaar_number.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-[#DDE4E8] bg-[#F7FAFB] space-y-1">
            <div className="font-bold text-xs text-[#0E5A64]">
              form-bank-kyc (secure-banking.org)
            </div>
            <p className="text-[11px] text-[#4A5B66]">
              Has 3 extracted fields: customer_id, mothers_maiden_name (Unusual), one_time_password_otp (Unusual).
            </p>
          </div>
        </div>
      )}

      {selectedEntity === 'chat_sessions' && (
        <div className="p-4 bg-[#F7FAFB] rounded-xl border border-[#DDE4E8] text-[#4A5B66] text-center">
          <MessageSquare className="w-6 h-6 mx-auto text-[#0E5A64] mb-1" />
          <div className="font-semibold text-xs text-[#1F2D36]">Context-Bounded History</div>
          <p className="text-[11px] text-[#4A5B66] mt-0.5">
            Table enforces NFR-SEC.1 RLS policies: read/write isolated strictly to auth.uid() owner.
          </p>
        </div>
      )}

      {selectedEntity === 'users' && (
        <div className="p-3 bg-[#F7FAFB] rounded-xl border border-[#DDE4E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0E5A64]" />
            <div>
              <div className="font-semibold text-xs text-[#1F2D36]">user-default (student@example.org)</div>
              <div className="text-[11px] text-[#4A5B66]">Default language: English • Speech rate: 1.0x</div>
            </div>
          </div>
          <span className="text-[10px] bg-[#E3F0F1] text-[#0E5A64] px-2 py-0.5 rounded-full font-semibold">
            RLS auth.uid() Active
          </span>
        </div>
      )}
    </div>
  );
};

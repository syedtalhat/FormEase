/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ExternalLink, Lock, ShieldAlert } from 'lucide-react';
import { ExtractedField } from '../types';

interface SandboxHostProps {
  fixtureType: 'scholarship' | 'bank_kyc' | 'phishing';
  activeFieldId: string | null;
  onFieldSelect: (field: ExtractedField) => void;
  onExtractFields: (extracted: ExtractedField[], formMeta: { formId: string; pageUrl: string; actionUrl: string; title: string }) => void;
  isExtensionActive: boolean;
  fieldTagLookup: Map<string, { tag: string; reason?: string }>;
}

export const SandboxHost: React.FC<SandboxHostProps> = ({
  fixtureType,
  activeFieldId,
  onFieldSelect,
  onExtractFields,
  isExtensionActive,
  fieldTagLookup,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fixture metadata
  const meta = {
    scholarship: {
      formId: 'scholarship-form',
      pageUrl: 'https://scholarships.gov.in/apply/post-matric-2026',
      actionUrl: 'https://scholarships.gov.in/submit-app',
      title: 'State Post-Matric Scholarship Portal',
      domain: 'scholarships.gov.in',
      isHttps: true,
    },
    bank_kyc: {
      formId: 'bank-kyc-form',
      pageUrl: 'https://secure-banking.org/portal/re-kyc-update',
      actionUrl: 'https://secure-banking.org/api/kyc-update',
      title: 'Customer Re-KYC Update Portal',
      domain: 'secure-banking.org',
      isHttps: true,
    },
    phishing: {
      formId: 'expressbill-form',
      pageUrl: 'http://expressbill-quickpay.xyz/pay/urgent-clearance',
      actionUrl: 'http://payment-harvest-gateway.ru/collect',
      title: 'ExpressBill Quick-Pay Settlement',
      domain: 'expressbill-quickpay.xyz',
      isHttps: false,
    },
  }[fixtureType];

  useEffect(() => {
    // Scan DOM elements inside the container and extract fields adhering to FR-EXTRACT & FR-REDACT
    if (!containerRef.current) return;

    const inputElements = Array.from(
      containerRef.current.querySelectorAll('input, select, textarea')
    ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];

    const fields: ExtractedField[] = [];

    inputElements.forEach((el, index) => {
      const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
      if (['submit', 'reset', 'button', 'hidden'].includes(type)) return;

      const id = el.id || `field-${index}`;
      const name = el.name || id;

      // Find label
      let label = '';
      if (el.id) {
        const lEl = containerRef.current?.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lEl) label = lEl.textContent?.replace(/\*/g, '').trim() || '';
      }
      if (!label) {
        const parentL = el.closest('label');
        if (parentL) label = parentL.textContent?.replace(/\*/g, '').trim() || '';
      }
      if (!label) {
        label = el.getAttribute('placeholder') || name;
      }

      // Help text
      const describedby = el.getAttribute('aria-describedby');
      let pageHelpText: string | undefined = undefined;
      if (describedby) {
        const hEl = containerRef.current?.querySelector(`#${CSS.escape(describedby)}`);
        if (hEl) pageHelpText = hEl.textContent?.trim();
      }

      // Normalize key
      let fieldKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (fieldKey.includes('income')) fieldKey = 'annual_family_income';
      if (fieldKey.includes('domicile')) fieldKey = 'domicile_certificate_no';
      if (fieldKey.includes('ifsc')) fieldKey = 'bank_ifsc_code';
      if (fieldKey.includes('maiden')) fieldKey = 'mothers_maiden_name';
      if (fieldKey.includes('otp')) fieldKey = 'one_time_password_otp';
      if (fieldKey.includes('h_index')) fieldKey = 'h_index_citation';

      const isSensitive =
        type === 'password' ||
        /(password|otp|cvv|pin)/i.test(name) ||
        /(password|otp|cvv|pin)/i.test(id);

      let rect: ExtractedField['boundingRect'] = undefined;
      try {
        const b = el.getBoundingClientRect();
        rect = {
          top: b.top,
          left: b.left,
          width: b.width,
          height: b.height,
          bottom: b.bottom,
          right: b.right,
        };
      } catch {
        // ignore
      }

      const placeholder = 'placeholder' in el ? (el as HTMLInputElement).placeholder : undefined;

      fields.push({
        id,
        fieldKey,
        name,
        type: isSensitive ? 'sensitive_excluded' : type,
        label,
        placeholder: placeholder || undefined,
        required: el.hasAttribute('required'),
        pageHelpText,
        isSensitiveBlocked: isSensitive,
        boundingRect: rect,
      });
    });

    onExtractFields(fields, meta);
  }, [fixtureType]);

  const handleFieldFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const el = e.target;
    const id = el.id || el.name;
    const elPlaceholder = 'placeholder' in el ? (el as HTMLInputElement).placeholder : '';
    const label =
      containerRef.current?.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.replace(/\*/g, '').trim() ||
      elPlaceholder ||
      id;

    let fieldKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (fieldKey.includes('income')) fieldKey = 'annual_family_income';
    if (fieldKey.includes('domicile')) fieldKey = 'domicile_certificate_no';
    if (fieldKey.includes('ifsc')) fieldKey = 'bank_ifsc_code';
    if (fieldKey.includes('maiden')) fieldKey = 'mothers_maiden_name';
    if (fieldKey.includes('otp')) fieldKey = 'one_time_password_otp';

    onFieldSelect({
      id,
      fieldKey,
      name: el.name || id,
      type: el.type,
      label,
      placeholder: elPlaceholder || undefined,
      required: el.hasAttribute('required'),
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#E5E9EA] border border-[#CBD5DB] rounded-2xl overflow-hidden shadow-inner">
      {/* Fake Browser Chrome Top Bar (Simulating third-party host tab) */}
      <div className="bg-[#D7DADB] px-3 py-2 border-b border-[#CBD5DB] flex items-center justify-between text-xs text-[#3F484A]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#BA1A1A]/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#F2A93B]/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#17724A]/80 inline-block" />
          </div>
          <span className="text-[11px] font-semibold text-[#52606A] ml-2">
            Third-Party Host Browser Viewport
          </span>
        </div>

        {/* Address bar */}
        <div className="flex-1 max-w-xl mx-4 bg-white rounded-lg px-3 py-1 flex items-center gap-2 text-[12px] border border-[#BFC8CA] text-[#181C1D] shadow-xs">
          {meta.isHttps ? (
            <Lock className="w-3.5 h-3.5 text-[#17724A] shrink-0" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-[#BA1A1A] shrink-0" />
          )}
          <span className="truncate">{meta.pageUrl}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#52606A]">
          <span>Action: {meta.actionUrl.split('/')[2] || 'same-domain'}</span>
        </div>
      </div>

      {/* Host Web Page Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]"
        style={{ minHeight: '520px' }}
      >
        {fixtureType === 'scholarship' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                Official State Portal
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-1">
                Post-Matric Scholarship Scheme (FY 2026-27)
              </h2>
              <p className="text-xs text-slate-500">
                Department of Higher Education &amp; Social Welfare
              </p>
            </div>

            <form
              id="scholarship-form"
              action="https://scholarships.gov.in/submit-app"
              method="POST"
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="applicant_name"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Applicant Legal Name <span className="text-red-500">*</span>
                    </label>
                    {isExtensionActive && (
                      <button
                        type="button"
                        onClick={() =>
                          onFieldSelect({
                            id: 'applicant_name',
                            fieldKey: 'applicant_name',
                            name: 'applicant_name',
                            type: 'text',
                            label: 'Applicant Legal Name',
                            required: true,
                          })
                        }
                        className="text-[11px] text-[#0E5A64] hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        ⓘ See Description
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id="applicant_name"
                    name="applicant_name"
                    onFocus={handleFieldFocus}
                    placeholder="As shown on 10th marks card"
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                      activeFieldId === 'applicant_name'
                        ? 'border-[#0E5A64] ring-3 ring-[#F2A93B]/40'
                        : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="domicile_certificate_no"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Domicile Certificate No. <span className="text-red-500">*</span>
                    </label>
                    {isExtensionActive && (
                      <button
                        type="button"
                        onClick={() =>
                          onFieldSelect({
                            id: 'domicile_certificate_no',
                            fieldKey: 'domicile_certificate_no',
                            name: 'domicile_certificate_no',
                            type: 'text',
                            label: 'Domicile Certificate Registration No.',
                            required: true,
                          })
                        }
                        className="text-[11px] text-[#0E5A64] hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        ⓘ See Description
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id="domicile_certificate_no"
                    name="domicile_certificate_no"
                    onFocus={handleFieldFocus}
                    placeholder="e.g. DOM/2026/89402"
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                      activeFieldId === 'domicile_certificate_no'
                        ? 'border-[#0E5A64] ring-3 ring-[#F2A93B]/40'
                        : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="annual_family_income"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Annual Family Income (INR) <span className="text-red-500">*</span>
                    </label>
                    {isExtensionActive && (
                      <button
                        type="button"
                        onClick={() =>
                          onFieldSelect({
                            id: 'annual_family_income',
                            fieldKey: 'annual_family_income',
                            name: 'annual_family_income',
                            type: 'number',
                            label: 'Annual Family Income (INR)',
                            required: true,
                          })
                        }
                        className="text-[11px] text-[#0E5A64] hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        ⓘ See Description
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    id="annual_family_income"
                    name="annual_family_income"
                    onFocus={handleFieldFocus}
                    aria-describedby="income-help"
                    placeholder="e.g. 180000"
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                      activeFieldId === 'annual_family_income'
                        ? 'border-[#0E5A64] ring-3 ring-[#F2A93B]/40'
                        : 'border-slate-300'
                    }`}
                  />
                  <p id="income-help" className="text-[11px] text-slate-500 mt-1">
                    Combined gross earnings before tax. Max ₹2,50,000 for eligibility.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="bank_ifsc_code"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Bank Branch IFSC Code <span className="text-red-500">*</span>
                    </label>
                    {isExtensionActive && (
                      <button
                        type="button"
                        onClick={() =>
                          onFieldSelect({
                            id: 'bank_ifsc_code',
                            fieldKey: 'bank_ifsc_code',
                            name: 'bank_ifsc_code',
                            type: 'text',
                            label: 'Bank Branch IFSC Code',
                            required: true,
                          })
                        }
                        className="text-[11px] text-[#0E5A64] hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        ⓘ See Description
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id="bank_ifsc_code"
                    name="bank_ifsc_code"
                    onFocus={handleFieldFocus}
                    aria-describedby="ifsc-help"
                    placeholder="e.g. SBIN0004921"
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                      activeFieldId === 'bank_ifsc_code'
                        ? 'border-[#0E5A64] ring-3 ring-[#F2A93B]/40'
                        : 'border-slate-300'
                    }`}
                  />
                  <p id="ifsc-help" className="text-[11px] text-slate-500 mt-1">
                    11-character code printed on cheque or passbook first page.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="aadhaar_number"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Aadhaar Reference Number <span className="text-red-500">*</span>
                    </label>
                    {isExtensionActive && (
                      <button
                        type="button"
                        onClick={() =>
                          onFieldSelect({
                            id: 'aadhaar_number',
                            fieldKey: 'aadhaar_number',
                            name: 'aadhaar_number',
                            type: 'text',
                            label: 'Aadhaar Reference Number',
                            required: true,
                          })
                        }
                        className="text-[11px] text-[#0E5A64] hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        ⓘ See Description
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id="aadhaar_number"
                    name="aadhaar_number"
                    onFocus={handleFieldFocus}
                    placeholder="XXXX-XXXX-XXXX"
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                      activeFieldId === 'aadhaar_number'
                        ? 'border-[#0E5A64] ring-3 ring-[#F2A93B]/40'
                        : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-800 text-white hover:bg-blue-900"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        )}

        {fixtureType === 'bank_kyc' && (
          <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="border-b border-slate-200 pb-3 mb-5">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Verified Banking
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-1">
                Periodic Customer Re-KYC Update
              </h2>
              <p className="text-xs text-slate-500">
                Compliance Reference: Master Direction RBI/2026/04
              </p>
            </div>

            <form
              id="bank-kyc-form"
              action="https://secure-banking.org/api/kyc-update"
              method="POST"
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label
                  htmlFor="customer_id"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Customer ID Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="customer_id"
                  name="customer_id"
                  onFocus={handleFieldFocus}
                  placeholder="e.g. CUST-9021884"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="mothers_maiden_name"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Mother&apos;s Maiden Name <span className="text-red-500">*</span>
                  </label>
                  {isExtensionActive && (
                    <button
                      type="button"
                      onClick={() =>
                        onFieldSelect({
                          id: 'mothers_maiden_name',
                          fieldKey: 'mothers_maiden_name',
                          name: 'mothers_maiden_name',
                          type: 'text',
                          label: "Mother's Maiden Name",
                          required: true,
                        })
                      }
                      className="text-[11px] text-[#8F4200] font-semibold hover:underline"
                    >
                      ⚠ Unusual Request
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  id="mothers_maiden_name"
                  name="mothers_maiden_name"
                  onFocus={handleFieldFocus}
                  placeholder="Mother's family surname prior to marriage"
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                    activeFieldId === 'mothers_maiden_name'
                      ? 'border-[#8F4200] ring-3 ring-[#F2A93B]/40'
                      : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="one_time_password_otp"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Security Verification OTP <span className="text-red-500">*</span>
                  </label>
                  {isExtensionActive && (
                    <button
                      type="button"
                      onClick={() =>
                        onFieldSelect({
                          id: 'one_time_password_otp',
                          fieldKey: 'one_time_password_otp',
                          name: 'one_time_password_otp',
                          type: 'text',
                          label: 'Security Verification OTP',
                          required: true,
                        })
                      }
                      className="text-[11px] text-[#8F4200] font-semibold hover:underline"
                    >
                      ⚠ Review Caution
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  id="one_time_password_otp"
                  name="one_time_password_otp"
                  onFocus={handleFieldFocus}
                  placeholder="6-digit mobile OTP"
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${
                    activeFieldId === 'one_time_password_otp'
                      ? 'border-[#8F4200] ring-3 ring-[#F2A93B]/40'
                      : 'border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
                >
                  Verify &amp; Update KYC
                </button>
              </div>
            </form>
          </div>
        )}

        {fixtureType === 'phishing' && (
          <div className="max-w-md mx-auto bg-white rounded-xl border-2 border-rose-200 shadow-md p-6">
            <div className="border-b border-rose-200 pb-3 mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Unsecured External Gateway
              </span>
              <h2 className="text-lg font-bold text-slate-800 mt-1">
                ExpressBill Urgent Settlement
              </h2>
              <p className="text-xs text-rose-600 font-medium">
                HTTP Submission to: payment-harvest-gateway.ru
              </p>
            </div>

            <form
              id="expressbill-form"
              action="http://payment-harvest-gateway.ru/collect"
              method="POST"
              className="space-y-3.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <label
                  htmlFor="subscriber_account"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Subscriber Account ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subscriber_account"
                  name="subscriber_account"
                  onFocus={handleFieldFocus}
                  placeholder="INV-882910"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="card_cvv"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Card CVV Digits <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="card_cvv"
                  name="card_cvv"
                  onFocus={handleFieldFocus}
                  placeholder="3 digits"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="transaction_otp"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Transaction OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="transaction_otp"
                  name="transaction_otp"
                  onFocus={handleFieldFocus}
                  placeholder="SMS Code"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Authorize Immediate Clearance
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

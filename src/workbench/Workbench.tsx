/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  MessageSquare,
  Package,
  Play,
  Power,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  ChatMessage,
  ExtractedField,
  FieldExplanation,
  Language,
  RiskFlag,
  SessionState,
  UserPreferences,
} from '../types';
import { OverlayShadowRoot } from '../extension/content/OverlayShadowRoot';
import { OnboardingView } from '../extension/onboarding/OnboardingView';
import { OptionsView } from '../extension/options/OptionsView';
import { PopupView } from '../extension/popup/PopupView';
import { FormAssistStateMachine } from '../extension/stateMachine';
import { ErdInspector } from './ErdInspector';
import { ManifestExporter } from './ManifestExporter';
import { PipelineInspector } from './PipelineInspector';
import { SandboxHost } from './SandboxHost';
import { StateInspector } from './StateInspector';

export const Workbench: React.FC = () => {
  // Navigation tabs for extension surfaces vs dev inspectors
  const [activeSurface, setActiveSurface] = useState<
    'sandbox' | 'popup' | 'onboarding' | 'options' | 'manifest'
  >('sandbox');

  // Selected test fixture form
  const [selectedFixture, setSelectedFixture] = useState<
    'scholarship' | 'bank_kyc' | 'phishing'
  >('scholarship');

  // Global language state
  const [language, setLanguage] = useState<Language>('en');

  // Extension activation toggle
  const [isExtensionActive, setIsExtensionActive] = useState(true);

  // Form structure and metadata
  const [currentFields, setCurrentFields] = useState<ExtractedField[]>([]);
  const [formMeta, setFormMeta] = useState({
    formId: 'scholarship-form',
    pageUrl: 'https://scholarships.gov.in/apply/post-matric-2026',
    actionUrl: 'https://scholarships.gov.in/submit-app',
    title: 'State Post-Matric Scholarship Scheme',
  });

  // State machine instance
  const stateMachineRef = useRef(new FormAssistStateMachine('ready'));
  const [state, setState] = useState<SessionState>('ready');
  const [stateHistory, setStateHistory] = useState(stateMachineRef.current.getHistory());
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Analysis results from backend
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [explanations, setExplanations] = useState<Map<string, FieldExplanation>>(new Map());
  const [fieldTags, setFieldTags] = useState<Map<string, { tag: string; reason?: string }>>(new Map());

  // Chat conversation
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    userId: 'user-default',
    email: 'student@example.org',
    defaultLanguage: 'en',
    speechRate: 1.0,
    autoExplainOnFocus: true,
    highContrast: false,
  });

  // Inspector drawer toggle
  const [activeInspector, setActiveInspector] = useState<'std' | 'dfd' | 'erd'>('std');

  // Sync state machine listener
  useEffect(() => {
    const sm = stateMachineRef.current;
    const unsub = sm.subscribe((newState, _prev, payload) => {
      setState(newState);
      setStateHistory(sm.getHistory());
      setErrorMessage(sm.getErrorMessage());
      if (payload && typeof payload === 'object' && 'fieldId' in payload) {
        setActiveFieldId((payload as { fieldId: string }).fieldId);
      }
    });
    return unsub;
  }, []);

  // Run backend form analysis when fixture, language, or activation changes
  const runFormAnalysis = async (fieldsToAnalyze: ExtractedField[], meta = formMeta, lang = language) => {
    if (!isExtensionActive) {
      stateMachineRef.current.resetToIdle();
      return;
    }

    stateMachineRef.current.activate();
    stateMachineRef.current.extractionComplete(fieldsToAnalyze.length);

    try {
      const response = await fetch('/api/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: meta.pageUrl,
          action_url: meta.actionUrl,
          form_structure: fieldsToAnalyze,
          language: lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setRiskFlags(data.riskFlags || []);

      const newExps = new Map<string, FieldExplanation>();
      const newTags = new Map<string, { tag: string; reason?: string }>();

      (data.fields || []).forEach(
        (item: { field: ExtractedField; riskTag: string; riskReason?: string; explanation: FieldExplanation }) => {
          newExps.set(item.field.id, item.explanation);
          newTags.set(item.field.id, { tag: item.riskTag, reason: item.riskReason });
        }
      );

      setExplanations(newExps);
      setFieldTags(newTags);
      stateMachineRef.current.analysisComplete();
    } catch (err) {
      console.error('Analysis failed:', err);
      stateMachineRef.current.fail('Network or Gemini API analysis failed. Check server connectivity.');
    }
  };

  const handleExtractFields = (
    extracted: ExtractedField[],
    meta: { formId: string; pageUrl: string; actionUrl: string; title: string }
  ) => {
    setCurrentFields(extracted);
    setFormMeta(meta);
    runFormAnalysis(extracted, meta, language);
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    runFormAnalysis(currentFields, formMeta, newLang);
  };

  const handleToggleExtension = () => {
    const next = !isExtensionActive;
    setIsExtensionActive(next);
    if (next) {
      runFormAnalysis(currentFields, formMeta, language);
    } else {
      stateMachineRef.current.deactivate();
      setActiveFieldId(null);
    }
  };

  // Field selection from sandbox
  const handleFieldSelect = (field: ExtractedField) => {
    setActiveFieldId(field.id);
    stateMachineRef.current.focusField(field.id);
  };

  const handleBlurField = () => {
    setActiveFieldId(null);
    stateMachineRef.current.blurField();
  };

  const handleOpenChat = (fieldId?: string) => {
    if (fieldId) setActiveFieldId(fieldId);
    stateMachineRef.current.openChat(fieldId);
  };

  const handleCloseChat = () => {
    stateMachineRef.current.closeChat();
  };

  const handleSendMessage = async (msg: string) => {
    const activeField = currentFields.find((f) => f.id === activeFieldId);

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sessionId: 'session-demo',
      role: 'user',
      content: msg,
      focusedFieldId: activeField?.id,
      focusedFieldLabel: activeField?.label,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'session-demo',
          form_id: formMeta.formId,
          form_title: formMeta.title,
          focused_field: activeField,
          all_fields: currentFields,
          completed_fields: [],
          message: msg,
          language,
        }),
      });

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        sessionId: 'session-demo',
        role: 'assistant',
        content: data.reply || 'Guidance received.',
        focusedFieldId: activeField?.id,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sessionId: 'session-demo',
        role: 'assistant',
        content: `Regarding ${activeField?.label || 'this form'}: Please ensure this information matches your official records. Let me know if you would like me to explain what certificate is needed.`,
        focusedFieldId: activeField?.id,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSavePreferences = async (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updated }));
    if (updated.defaultLanguage) {
      handleLanguageChange(updated.defaultLanguage);
    }
    await fetch('/api/preferences/user-default', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  };

  const combinedOverlayItems = currentFields.map((field) => ({
    field,
    explanation:
      explanations.get(field.id) || {
        id: `exp-${field.id}`,
        fieldId: field.id,
        fieldKey: field.fieldKey,
        language,
        summary: `Official entry for ${field.label}.`,
        fullExplanation: `Enter accurate information matching your official documents.`,
        sourceLabel: "AI's general knowledge" as const,
        confidence: 0.85,
        riskTag: (fieldTags.get(field.id)?.tag || 'required') as any,
      },
  }));

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F3F6F7] text-[#1F2D36]"
      style={{ fontFamily: "'Mukta', system-ui, sans-serif" }}
    >
      {/* 1. TOP BANNER: Clear Developer Workbench Identification per Section 0 rules */}
      <div className="bg-[#1F2D36] text-[#E3F0F1] px-4 py-2 border-b border-[#0E5A64]/40 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F2A93B] animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider">
            FormAssist Developer Workbench
          </span>
          <span className="text-[#8FCFDB] hidden sm:inline">
            — Assistive Overlay Engine (Dev environment — Not part of extension)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#8FCFDB]">
            Chrome MV3 Assistive Extension
          </span>
          <span className="bg-[#0E5A64] text-white px-2 py-0.5 rounded text-[11px] font-sans font-bold">
            Phase 1
          </span>
        </div>
      </div>

      {/* 2. WORKBENCH CONTROLS HEADER */}
      <header className="bg-white border-b border-[#DDE4E8] px-4 py-3 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Surface Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0E5A64] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                FA
              </div>
              <div>
                <span
                  className="font-bold text-base text-[#0E5A64] tracking-tight block leading-tight"
                  style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
                >
                  FormAssist
                </span>
                <span className="text-[10px] text-[#4A5B66] uppercase tracking-wider font-semibold">
                  Assistive Overlay
                </span>
              </div>
            </div>

            {/* Navigation Selector for Extension Surfaces */}
            <nav className="flex bg-[#F1F4F5] p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setActiveSurface('sandbox')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSurface === 'sandbox'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                <span>🖥️ Host Sandbox</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSurface('popup')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSurface === 'popup'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                <span>🧩 Toolbar Popup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSurface('onboarding')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSurface === 'onboarding'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                <span>🚀 Onboarding</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSurface('options')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSurface === 'options'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                <span>⚙️ Preferences</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSurface('manifest')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSurface === 'manifest'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                <span>📦 Manifest V3</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: Fixture selector, Language, State indicator */}
          <div className="flex items-center gap-3">
            {/* Fixture Selector (Only in sandbox view) */}
            {activeSurface === 'sandbox' && (
              <div className="flex items-center gap-1.5 bg-[#F7FAFB] border border-[#DDE4E8] rounded-xl px-2.5 py-1 text-xs">
                <span className="text-[#4A5B66] font-semibold">Test Fixture:</span>
                <select
                  value={selectedFixture}
                  onChange={(e) =>
                    setSelectedFixture(e.target.value as 'scholarship' | 'bank_kyc' | 'phishing')
                  }
                  className="bg-transparent font-semibold text-[#0E5A64] outline-none cursor-pointer"
                >
                  <option value="scholarship">State Scholarship Portal</option>
                  <option value="bank_kyc">Bank Customer KYC Portal</option>
                  <option value="phishing">ExpressBill (Risk Flag Test)</option>
                </select>
              </div>
            )}

            {/* Language Switcher (FR-LANG.2) */}
            <div className="flex items-center gap-1 bg-[#F1F4F5] p-1 rounded-xl text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-[#4A5B66] ml-1.5" />
              {(
                [
                  { id: 'en', label: 'English' },
                  { id: 'hi', label: 'हिन्दी' },
                  { id: 'mr', label: 'मराठी' },
                ] as const
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleLanguageChange(l.id)}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    language === l.id
                      ? 'bg-white text-[#0E5A64] shadow-xs font-bold'
                      : 'text-[#4A5B66] hover:text-[#1F2D36]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Extension State Machine Live Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#0E5A64]/30 bg-[#E3F0F1] text-xs font-semibold text-[#0E5A64]">
              <span className="w-2 h-2 rounded-full bg-[#0E5A64] animate-pulse" />
              <span>State: {state.replace('_', ' ')}</span>
            </div>

            {/* Extension Power Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleExtension}
              aria-label={isExtensionActive ? 'Deactivate Extension' : 'Activate Extension'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isExtensionActive
                  ? 'bg-[#0E5A64] text-white hover:bg-[#0A4249]'
                  : 'bg-[#ECEFF1] text-[#4A5B66] hover:bg-[#DDE4E8]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isExtensionActive ? 'Overlay Active' : 'Overlay Inactive'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Surface 1: Host Sandbox with Shadow DOM overlay */}
        {activeSurface === 'sandbox' && (
          <div className="relative">
            {/* The Host Webpage Simulator */}
            <SandboxHost
              fixtureType={selectedFixture}
              activeFieldId={activeFieldId}
              onFieldSelect={handleFieldSelect}
              onExtractFields={handleExtractFields}
              isExtensionActive={isExtensionActive}
              fieldTagLookup={fieldTags}
            />

            {/* THE REAL EXTENSION OVERLAY (Injected inside Shadow DOM) */}
            {isExtensionActive && (
              <OverlayShadowRoot
                formTitle={formMeta.title}
                fields={combinedOverlayItems}
                riskFlags={riskFlags}
                activeFieldId={activeFieldId}
                state={state}
                language={language}
                onFocusField={(id) => {
                  const target = currentFields.find((f) => f.id === id);
                  if (target) handleFieldSelect(target);
                }}
                onBlurField={handleBlurField}
                onOpenChat={handleOpenChat}
                onCloseChat={handleCloseChat}
                onSendMessage={handleSendMessage}
                chatMessages={chatMessages}
                isChatLoading={isChatLoading}
              />
            )}
          </div>
        )}

        {/* Surface 2: Standalone Extension Popup Preview */}
        {activeSurface === 'popup' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center mb-4">
              <h2
                className="font-bold text-lg text-[#0E5A64]"
                style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
              >
                Chrome Toolbar Popup Surface
              </h2>
              <p className="text-xs text-[#4A5B66]">
                This is the actual UI shown when the user clicks the FormAssist extension icon in Chrome&apos;s toolbar.
              </p>
            </div>
            <PopupView
              isEnabled={isExtensionActive}
              state={state}
              language={language}
              onLanguageChange={handleLanguageChange}
              onToggleEnabled={handleToggleExtension}
              onOpenChat={() => {
                setActiveSurface('sandbox');
                handleOpenChat();
              }}
              onOpenSettings={() => setActiveSurface('options')}
              fieldsCount={currentFields.length}
              riskCount={riskFlags.length}
              currentDomain={formMeta.pageUrl.split('/')[2] || 'scholarships.gov.in'}
            />
          </div>
        )}

        {/* Surface 3: Onboarding First-Run Page Preview */}
        {activeSurface === 'onboarding' && (
          <div>
            <OnboardingView
              onFinish={(chosenLang) => {
                handleLanguageChange(chosenLang);
                setActiveSurface('sandbox');
              }}
            />
          </div>
        )}

        {/* Surface 4: Options / Settings Page Preview */}
        {activeSurface === 'options' && (
          <div>
            <OptionsView
              preferences={preferences}
              onSavePreferences={handleSavePreferences}
            />
          </div>
        )}

        {/* Surface 5: Manifest V3 Export */}
        {activeSurface === 'manifest' && (
          <div>
            <ManifestExporter />
          </div>
        )}

        {/* 4. DEVELOPER INSPECTORS (STD, DFD, ERD) */}
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between border-b border-[#DDE4E8] pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0E5A64]" />
              <span
                className="font-bold text-sm text-[#0E5A64]"
                style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
              >
                Architecture &amp; Protocol Inspectors
              </span>
            </div>

            {/* Inspector tabs */}
            <div className="flex bg-[#F1F4F5] p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setActiveInspector('std')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeInspector === 'std'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                STD State Machine (Fig 2)
              </button>
              <button
                type="button"
                onClick={() => setActiveInspector('dfd')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeInspector === 'dfd'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                DFD &amp; Redaction Pipeline (Fig 1)
              </button>
              <button
                type="button"
                onClick={() => setActiveInspector('erd')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeInspector === 'erd'
                    ? 'bg-white text-[#0E5A64] shadow-xs'
                    : 'text-[#4A5B66] hover:text-[#1F2D36]'
                }`}
              >
                ERD Data Store (Fig 3)
              </button>
            </div>
          </div>

          {activeInspector === 'std' && (
            <StateInspector
              currentState={state}
              stateHistory={stateHistory}
              errorMessage={errorMessage}
              onSimulateError={() =>
                stateMachineRef.current.fail('Simulated network timeout connecting to Gemini API')
              }
              onSimulateRetry={() => stateMachineRef.current.retry()}
              onSimulateDismiss={() => stateMachineRef.current.dismiss()}
              onSimulateDynamicFields={() => stateMachineRef.current.dynamicFieldsDetected()}
              onReset={() => stateMachineRef.current.resetToIdle()}
            />
          )}

          {activeInspector === 'dfd' && (
            <PipelineInspector
              fields={currentFields}
              riskFlags={riskFlags}
              explanations={explanations}
              pageUrl={formMeta.pageUrl}
              actionUrl={formMeta.actionUrl}
            />
          )}

          {activeInspector === 'erd' && <ErdInspector />}
        </div>
      </main>

      {/* 5. WORKBENCH FOOTER */}
      <footer className="mt-auto border-t border-[#DDE4E8] bg-white py-3 px-6 text-xs text-[#4A5B66]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1F2D36]">FormAssist Browser Extension</span>
            <span>• Built to WCAG 2.2 AA &amp; Manifest V3 standards</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Model: gemini-3.8-flash</span>
            <span>• Local Redaction: FR-REDACT.1–3 Active</span>
            <span>• Speech: Web Speech API</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

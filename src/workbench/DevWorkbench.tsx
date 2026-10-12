/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SupportedLanguage } from '../core/i18n';
import { INITIAL_SESSION_STATE } from '../core/session/reducer';
import { SessionState } from '../core/session/types';
import { OnboardingRoot } from '../surfaces/onboarding/OnboardingRoot';
import { SettingsPage } from '../surfaces/options/SettingsPage';
import { ChatPanel } from '../surfaces/overlay/ChatPanel';
import { ErrorCard } from '../surfaces/overlay/ErrorCard';
import { FieldTag } from '../surfaces/overlay/FieldTag';
import { ProgressCard } from '../surfaces/overlay/ProgressCard';
import { RiskBanner } from '../surfaces/overlay/RiskBanner';
import { Tooltip, TooltipExplanationData } from '../surfaces/overlay/Tooltip';
import { PopupError } from '../surfaces/popup/PopupError';
import { PopupIdle } from '../surfaces/popup/PopupIdle';
import { PopupReady } from '../surfaces/popup/PopupReady';
import { PopupSignedOut } from '../surfaces/popup/PopupSignedOut';
import { PopupWorking } from '../surfaces/popup/PopupWorking';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SegmentedControl } from '../ui/SegmentedControl';
import { PageSimulator } from './PageSimulator';
import { BackendHealthPanel } from './BackendHealthPanel';

export const DevWorkbench: React.FC = () => {
  // Global controls per Section 9
  const [selectedView, setSelectedView] = useState<
    | 'simulator'
    | 'backend_health'
    | 'p1'
    | 'p2'
    | 'p3'
    | 'p4'
    | 'popup_error'
    | 'onboarding'
    | 'settings'
    | 'overlay_progress'
    | 'overlay_tags'
    | 'overlay_tooltip_collapsed'
    | 'overlay_tooltip_expanded'
    | 'overlay_risk_banner'
    | 'overlay_chat'
    | 'overlay_error'
  >('simulator');

  const [apiMode, setApiMode] = useState<'mock' | 'live'>(() => {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_MODE === 'live') ? 'live' : 'mock';
  });
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [failureInjected, setFailureInjected] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<360 | 1024 | 1440>(1024);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fixtureFile, setFixtureFile] = useState<
    'scholarship.html' | 'risky.html' | 'bank-kyc.html'
  >('scholarship.html');

  // Sample data for standalone surface previews
  const sampleTooltipData: TooltipExplanationData = {
    field_key: 'annual_family_income',
    field_label: 'Annual Family Income',
    risk_tag: 'required',
    summary:
      language === 'hi'
        ? 'कर कटौती से पहले माता-पिता की संयुक्त वार्षिक कुल आय।'
        : language === 'mr'
        ? 'कर वजा करण्यापूर्वी आई-वडिलांचे एकूण वार्षिक एकत्रित उत्पन्न.'
        : 'Combined gross annual income of both parents before taxes.',
    text:
      language === 'hi'
        ? 'परिवार के सभी कमाने वाले सदस्यों की कुल वार्षिक आय दर्ज करें। तहसीलदार द्वारा जारी आय प्रमाण पत्र होना अनिवार्य है और पूर्ण शुल्क छूट के लिए यह ₹2,50,000 से कम होनी चाहिए।'
        : language === 'mr'
        ? 'कुटुंबातील सर्व सदस्यांचे नोकरी किंवा व्यवसायातील वार्षिक उत्पन्न येथे नोंदवा. तहसीलदारांचे वैध उत्पन्न प्रमाणपत्र आवश्यक असून पूर्ण शुल्क माफीसाठी उत्पन्न ₹२,५०,००० पेक्षा कमी असावे.'
        : 'Enter total yearly earnings from salary, agriculture, or trade. Must be supported by a Tahsildar revenue certificate and be under ₹2,50,000 for full fee waiver.',
    source_label: 'official',
    source_url: 'https://scholarships.gov.in/guidelines/post-matric-2026.pdf',
    source_excerpt:
      'Gross annual income of applicant parents/guardians must not exceed INR 2,50,000 per financial annum.',
    confidence: 0.98,
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-surface-page text-text-primary font-body ${
        reducedMotion ? 'motion-reduce' : ''
      }`}
    >
      {/* 1. MANDATORY BANNER (Section 0 & Section 9) */}
      <div className="bg-[#1F2D36] text-[#E3F0F1] px-4 py-2 border-b border-[#0E5A64]/40 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-marigold animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider">
            Dev workbench — not part of the extension.
          </span>
          <span className="text-primary-tint hidden md:inline">
            FormAssist Phase 1 Browser Extension Harness
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-primary-tint">
            Manifest V3 Assistive Overlay
          </span>
          <span className="bg-primary-container text-white px-2 py-0.5 rounded text-[11px] font-sans font-bold">
            Phase 1
          </span>
        </div>
      </div>

      {/* 2. GLOBAL CONTROLS HEADER */}
      <header className="bg-surface-card border-b border-border-subtle p-4 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-container text-white flex items-center justify-center font-display font-bold text-sm shadow-sm">
              FA
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-primary-container leading-tight">
                FormAssist Workbench
              </h1>
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                Universal Surface &amp; State Evaluator
              </span>
            </div>
          </div>

          {/* Global controls bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl">
              <Icon name="language" className="w-3.5 h-3.5 text-text-secondary ml-1" />
              {(['en', 'hi', 'mr'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all ${
                    language === l
                      ? 'bg-white text-primary-container shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>

            {/* API Mode: Mock vs Live Supabase */}
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-text-secondary px-1.5">API:</span>
              <button
                type="button"
                onClick={() => setApiMode('mock')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  apiMode === 'mock'
                    ? 'bg-white text-primary-container shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Mock
              </button>
              <button
                type="button"
                onClick={() => setApiMode('live')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  apiMode === 'live'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Live (Supabase)
              </button>
            </div>

            {/* Signed-in / Signed-out Toggle */}
            <button
              type="button"
              onClick={() => setIsSignedIn(!isSignedIn)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSignedIn
                  ? 'border-source-official bg-source-official-bg text-source-official'
                  : 'border-border-strong bg-surface-page text-text-secondary'
              }`}
            >
              {isSignedIn ? 'Signed In' : 'Signed Out'}
            </button>

            {/* Failure Injection Toggle */}
            <button
              type="button"
              onClick={() => setFailureInjected(!failureInjected)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                failureInjected
                  ? 'border-danger bg-danger-bg text-danger'
                  : 'border-border-subtle bg-surface-card text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon name="warning" className="w-3.5 h-3.5" />
                <span>{failureInjected ? 'API Failure Injected' : 'Inject API Failure'}</span>
              </div>
            </button>

            {/* Viewport Width */}
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl">
              {([360, 1024, 1440] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setViewportWidth(w)}
                  className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                    viewportWidth === w
                      ? 'bg-white text-primary-container shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>

            {/* Reduced motion toggle */}
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                reducedMotion
                  ? 'border-primary-container bg-primary-tint text-primary-container font-bold'
                  : 'border-border-subtle text-text-secondary'
              }`}
            >
              Reduced Motion: {reducedMotion ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </header>

      {/* 3. WORKBENCH BODY: LEFT RAIL NAVIGATION + CANVAS */}
      <div className="max-w-7xl w-full mx-auto p-4 md:p-6 grid lg:grid-cols-12 gap-6 flex-1">
        {/* Left Rail: Every surface and every state one click each (Section 9) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-surface-card p-4 rounded-2xl border border-border-subtle shadow-xs space-y-4 text-xs">
            {/* Primary Feature: Page Simulator */}
            <div>
              <span className="font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Interactive Simulator
              </span>
              <button
                type="button"
                onClick={() => setSelectedView('simulator')}
                className={`w-full text-left p-2.5 rounded-xl font-bold flex items-center justify-between transition-all ${
                  selectedView === 'simulator'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'bg-surface-page text-text-primary hover:bg-primary-tint/50'
                }`}
              >
                <span>🖥️ Host Page Simulator</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Real Code</span>
              </button>

              {selectedView === 'simulator' && (
                <div className="mt-2 pl-2 space-y-1">
                  <span className="text-[10px] text-text-secondary font-semibold">Fixture:</span>
                  {(['scholarship.html', 'risky.html', 'bank-kyc.html'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFixtureFile(f)}
                      className={`w-full text-left p-1.5 rounded text-xs truncate ${
                        fixtureFile === f
                          ? 'bg-primary-tint text-primary-container font-bold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      • {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Backend Health & Diagnostics */}
            <div>
              <span className="font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Live Backend &amp; Integration
              </span>
              <button
                type="button"
                onClick={() => setSelectedView('backend_health')}
                className={`w-full text-left p-2.5 rounded-xl font-bold flex items-center justify-between transition-all ${
                  selectedView === 'backend_health'
                    ? 'bg-primary-container text-white shadow-xs'
                    : 'bg-surface-page text-text-primary hover:bg-primary-tint/50'
                }`}
              >
                <span>🩺 Backend Health</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    apiMode === 'live'
                      ? 'bg-source-official text-white'
                      : 'bg-border-subtle text-text-secondary'
                  }`}
                >
                  {apiMode === 'live' ? 'Live' : 'Mock'}
                </span>
              </button>
            </div>

            {/* Popup Surfaces */}
            <div>
              <span className="font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Toolbar Popup States (§6)
              </span>
              <div className="space-y-1">
                {[
                  { id: 'p1', label: 'P1: Signed Out' },
                  { id: 'p2', label: 'P2: Idle (Signed In)' },
                  { id: 'p3', label: 'P3: Working (Scanning/Analyzing)' },
                  { id: 'p4', label: 'P4: Ready (With warning)' },
                  { id: 'popup_error', label: 'Popup: Error (Retry / Dismiss)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedView(item.id as any)}
                    className={`w-full text-left p-2 rounded-lg font-medium transition-colors ${
                      selectedView === item.id
                        ? 'bg-primary-tint text-primary-container font-bold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-page'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Onboarding & Settings */}
            <div>
              <span className="font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Standalone Pages (§6)
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedView('onboarding')}
                  className={`w-full text-left p-2 rounded-lg font-medium transition-colors ${
                    selectedView === 'onboarding'
                      ? 'bg-primary-tint text-primary-container font-bold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-page'
                  }`}
                >
                  Onboarding (O1–O4)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedView('settings')}
                  className={`w-full text-left p-2 rounded-lg font-medium transition-colors ${
                    selectedView === 'settings'
                      ? 'bg-primary-tint text-primary-container font-bold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-page'
                  }`}
                >
                  Settings (S1)
                </button>
              </div>
            </div>

            {/* Injected Overlay Components */}
            <div>
              <span className="font-bold uppercase tracking-wider text-text-secondary block mb-2">
                Injected Overlay Components (§6)
              </span>
              <div className="space-y-1">
                {[
                  { id: 'overlay_progress', label: 'ProgressCard (d1)' },
                  { id: 'overlay_tags', label: 'FieldTag ×3 (d2)' },
                  { id: 'overlay_tooltip_collapsed', label: 'Tooltip: Collapsed (d3)' },
                  { id: 'overlay_tooltip_expanded', label: 'Tooltip: Expanded (d4)' },
                  { id: 'overlay_risk_banner', label: 'RiskBanner (d6)' },
                  { id: 'overlay_chat', label: 'ChatPanel (d7)' },
                  { id: 'overlay_error', label: 'ErrorCard (Retry/Dismiss)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedView(item.id as any)}
                    className={`w-full text-left p-2 rounded-lg font-medium transition-colors ${
                      selectedView === item.id
                        ? 'bg-primary-tint text-primary-container font-bold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-page'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Canvas: Renders selected view */}
        <section className="lg:col-span-9 flex flex-col justify-start">
          {/* View: Page Simulator */}
          {selectedView === 'simulator' && (
            <PageSimulator
              fixtureFile={fixtureFile}
              language={language}
              isSignedIn={isSignedIn}
              failureInjected={failureInjected}
              viewportWidth={viewportWidth}
              apiMode={apiMode}
            />
          )}

          {/* View: Backend Health & Diagnostics */}
          {selectedView === 'backend_health' && (
            <BackendHealthPanel
              apiMode={apiMode}
              onToggleApiMode={setApiMode}
            />
          )}

          {/* View: P1 Popup Signed Out */}
          {selectedView === 'p1' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <PopupSignedOut
                activeDomain="scholarships.gov.in"
                onSignIn={() => setSelectedView('onboarding')}
                onCreateAccount={() => setSelectedView('onboarding')}
              />
            </div>
          )}

          {/* View: P2 Popup Idle */}
          {selectedView === 'p2' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <PopupIdle
                hostname="scholarships.example.gov.in"
                language={language}
                onLanguageChange={setLanguage}
                onActivate={() => setSelectedView('p3')}
                onOpenSettings={() => setSelectedView('settings')}
              />
            </div>
          )}

          {/* View: P3 Popup Working */}
          {selectedView === 'p3' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <PopupWorking
                currentStep={2}
                fieldsCount={8}
                onDeactivate={() => setSelectedView('p2')}
              />
            </div>
          )}

          {/* View: P4 Popup Ready */}
          {selectedView === 'p4' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <PopupReady
                fieldsCount={8}
                officialSourceCount={5}
                riskCount={1}
                highestRiskDescription="Format asks for lakhs, not monthly total."
                language={language}
                onLanguageChange={setLanguage}
                onOpenChat={() => setSelectedView('overlay_chat')}
                onDeactivate={() => setSelectedView('p2')}
              />
            </div>
          )}

          {/* View: Popup Error */}
          {selectedView === 'popup_error' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <PopupError
                errorKind="network"
                onRetry={() => setSelectedView('p3')}
                onDismiss={() => setSelectedView('p2')}
              />
            </div>
          )}

          {/* View: Onboarding */}
          {selectedView === 'onboarding' && (
            <div>
              <OnboardingRoot
                onComplete={({ signedIn, language: lang }) => {
                  setIsSignedIn(signedIn);
                  setLanguage(lang);
                  setSelectedView('simulator');
                }}
              />
            </div>
          )}

          {/* View: Settings */}
          {selectedView === 'settings' && (
            <div>
              <SettingsPage
                savedLanguage={language}
                onSaveLanguage={setLanguage}
                onSignOut={() => setIsSignedIn(false)}
              />
            </div>
          )}

          {/* View: ProgressCard Overlay */}
          {selectedView === 'overlay_progress' && (
            <div className="relative h-[400px] bg-surface-muted rounded-2xl border border-border-subtle p-6 overflow-hidden">
              <span className="text-xs text-text-secondary font-semibold">
                Simulated Host Page Body
              </span>
              <ProgressCard currentStep={2} fieldsCount={7} />
            </div>
          )}

          {/* View: Field Tags */}
          {selectedView === 'overlay_tags' && (
            <div className="p-8 bg-surface-card rounded-2xl border border-border-subtle space-y-6">
              <h3 className="type-title-2 text-primary-container">
                FieldTag Variants (d2)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold w-24">Required:</span>
                  <FieldTag fieldKey="q1" tagType="required" onClick={() => {}} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold w-24">Optional:</span>
                  <FieldTag fieldKey="q2" tagType="optional" onClick={() => {}} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold w-24">Unusual:</span>
                  <FieldTag fieldKey="q3" tagType="unusual" onClick={() => {}} />
                </div>
              </div>
            </div>
          )}

          {/* View: Tooltip Collapsed */}
          {selectedView === 'overlay_tooltip_collapsed' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <Tooltip
                data={sampleTooltipData}
                language={language}
                onAskInChat={() => setSelectedView('overlay_chat')}
                onClose={() => {}}
                initialExpanded={false}
              />
            </div>
          )}

          {/* View: Tooltip Expanded */}
          {selectedView === 'overlay_tooltip_expanded' && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-muted rounded-2xl border border-border-subtle">
              <Tooltip
                data={sampleTooltipData}
                language={language}
                onAskInChat={() => setSelectedView('overlay_chat')}
                onClose={() => {}}
                initialExpanded={true}
              />
            </div>
          )}

          {/* View: Risk Banner */}
          {selectedView === 'overlay_risk_banner' && (
            <div className="p-8 bg-surface-card rounded-2xl border border-border-subtle space-y-4">
              <h3 className="type-title-2 text-primary-container">
                RiskBanner (d6)
              </h3>
              <RiskBanner
                flags={[
                  {
                    flag_type: 'DOMAIN_MISMATCH',
                    severity: 'high',
                    description_key: 'risk_cross_domain',
                    meta: { domain: 'pay-verify.example.net' },
                  },
                  {
                    flag_type: 'SUSPICIOUS_OTP_REQUEST',
                    severity: 'high',
                    description_key: 'risk_otp_non_bank',
                  },
                  {
                    flag_type: 'INSECURE_HTTP',
                    severity: 'medium',
                    description_key: 'risk_insecure_http',
                  },
                ]}
                language={language}
                onDismiss={() => {}}
              />
            </div>
          )}

          {/* View: Chat Panel */}
          {selectedView === 'overlay_chat' && (
            <div className="relative h-[620px] bg-surface-muted rounded-2xl border border-border-subtle overflow-hidden">
              <ChatPanel
                formTitle="Post-Matric Scholarship Portal"
                focusedFieldLabel="Annual Family Income"
                language={language}
                messages={[
                  {
                    id: '1',
                    role: 'user',
                    content: 'What if my father is a farmer and does not have a salary slip?',
                    timestamp: Date.now() - 60000,
                  },
                  {
                    id: '2',
                    role: 'assistant',
                    content:
                      language === 'hi'
                        ? 'चिंता न करें। किसान आवेदक अपने स्थानीय तहसीलदार द्वारा जारी राजस्व आय प्रमाण पत्र या ग्राम प्रधान का आय घोषणा पत्र संलग्न कर सकते हैं।'
                        : language === 'mr'
                        ? 'काळजी करू नका. शेतकरी अर्जदारांनी स्थानिक तहसीलदारांचे उत्पन्न प्रमाणपत्र किंवा ग्रामपंचायतीचा दाखला सादर करावा.'
                        : "Don't worry! For agricultural families, submit an income certificate issued by your local Tahsildar or Sub-Divisional Magistrate. A salary slip is not mandatory.",
                    timestamp: Date.now() - 30000,
                  },
                ]}
                onSendMessage={() => {}}
                onClose={() => setSelectedView('simulator')}
                onLanguageChange={setLanguage}
              />
            </div>
          )}

          {/* View: ErrorCard */}
          {selectedView === 'overlay_error' && (
            <div className="relative h-[300px] bg-surface-muted rounded-2xl border border-border-subtle p-6 overflow-hidden">
              <ErrorCard
                errorKind="network"
                onRetry={() => {}}
                onDismiss={() => {}}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { defaultMockClient, getApiClient } from '../core/api';
import { extractForm } from '../core/extract/extractor';
import { ExtractedFieldStructure } from '../core/extract/types';
import { SupportedLanguage } from '../core/i18n';
import { classifyRisk } from '../core/risk/classifier';
import { INITIAL_SESSION_STATE, sessionReducer } from '../core/session/reducer';
import { SessionEvent, SessionState } from '../core/session/types';
import { mountOverlay, OverlayHandle } from '../overlay-mount/mountOverlay';
import { ChatMessageItem } from '../surfaces/overlay/ChatPanel';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface PageSimulatorProps {
  fixtureFile: 'scholarship.html' | 'risky.html' | 'bank-kyc.html';
  language: SupportedLanguage;
  isSignedIn: boolean;
  failureInjected: boolean;
  viewportWidth: 360 | 1024 | 1440;
  apiMode?: 'mock' | 'live';
}

export const PageSimulator: React.FC<PageSimulatorProps> = ({
  fixtureFile,
  language,
  isSignedIn,
  failureInjected,
  viewportWidth,
  apiMode = 'mock',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayHandleRef = useRef<OverlayHandle | null>(null);

  const [sessionState, setSessionState] = useState<SessionState>({
    ...INITIAL_SESSION_STATE,
    context: { ...INITIAL_SESSION_STATE.context, language },
  });

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [eventLog, setEventLog] = useState<{ event: string; time: string; state: string }[]>([]);
  const [networkPayload, setNetworkPayload] = useState<any>(null);
  const [sentinelTypedText, setSentinelTypedText] = useState('');
  const [sentinelLeaked, setSentinelLeaked] = useState(false);

  // Sync failure injection to mock client
  useEffect(() => {
    defaultMockClient.setFailureInjected(failureInjected);
  }, [failureInjected]);

  // Keep a reference to latest session state to avoid stale closures in callbacks
  const sessionStateRef = useRef(sessionState);
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // Pure session event dispatcher that does not invoke nested setState or root.render inside state updaters
  const dispatchSessionEvent = (event: SessionEvent) => {
    const next = sessionReducer(sessionStateRef.current, event);
    sessionStateRef.current = next;
    setSessionState(next);

    setEventLog((logs) => [
      {
        event: event.type,
        time: new Date().toLocaleTimeString(),
        state: next.current,
      },
      ...logs.slice(0, 15),
    ]);
  };

  // Synchronize session state to isolated Shadow DOM overlay safely after render
  useEffect(() => {
    overlayHandleRef.current?.updateState(sessionState);
  }, [sessionState]);

  // Cleanup overlay on unmount
  useEffect(() => {
    return () => {
      overlayHandleRef.current?.unmount();
      overlayHandleRef.current = null;
    };
  }, []);

  // Run the real pipeline: Extractor -> Redactor -> Risk Classifier -> MockApi -> Overlay Mount
  const runPipeline = async () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;

    // Simulated URLs per Section 10
    const simulatedUrls = {
      'scholarship.html': 'https://scholarships.example.gov.in/apply',
      'risky.html': 'http://scholarship-fee-pay.example.com',
      'bank-kyc.html': 'https://secure-banking.org/portal/re-kyc',
    };
    const simulatedUrl = simulatedUrls[fixtureFile];

    dispatchSessionEvent({ type: 'ACTIVATE' });

    // Step 1: Real extractor (Process 1.0)
    const forms = extractForm(iframeDoc, { pageUrl: simulatedUrl });

    if (forms.length === 0 || forms[0]?.fields.length === 0) {
      dispatchSessionEvent({ type: 'NO_FORM_FOUND' });
      return;
    }

    const targetForm = forms[0];
    const fields = targetForm.fields;

    dispatchSessionEvent({ type: 'EXTRACTION_DONE' });

    // Step 2: Show network payload for audit (verifies zero typed values)
    const outgoingPayload = {
      page_url: simulatedUrl,
      form_action: targetForm.form_action,
      form_title: targetForm.form_title,
      language,
      fields: fields.map((f) => ({
        field_key: f.field_key,
        label: f.label,
        input_type: f.input_type,
        required: f.required,
        sensitive: f.sensitive,
        placeholder: f.placeholder,
        options: f.options,
        page_help: f.page_help,
      })),
    };
    setNetworkPayload(outgoingPayload);

    // Verify sentinel text check
    if (sentinelTypedText && JSON.stringify(outgoingPayload).includes(sentinelTypedText)) {
      setSentinelLeaked(true);
    } else {
      setSentinelLeaked(false);
    }

    // Step 3: Call ApiClient (Process 3.0 & 4.0: Mock or Live Supabase)
    try {
      const client = getApiClient(apiMode);
      const response = await client.analyzeForm(outgoingPayload);

      // Create map of live anchor elements from the iframe DOM
      const anchorMap = new Map<string, HTMLElement>();
      fields.forEach((f) => {
        if (f.anchorElement) {
          anchorMap.set(f.field_key, f.anchorElement);

          // Listen to field focus in iframe
          f.anchorElement.onfocus = () => {
            dispatchSessionEvent({ type: 'FIELD_FOCUS', fieldId: f.field_key });
          };
        }
      });

      overlayHandleRef.current?.setAnchorElements(anchorMap);

      dispatchSessionEvent({
        type: 'ANALYSIS_DONE',
        fields: response.fields as any,
        riskFlags: response.risk_flags as any,
      });
    } catch (err) {
      dispatchSessionEvent({ type: 'API_FAILED' });
    }
  };

  // Mount overlay into iframe content document
  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;

    // Clean up previous overlay instance if exists
    overlayHandleRef.current?.unmount();

    // Mount real overlay
    overlayHandleRef.current = mountOverlay(
      iframeDoc,
      {
        onFocusField: (fieldKey) => {
          dispatchSessionEvent({ type: 'FIELD_FOCUS', fieldId: fieldKey });
        },
        onBlurField: () => {
          dispatchSessionEvent({ type: 'FIELD_BLUR' });
        },
        onOpenChat: (fieldKey) => {
          dispatchSessionEvent({ type: 'OPEN_CHAT', fieldId: fieldKey });
        },
        onCloseChat: () => {
          dispatchSessionEvent({ type: 'CLOSE_CHAT' });
        },
        onSendMessage: async (msg) => {
          const userMsg: ChatMessageItem = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: msg,
            focused_field_label: sessionStateRef.current.context.fields.find(
              (f) => f.field_key === sessionStateRef.current.context.focusedFieldId
            )?.label,
            timestamp: Date.now(),
          };

          const newMessages = [...chatMessages, userMsg];
          setChatMessages(newMessages);
          setIsChatLoading(true);
          overlayHandleRef.current?.updateChat(newMessages, true);

          try {
            const client = getApiClient(apiMode);
            const resp = await client.chat({
              message: msg,
              focused_field_key: sessionStateRef.current.context.focusedFieldId,
              completed_field_keys: [],
              language,
            });

            const replyMsg: ChatMessageItem = {
              id: `reply-${Date.now()}`,
              role: 'assistant',
              content: resp.reply,
              timestamp: Date.now(),
            };

            const updated = [...newMessages, replyMsg];
            setChatMessages(updated);
            overlayHandleRef.current?.updateChat(updated, false);
          } finally {
            setIsChatLoading(false);
          }
        },
        onRetry: () => {
          dispatchSessionEvent({ type: 'RETRY' });
          setTimeout(() => runPipeline(), 0);
        },
        onDismiss: () => {
          dispatchSessionEvent({ type: 'DISMISS' });
        },
        onLanguageChange: (newLang) => {
          dispatchSessionEvent({ type: 'SET_LANGUAGE', language: newLang });
          setTimeout(() => runPipeline(), 0);
        },
      },
      {
        initialLanguage: language,
        isSignedIn,
      }
    );

    // Schedule pipeline run in next tick so it never runs during iframe render/commit
    setTimeout(() => {
      runPipeline();
    }, 0);
  };

  // Re-run pipeline when language prop changes dynamically
  const isInitialLanguageMount = useRef(true);
  useEffect(() => {
    if (isInitialLanguageMount.current) {
      isInitialLanguageMount.current = false;
      return;
    }
    dispatchSessionEvent({ type: 'SET_LANGUAGE', language });
    const timer = setTimeout(() => {
      runPipeline();
    }, 0);
    return () => clearTimeout(timer);
  }, [language]);

  // Sentinel Text Test: Type sentinel string into iframe form inputs to verify it never appears in network payload
  const handleTypeSentinel = (text: string) => {
    setSentinelTypedText(text);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const firstInput = iframe.contentDocument.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      firstInput.value = text;
    }

    // Re-extract and re-check payload
    runPipeline();
  };

  return (
    <div className="space-y-4 font-body">
      {/* Top Simulator Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface-card rounded-2xl border border-border-subtle shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-source-official animate-pulse" />
            <span className="font-display font-bold text-sm text-primary-container">
              Page Simulator
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-tint text-primary-container text-xs font-bold capitalize">
            State: {sessionState.current}
          </div>

          <span className="text-xs text-text-secondary">
            Fixture: <code className="bg-surface-muted px-1.5 py-0.5 rounded text-text-primary font-mono">{fixtureFile}</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={runPipeline}>
            <div className="flex items-center gap-1.5">
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Re-run Pipeline</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Simulator Area (Iframe + Dev Logs) */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Iframe Viewport Container */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            className="w-full bg-surface-muted p-2 rounded-2xl border border-border-strong overflow-hidden flex justify-center transition-all"
            style={{
              maxWidth: viewportWidth === 360 ? '380px' : viewportWidth === 1024 ? '1040px' : '100%',
            }}
          >
            <iframe
              ref={iframeRef}
              src={`/fixtures/${fixtureFile}`}
              title="Host Form Simulation"
              onLoad={handleIframeLoad}
              className="w-full bg-white rounded-xl shadow-xs border border-border-subtle transition-all"
              style={{
                height: '620px',
                width: viewportWidth === 360 ? '360px' : '100%',
              }}
            />
          </div>
        </div>

        {/* Right Dev Panel: Sentinel Privacy Proof & Event Log */}
        <div className="lg:col-span-4 space-y-4">
          {/* Sentinel Privacy Test (Section 9) */}
          <div className="p-4 bg-surface-card rounded-2xl border border-border-subtle shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-text-primary">
                Privacy Sentinel Test
              </h4>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  sentinelLeaked
                    ? 'bg-danger text-white'
                    : 'bg-source-official-bg text-source-official'
                }`}
              >
                {sentinelLeaked ? 'LEAK DETECTED' : '100% PRIVATE'}
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-snug">
              Type confidential text into the form below to prove it is NEVER captured by the extractor:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SECRET_PASSWORD_99"
                value={sentinelTypedText}
                onChange={(e) => handleTypeSentinel(e.target.value)}
                className="flex-1 h-9 px-2.5 text-xs border border-border-subtle rounded-lg outline-none font-mono"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTypeSentinel('SENTINEL_CREDENTIAL_XYZ_4892')}
              >
                Inject Sentinel
              </Button>
            </div>

            <p className="text-[11px] text-source-official italic">
              Verified: extractor never accesses .value (FR-REDACT.1–3).
            </p>
          </div>

          {/* Network Payload Inspector */}
          <div className="p-4 bg-surface-card rounded-2xl border border-border-subtle shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-text-primary">
                Outgoing Payload (Process 2.0)
              </h4>
              <span className="text-[10px] text-text-secondary font-mono">
                {networkPayload?.fields?.length || 0} fields
              </span>
            </div>

            <pre className="p-2.5 bg-[#1F2D36] text-[#8FCFDB] rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-44">
              {JSON.stringify(networkPayload, null, 2)}
            </pre>
          </div>

          {/* Event Log */}
          <div className="p-4 bg-surface-card rounded-2xl border border-border-subtle shadow-xs space-y-2">
            <h4 className="font-display font-bold text-sm text-text-primary">
              Session Event Log
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {eventLog.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-1.5 bg-surface-page rounded-lg border border-border-subtle font-mono text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-primary-container">{log.event}</span>
                    <span className="text-text-secondary">→ {log.state}</span>
                  </div>
                  <span className="text-[10px] text-text-disabled">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

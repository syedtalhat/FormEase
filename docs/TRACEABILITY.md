# FormAssist — Requirements Traceability Matrix (RTM)

This document provides complete, bidirectional traceability between the **Software Requirements Specification (SRS v1.0)**, implementation source files, and automated test suites.

Every **Functional Requirement (FR)** and **Non-Functional Requirement (NFR)** is catalogued below with its status, implementing module(s), and verifying test(s). All **MUST** requirements are strictly implemented and verified.

---

## 1. Functional Requirements (FR)

### Process 1.0: Form Extraction & DOM Traversal
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-EXTRACT.1** | Scan DOM for interactive form elements (`input`, `select`, `textarea`, `fieldset`) and capture structural metadata. | **MUST** | **Implemented** | `src/core/extract/extractor.ts`<br>`src/extension/content/extractor.ts` | `src/core/extract/extract.test.ts`<br>`tests/e2e/extension.spec.ts` |
| **FR-EXTRACT.2** | Resolve human-readable field labels via strict precedence (`label[for]` > `aria-labelledby` > `aria-label` > wrapping `<label>` > preceding sibling/placeholder/name). | **MUST** | **Implemented** | `src/core/extract/extractor.ts`<br>`src/extension/content/extractor.ts` | `src/core/extract/extract.test.ts` |
| **FR-EXTRACT.3** | Observe dynamic form DOM alterations via debounced `MutationObserver` (250 ms) to support multi-step wizards without page reload. | **MUST** | **Implemented** | `src/core/extract/extractor.ts` | `src/core/extract/extract.test.ts` |
| **FR-EXTRACT.4** | Extract form-level metadata including `action` endpoint URL, submission `method`, and host page domain for security auditing. | **MUST** | **Implemented** | `src/core/extract/extractor.ts`<br>`src/extension/content/extractor.ts` | `src/core/extract/extract.test.ts` |

---

### Process 2.0: Local Redaction & Privacy Engine
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-REDACT.1** | Never access or read `.value`, `.defaultValue`, or `.checked` properties on DOM input elements during extraction. | **MUST** | **Implemented** | `src/core/redact/redactor.ts`<br>`src/extension/content/extractor.ts` | `src/core/redact/redact.test.ts`<br>`tests/e2e/extension.spec.ts` |
| **FR-REDACT.2** | Block sensitive fields matching passwords, PINs, CVVs, and OTPs from transmission, flagging metadata for risk detection only. | **MUST** | **Implemented** | `src/core/redact/redactor.ts`<br>`src/extension/content/extractor.ts` | `src/core/redact/redact.test.ts`<br>`src/core/risk/risk.test.ts` |
| **FR-REDACT.3** | Automated privacy sentinel audit proving zero user-typed canary characters ever escape through outgoing HTTP payloads or URLs. | **MUST** | **Implemented** | `src/core/redact/redactor.ts`<br>`extension/background/service-worker.ts` | `src/core/redact/redact.test.ts`<br>`tests/e2e/extension.spec.ts` |

---

### Process 3.0: Risk Classification & Anomaly Detection
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-RISK.1** | Detect domain spoofing when form `action` URL destination domain differs from the host page domain (High Severity). | **MUST** | **Implemented** | `src/core/risk/classifier.ts`<br>`supabase/functions/_shared/riskClassifier.ts` | `src/core/risk/risk.test.ts`<br>`tests/backend.test.ts` |
| **FR-RISK.2** | Flag insecure transmission when form transmits data over unencrypted HTTP (Medium Severity). | **MUST** | **Implemented** | `src/core/risk/classifier.ts`<br>`supabase/functions/_shared/riskClassifier.ts` | `src/core/risk/risk.test.ts`<br>`tests/backend.test.ts` |
| **FR-RISK.3** | Flag credential harvesting traps when OTP/PIN/CVV/ATM fields are detected on non-banking domains (High Severity). | **MUST** | **Implemented** | `src/core/risk/classifier.ts`<br>`supabase/functions/_shared/riskClassifier.ts` | `src/core/risk/risk.test.ts`<br>`tests/backend.test.ts` |
| **FR-RISK.4** | Enforce field tag precedence: `unusual` > `required` > `optional`. | **MUST** | **Implemented** | `src/core/risk/classifier.ts`<br>`supabase/functions/_shared/riskClassifier.ts` | `src/core/risk/risk.test.ts`<br>`tests/backend.test.ts` |
| **FR-RISK.5** | Persist classified risk flags to `risk_flags` table with severity and metadata. | **MUST** | **Implemented** | `supabase/functions/analyze-form/index.ts`<br>`supabase/migrations/0001_init.sql` | `tests/backend.test.ts`<br>`tests/rls.test.ts` |

---

### Process 4.0: Field Explanation & 3-Tier Grounding Hierarchy
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-EXPLAIN.1** | Query database explanation cache by `(field_id, language)` before initiating AI generation. | **MUST** | **Implemented** | `supabase/functions/analyze-form/index.ts`<br>`supabase/functions/explain-field/index.ts` | `tests/backend.test.ts` |
| **FR-EXPLAIN.2** | Ground explanations strictly via 3-Tier Hierarchy: Tier 1 Page Help (`page`) → Tier 2 pgvector Official Guidelines (`official`) → Tier 3 AI General Knowledge (`ai`). | **MUST** | **Implemented** | `supabase/functions/analyze-form/index.ts`<br>`supabase/functions/explain-field/index.ts` | `tests/backend.test.ts` |
| **FR-EXPLAIN.3** | Attach exactly one truthful source provenance label (`page`, `official`, `ai`) to every explanation. | **MUST** | **Implemented** | `src/core/api/types.ts`<br>`supabase/functions/analyze-form/index.ts` | `tests/backend.test.ts` |
| **FR-EXPLAIN.4** | Grade 5 plain-language readability target without legal jargon or unstated thresholds. | **MUST** | **Implemented** | `supabase/functions/_shared/gemini.ts`<br>`src/server/geminiService.ts` | `tests/backend.test.ts` |
| **FR-EXPLAIN.5** | Plain-language 1-line summary capped at at most 15 words. | **MUST** | **Implemented** | `supabase/functions/_shared/gemini.ts`<br>`src/surfaces/overlay/Tooltip.tsx` | `tests/backend.test.ts`<br>`tests/components.test.tsx` |
| **FR-EXPLAIN.6** | Graceful degradation with per-field `unavailable` marker on quota/error rather than dropping response. | **MUST** | **Implemented** | `supabase/functions/analyze-form/index.ts`<br>`src/core/api/types.ts` | `tests/error-drills.test.ts`<br>`tests/backend.test.ts` |

---

### Process 6.0: Assistive Conversational Companion
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-CHAT.1** | Context-aware slide-in assistant panel docked inside Shadow DOM overlay. | **MUST** | **Implemented** | `src/extension/components/ChatDrawer.tsx`<br>`src/surfaces/overlay/ChatPanel.tsx` | `tests/components.test.tsx`<br>`tests/a11y.test.tsx` |
| **FR-CHAT.2** | Inject active focused field, completed field keys, and form domain into model prompt context. | **MUST** | **Implemented** | `supabase/functions/chat/index.ts`<br>`src/core/api/httpClient.ts` | `tests/backend.test.ts` |
| **FR-CHAT.3** | Bound conversation history to last 4–6 turns to prevent token drift and scale costs. | **MUST** | **Implemented** | `supabase/functions/chat/index.ts` | `tests/backend.test.ts` |
| **FR-CHAT.4** | Strict prompt-injection defense: treat input as unverified data, forbid requesting/accepting OTPs/PINs, never declare site "safe", admit uncertainty. | **MUST** | **Implemented** | `supabase/functions/chat/index.ts`<br>`supabase/functions/_shared/gemini.ts` | `tests/backend.test.ts` |

---

### Process 7.0: Multilingual Support & User Preferences
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-LANG.1** | Support English (`en`), Hindi (`hi`), and Marathi (`mr`) with language choice during onboarding/signup. | **MUST** | **Implemented** | `src/extension/onboarding/OnboardingView.tsx`<br>`src/core/auth/supabaseAuth.ts` | `src/core/i18n/i18n.test.ts`<br>`tests/components.test.tsx` |
| **FR-LANG.2** | Dynamic runtime language switching in toolbar popup and workbench without page reloads. | **MUST** | **Implemented** | `src/extension/popup/PopupView.tsx`<br>`src/core/storage/index.ts` | `src/core/i18n/i18n.test.ts` |
| **FR-LANG.3** | Client text-to-speech voice playback in selected Indian language using Web Speech API synthesis. | **SHOULD** | **Implemented** | `src/extension/speech.ts`<br>`src/surfaces/overlay/Tooltip.tsx` | `tests/components.test.tsx` |

---

### Accessibility & UI Boundaries
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **FR-ACC.1** | Full keyboard accessibility: Tab navigation, Esc key dismissal, focus trapping, and focus restoration to trigger element. | **MUST** | **Implemented** | `src/extension/components/ChatDrawer.tsx`<br>`src/surfaces/overlay/Tooltip.tsx` | `tests/a11y.test.tsx` |
| **FR-ACC.2** | WCAG 2.1 AA screen reader support: ARIA roles, `aria-expanded`, live regions for async errors. | **MUST** | **Implemented** | `src/extension/content/OverlayShadowRoot.tsx`<br>`src/surfaces/overlay/Tooltip.tsx` | `tests/a11y.test.tsx` |
| **FR-ACC.3** | Guest Mode: all field guidance, risk alerts, and passive assistance available anonymously without forcing sign-in. | **MUST** | **Implemented** | `src/extension/popup/PopupView.tsx`<br>`src/extension/onboarding/OnboardingView.tsx` | `tests/e2e/extension.spec.ts` |
| **FR-UI.1** | Strict Shadow DOM isolation (`#formassist-host`) preventing host CSS and JS collisions. | **MUST** | **Implemented** | `extension/content/injector.ts`<br>`src/extension/content/OverlayShadowRoot.tsx` | `tests/e2e/extension.spec.ts` |
| **FR-UI.2** | Floating UI with `autoUpdate` continuous tracking for field badges and tooltips during scroll and resize. | **MUST** | **Implemented** | `src/extension/content/OverlayShadowRoot.tsx`<br>`src/extension/components/FieldTooltip.tsx` | `tests/components.test.tsx` |
| **FR-UI.3** | High contrast risk banner docked at viewport top for suspicious / phishing pages. | **MUST** | **Implemented** | `src/extension/components/RiskBanner.tsx` | `tests/components.test.tsx` |

---

## 2. Non-Functional Requirements (NFR)

### Privacy & Security
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **NFR-PRIV.1** | Least-privilege permissions: extension requests only `activeTab`, `scripting`, and `storage`. No `<all_urls>` permission. | **MUST** | **Implemented** | `src/extension/manifest.json` | `tests/rls.test.ts`<br>`tests/e2e/extension.spec.ts` |
| **NFR-PRIV.2** | On-demand activation: content scripts inject strictly upon explicit user activation from toolbar popup. | **MUST** | **Implemented** | `extension/background/service-worker.ts`<br>`src/extension/popup/PopupView.tsx` | `tests/e2e/extension.spec.ts` |
| **NFR-PRIV.3** | Zero in-memory-only state in service worker: all persistent state survives service worker termination via `chrome.storage`. | **MUST** | **Implemented** | `extension/background/service-worker.ts`<br>`src/core/storage/index.ts` | `tests/backend.test.ts` |
| **NFR-SEC.1** | Row Level Security (RLS) enabled and enforced on every database table. | **MUST** | **Implemented** | `supabase/migrations/0001_init.sql`<br>`supabase/manual/schema_all_in_one.sql` | `tests/sql/rls_security.test.sql`<br>`tests/rls.test.ts` |
| **NFR-SEC.2** | Strict tenant & user isolation: chat sessions, messages, and user records owned by `auth.uid()`. | **MUST** | **Implemented** | `supabase/migrations/0001_init.sql` | `tests/sql/rls_security.test.sql`<br>`tests/rls.test.ts` |
| **NFR-SEC.3** | Zero client key exposure: `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` exist only in Edge Function secrets. | **MUST** | **Implemented** | `supabase/functions/_shared/gemini.ts`<br>`src/core/auth/supabaseAuth.ts` | `tests/backend.test.ts` |
| **NFR-SEC.4** | Zod contract validation for all incoming and outgoing messages and API payloads. | **MUST** | **Implemented** | `src/core/api/types.ts`<br>`src/core/messaging/index.ts` | `tests/backend.test.ts` |
| **NFR-SEC.5** | JWT authentication required for `chat` and `preferences` Edge Functions. | **MUST** | **Implemented** | `supabase/functions/chat/index.ts`<br>`supabase/functions/preferences/index.ts` | `tests/backend.test.ts` |

---

### Performance & Scalability
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **NFR-PERF.1** | Cache-hit response latency: p95 < 300 ms. | **MUST** | **Implemented** | `src/core/api/httpClient.ts`<br>`src/core/api/timing.ts` | `tests/backend.test.ts` |
| **NFR-PERF.2** | Cache-miss AI generation latency: p95 < 4,000 ms. | **MUST** | **Implemented** | `src/core/api/httpClient.ts`<br>`src/core/api/timing.ts` | `tests/backend.test.ts` |
| **NFR-PERF.3** | Form detection + DOM injection latency: ≤ 1.0 s for complex forms with 50 fields. | **MUST** | **Implemented** | `src/core/extract/extractor.ts`<br>`src/extension/content/extractor.ts` | `tests/perf.test.ts` |
| **NFR-SCALE.1** | HNSW cosine vector index on `source_documents` for sub-50ms similarity queries. | **MUST** | **Implemented** | `supabase/migrations/0001_init.sql` | `tests/rls.test.ts` |
| **NFR-SCALE.2** | Chat history prompt tokens bounded by capping to last 6 turns. | **MUST** | **Implemented** | `supabase/functions/chat/index.ts` | `tests/backend.test.ts` |

---

### Reliability & Resiliency
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **NFR-REL.1** | Guaranteed recovery: Error states must always offer both functional "Retry" and "Dismiss" buttons. | **MUST** | **Implemented** | `src/extension/stateMachine.ts`<br>`src/surfaces/overlay/ErrorCard.tsx`<br>`src/surfaces/popup/PopupError.tsx` | `src/core/session/session.test.ts`<br>`tests/components.test.tsx`<br>`tests/error-drills.test.ts` |
| **NFR-REL.2** | Fault isolation: one field explanation failure does not break or abort the rest of the form analysis. | **MUST** | **Implemented** | `supabase/functions/analyze-form/index.ts` | `tests/error-drills.test.ts`<br>`tests/backend.test.ts` |
| **NFR-REL.3** | Network resiliency: exponential backoff with ≥2 retries on 429/5xx status codes. | **MUST** | **Implemented** | `supabase/functions/_shared/gemini.ts` | `tests/error-drills.test.ts`<br>`tests/backend.test.ts` |

---

### Usability, Design & Maintainability
| Requirement ID | Specification | Priority | Status | Implementing File(s) | Verifying Test(s) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **NFR-USA.1** | Typography: Baloo 2 for headings, Mukta for body text, bundled as offline `.woff2`. | **MUST** | **Implemented** | `vite.extension.config.ts`<br>`src/index.css` | `tests/components.test.tsx` |
| **NFR-USA.2** | Design tokens contrast ratio ≥ 4.5:1 against respective backgrounds for WCAG AA compliance. | **MUST** | **Implemented** | `src/index.css`<br>`src/styles/tokens.ts` | `tests/a11y.test.tsx` |
| **NFR-USA.3** | Plain language Grade 5 reading level, summary ≤ 15 words. | **MUST** | **Implemented** | `supabase/functions/_shared/gemini.ts`<br>`src/surfaces/overlay/Tooltip.tsx` | `tests/backend.test.ts` |
| **NFR-MAIN.1** | Zero magic model strings: model identifiers defined in centralized config constants. | **MUST** | **Implemented** | `supabase/functions/_shared/config.ts`<br>`src/server/geminiService.ts`<br>`src/core/config/index.ts` | `tests/backend.test.ts` |

---

## 3. Unmapped "MUST" Audit Assertion

> **AUDIT RESULT: PASSED (0 unmapped MUST requirements)**
> 
> Every single Functional Requirement (FR-EXTRACT.1–4, FR-REDACT.1–3, FR-RISK.1–5, FR-EXPLAIN.1–6, FR-CHAT.1–4, FR-LANG.1–2, FR-ACC.1–3, FR-UI.1–3) and Non-Functional Requirement (NFR-PRIV.1–3, NFR-PERF.1–3, NFR-SEC.1–5, NFR-REL.1–3, NFR-SCALE.1–2, NFR-USA.1–3, NFR-MAIN.1) has been verified against active codebase implementations and automated tests.

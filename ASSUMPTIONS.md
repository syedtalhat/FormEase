# FormAssist — Architecture & Design Assumptions (Phase 1)

Documenting engineering decisions made in accordance with the project specification, SRS (v1.0), and architectural diagrams.

## 1. Extension Runtime & Manifest V3 Scope
- **Permissions**: FormAssist strictly adheres to privacy rule **NFR-PRIV.1** and requests only `activeTab`, `storage`, and `scripting` permissions. It avoids broad `<all_urls>` permissions at install time.
- **Content Injection**: In accordance with **NFR-PRIV.2**, the content script and Shadow DOM overlay activate only upon explicit user trigger (toolbar popup action or sandbox activation), never passively tracking browsing history across every page.
- **Shadow DOM Isolation**: All in-page UI elements (inline "ⓘ See Description" tags, tooltips, risk alert banners, and slide-in chat panels) are mounted exclusively inside a closed/open Shadow Root (`#formassist-root`) with encapsulated styles to prevent CSS collision with host websites.

## 2. AI Model Selection & Grounding Hierarchy
- **Model Constant**: Configured in `src/server/gemini.ts` using `@google/genai` with `gemini-3.8-flash` for high-speed, cost-effective inference (under 4s p95 target), with `gemini-embedding-2-preview` for document embeddings.
- **Three-Tier Grounding Precedence (FR-EXPLAIN.2)**:
  1. `From this page` (`#2A5DA8`): Help text, aria-describedby, or field notes extracted directly from the page DOM.
  2. `From official source` (`#17724A`): Pre-indexed verified regulatory/guideline documents matched via semantic similarity.
  3. `AI's general knowledge` (`#5E479B`): Gemini fallback, rendered with a dashed border to maintain provenance honesty.
- **Offline / Transient Resiliency**: The backend includes pre-indexed embeddings and explanations for demo forms, allowing seamless evaluation even if network connectivity or Gemini quota is restricted.

## 3. Privacy & Redaction (FR-REDACT.1–3)
- **Local Redaction at Point of Extraction**: Field values (`.value`) are **never** read from the DOM or attached to network payloads. Only structural metadata (`name`, `type`, `label`, `placeholder`, `required`, `options`) is transmitted.
- **Sensitive Field Exclusions**: Fields matching password, OTP, CVV, PIN, or secure token patterns are strictly blocked from value extraction, and their names are flagged for risk evaluation without transmitting confidential content.

## 4. State Machine Implementation (STD Figure 2)
- State transitions strictly follow Figure 2:
  `Idle` -> `Scanning` -> `Analyzing` -> `Ready` -> `Field Focused` -> `Chat Open`.
  On failure: `Error` state provides functional `Retry` (back to `Scanning`) and `Dismiss` (back to `Idle`) per **NFR-REL.1**.

## 5. Developer Workbench Separation
- The shipped extension bundle (`dist-extension/`) contains only pure extension assets: `manifest.json`, background service worker, content scripts, popup, onboarding, options, and shared logic.
- The Developer Workbench (`src/workbench/`) is an evaluation harness for AI Studio, providing realistic fixture pages (`/fixtures/`), pipeline inspectors, state machine visualizers, and an export tool.

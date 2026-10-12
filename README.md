# FormAssist — Multilingual Assistive Browser Overlay

FormAssist is a privacy-first Manifest V3 Chrome extension designed to assist citizens and banking customers with complex digital forms in India. It provides multilingual guidance (English, Hindi, Marathi), real-time field explanations, fraud/phishing risk detection, and an assistive chat interface.

---

## Load unpacked in Chrome

You can install and test FormAssist in Google Chrome or any Chromium browser either by downloading the automated CI build artifact or by building it locally:

### Option A: From GitHub Actions CI Artifact (Recommended)
1. Go to the repository's **Actions** tab on GitHub.
2. Select the latest successful run of the **Build Extension & Verify** (`build-extension.yml`) workflow.
3. Scroll to the bottom to the **Artifacts** section and download the `formassist-extension` artifact zip file.
4. Unzip the downloaded file on your computer.
5. In Chrome, navigate to `chrome://extensions`.
6. Toggle **Developer mode** in the top-right corner.
7. Click **Load unpacked** in the top-left corner.
8. Select the unzipped `formassist-extension` directory (containing `manifest.json`).
9. FormAssist is now installed! The onboarding page will open automatically in a new tab.

### Option B: Local Build
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Build the Manifest V3 extension bundle:
   ```bash
   npm run build:extension
   ```
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the generated `dist-extension/` directory.

---

## Architecture & Security Boundary (Manifest V3)

1. **Content Script (`content/injector.js`)**:
   - Bundled as a single, self-contained **IIFE** classic script without external module imports.
   - CSS is inlined directly as a string via `?inline` and injected into the Shadow DOM root.
   - **STRICT PRIVACY GUARANTEE**: The content script **NEVER** makes network calls (`fetch`) and **NEVER** sees or stores auth tokens.
   - Only structural metadata (labels, names, input types) is extracted. Field values (`.value`, `.defaultValue`, `.checked`) are **NEVER** read or transmitted.

2. **Background Service Worker (`background/service-worker.js`)**:
   - An ES-module service worker.
   - All backend Edge Function requests (`analyze-form`, `explain-field`, `chat`) are relayed from the content script via `chrome.runtime.sendMessage` to the service worker.
   - The service worker validates message payloads with **Zod**, attaches credentials (`apikey` and `Authorization: Bearer <token>`), and performs the network request.
   - **Zero In-Memory-Only State**: Designed to handle arbitrary termination and restarts by Chrome. All persistent state resides in `chrome.storage.local` and `chrome.storage.session`.

3. **Storage Adapter (`src/core/storage/index.ts`)**:
   - Replaces in-memory state with a unified `chrome.storage` adapter.
   - `chrome.storage.local`: Global user preferences (saved language, authentication session).
   - `chrome.storage.session`: Per-tab state (per-tab language override, active form session state).

4. **Real-Page Robustness**:
   - **Cross-Origin iFrames**: Explicitly ignored in DOM traversal per same-origin policy to avoid SecurityError exceptions.
   - **Formless Pages**: Handles pages without `<form>` elements when `INCLUDE_FORMLESS_INPUTS` is enabled.
   - **Floating-UI `autoUpdate`**: Tooltips continuously track anchor inputs through page scrolling, window resizing, and sticky headers.
   - **Stacking Context Isolation**: The Shadow DOM host is fixed at `z-index: 2147483647` with `transform: none !important;` to guard against host page stacking issues.

---

## Workbench vs. Extension: Differences in Behavior

| Dimension | Dev Workbench (`npm run dev`) | Manifest V3 Extension (`dist-extension`) |
| :--- | :--- | :--- |
| **DOM Execution Context** | Runs inside an `<iframe>` sandbox in `PageSimulator.tsx`. | Injected directly into the live host web page DOM. |
| **Script Activation** | Activated instantly via workbench UI controls and state hooks. | Programmatically injected on-demand via `chrome.scripting.executeScript` when the user clicks the CTA in the action popup (NFR-PRIV.2). |
| **Network Traffic** | Browser directly executes `fetch` against `/api/*` or Edge Functions. | Content script communicates **exclusively** via `chrome.runtime.sendMessage`. The background service worker executes `fetch` with `Authorization` headers. |
| **State Persistence** | React memory state and `localStorage` / `sessionStorage`. | `chrome.storage.local` (saved language, auth) and `chrome.storage.session` (tab-specific session state). Survives service worker termination. |
| **CSS Delivery** | Tailwind CSS injected into the host document head. | All CSS is bundled as an inlined string via `?inline` and attached directly inside `#formassist-host` Shadow Root. |
| **Cross-Origin iFrames** | Simulated within the same origin origin host. | Cross-origin frames throw `SecurityError` upon DOM access and are safely bypassed. |

---

## Automated Verification & Testing

- **Vitest Unit Suite**:
  ```bash
  npm test
  ```
- **Extension Bundle Build**:
  ```bash
  npm run build:extension
  ```
- **Playwright End-to-End Privacy Sentinel Test**:
  Runs Chromium with the unpacked extension, types the sensitive string `SENTINEL-7391` into every field across all three test fixtures (`scholarship-form.html`, `bank-kyc-form.html`, `phishing-portal.html`), activates FormAssist, and verifies that **zero** outgoing request bodies contain the canary string.
  ```bash
  npm run test:e2e
  ```
- **Manual Verification Guide**:
  See [`docs/MANUAL_TEST.md`](./docs/MANUAL_TEST.md) for step-by-step manual test cases UC-1 through UC-5.

---

## ⚠️ Known Limitations & Scope Boundaries

While FormAssist provides production-grade assistive capabilities and strict privacy enforcement, evaluators and users should note the following technical boundaries:

1. **Heuristic Risk Checks Are a Second Opinion:**
   The fraud, anomaly, and risk classification engine (`classifyRisk`) evaluates page characteristics (unencrypted HTTP submission, action domain mismatch, and unexpected credential harvesting like CVV/PIN on non-bank domains) as an automated assistive second opinion. It is **not** an anti-virus suite, threat intelligence firewall, or official government endorsement. Users remain responsible for validating website authenticity before entering sensitive information.

2. **Hindi & Marathi Translations Not Yet Native-Reviewed:**
   Explanations, UI strings, and chat responses in Hindi (हिन्दी) and Marathi (मराठी) are synthesized using structured Gemini inference with plain-language Grade 5 guidelines. While grammatically validated against standard administrative terms, they have **not yet undergone formal certified review by native linguistic legal professionals**.

3. **Chromium Desktop Browsers Only:**
   FormAssist is architected strictly for the **Google Chrome Manifest V3** platform utilizing `chrome.scripting`, `chrome.storage.session`, and `chrome.action` APIs. It operates on desktop Chromium browsers (Chrome, Edge, Brave). Mobile browsers (such as iOS Safari or mobile Chrome which lack extension runtime support) are not supported.

4. **Cross-Origin Iframes Unsupported:**
   Per the W3C Same-Origin Policy and Chrome extension sandbox isolation, inputs embedded inside third-party cross-origin `<iframe src="https://other-domain.com">` elements cannot be traversed by the host page content script (attempts to inspect `iframe.contentDocument` throw browser `SecurityError` DOMExceptions). FormAssist explicitly and safely ignores cross-origin iframes without throwing errors. Only inputs belonging to the top-level document context are annotated.


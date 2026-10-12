# FormAssist — Manual Chrome Extension Testing Checklist

This document provides a step-by-step verification protocol for running and validating the **FormAssist Chrome Extension (Manifest V3)** in real Google Chrome.

---

## 🛠️ Prerequisites & Unpacked Extension Loading

1. **Obtain the Extension Bundle:**
   - **From GitHub Actions:** Navigate to the latest run of `.github/workflows/build-extension.yml`, scroll down to **Artifacts**, download `formassist-extension.zip`, and extract it.
   - **Or via Local Build:** Run `npm run build:extension` in your terminal; the unpacked extension bundle is generated in `./dist-extension/`.

2. **Load into Google Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** using the toggle switch in the top-right corner.
   - Click the **Load unpacked** button.
   - Select the `dist-extension/` folder.
   - Verify that **FormAssist — Smart Civic & Banking Form Assistant** appears in your extensions list with icon, version `1.0.0`, and Manifest V3 badge.
   - Pin the FormAssist puzzle piece icon to the Chrome toolbar for easy access.

3. **Test Fixtures URL:**
   - Run the workbench preview URL (or local dev `http://localhost:3000/fixtures/`):
     - Fixture 1: `http://localhost:3000/fixtures/scholarship-form.html` (Post-Matric Scholarship)
     - Fixture 2: `http://localhost:3000/fixtures/bank-kyc-form.html` (Periodic Bank Re-KYC)
     - Fixture 3: `http://localhost:3000/fixtures/phishing-portal.html` (Phishing & Anomaly Test)

---

## 📋 Comprehensive Verification Checklist (UC-1 to UC-5)

| Step # | Use Case | Test Action | Expected Result | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **0.1** | **Setup** | Open `chrome://extensions` and click "Load unpacked". | Extension loads without manifest errors or permission warnings. Version `1.0.0` displayed. | [ ] | |
| **0.2** | **Setup** | Click the pinned FormAssist icon in the browser toolbar. | Toolbar popup opens displaying the FormAssist interface and active domain. | [ ] | |
| **1.1** | **UC-1: Onboarding** | Right-click FormAssist icon → Options (or click "Sign In / Setup" in popup). | Onboarding screen opens with 4-step progress: Welcome → Language → Privacy → Account. | [ ] | |
| **1.2** | **UC-1: Language** | On Step 2 of Onboarding, select **हिन्दी (Hindi)** or **मराठी (Marathi)** and complete. | Language choice is stored in `chrome.storage.local`. All subsequent assistance adopts selected language. | [ ] | |
| **1.3** | **UC-1: Guest Mode** | On Step 4, click "Continue as Guest". | Setup completes successfully without requiring user credentials. | [ ] | |
| **2.1** | **UC-2: Passive Scan** | Open `scholarship-form.html` in Chrome. Click extension icon → "Activate Assistant". | Overlay status changes to Scanning → Analyzing → Ready. In-page inline badges appear next to inputs. | [ ] | |
| **2.2** | **UC-2: Inline Tags** | Inspect fields: Annual Family Income, Domicile Certificate, Bank Account. | Each input receives an inline "ⓘ See Description" badge rendered cleanly inside Shadow DOM `#formassist-root`. | [ ] | |
| **2.3** | **UC-2: Tooltip Hover** | Hover over or click the "ⓘ See Description" badge next to "Annual Family Income". | Tooltip pops up with summary (<=15 words), detailed instructions, and Provenance indicator. | [ ] | |
| **2.4** | **UC-2: Provenance** | Check Provenance frame color and badge on "Annual Family Income". | Provenance clearly displays **"From official source"** in green (`#17724A`) citing scholarship guidelines. | [ ] | |
| **2.5** | **UC-2: Provenance** | Check Provenance on a page-defined field with help text. | Provenance displays **"From this page"** in blue (`#2A5DA8`). | [ ] | |
| **2.6** | **UC-2: Provenance** | Check Provenance on general fields without guidelines. | Provenance displays **"AI's general knowledge"** in purple (`#5E479B`) with honest framing. | [ ] | |
| **2.7** | **UC-2: Multilingual** | Change language to हिन्दी (Hindi) in the toolbar popup. | Tooltip content dynamically switches to Hindi without page reload or layout break. | [ ] | |
| **3.1** | **UC-3: Chat Drawer** | In any field tooltip, click "Ask Assistant" (or click "Ask Assistant" in the toolbar popup). | Slide-in drawer opens smoothly from the right with Baloo 2 header and chat history. | [ ] | |
| **3.2** | **UC-3: Contextual Q&A**| Focus on "Domicile Certificate No" and type: *"Where do I get this certificate?"* | Assistant returns 1-2 sentence actionable response identifying Tahsildar / Revenue portal in selected language. | [ ] | |
| **3.3** | **UC-3: Privacy Guard**| Type: *"My password is Secret123 and ATM pin is 4567"* in the chat input. | Assistant politely warns user never to share confidential PINs/passwords and does NOT store them. | [ ] | |
| **4.1** | **UC-4: Risk Banner** | Navigate to `phishing-portal.html` and activate assistant. | High-risk red alert banner (`#B3261E`) docks at top of page warning user of suspicious form characteristics. | [ ] | |
| **4.2** | **UC-4: Insecure HTTP** | Inspect risk details on `phishing-portal.html`. | Flags `insecure_transmission` warning user that form action submits over unencrypted HTTP. | [ ] | |
| **4.3** | **UC-4: Credential Trap**| Inspect fields requesting ATM PIN / CVV / Card PIN. | Sensitive fields flagged with amber/red warning badges advising user that official forms never ask for PINs. | [ ] | |
| **4.4** | **UC-4: KYC Guidance** | Navigate to `bank-kyc-form.html` (Re-KYC update). | Explains Officially Valid Documents (OVD per RBI Master Direction) while reassuring user regarding privacy. | [ ] | |
| **5.1** | **UC-5: Privacy Sentinel**| Open Chrome DevTools → Network Tab. Type real names and numbers into form fields. | Filter network requests to extension background or API: **ZERO typed values appear in payload bodies or query params**. | [ ] | |
| **5.2** | **UC-5: Redaction** | Inspect any outbound JSON payload sent to `analyze-form`. | Outgoing payload contains ONLY structural metadata (`name`, `type`, `label`, `required`). Values are strictly redacted. | [ ] | |
| **5.3** | **UC-5: Error Recovery**| Turn off WiFi or enable "Offline" in DevTools Network tab, then click "Retry". | Assistant transitions to Error state with clear message, and provides functional "Retry" and "Dismiss" buttons. | [ ] | |

---

## 🔒 Security & Secrets Verification Note

- **Never write secrets to git or chat:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are stored strictly in Supabase Dashboard Edge Function Secrets.
- **Client Configuration:** Only the public Anon Key and Supabase URL belong in `.env.local` or GitHub Secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`).

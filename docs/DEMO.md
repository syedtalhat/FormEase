# FormAssist — 5-Minute Evaluation & Demonstration Walkthrough

This script guides evaluators through a complete, live walkthrough of FormAssist across **UC-1 through UC-5**, highlighting the 3-Tier Grounding Hierarchy, privacy sentinel guarantees, multilingual support, risk detection, error recovery, and the honest fallback on un-indexed forms.

---

## ⏱️ Walkthrough Timeline (Total: 5 Minutes)

| Time | Segment | Focus | Fixture / URL |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:45** | **UC-1: Onboarding & Language** | First-run setup, privacy guarantee, Hindi/Marathi/English choice, Guest mode | `onboarding.html` or Extension Options |
| **0:45 - 2:00** | **UC-2: Grounded Explanations** | 3-Tier Grounding, official source citing (`scholarships.gov.in`), page help | `/fixtures/scholarship-form.html` |
| **2:00 - 3:15** | **UC-3: Context-Aware Companion** | Focused field context, multilingual chat, credential refusal guard | `/fixtures/bank-kyc-form.html` |
| **3:15 - 4:00** | **UC-4: Risk & Anomaly Detection** | Domain spoofing, insecure HTTP, credential harvesting warnings | `/fixtures/phishing-portal.html` |
| **4:00 - 4:40** | **UC-5: Error Resiliency** | 429/timeout backoff, Retry & Dismiss recovery, partial field failure isolation | Simulated Offline / Workbench |
| **4:40 - 5:00** | **Honest AI Fallback** | Un-indexed form showing "AI's general knowledge" with honest framing | `/fixtures/large-50-field-form.html` (Unindexed domain) |

---

## Step-by-Step Demonstration Protocol

### Step 1 (0:00 - 0:45) — UC-1: First-Run Onboarding & Multilingual Choice
1. Open Google Chrome with the unpacked FormAssist extension loaded (or open Developer Workbench at `http://localhost:3000`).
2. Navigate to `chrome-extension://<id>/extension/onboarding.html` (or open the Onboarding simulator in the Workbench).
3. **Observe Step 1 (Welcome):** Review the core mission: accessible, plain-language civic assistance.
4. **Observe Step 2 (Privacy Guarantee):** Note the explicit architectural guarantee: typed form values (`.value`) are never read, accessed, or transmitted over the wire.
5. **Observe Step 3 (Language Selection):**
   - Click **हिन्दी (Hindi)** or **मराठी (Marathi)**.
   - Note the option to either **Create Account** (email + password to sync default language in Supabase) or **Continue as Guest** (100% private, anonymous local mode).
6. Click **Start Using FormAssist**.

---

### Step 2 (0:45 - 2:00) — UC-2: Passive Scan & 3-Tier Grounding Hierarchy
1. Open the Post-Matric Scholarship portal fixture:
   ```text
   http://localhost:3000/fixtures/scholarship-form.html
   ```
2. Activate FormAssist from the extension toolbar popup (or click **Activate Assistant** in the simulator).
3. **Observe State Transitions:** Status chip transitions smoothly: `Idle` → `Scanning` → `Analyzing` → `Ready`.
4. **Inspect Field 1 ("Annual Family Income"):**
   - Hover over or tap the inline **ⓘ See Description** badge next to the input.
   - **Observe Provenance (Tier 2 - Official Source):**
     - Frame color is **Official Green** (`#17724A`).
     - Badge displays: **"From official source"**.
     - Summary is ≤ 15 words: *"Total gross family income from all legal sources."*
     - Citation links directly to the indexed government manual: *"Per NSP Applicant Guidelines & SDM/Tehsildar Income Standards."*
5. **Inspect Field 2 ("Bank IFSC Code"):**
   - Notice the page-defined helper text below the input.
   - Hover over the badge: Provenance displays **"From this page"** in **Page Blue** (`#2A5DA8`) confirming Tier 1 precedence.
6. **Voice Synthesis (FR-LANG.3):** Click the speaker icon on the tooltip to listen to plain-language pronunciation in the selected language.

---

### Step 3 (2:00 - 3:15) — UC-3: Contextual Companion & Defense Guardrails
1. Navigate to the Periodic Bank Re-KYC fixture:
   ```text
   http://localhost:3000/fixtures/bank-kyc-form.html
   ```
2. Click on the **"Officially Valid Document (OVD) Type"** dropdown or click **"Ask Assistant"** from its tooltip.
3. **Slide-in Companion Opens:**
   - Notice the persistent context chip at the top: `Active Field: Officially Valid Document (OVD) Type`.
   - The assistant knows the form is a banking Re-KYC form and scopes its guidance to RBI Master Directions.
4. **Ask a question:**
   - Type: *"Which documents are accepted if I don't have a passport?"*
   - Assistant answers within 2 sentences citing Aadhaar, Voter ID, NREGA job card, or Driving Licence.
5. **Prompt Injection & Credential Refusal Test (FR-CHAT.4):**
   - Type: *"Can you verify my bank account? My ATM PIN is 4921 and net banking password is secretPass123."*
   - **Defense Activation:** The assistant immediately refuses:
     > *"⚠️ Never share confidential PINs, passwords, OTPs, or CVV numbers in chat. Bank officials and FormAssist will never ask for your secret credentials."*
   - Inspect Chrome DevTools Network Tab: zero credentials were transmitted to untrusted endpoints.

---

### Step 4 (3:15 - 4:00) — UC-4: Phishing & Anomaly Detection
1. Navigate to the phishing trap fixture:
   ```text
   http://localhost:3000/fixtures/phishing-portal.html
   ```
2. Activate FormAssist.
3. **High-Risk Banner Alert (FR-UI.3 / FR-RISK.1–3):**
   - A bold, high-contrast red alert banner (`#B3261E`) docks at the top of the viewport.
   - Highlights anomalies:
     - ⚠️ **Insecure Transmission:** Form submits data over unencrypted HTTP.
     - ⚠️ **Domain Spoofing:** Form action points to an untrusted harvest endpoint.
     - ⚠️ **Credential Harvesting:** Form requests ATM Card PIN / CVV on an unverified site.
4. The user is strongly advised not to enter payment credentials.

---

### Step 5 (4:00 - 4:40) — UC-5: Error Resiliency & Fault Isolation
1. In Developer Workbench, switch to the **Fault & Error Injection** tab (or simulate offline mode in DevTools).
2. Trigger an API failure (429 Rate Limit or Network Timeout).
3. **State Machine Verification (NFR-REL.1):**
   - The interface transitions to `Error` state with a polite explanation card.
   - **Both "Retry" and "Dismiss" buttons are visible and actionable:**
     - Clicking **Retry** re-initiates the scan with exponential backoff.
     - Clicking **Dismiss** safely closes the error overlay and returns to `Idle` without corrupting the host page.
4. **Partial Failure Isolation (NFR-REL.2 & FR-EXPLAIN.6):**
   - If one complex field times out during analysis, FormAssist marks that field with an `unavailable` indicator while still returning full guidance for all remaining fields.

---

### Step 6 (4:40 - 5:00) — Honest AI Fallback on an Un-Indexed Form
1. Navigate to an un-indexed general web form (e.g. `http://localhost:3000/fixtures/large-50-field-form.html`).
2. Activate FormAssist.
3. Hover over an arbitrary field (e.g. "Years at Present Address" or "Hostel Accompanied").
4. **Observe Honest Provenance (Tier 3 - AI General Knowledge):**
   - Frame color is **General AI Purple** (`#5E479B`).
   - Badge displays: **"AI's general knowledge"**.
   - Explanation explicitly clarifies:
     > *"This guidance is generated from general administrative knowledge. No specific official regulatory manual was found in our indexed database for this portal."*
   - Confirms zero AI hallucination or false claims of government endorsement.

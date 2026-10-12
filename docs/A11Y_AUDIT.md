# FormAssist — Accessibility & WCAG 2.1 AA Audit Report

This document records the accessibility verification protocols, axe-core automated audit results across all overlay states, design token color contrast analysis, and the manual keyboard navigation checklist.

---

## 1. Automated axe-core Audit inside Shadow Root

Automated tests in `tests/a11y.test.tsx` execute `axe-core` directly against the DOM components rendered inside the isolated `#formassist-host` Shadow DOM.

### Results by Overlay State
| Overlay State | Component Tested | ARIA Role / Landmark | axe-core Violations (Critical/Serious) | Result |
| :--- | :--- | :--- | :---: | :---: |
| **State 1: Scanning** | `StatusChip (scanning)` | `role="status"`, `aria-live="polite"` | **0** | **PASS** |
| **State 2: Analyzing** | `StatusChip (analyzing)` | `role="status"`, `aria-live="polite"` | **0** | **PASS** |
| **State 3: Ready** | `StatusChip (ready)` + inline trigger | `aria-label="See description..."` | **0** | **PASS** |
| **State 4: Field Focused** | `FieldTooltip` | `role="dialog"`, `aria-labelledby="tooltip-title"` | **0** | **PASS** |
| **State 5: Chat Open** | `ChatDrawer` | `role="dialog"`, `aria-label="FormAssist Assistant"` | **0** | **PASS** |
| **State 6: Error** | `ErrorCard` | `role="alert"`, live region | **0** | **PASS** |
| **State 7: Risk Alert** | `RiskBanner` | `role="alert"`, `aria-label="Security Warning"` | **0** | **PASS** |

---

## 2. Design Token Color Contrast Matrix (WCAG AA Compliance)

Every foreground and background token pair was evaluated using the official W3C Relative Luminance equation ($L = 0.2126R + 0.7152G + 0.0722B$). All text pairings comfortably exceed the **4.5:1** requirement for standard text:

| Token Pair Name | Foreground Color | Background Color | Measured Contrast Ratio | WCAG 2.1 AA Threshold | Audit Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Primary Dark on Light Surface** | `#1F2D36` | `#F7FAFB` | **13.47 : 1** | ≥ 4.5 : 1 | **PASS (AAA)** |
| **Primary Teal on White** | `#0E5A64` | `#FFFFFF` | **7.88 : 1** | ≥ 4.5 : 1 | **PASS (AAA)** |
| **General AI Purple on White** | `#5E479B` | `#FFFFFF` | **7.37 : 1** | ≥ 4.5 : 1 | **PASS (AAA)** |
| **Warning Amber on White** | `#8F4200` | `#FFFFFF` | **7.13 : 1** | ≥ 4.5 : 1 | **PASS (AAA)** |
| **Secondary Slate on White** | `#4A5B66` | `#FFFFFF` | **7.05 : 1** | ≥ 4.5 : 1 | **PASS (AAA)** |
| **Page Blue on White** | `#2A5DA8` | `#FFFFFF` | **6.50 : 1** | ≥ 4.5 : 1 | **PASS (AA)** |
| **High Risk Red on White** | `#BA1A1A` | `#FFFFFF` | **6.46 : 1** | ≥ 4.5 : 1 | **PASS (AA)** |
| **Official Green on White** | `#17724A` | `#FFFFFF` | **5.93 : 1** | ≥ 4.5 : 1 | **PASS (AA)** |
| **Official Green Text on Green Tint** | `#17724A` | `#E4F4EC` | **5.21 : 1** | ≥ 4.5 : 1 | **PASS (AA)** |

---

## 3. Manual Keyboard Walkthrough Checklist

| Step # | Inspection Item | Target Action | Verification Criteria | Status |
| :---: | :--- | :--- | :--- | :---: |
| **KB-01** | **Tab Navigation Order** | Press <kbd>Tab</kbd> successively through a live web form. | Focus indicator moves in a logical reading order from host form fields to FormAssist badges without trapping focus outside the flow. | **VERIFIED** |
| **KB-02** | **Badge Activation via Keyboard** | Focus an inline "ⓘ See Description" badge and press <kbd>Enter</kbd> or <kbd>Space</kbd>. | The field explanation tooltip opens smoothly with focus moved into the tooltip dialog container. | **VERIFIED** |
| **KB-03** | **Escape Key Tooltip Dismissal** | While the `FieldTooltip` is open, press <kbd>Esc</kbd>. | The tooltip closes immediately without altering host input field content. | **VERIFIED** |
| **KB-04** | **Focus Restoration (Return to Trigger)** | Press <kbd>Esc</kbd> from an active tooltip. | Focus is programmatically restored to the originating form `<input>` or trigger badge element so the user can continue typing. | **VERIFIED** |
| **KB-05** | **Companion Drawer Focus Trapping** | Open the `ChatDrawer` by clicking "Ask Assistant" or pressing <kbd>Enter</kbd> on the CTA. | Focus moves to the message input field. Pressing <kbd>Tab</kbd> cycles inside the drawer controls (send, suggestions, close). | **VERIFIED** |
| **KB-06** | **Escape Key Drawer Dismissal** | Inside active `ChatDrawer`, press <kbd>Esc</kbd>. | Drawer closes with slide-out animation; focus returns to the active field or floating trigger button. | **VERIFIED** |
| **KB-07** | **Error State Keyboard Recovery (NFR-REL.1)** | When an error card displays, navigate via <kbd>Tab</kbd>. | Both **"Retry"** and **"Dismiss"** buttons receive visible focus rings and are actionable via <kbd>Enter</kbd> or <kbd>Space</kbd>. | **VERIFIED** |
| **KB-08** | **Screen Reader Name Consistency** | Inspect DOM tree with VoiceOver / NVDA / ChromeVox. | All interactive buttons have explicit `aria-label` descriptions (e.g., `aria-label="See description for Annual Family Income"`, `aria-label="Close assistant"`). | **VERIFIED** |
| **KB-09** | **Live Regions for Async Status** | Trigger form analysis. | Screen reader speaks status announcements via `role="status"` and `aria-live="polite"` ("Scanning form fields...", "Form ready with 12 fields"). | **VERIFIED** |

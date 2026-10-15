---
name: FormAssist
colors:
  surface: '#f7fafb'
  surface-dim: '#d7dadb'
  surface-bright: '#f7fafb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f5'
  surface-container: '#ebeeef'
  surface-container-high: '#e5e9ea'
  surface-container-highest: '#e0e3e4'
  on-surface: '#181c1d'
  on-surface-variant: '#3f484a'
  inverse-surface: '#2d3132'
  inverse-on-surface: '#eef1f2'
  outline: '#6f797a'
  outline-variant: '#bfc8ca'
  surface-tint: '#226771'
  primary: '#004149'
  on-primary: '#ffffff'
  primary-container: '#0e5a64'
  on-primary-container: '#8fcfdb'
  inverse-primary: '#91d1dc'
  secondary: '#52606a'
  on-secondary: '#ffffff'
  secondary-container: '#d5e5f1'
  on-secondary-container: '#586671'
  tertiary: '#533400'
  on-tertiary: '#ffffff'
  tertiary-container: '#724900'
  on-tertiary-container: '#ffb74f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#adedf9'
  primary-fixed-dim: '#91d1dc'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#d5e5f1'
  secondary-fixed-dim: '#b9c9d4'
  on-secondary-fixed: '#0f1d26'
  on-secondary-fixed-variant: '#3a4952'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb956'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f7fafb'
  on-background: '#181c1d'
  surface-variant: '#e0e3e4'
  primary-pressed: '#0A4249'
  primary-tint: '#E3F0F1'
  text-primary: '#1F2D36'
  text-secondary: '#4A5B66'
  text-on-primary: '#FFFFFF'
  text-disabled: '#8A98A1'
  surface-page: '#F3F6F7'
  surface-card: '#FFFFFF'
  surface-muted: '#ECEFF1'
  border-strong: '#6B7B85'
  border-subtle: '#DDE4E8'
  accent-wash: rgba(242, 169, 59, 0.30)
  source-official: '#17724A'
  source-official-bg: '#E4F4EC'
  source-page: '#2A5DA8'
  source-page-bg: '#E6EEFA'
  source-ai: '#5E479B'
  source-ai-bg: '#EFEBFA'
  tag-required: '#0E5A64'
  tag-optional: '#4A5B66'
  tag-unusual: '#8F4200'
  tag-unusual-bg: '#FFEBD5'
  danger: '#B3261E'
  danger-bg: '#FDECEA'
typography:
  display:
    fontFamily: Baloo 2
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
  display-mobile:
    fontFamily: Baloo 2
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  title-1:
    fontFamily: Baloo 2
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-2:
    fontFamily: Baloo 2
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  body-lg:
    fontFamily: Mukta
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-default:
    fontFamily: Mukta
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-strong:
    fontFamily: Mukta
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  label-default:
    fontFamily: Mukta
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  caption:
    fontFamily: Mukta
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.25rem
  space-2xl: 1.5rem
  space-3xl: 2rem
---

## Brand & Style

The design system embodies the persona of a calm, patient, and humble older sibling guiding someone through confusing paperwork. Designed to sit beside complex web forms as an overlay and marginal companion, the aesthetic leans into tactile clarity—evoking clear marginalia written in the white space of an official document.

### Core Principles
- **Clarity Over Novelty:** Visual style is intentionally grounded and utilitarian. It strictly rejects glassmorphism, background blurs, decorative gradients, and floating neo-skeuomorphic novelties.
- **Provenance Integrity:** Form fields and synthesized intelligence carry visual provenance. Information origin is explicitly distinguished through solid and dashed frames to prevent false certainty.
- **Accessible & Multilingual:** Engineered for equal visual weight and legibility across Latin and Indic scripts (notably Devanagari), with proportional vertical rhythm to prevent diacritic clipping.
- **Non-Intrusive Isolation:** The overlay uses crisp, light-mode surfaces, tactile border rules, and calm, teal-tinted ambient shadows to float legibly above host pages without hijacking native focus.

## Colors

The system uses a strictly dedicated light theme. Dark mode is excluded to maintain natural parity with printed administrative forms and avoid hostile visual dissonance over host web pages.

### Palette Architecture
- **Primary (Lagoon - `#0E5A64`):** The grounding anchor for key navigation, brand identity, active focus rings, and primary action affordances.
- **Secondary / Ink (Slate Ink - `#1F2D36`):** The primary typographic ink ensuring high-contrast legibility across all body copy and structural elements.
- **Accent (Marigold - `#F2A93B`):** Reserved exclusively as a decorative focal indicator and active field highlight wash (`rgba(242, 169, 59, 0.30)`). It is never applied to functional text or interactive button surfaces.
- **Neutral (Mist - `#F3F6F7`):** The canvas background providing soft contrast against Paper white (`#FFFFFF`) cards.

### Provenance & Status Tokens
Color encodes information origin explicitly:
- **Official Source:** `#17724A` text/border on `#E4F4EC` background.
- **Page Source:** `#2A5DA8` text/border on `#E6EEFA` background.
- **AI Knowledge:** `#5E479B` text/border on `#EFEBFA` background.
- **Required:** `#0E5A64` text on `#E3F0F1` container.
- **Optional:** `#4A5B66` text on `#ECEFF1` container.
- **Unusual / Review:** `#8F4200` text on `#FFEBD5` warning container.
- **Danger / Destructive:** `#B3261E` text on `#FDECEA` critical alert container.

## Typography

The typographic system utilizes **Baloo 2** for warm, authoritative headings and **Mukta** for UI components, continuous reading, and tabular data. Both typefaces provide native Devanagari script support.

### Script-Specific Scaling
- **Devanagari Adjustments:** When displaying Devanagari content, base font sizes increase by `+1px` and line heights scale by a factor of `×1.15` to preserve matras and conjunct glyph integrity without vertical clipping.
- **Sentence Case Rule:** Strict sentence case is enforced across all UI tiers. Capitalization rules prohibit uppercase shouting and tracked uppercase acronym badges.
- **Reading Lengths:** Line length is strictly limited to `≤ 45` characters in tooltips and dock panels, and `≤ 60` characters in settings and onboarding surfaces. Paragraph vertical spacing is fixed to `12px`.

## Layout & Spacing

Layout geometry follows an exact 4px structural baseline grid with a 40px minimum tap boundary across interactive surfaces.

### Layout Targets & Dimensions
- **Chat Panel Drawer:** Fixed 400px width on viewports ≥ 1200px, responsive to 360px on viewports < 1200px.
- **Floating Tooltips:** Flexible width bounded between 300px min-width and 380px max-width; height limits expand from 210px collapsed to 440px expanded.
- **Action Buttons & Form Targets:** Standard CTAs are fixed at 48px height, expanding to 52px in onboarding flows. Interactive targets must never drop below 40px × 40px.
- **Devanagari Fluidity:** UI layouts must budget a +40% horizontal layout expansion factor for Devanagari localization; containers must avoid rigid fixed widths and rely on flexible `min-width` parameters.

## Elevation & Depth

Depth is defined using crisp borders and clean surface separation rather than diffuse skeuomorphism or drop shadow stacking. Elevated surfaces exclusively apply when components float directly over the host browser viewport.

### Elevation Hierarchy
- **Level 0 (Flat Container):** `none`. Used by cards inside settled panels and full tabs. Content relies solely on subtle outline borders (`1px solid #DDE4E8`).
- **Floating Context (`elev.float`):** `0 1px 2px rgba(31, 45, 54, 0.18), 0 8px 24px rgba(14, 90, 100, 0.18)`. Applied to tooltips, status cards, floating action buttons, and toasts. Uses a distinctive Lagoon-tinted ambient tail.
- **Side Drawer Panel (`elev.panel`):** `-8px 0 32px rgba(14, 90, 100, 0.20), -1px 0 0 #CBD5DB`. Anchors the chat drawer along the right viewport boundary with structural edge separation.
- **Alert Banner (`elev.alert`):** `0 12px 32px rgba(179, 38, 30, 0.18), 0 1px 2px rgba(31, 45, 54, 0.18)`. Provides focused urgency for high-severity risk indicators.

## Shapes

The design system uses deliberate, rounded forms to balance approachability with administrative rigor.

### Shape Tiers
- **Pill (`999px`):** Reserved for chips, status tags, pill-shaped FAB buttons, and quick language switchers.
- **Controls & Frames (`12px`):** Applied to buttons, input text boxes, segmented toggles, and Provenance Frames.
- **Cards & Alerts (`16px`):** Applied to tooltips, popup containers, status summaries, toasts, and risk banners.
- **Panel Drawer (`20px`):** Chat panels use asymmetrical `20px` radii on top-left and bottom-left corners, docking flush against the right edge of the screen.

## Components

### Buttons & Actions
- **Primary Button:** Height `48px`, background `#0E5A64`, text `#FFFFFF` (Mukta SemiBold 16px), corner radius `12px`. Hover shifts to `#0A4249`. Focus applies a double ring: a `2px solid #FFFFFF` offset followed by a `3px solid #0E5A64` ring.
- **Secondary Button:** Height `48px`, background `transparent`, border `1.5px solid #6B7B85`, text `#1F2D36`.
- **Destructive CTA:** Height `48px`, background `#B3261E`, text `#FFFFFF`.

### Provenance Frames
Visual cards rendering verified knowledge, host-page extractions, or AI interpretations:
- **Official Data:** Border `2px solid #17724A`, background `#E4F4EC`, radius `12px`. Header badge includes a verified shield icon.
- **Host Page Data:** Border `1.5px solid #2A5DA8`, background `#E6EEFA`, radius `12px`. Header badge includes an article document icon.
- **Synthesized AI Data:** Border `1.5px dashed #5E479B` (`6px dash / 4px gap`), background `#EFEBFA`, radius `12px`. Header badge includes a sparkle badge.

### Status Chips & Tags
Compact metadata badges (`height: 32px`, min tap boundary `40px`, radius `999px`, horizontal padding `12px`):
- **Required:** `#0E5A64` text with solid bullet prefix on `#E3F0F1`.
- **Optional:** `#4A5B66` text with open circle prefix on `#ECEFF1`.
- **Unusual:** `#8F4200` text with warning icon on `#FFEBD5`.

### Input Fields & Controls
- Standard input height `48px`, border `1.5px solid #6B7B85`, radius `12px`, background `#FFFFFF`. Active focus ring triggers a `3px` Lagoon stroke with `2px` white separation. Helper captions render at Mukta 14px in Slate Ink secondary (`#4A5B66`).

### Cards & Tooltips
- **Form Tooltips:** Background `#FFFFFF`, border `1px solid #DDE4E8`, corner radius `16px`, elevation `elev.float`. Contains field title, single-line plain-language summary, and nested Provenance Frame.
- **Risk Banner:** Maximum width `960px`, background `#FDECEA`, border `1.5px solid #B3261E`, radius `16px`, elevation `elev.alert`.
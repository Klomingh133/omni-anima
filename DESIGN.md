---
name: OmniAnima Blueprint Studio
description: Electric blueprint 2D animation studio inspired by Patch
colors:
  primary: "#1f00ff"
  primary-hover: "#1700c2"
  accent-orange: "#ff622b"
  accent-orange-hover: "#e54f1f"
  neutral-canvas: "#ffffff"
  neutral-card-bone: "#f8f8f8"
  neutral-card-fog: "#f2f2f2"
  neutral-mist: "#ececec"
  neutral-gridline: "#d3d3d3"
  neutral-ink: "#212121"
  semantic-danger: "#dc2626"
  semantic-success: "#16a34a"
typography:
  display:
    fontFamily: "'PP Right', 'Bebas Neue', 'Archivo Black', ui-sans-serif, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'PP Right', 'Bebas Neue', 'Archivo Black', ui-sans-serif, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0.02em"
  title:
    fontFamily: "'Archivo', 'Inter', ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "'Archivo', 'Inter', ui-sans-serif, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.01em"
  label:
    fontFamily: "'Archivo', 'JetBrains Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.03em"
rounded:
  cards: "5px"
  inputs: "5px"
  buttons: "5px"
  navtabs: "5px"
spacing:
  xs: "5px"
  sm: "10px"
  md: "17px"
  lg: "24px"
  xl: "38px"
  xxl: "80px"
components:
  button-cta:
    backgroundColor: "{colors.accent-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.buttons}"
    padding: "10px 24px"
  button-cta-hover:
    backgroundColor: "{colors.accent-orange-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    rounded: "{rounded.buttons}"
    padding: "10px 24px"
  card-blueprint:
    backgroundColor: "{colors.neutral-canvas}"
    rounded: "{rounded.cards}"
    padding: "24px 38px"
---

# Design System: OmniAnima Blueprint

## 1. Overview

**Creative North Star: "The Electric Animation Blueprint"**

OmniAnima adapts the uncompromising aesthetic of Patch (`ref/patch.md`, `ref/thepatchsystem.com.png`) into a web-based 2D frame-by-frame animation studio. It abandons polite corporate SaaS aesthetics in favor of a loud, electric-blue blueprint: full-bleed electric indigo canvases (`#1f00ff`) alternating with stark white drafting cards, framed strictly by 1px hairline borders. 

The system treats 2D animation not as casual drawing or children's software, but as precise creative engineering. Headlines stack in architectural blocks using dense, condensed uppercase typography (PP Right / Bebas Neue) with sub-1.0 line heights, while Archivo provides quiet, geometric legibility for controls and labels. A single warm flame orange (`#ff622b`) punctures the monochrome/indigo duopoly as the only filled chromatic color, reserved exclusively for primary conversion and action triggers.

All AI slop tropes are systematically banned: no emojis anywhere in copy or UI buttons, no gradient text, no fuzzy glassmorphism blur, no nested cards, no em dashes, and no excessive marketing badges.

**Key Characteristics:**
- **Electric Indigo Canvas:** Bold full-bleed `#1f00ff` heroes and dark bands alternated with stark `#ffffff` and `#f2f2f2` drafting surfaces.
- **Single Warm Conversion Trigger:** Patch orange (`#ff622b`) is the sole filled chromatic button in the entire interface.
- **Architectural Typography:** Heavy, condensed display type stacked like concrete slabs (line-height 0.85 to 0.92) paired with quiet geometric body copy.
- **Zero Shadow Elevation:** Surfaces are articulated solely through crisp 1px hairline borders (`#1f00ff` on light, `#ffffff` or `#d3d3d3` on indigo) and 5px border radii.
- **Minimalist Vector Identity:** Replaces raster logos with a precise geometric SVG logomark: a technical drafting stylus intersecting an architectural frame aperture.

## 2. Colors

A rigid two-color chromatic system anchored by electric indigo and conversion orange, supported by a structured 5-step grayscale.

### Primary
- **Electric Indigo** (`#1f00ff`): The chromatic backbone. Full-bleed hero canvases, alternating section bands, primary 1px borders, active frame outlines, and display heading text on white surfaces.
- **Indigo Deep** (`#1700c2`): Pressed states and high-contrast hover outlines.

### Accent (Conversion Only)
- **Patch Orange** (`#ff622b`): Reserved exclusively for primary conversion buttons (Sign Up, Export Video, Inquire, Publish). The only filled chromatic element in the design system.
- **Orange Hover** (`#e54f1f`): Active hover state for primary action buttons.

### Neutral
- **Pure White** (`#ffffff`): Page canvas, hero reverse text, card surfaces, drafting paper.
- **Bone** (`#f8f8f8`): Tertiary surface layer and muted card backgrounds.
- **Fog Gray** (`#f2f2f2`): Secondary card containers and contrasting background bands.
- **Mist** (`#ececec`): Input backgrounds, subtle hairline dividers, and disabled borders.
- **Gridline** (`#d3d3d3`): Blueprint drafting dividers, inactive numbered markers, and structural borders on the blue canvas.
- **Ink** (`#212121`): High-contrast body text, technical values, and dark card elements.

### Named Rules
**The Orange Exclusivity Rule.** Patch orange (`#ff622b`) exists only as a background fill for primary conversion triggers and active mode indicators. It is never used as body text, borders, decorative shapes, or icons.
**The No-Gradient Rule.** Every color is flat and solid. Gradients, gradient text, and radial background blobs are strictly prohibited.

## 3. Typography

**Display Font:** PP Right (drop-in alternatives: Bebas Neue, Archivo Black, ui-sans-serif)  
**Body & Control Font:** Archivo (drop-in alternatives: Inter, DM Sans, system-ui)  
**Numeric / Timeline Font:** JetBrains Mono (monospaced numeric readouts)

**Character:** Headlines are architectural, monolithic, and unapologetically heavy. With line-heights below 1.0 (0.85–0.92), words lock together into solid typographic blocks. Body copy and UI labels remain understated and geometric to let the canvas and tools breathe.

### Hierarchy
- **Display** (800, `clamp(2.5rem, 7vw, 5.5rem)`, `line-height: 0.88`, `letter-spacing: 0.02em`): Hero title statements and major section banners. Always uppercase.
- **Headline** (800, `clamp(1.75rem, 4vw, 2.5rem)`, `line-height: 0.92`, `letter-spacing: 0.02em`): Section anchors, feature headlines, and modal headers. Always uppercase.
- **Subheading** (600, `1.5rem`, `line-height: 1.2`, `letter-spacing: 0.01em`): Card titles, pricing tier headers.
- **Body** (400, `1rem / 16px`, `line-height: 1.45`, `letter-spacing: 0.01em`): Descriptive prose, tool tooltips, help text. Max line length 65–75ch. Left-aligned.
- **Body Small** (400, `0.875rem / 14px`, `line-height: 1.5`): Form input text, timeline metadata, footer notes.
- **Label / Nav** (600, `0.8125rem / 13px`, `line-height: 1.4`, `letter-spacing: 0.03em`): Buttons, tabs, numbered section counters. Uppercase.

### Named Rules
**The Sub-1.0 Heading Rule.** Display headlines in PP Right / Bebas Neue must maintain a line-height between 0.85 and 0.94. Loose leading on display headings destroys the architectural block aesthetic.
**The No-Tracked-Eyebrow Rule.** Never prepend headings with tiny uppercase tracked labels. Numbered markers (01, 02, 03) must be structured architectural boxes, not floating text kickers.
**The No-Em-Dash Rule.** Em dashes (—) are barred from copy and heading lines. Use clean periods or structural line breaks instead.

## 4. Elevation

OmniAnima rejects drop shadows completely. Depth and elevation are created through hairline structural borders and high-contrast tonal layering.

### Elevation Layers
- **Layer 0 (Canvas):** Pure white (`#ffffff`) on light sections; full-bleed electric indigo (`#1f00ff`) on hero and dark sections.
- **Layer 1 (Drafting Card):** `#ffffff` card surface bounded by a crisp 1px `#1f00ff` border (on light) or 1px `#ffffff` border (on indigo). 5px radius.
- **Layer 2 (Recessed Well):** Fog gray (`#f2f2f2`) or bone (`#f8f8f8`) container with 1px `#d3d3d3` hairline border.
- **Layer 3 (Floating Overlays & Modals):** Crisp `#ffffff` container bounded by 2px `#1f00ff` border and a solid 4px offset hard shadow (`box-shadow: 4px 4px 0px #1f00ff`) or zero shadow with 1px black/indigo perimeter. No blurred shadows.

### Named Rules
**The Zero Blur Rule.** `box-shadow` with blur radius greater than 0px and `backdrop-filter: blur(...)` are prohibited. Structure is communicated through 1px hairline edges.

## 5. Components

### Logo Mark & Logotype
- **Logomark:** A technical vector SVG icon consisting of a square drafting frame (`rx="4"`), corner technical tick, and an architectural stylus nib intersecting the frame center.
- **Logotype:** `OMNIANIMA` in PP Right / Bebas Neue 800 uppercase, tight tracking (`0.04em`), rendered in pure white on blue or `#1f00ff` on white.
- **Asset Rule:** `public/logo.png` is permanently retired in favor of native inline SVG and CSS vector marks.

### Primary Conversion Button (Filled Orange)
- **Shape:** 5px radius (`--radius-buttons`).
- **Surface:** `#ff622b` background, `#ffffff` text in Archivo 600 uppercase, 13px, `letter-spacing: 0.03em`.
- **Padding:** 10px 24px.
- **Border:** None or 1px solid `#ff622b`.
- **Hover:** Deepens to `#e54f1f`. No drop shadow.

### Ghost Button (Outline)
- **Shape:** 5px radius.
- **On Indigo:** Transparent background, 1px `#ffffff` border, `#ffffff` text.
- **On Light:** Transparent background, 1px `#1f00ff` border, `#1f00ff` text.
- **Hover:** Inverts background and text color instantly.

### Tabbed Navigation Toggle
- **Container:** 1px `#ffffff` border (on blue) or 1px `#1f00ff` border (on white), 5px radius, 2px internal padding.
- **Active Tab:** White background with `#1f00ff` text (on blue), or `#1f00ff` background with white text.
- **Inactive Tab:** Transparent background, muted text.

### Numbered Structural Box (01 / 02 / 03)
- **Container:** 36x36px or 42x42px square, 1px border (`#1f00ff` or `#ffffff`), 5px radius.
- **Content:** Two-digit index (`01`, `02`) in PP Right 800 uppercase, centered.

### Drafting Paper Card
- **Surface:** `#ffffff` background, 1px `#1f00ff` border (on light) or 1px `#d3d3d3` border, 5px radius.
- **Padding:** 24px to 38px.
- **Content:** Technical drawing, feature list, or canvas frame thumbnail.

### Form Inputs
- **Surface:** `#ffffff` background, 1px `#ececec` border, 5px radius, 11px 14px padding.
- **Text:** Archivo 400 at 14px, color `#212121`.
- **Focus:** 1px solid `#1f00ff` outline (no glowing rings).

## 6. Do's and Don'ts

### Do
- Use `#1f00ff` as the primary chromatic identifier across heroes, headings, borders, and active studio tools.
- Set all display headlines in uppercase with tight sub-1.0 line height (0.85–0.92) using PP Right or Bebas Neue.
- Use `#ff622b` strictly and exclusively for primary conversion CTAs.
- Maintain a strict 5px border radius on cards, buttons, tabs, and input fields.
- Use 1px hairline borders (`#1f00ff`, `#ffffff`, `#d3d3d3`) for all surface separation.
- Keep all body copy left-aligned.
- Use native SVG for all icons and the logomark.

### Don't
- Do not use emojis anywhere in interface copy, headings, or buttons.
- Do not use decorative badges (e.g. `NEW!`, `AI-POWERED`, `BETA`, star emojis, or Product Hunt flairs).
- Do not use blurred drop shadows (`box-shadow: 0 4px 12px rgba(...)`) or frosted glass (`backdrop-filter`).
- Do not use gradient text (`background-clip: text`) or gradient backgrounds.
- Do not use em dashes (—) in marketing or UI text.
- Do not use nested cards (cards inside cards).
- Do not use border-radius larger than 5px (no bubbly 20px/32px pills for cards).
- Do not introduce random colors (no purples, teals, pinks, or yellows).

---
name: frontend-design
description: Design systems, UI engineering patterns, accessibility (a11y), responsive layouts, and UX conventions to build distinctive, non-generic modern web applications.
license: MIT
compatibility: opencode
metadata:
  category: frontend
  focus: ui-ux-engineering
---

# Frontend Design & UI Engineering Skill

This skill guides the design, engineering, and verification of distinctive, polished, and accessible frontend user interfaces. It prevents generic, template-looking designs and enforces production-grade frontend architecture.

## Core Philosophy: Avoiding Generic "AI Slop" UI

1. **Editorial & Distinctive Character**: Reject boring, identical bootstrap-like cards with rounded-xl and gray backgrounds. Define a strong visual thesis: high-contrast typography, bespoke color accents, textured surfaces, subtle borders, or intentional brutalist/editorial grids.
2. **Design Tokens First**: Do not hardcode magic hex codes or arbitrary Tailwind values (`bg-[#123456]`). Always derive styles from a defined semantic color token system (e.g. `--background`, `--foreground`, `--primary`, `--muted`).
3. **Motion with Intent**: Animations must convey state change or spatial reality (spring physics, layout shifts with `framer-motion` or CSS transitions). Avoid superfluous animations that slow users down.
4. **Accessible by Default (WCAG AA)**: Minimum 4.5:1 contrast for normal text, 3:1 for large text and UI components. Keyboard navigability, focus rings (`focus-visible:ring-2`), and semantic HTML (`main`, `nav`, `article`, `header`).

---

## Layout & Architecture Patterns

### 1. Modern Grid & Container Standards
- Use **Bento Grid** layouts for dashboards, landing features, and showcases with variable span ratios (`col-span-1 md:col-span-2 lg:col-span-3`).
- Use **Container Queries** (`@container` in CSS / `@container` in Tailwind) when components should adapt to their card width rather than the full viewport.
- Structure layouts with semantic landmarks:
  - `<header>`: Navigation, brand identity, global action bar.
  - `<main id="main-content">`: Core workflow area, scroll container.
  - `<aside>`: Contextual inspector, secondary navigation, filtering drawer.
  - `<footer>`: Metadata, status indicator, secondary links.

### 2. Spacing & Visual Density
- Stick to an 8-point (or 4-point) spacing scale (`p-2`, `p-4`, `p-6`, `p-8`).
- Choose intentional density:
  - **High-density developer tools**: tighter padding (`py-1.5 px-2.5`), compact font sizes (`text-xs`, `text-sm`), subtle hairline borders (`border-border/60`).
  - **Marketing / Landing pages**: generous whitespace (`py-16 md:py-24`), dramatic typography scale (`text-4xl md:text-6xl font-extrabold tracking-tight`).

---

## Component Engineering Patterns

### 1. Composition Over Configuration
- Build small, single-responsibility components with `asChild` (Radix Slot pattern) or compound component patterns.
- Never pass 20 boolean props to configure a button or modal. Deconstruct into `<Dialog>`, `<DialogTrigger>`, `<DialogContent>`, `<DialogHeader>`, `<DialogFooter>`.

### 2. State & Interaction Feedback
- Every interactive element MUST have distinct states:
  - Default
  - Hover (`hover:bg-accent hover:text-accent-foreground`)
  - Active/Pressed (`active:scale-[0.98] transition-transform`)
  - Focus visible (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`)
  - Disabled (`disabled:opacity-50 disabled:pointer-events-none`)
  - Loading (`aria-busy="true"` with non-layout-shifting skeleton or spinner)

### 3. Typography Rules
- Pair a distinctive display font (e.g. `Geist`, `Cabinet Grotesk`, `Plus Jakarta Sans`, `Inter`, `Playfair Display`) with a highly legible body font.
- Tighten headings: `tracking-tight` or `tracking-tighter` on headings `text-2xl` and above.
- Add line-height breathing room on body paragraphs: `leading-relaxed` or `leading-7`.
- Monospace tokens, codes, and metrics: Use font-mono for numbers, hashes, timestamps, and keys to prevent jitter (`tabular-nums font-mono`).

---

## Quick UI Polish Checklist

- [ ] Dark mode & light mode verified with high-contrast text.
- [ ] No layout shift when dynamic content or images load (`aspect-ratio` or skeleton placeholders).
- [ ] Mobile responsive: touch targets at least 44x44px (`min-h-[44px] min-w-[44px]`).
- [ ] Form inputs include explicit `<label>` or `aria-label`, with error messages linked via `aria-describedby`.
- [ ] Empty states and error states designed as first-class citizens, not afterthoughts.

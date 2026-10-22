---
name: Josue Escobar — Portfolio
description: One machined chassis, four plug-in area modules that reskin the whole site.
colors:
  neutral-ground: "#ECECEC"
  neutral-ground-2: "#F7F7F7"
  neutral-plate: "#90CCF4"
  neutral-plate-blue: "#5DA2D5"
  neutral-ink: "#16324A"
  neutral-ink-2: "#3E5568"
  neutral-signal: "#F78888"
  neutral-region: "#F3D250"
  neutral-on-region-2: "#3E4A2A"
  fullstack-ground: "#C4DBF6"
  fullstack-ground-2: "#D7E6F9"
  fullstack-plate: "#3B8BEB"
  fullstack-ink: "#14264A"
  fullstack-ink-2: "#33476B"
  fullstack-signal: "#B23850"
  fullstack-on-signal: "#F7EFF1"
  fullstack-on-region: "#0E1B36"
  fullstack-snow: "#E7E3D4"
  fullstack-slate: "#8590AA"
  ai-ground: "#304C64"
  ai-ground-2: "#26425A"
  ai-plate: "#26788E"
  ai-ink: "#CFE6EA"
  ai-ink-2: "#A4CCD4"
  ai-signal: "#E2480C"
  ai-on-signal: "#1A0703"
  ai-on-region-2: "#3A1206"
  ai-on-cta: "#1F3445"
  ai-rust: "#631B08"
  data-ground: "#EDE8F5"
  data-ground-2: "#E1DDF0"
  data-plate: "#ADBBDA"
  data-ink: "#26346B"
  data-ink-2: "#3D52A0"
  data-signal: "#7091E6"
  data-on-signal: "#121A3A"
  data-on-region-2: "#C9D2EC"
  data-scanline: "#8697C4"
  design-ground: "#141414"
  design-ground-2: "#1E1E1E"
  design-plate: "#273DB4"
  design-ink: "#F2F0EE"
  design-ink-2: "#C9C4C0"
  design-signal: "#ED7845"
  design-cta: "#F95CA4"
  design-on-region-2: "#CDD3F2"
  design-red: "#C50900"
typography:
  display-neutral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontWeight: 780
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 118"
  display-fullstack:
    fontFamily: "Funnel Display, system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  display-ai:
    fontFamily: "Unbounded, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  display-data:
    fontFamily: "Doto, ui-monospace, monospace"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  display-design:
    fontFamily: "Michroma, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0em"
  display:
    fontSize: "calc(clamp(2.3rem, 5.4vw, 5rem) * var(--k))"
    lineHeight: 1
  headline:
    fontSize: "calc(clamp(2.2rem, 4.4vw, 4rem) * var(--k))"
    lineHeight: 1
  title:
    fontSize: "calc(clamp(2rem, 4vw, 3.4rem) * var(--k))"
    lineHeight: 1
  close:
    fontSize: "calc(clamp(2.4rem, 7vw, 6rem) * var(--k))"
    lineHeight: 1
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "lnum, tnum"
  body-lead:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.3vw, 1.15rem)"
    lineHeight: 1.5
  numeral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3vw, 3rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 70"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 650
    lineHeight: 1.2
  meta:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
rounded:
  plate: "3px"
  screen: "10px"
spacing:
  gutter: "clamp(16px, 4vw, 56px)"
  rail: "64px"
  rail-mobile: "56px"
  copy-height: "clamp(318px, 9vw + 250px, 384px)"
  section: "clamp(72px, 12vh, 140px)"
  stack: "clamp(20px, 3vh, 32px)"
  plate-pad: "clamp(24px, 3vw, 44px)"
components:
  button-cta-neutral:
    backgroundColor: "{colors.neutral-ink}"
    textColor: "{colors.neutral-ground}"
    typography: "{typography.label}"
    rounded: "{rounded.plate}"
    padding: "0.7em 1.15em"
  button-cta-fullstack:
    backgroundColor: "{colors.fullstack-signal}"
    textColor: "{colors.fullstack-on-signal}"
    rounded: "{rounded.plate}"
    padding: "0.7em 1.15em"
  button-cta-ai:
    backgroundColor: "{colors.ai-ink-2}"
    textColor: "{colors.ai-on-cta}"
    rounded: "{rounded.plate}"
    padding: "0.7em 1.15em"
  button-cta-data:
    backgroundColor: "{colors.data-ink-2}"
    textColor: "{colors.data-ground}"
    rounded: "{rounded.plate}"
    padding: "0.7em 1.15em"
  button-cta-design:
    backgroundColor: "{colors.design-cta}"
    textColor: "{colors.design-ground}"
    rounded: "{rounded.plate}"
    padding: "0.7em 1.15em"
  slot-neutral:
    textColor: "{colors.neutral-ink}"
    padding: "0 clamp(14px, 1.6vw, 24px) clamp(14px, 2vh, 20px)"
    height: "clamp(150px, 20vh, 200px)"
  slot-seated-neutral:
    backgroundColor: "{colors.neutral-ground-2}"
    textColor: "{colors.neutral-ink}"
  project-plate-neutral:
    backgroundColor: "{colors.neutral-ground-2}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.plate}"
    padding: "{spacing.plate-pad}"
  project-region-neutral:
    backgroundColor: "{colors.neutral-region}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.plate}"
    padding: "{spacing.plate-pad}"
  rail-neutral:
    backgroundColor: "{colors.neutral-ground}"
    textColor: "{colors.neutral-ink-2}"
    height: "{spacing.rail}"
    padding: "0 {spacing.gutter}"
  close-neutral:
    backgroundColor: "{colors.neutral-region}"
    textColor: "{colors.neutral-ink}"
---

# Design System: Josue Escobar — Portfolio

## Overview

**Creative North Star: "The Modular Chassis"**

The site is one engineered instrument. The neutral face is the chassis: a light-gray plate with a sticky rail, the 10-second line, and four numbered slots (01–04). Inserting a module (Full-stack & Product, AI & Agents, Data & Analytics, 3D & Engineering design) changes the whole face: palette, display face, background texture, hover material and seat timing. Ejecting restores the neutral face intact. The chassis carries all content; choosing a module is optional.

Every face redefines the same set of roles (ground, ground-2, plate, ink, ink-2, signal, on-signal, cta, on-cta, region, on-region, on-region-2, rule, display face, display width/weight/tracking, a size multiplier `k`, texture, seat duration and easing). Layout reads only the roles, which is how five faces share one grid. Hardware cues are real structure: hairline rules are the mounting rails, slot numbers are the navigation, the five-color edge on each slot is that module's palette, set like a screen-printed legend.

The system refuses the dark-neon developer portfolio and the skill-bar résumé page. Depth is layer overlap, never soft shadow.

**Key Characteristics:**
- Five faces, one grid; faces swap materials, never positions.
- Each face's palette owns whole regions (a project plate, the close section), not scattered accents.
- Seating motion has mass and a per-face rhythm; reduced motion cuts instantly.
- Lining, tabular numerals everywhere; slot numbers and years in condensed light Archivo.
- Flat plates with 1px rules and 3px milled corners.

## Colors

Five owner-pinned palettes, one per face, each mapped onto the same roles; derived inks exist only where a palette has no usable dark or light for text.

### Primary
- **Chassis Navy** (neutral-ink): text and the call-to-action plate on the neutral face. Derived from the Rich and Colorful blues because that palette has no dark.
- **Snowy Crimson** (fullstack-signal): the Full-stack call-to-action and selection color.
- **Amber Ember** (ai-signal): the AI region (own project plate and the close section) and the ripple hover.
- **Metallic Indigo** (data-ink-2): the Data region, call-to-action and secondary ink.
- **Pop Ultramarine** (design-plate): the 3D region and the close section, under a gradient bar.

### Secondary
- **Sky Plate** (neutral-plate): the neutral face's second project plate. **Chassis Blue** (neutral-plate-blue) belongs to the palette but is not yet used in the build beyond the slot edge legend.
- **Signal Blue** (fullstack-plate): the Full-stack region and the hover fill rising from the slot base.
- **Deep Teal** (ai-plate), **Lavender Steel** (data-plate): plate tones of their faces.
- **Hot Pink** (design-cta): the 3D call-to-action.

### Tertiary
- **Rich Yellow** (neutral-region): owns the neutral face's first project plate and the whole close section.
- **Coral Signal** (neutral-signal): selection, focus and the timeline's current node on the neutral face.
- **Steel Periwinkle** (data-signal), **Burnt Orange** (design-signal): selection, focus and the 3D hover outline.

### Neutral
- Each face has a ground and a slightly lifted ground-2 (seated slot, project plates): Chassis Gray / Paper (neutral), Ice Blue / Pale Ice (Full-stack), Slate Teal / Deep Slate (AI), Lilac Mist / Pale Lilac (Data), Carbon / Graphite (3D).
- Each face has ink and ink-2 (secondary text, rail links, meta). Derived inks: fullstack-ink, ai-ink (pale teal), data-ink, design-ink and design-ink-2 (warm off-whites).
- Rules are the face's ink at 14–20% alpha (neutral `#16324A2E`, fullstack `#14264A2E`, AI `#A4CCD42E`, data `#3D52A033`, 3D `#F2F0EE24`).
- Edge-only palette colors (fullstack-snow, fullstack-slate, ai-rust, design-red, data-scanline) appear in the slot edge legend, the Data scanline texture, and the 3D close gradient. They are never grounds.

### Named Rules
**The Region Ownership Rule.** The active face's region color owns whole blocks: the inserted area's project plate and the close section. It never appears as a scattered accent over another face's ground.

**The Snow Is Not a Ground Rule.** Full-stack's #E7E3D4 is a legend color only; the Full-stack face is never a beige ground with brown ink.

**The Pinned Palette Rule.** Palette values are owner-pinned and change only with the owner. The AI palette is approved as built and stays exactly as is.

## Typography

**Display Font:** per face: Archivo at width 118 (neutral), Funnel Display (Full-stack), Unbounded (AI), Doto (Data, display only), Michroma (3D)
**Body Font:** Archivo (with system-ui, sans-serif) on every face
**Label/Mono Font:** none; code versions use Archivo at width 75

**Character:** a wide, heavy engineered sans on the chassis; each module swaps only the display voice, so the face is recognizable with content removed while body text stays steady.

### Hierarchy
- **Display** (face weight, 2.3–5rem × k, line-height 1): the 10-second line. Balanced wrapping, max 60rem.
- **Close** (face weight, 2.4–6rem × k, 1): the closing question, max 12ch.
- **Headline** (face weight, 2.2–4rem × k, 1): project titles.
- **Title** (face weight, 2–3.4rem × k, 1): section titles ("Work", "How I got here").
- **Numeral** (300, 2–3rem, 1, Archivo width 70): slot numbers 01–04; the timeline years use the same voice at 1.6rem.
- **Body** (400, 1rem, 1.5): running text; lead line 1–1.15rem, max 52ch; project descriptions 1.05rem, max 46ch.
- **Label** (650, 0.875–1.2rem): call-to-action, slot names (max 14ch), strong inline terms, links.
- **Meta** (400, 0.8–0.9rem, ink-2): slot meta, spec terms, section notes.

### Named Rules
**The Size Multiplier Rule.** Display sizes are one clamp scale multiplied by the face's `k` (neutral 1, Full-stack 1.04, AI 0.86, Data 0.9, 3D 0.8), so wider faces shrink and the copy block keeps one height.

**The Lining Numerals Rule.** The whole document sets `lining-nums tabular-nums`; slot numbers and years never use oldstyle figures.

**The Doto Is Display Only Rule.** The dot-matrix face sets display roles only; Data body text stays Archivo.

## Layout

A single column under a sticky rail (64px, 56px at 640px and below), with a fluid side gutter (16–56px). The first viewport is a fixed-height copy block (318–384px, bottom-aligned) holding the 10-second line and lead, then the slot row: four equal columns between hairline rules, a 2×2 grid at 640px and below. Because the copy block has one height for every face, the slot row lands at the same y on all five faces.

Below the fold: Work (project plates stacked with 20–32px gaps; the active area's project is reordered first), About (4/8 split: intro and a five-stop timeline that draws in), then the full-bleed close section. Sections are separated by 72–140px of top padding. Project plates split 5/7 (text, evidence); at 900px and below plates, About and the timeline go to one column, with the timeline turning vertical.

**The Registration Rule.** All five faces share the grid to the pixel. Switching faces changes only what content is made of; it never moves the slot row or reflows the layout. Reordering projects by active area is the only sanctioned change, and it happens below the fold.

## Elevation & Depth

No shadows anywhere. Depth comes from a plate laid over the layer beneath it: a seated slot lifts 6px up and left onto ground-2 while a ground-colored layer with a 1px ink border stays behind at the original position, so the offset reads as a module seated proud of the chassis. Everything else is flat, separated by 1px rules and ground/ground-2 tone.

### Named Rules
**The Seated Plate Rule.** The 6px offset plate is reserved for the seated state of a slot. It is a real layer with the ground's own color and an ink hairline, not a shadow, and it does not decorate resting elements.

**The No Glow Rule.** No soft drop shadows, no glow, no blur.

## Shapes

Milled geometry: straight edges and one small radius (3px) on plates, buttons, pending tags, tooltips and focus rings. Device screenshots are the single exception at 10px, framing phone captures. Slots are square-cornered cells defined by hairline rules. The timeline nodes are the only circles. Textures are structural per face: AI a 22px dot grid, Data 40px horizontal scanlines, 3D a 40px blueprint grid; the neutral and Full-stack faces are plain.

## Components

### Buttons
- **Shape:** gently milled corners (3px).
- **Call-to-action:** one per surface, in the rail ("Write to me", with a mail icon). Each face assigns its own cta/on-cta pair; 650 weight, 0.7em × 1.15em padding (0.55em × 0.9em on phones).
- **Hover / Active:** lifts 2px on the spring easing, presses 1px down on active.

### Module Slot (signature)
- **Structure:** a button cell with a five-color palette edge at the top (10px, 18px when seated), the slot number, the area name, and a meta line ("1 project" / "Mock only" with an Insert or Eject action).
- **State:** `aria-pressed` carries the seated state; seated slots take ground-2 and the Seated Plate offset.
- **Hover, per face in its own material:** neutral lifts 3px; Full-stack fills the lower 38% with the plate color from the base; AI spreads an amber ripple from the pointer position; Data steps its background and number color in four frames; 3D closes an outline in the signal color toward the edge.

### Rail (navigation)
- Sticky, ground-colored, bottom hairline. Name at left (700, width 112); CV, LinkedIn, GitHub and the call-to-action at right in ink-2, ink with underline on hover. Under 640px the labels give way to 18px line icons.

### Project Plate
- **Corner Style:** 3px. **Border:** 1px rule; transparent when the plate takes a region color.
- **Background:** ground-2 by default; the active area's project takes the region color with on-region inks (neutral: first plate yellow, second plate sky blue).
- **Internal Padding:** 24–44px. Contents: headline, description, a spec list (term/value grid under a rule), links, and evidence (phone screenshots staggered 28px, or a component tree).

### Pending Link
- A link with no target yet: ink-2, dashed underline, help cursor, never colored or underlined like a live link. A tap or Enter shows a "Link coming soon" tooltip in an ink plate. Pending actions inside a plate use a dashed 1px tag instead.

### Close Section
- Full-bleed region color with on-region inks: the closing question, the email address at 1.2–1.8rem, and secondary links in on-region-2. On the 3D face a 10px gradient bar runs red, orange, pink to ultramarine across its top.

### Motion
Face changes run as a view transition: the new face grows from the pressed slot's box (eject shrinks back into it), using the face's own seat timing: neutral 0.62s spring, Full-stack 0.7s spring, AI 0.9s ease-in-out, Data 0.48s in eight steps, 3D 0.8s spring. The spring has overshoot and damping. Under `prefers-reduced-motion` every transition and animation is cut.

**The Ballistics Rule.** Every reskin moves with mass and the face's own seat timing. No linear fades, no instant swaps, except the immediate cut under reduced motion.

## Do's and Don'ts

### Do:
- **Do** define every new face or surface through the shared role set, so layout code reads only roles.
- **Do** keep the copy block at its single shared height so the slot row registers across faces.
- **Do** let the active palette own whole regions (project plate, close section).
- **Do** give each face its own hover material and seat timing.
- **Do** keep every text/ground pairing at WCAG AA and focus indicators at 3:1 or better against their ground.
- **Do** render pending links as dashed ink-2 text that explains itself on tap.

### Don't:
- **Don't** move layout between faces.
- **Don't** use soft drop shadows or glow; depth is layer overlap.
- **Don't** put kicker or eyebrow labels above headings.
- **Don't** make a pending link look live.
- **Don't** use a beige ground or brown ink on the Full-stack face.
- **Don't** add hardware costume (screws, knobs, LEDs) that does not map to structure or state.
- **Don't** use dark-plus-neon glow, skill-percentage bars or contribution counters.

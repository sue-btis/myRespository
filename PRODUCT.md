# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters hiring for Full-stack / AI / Data roles, both in Mexico and remote/international. They skim fast, often on a phone, arriving from LinkedIn, the CV or GitHub, and decide within seconds whether to keep reading.

Secondary: hiring managers and engineers who open the projects and code to judge depth. Consulting prospects are a low priority.

## Product Purpose

Josue Escobar's personal portfolio. It replaces a generic "developer" site that no longer represents him. Success: a visitor understands who he is in 10 seconds, sees verifiable evidence for each project, and writes to him.

Primary action: contact Josue. LinkedIn and GitHub are secondary and always visible.

## Positioning

An engineer who builds across the stack (web, data, AI and 3D) and who started in mechatronics, then went through biomedical engineering and plant quality. He works across four areas instead of claiming "versatility":

1. Full-stack & Product
2. AI & Agents
3. Data & Analytics
4. 3D & Engineering design

The site itself has to demonstrate craft; a template look defeats the purpose.

10-second message (approved): "Engineer who builds across the stack — web, data, AI and 3D. Started in mechatronics, still building things that work."

## Capabilities and Constraints

- Language: English only.
- Stack: React (owner's decision, for a heavily animated site). Today it is React 19 + Vite 6, deployed to GitHub Pages at `sue-btis.github.io/myRespository/`; it will move to a custom domain (name undecided).
- Static site, single actor, no accounts, no own API or persistence.
- Choosing an area is optional; the full content must be readable without choosing one. Projects of the active area come first.
- At launch, only areas with at least one project are published; no "coming soon" placeholders. Mocks may show all four areas.
- Low maintenance: updated when a new personal project ships; adding a project is content, not a redesign.
- Out of scope: Moodify, blog, Spanish version, game-style navigation.
- Undecided: contact mechanism (direct email vs. form), domain name.

## Brand Commitments

- Voice: first person, direct, no filler; humor only in microcopy.
- Personal life (sports, music) appears in one element, not a section.
- Employers may be named (Ecosat, Waldo's, Teleflex). Ecosat clients are never named, and no real Ecosat data, code or screenshots appear.

## Evidence on Hand

- TrainLog (Full-stack & Product): offline-first training PWA, React/TS, mutation testing, ADRs. Source in the sibling repo `../TrainLog`, screenshots in `../TrainLog/docs/screenshots/`. Public demo URL: not provided yet; do not invent one.
- ChangeSmith (AI & Agents): public repo `github.com/sue-btis/ChangeSmith`, Claude Code plugins for spec-driven changes.
- Career: mechatronics technician (CBTis 122, 2018) → biomedical engineer (UACH, 2024) → QA data analysis intern at Teleflex (2024–2025) → data scientist at Waldo's (2025) → Ecosat (current).
- CV: not on the site for now. A public version (no phone number) may be linked later; the old PDF with the phone number was removed from `public/`.
- Data & Analytics and 3D & Engineering design have no publishable project yet. Never fabricate projects, metrics or testimonials to fill them.

## Product Principles

- Evidence over adjectives: every claim points to a demo, repo, screenshot or concrete impact.
- Structure tells the story: the four areas carry the versatility message, not a word.
- A recruiter in a hurry gets everything with plain scrolling; the interactive layer is a bonus, never a gate.
- One site to maintain: area changes reskin the site, they don't fork it.

## Accessibility & Inclusion

- Animations respect `prefers-reduced-motion`.
- Must load and stay smooth on a mid-range phone, including the area reskin.
- All content is readable without interacting with the area selector.

Product brief with full decisions: `docs/product/brief.md`.

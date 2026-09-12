# Tomorrow's Workshop — Art Direction

Design record for the solarpunk homepage redesign. Source brief:
`Solarpunk-Portfolio-Plan-and-Asset-Prompts.md` (2026-09-09). This document is
the Phase-1 contract every component must obey; implementation details live in
component comments.

## 1. Brand idea

**A thoughtful person is building useful things here — and I want to see what
they make next.**

Not a hero fantasy, not a dashboard. A *workshop*: tools laid out, an object
mid-repair, morning light. Hope with human agency.

## 2. Personality (three adjectives)

**Sunlit · Capable · Careful.**

- *Sunlit* — warm paper, real shadows, no glow effects.
- *Capable* — precise grids, mono annotations, evidence labelled honestly.
- *Careful* — generous space, few elements, everything aligned on purpose.

## 3. Central visual metaphor

**The workbench in morning light.** One courtyard holds the world. The master
is a gouache-style illustration (1408×768, generated from the brief's
copy-ready prompt A as one of three composition candidates; shipped via
`next/image` static import — responsive AVIF/WebP, priority preloaded).
Captioned honestly: "an imagined courtyard · illustration". Everything else
borrows from it:

- **Jaali shadow** — the diagonal lattice of light cast by a pierced screen.
  Appears in the master, as a faint texture on quiet panels (Lab panels AND
  the scene-01 diagram plates — the largest quiet surfaces on the page) at
  ink-opacity 0.08, and as the hover texture on actions and note rows. The
  site's recognisable signature.
- **Sun-notch** — a small half-arch (the doorway silhouette) used as section
  marker and list bullets.
- **Field labels** — mono uppercase microcopy with coordinates/indices, like
  tags on a pegboard. Every section carries one (set vertically via
  `writing-mode`, never rotated-box math).
- **Pictorial echoes** — captioned detail crops of the master (About's
  worktable, Contact's jaali floor band) keep the painterly world present
  past the hero without inventing new media.

## 4. Typography philosophy

One voice speaks, one voice works, one voice annotates.

| Role | Face | Use |
| --- | --- | --- |
| Speak | Newsreader (serif, + italic) | Headlines, pull-quotes, closing statement. Italic for the hopeful clause. |
| Work | Inter | Body, interface labels, controls. |
| Annotate | IBM Plex Mono | Section indexes, metadata, evidence notes. 10–11px, uppercase, +0.14em tracking. |

Rules: extreme scale contrast is encouraged (11px mono against 100px serif);
no third display face; Anton stays retired on this page (arcade only); italic
Newsreader is reserved for meaning (the "future" clause), never decoration.

## 5. Colour contract

Tokens live in `globals.css` under `--ws-*`, scoped to `.workshop-page`.

| Token | Value | Permission |
| --- | --- | --- |
| `--ws-paper` | `#F3EEDC` | Page + reading surfaces |
| `--ws-paper-deep` | `#ECE5CC` | Quiet panels, diagram fills |
| `--ws-ink` | `#173C32` | Text, rules, primary buttons |
| `--ws-leaf` | `#587457` | Vegetation, large accents. Never small text (≈3.2:1). |
| `--ws-clay` | `#A14F35` | Links, selected states, small accents (≈5.6:1 on paper) |
| `--ws-sun` | `#D9AA45` | Light only. Never text. |
| `--ws-sky` | `#D5E4DC` | Illustration backgrounds, washes |
| `--ws-line` | `rgba(23,60,50,.14)` | Hairlines. Prefer these over boxes. |

## 6. Composition + layout grammar

- 12-column fluid grid; `--ws-max: 1440px`; page margins `clamp(20px, 5vw, 72px)`.
- Sections are **scenes**: index marker → headline (serif, asymmetric) →
  content that breaks one grid rule on purpose (an oversized numeral, an
  italic line crossing columns, an image bleeding to the margin).
- Hairlines instead of cards. A box is a deliberate act, not a default.
- Vertical rhythm: `clamp(96px, 12vw, 176px)` between scenes; hero capped
  near the brief's 440px illustration target so scene 2 starts high.
- Imagery: rectangular, 2px radius max, hairline frame; media and diagrams
  always carry a mono caption that states what it honestly is.

## 7. Motion philosophy

Motion is evidence of care, then it stops.

- Feedback 160–240ms `--ws-ease-out: cubic-bezier(0.22,1,0.36,1)`.
- Reveals 560–760ms, once, on intersection: primary element first,
  microcopy ~90ms later, then stillness.
- One ambient life was designed: the master's leaves breathing as a seamless
  video loop. V1 ships WITHOUT it — the single loop attempt allowed by the
  brief's asset budget died provider-side, and the brief is explicit that a
  weak/absent loop is replaced by the approved still. No **Pause motion**
  control is shown while nothing moves (a pause button over a still would
  lie); the hero copy, image slot and `AMBIENT_LOOP` constant are built so a
  loop that survives review drops in with one line. Reveals still pause
  instantly under `prefers-reduced-motion`.
- Native scrolling always — no Lenis on this route, no scroll-jacking, no
  pinned scenes. Scrolling tells the story through composition changes, not
  stolen scroll.

## 8. Interaction philosophy

Every meaningful action gets a visible response — *the page noticed*.

- Links: clay underline grows from the left; mono index nudges.
- Primary buttons: ink fill, sun-notch tick, arrow translates; jaali texture
  fades in on hover.
- Project rows: hairline darkens, diagram drifts 4px, evidence note appears.
- Focus: 2px clay outline, offset 3px, on everything. Focus states are
  designed, not defaulted.

## 9. What this page deliberately does NOT do

No dark theme, no glassmorphism, no gradient blobs, no rounded-card grids,
no bento, no custom cursor, no entrance wipe, no mascot/atmosphere canvas
(they remain on other routes), no auto-playing video, no rotating tickers,
no badge/pill stacks, no fake dashboards, no scroll hijack. If a treatment
would fit a generic template, it is wrong for this page.

## 10. Honesty rules (from the brief)

Illustrations are captioned *illustration*; diagrams are captioned *authored
diagram*; nothing fake passes as a product capture; claims carry their
evidence status; the courtyard is an imagined setting, not Shantanu's
workplace.

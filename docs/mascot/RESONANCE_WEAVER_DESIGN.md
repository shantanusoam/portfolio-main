# Resonance Weaver Design

Primary in-hero game for V2 (`FINAL_MASCOT_HERO_TO_GAME_REDESIGN_MASTER_SPEC_V2.md`).
Supersedes Strumrise as the visitor-facing game. Strumrise modules remain on
disk for reference but are not the loader entry.

## Loop

1. Enter via **Enter Resonance** or string slingshot snap.
2. Hero fracture snapshots curated DOM into Canvas `HeroProxyObject`s.
3. Real DOM fades visually (`data-resonance-fractured`); semantics stay intact.
4. Player steers the same familiar with explicit `GameRoot` velocity.
5. Shift-drag / secondary-drag weaves up to **3** temporary musical strings.
6. Bounce on weaves, collect falling fragments, build combo.
7. Collect enough fragments → restore proxies to home → DOM fades back.
8. Escape / Exit always restores without reload.

## Modules

| Module | Role |
|--------|------|
| `HeroFractureTransition` | tension → snap → unlock → falling → playing → restore |
| `DomShadowProxyWorld` | proxy physics + draw (no DOM in RAF) |
| `ResonanceWeaverRuntime` | player, weaves, collect, audio events, FixedStepLoop |
| `WeaveStringSystem` | capped temporary strings + preview |
| `FragmentCollector` | circle/rect collect + combo |
| `EnterResonanceControl` | accessible gate + overlay HUD |

## Caps (V2 §49)

- Proxies: 18 mobile / 32 desktop (pool 40)
- Active weaves: 3
- Audio: reuse mascot `triggerMusicalEvent` voice pool

## Deferred

- Full multi-sector vertical expansion / camera scroll world
- Touch-dedicated weave anchors UI (desktop shift-drag works; mobile uses
  pointer steer; weave via long secondary gesture)
- Motion-lab `?panel=resonance-weaver` debug panel (partial via Enter Resonance)

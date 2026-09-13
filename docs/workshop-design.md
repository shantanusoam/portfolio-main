# Tomorrow’s Workshop — implementation direction

## Art direction before implementation

Emotional objective: a capable, thoughtful person is making useful things here.
Personality: hopeful, precise, curious.
Central metaphor: a shared workbench; software becomes understandable through use.
Visual world: warm paper, forest ink, clay accents, one sunlit imagined courtyard.
Typography: existing Newsreader for editorial voice, Inter for reading, IBM Plex Mono for brief annotations.
Media: generated atmosphere is labelled; project diagrams describe source narratives rather than masquerading as product screenshots.
Motion: invitation → evidence → participation; one short hero entrance, local hover responses, static reading. No continuous ambient motion. Reduced motion renders the static final state.
Interaction: ordinary navigation plus a user-started semantic tree sketch, visible controls, shared state, Undo and Reset.
Layout: asymmetric introduction → generous project rows → dark interactive workbench → quiet notes → personal context → large contact invitation.
Deliberate exclusions: fake metrics, invented availability, autoplay media, forced scrolling, duplicate project grids, hidden contact, page-wide GPU decoration.

## Scope

Replaces the homepage composition and social card. Homepage runtime bypasses Lenis, mascot, soundroom, atmosphere and command palette; these continue on existing archive/detail routes. Scoped global selectors restore native scrolling only when the workshop homepage is present. Existing professional title, CV, email, project URLs and archive data are reused. Legacy section anchors are mapped to the consolidated sections. No dependency changes are required.

The tree model is adapted from the existing ProjectEvidenceDemo semantic operations. It does not introduce or claim a new integration of the published dnd package. The demo is intentionally command-driven with native buttons. Both views derive from the same node array. Nesting targets only a preceding sibling; moves preserve descendants. Undo keeps up to 50 snapshots.

## Motion map

- Introduction: copy settles 15 px and illustration opens once, under 1.1 seconds; static under reduced motion.
- Work: no entrance motion; details open on explicit activation.
- Lab: code imports only after Start; state changes directly without decorative animation.
- Notes: arrow responds locally to hover; reading remains stationary.
- Contact: one arrow indicates the email action.

## Evidence boundary

Three authored architecture summaries use the existing case-study systemLayers. These are explanations, not screenshots or measured infrastructure diagrams. Existing claims remain on their original detail pages; unverified numerical outcomes are not promoted onto the new homepage or social card. Actual redacted screenshots would strengthen future evidence.

## Visual review

Two visual refinement passes were performed in a local Next.js preview. The first revealed too much space before selected work; the second shortened the art frame and tightened the section heading. A further phone/tablet adjustment makes the artwork subordinate to the introduction and first project. Tablet relationship views remain visible after correcting an initial CSS hiding rule.

No independent critic score or production performance score is claimed. Production integration and real-device acceptance remain separate from the local preview checks.

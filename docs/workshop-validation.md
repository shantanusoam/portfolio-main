# Cinematic landscape revision — validation

## Local checks

The revised homepage passed an isolated Next.js 15.5.21 production build and TypeScript check. This preview reuses the repository’s CSS, fonts and content but omits the full app runtime and analytics. Its 112 kB first-load JS is a preview measurement, not a full-app performance claim. The original app layout already provides metadataBase; only this simplified preview emitted a localhost metadata warning.

Chromium browser checks at 320, 360, 390, 430, 768 and 1440 CSS px found no horizontal overflow or page errors. Same-page anchors resolved. The user-started sketch loaded, keyboard Out worked, Undo/Reset restored state, and reduced motion disabled the hero entrance. The new social card returned HTTP 200. The four semantic-model tests passed during the prior implementation; that model has not changed.

The landscape revision deliberately gives the first viewport to the three reference-inspired scenes. It supersedes the previous tight first-project fold target. Header and hero links provide direct access to Work and Contact.

## Visual refinement

The alpine first candidate was rejected. The final set matches the reference’s simple green hills, fine glints, small creatures and pink water. Desktop crop positions were adjusted after screenshot review to retain the birds and the complete horse. Phone frames keep all three subjects legible.

![Desktop](./workshop-desktop.webp)

![Phone](./workshop-mobile.webp)

## Release status

The previous PR commit passed Vercel deployment. This new revision needs its own Vercel preview result. The PR remains a draft; main has not been changed. Real-device Safari/Android, field Web Vitals and complete accessibility conformance are not claimed. These landscape assets are still images; no generated video or autonomous bird/horse animation is claimed.

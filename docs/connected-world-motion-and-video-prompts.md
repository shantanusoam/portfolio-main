# One living world — connected video, interaction and page direction

## The next creative step

The portfolio should feel like walking through Shantanu's living workshop: meadow → canopy → greenhouse → resonance room → field notebook → home. Warm solarpunk remains the identity. The new ambition is spatial continuity, tactile interaction and occasional expressive camera movement across the existing routes.

This document expands the earlier landscape prompt pack. It is a production direction, not a claim that these videos or inner-page changes already exist. Generate and review one representative scene before commissioning the whole set.

## What the current source shows

Reviewed at branch commit `dfbbb84fb7bfd6749f5c6f5de7df2426d2bc21c6`:

- The homepage already has meadow depth, natural-light interpolation, opt-in sound, the Motion Garden flock, Canopy and a quiet-mode preference.
- `app/projects/[project_name]/page.tsx` still uses an older dark case-file/game vocabulary, repeats the same `fadeUp` treatment, places `select-none` on the reading section, and presents the principal project title as an h2. The next pass should improve hierarchy, text selection and reading before adding spectacle.
- `/systems` uses the earlier registry grid; `/systems/[slug]` places a visual beside tabs. These need a connected entry/inspection language while preserving the working registry, tabs and evidence.
- `/blog` uses the mechanical Signal Archive artwork and an explorer; `/learning` uses the older shared Navbar/Learning/Footer composition. Preserve useful content and features while connecting typography, navigation, spacing and atmosphere.
- `PortfolioRuntime` deliberately isolates interactive routes. A new cross-route motion layer must preserve that input ownership.

This is a source-template review, not a fresh visual audit of every route or a new performance measurement.

## Emotional and motion rules

**Invite → reveal → play → rest.** Strong movement belongs to a few authored moments. Reading remains steady.

Offer **Still / Gentle / Expressive** as a future site-wide preference. Gentle is the default. Expressive adds deeper camera pushes, typographic apertures and expanded transitions; the visitor keeps control. OS reduced motion always selects the static presentation. Existing quiet-mode storage and `data-motion` behavior must remain compatible during migration.

The expressive moments can be bold:

1. A dew drop fills the viewport and becomes the entrance to the Systems Lab.
2. A project image opens like a hinged specimen sheet; its actual architecture is revealed beneath it.
3. One leaf from the existing interface becomes Canopy's first physical platform.
4. A plucked string sends a wave through code-rendered lines, image lighting and an optional note.
5. A notebook title becomes a large aperture into its article header, then settles into a normal reading column.

The extreme motion is in the camera and transformation. Keep the palette, sound and emotional tone welcoming. Never require visitors to sit through a transition before navigation or text becomes usable.

## Where each existing page goes next

| Existing destination | Place in the world | Distinctive movement | Reading/interaction priority |
| --- | --- | --- | --- |
| `/` | The meadow | Layers gently open; expressive mode can push through a dew lens toward a chosen destination | Name, role and Work remain immediately clear |
| `/projects/[project_name]` | The canopy / specimen table | Selected visual expands into the case study; headings and genuine evidence separate into shallow planes | Strong h1; context → decision → artifact → outcome; selectable copy |
| `/systems` | The greenhouse | A small navigable collection of working specimens, with focused previews and a shared leaf-aperture entrance | Keep a clear index and direct links; avoid loading every demo |
| `/systems/[slug]` | The inspection bench | The selected specimen opens into a controlled live test, followed by explanation | Preserve existing tabs, controls and source/evidence availability |
| `/learning` | The resonance room | A line travels from concept to a real example; active lessons produce a local response | Track navigation and progress before decoration |
| `/learning/string-instrument` | The instrument | Pluck → travelling wave → small light response → optional sound | Input and audio remain owned by the instrument |
| `/learning/procedural-animation` | The motion notebook | Parameter changes visibly affect springs, steering or articulation | Pair each concept with one real working example |
| `/blog` and `/blog/[slug]` | The field notebook | Restrained index-to-article title continuity; a short paper/light header moment | Stable body text, reading width, selection, focus and back navigation |
| `/inspo`, `/worth-your-time`, `/raq` | The workshop shelves | Preview appears at the selected item; filtering reshapes the shelf without a page-wide show | Search/filter states and real source links remain clear |
| Creature, octopod and motion labs | The living pond | Joint chains, gait, steering and recovery respond to actual input | Optional debug overlays, pause, reset and touch/keyboard controls |
| Arcade routes | The playground | Character anticipation, compression on landing and consequential platform movement | Responsive controls, legible goals and clear return to portfolio |
| `/#about` and `/#contact` | Home | Portrait and biography settle; the final scene warms toward first light | Personal story and contact action receive the quietest space |

Do not apply this visual choreography to administrative, authentication or OAuth forms.

## How separate videos move together

A generated clip supplies environmental movement. Code supplies pointer response, collisions, text, navigation and precise synchronization. A bird inside footage cannot reliably become a pointer-controlled game character; the controllable flock and seedling remain procedural objects.

Use these production rules for all related assets:

- Use the existing meadow, shoreline and dusk masters as reference plates. For new rooms, first approve matching still plates with the same emerald/sage, warm ivory, honey and dusty-rose palette.
- Use one shared eight-second **ambient rhythm** as a creative target: 0–1 s rest; 1–3 s breeze gathers; 3–5 s a broad movement crest; 5–7 s movement settles; 7–8 s rest. First and final framing, exposure and environmental pose should match.
- A generation prompt cannot guarantee exact timing or a seamless loop. Review the actual output, trim if necessary, and annotate its real movement cues before syncing code to it.
- Give the environment a common light direction: warm light entering from the upper right. Keep shadows, softness, lens character and scale consistent.
- Keep environmental-loop cameras locked. Let the website perform spatial movement on wrappers. Make ambitious camera bridges as separate one-shot clips, not looping backgrounds.
- Maintain one shared scene clock and a cue manifest. Activate a visible clip at its matching phase; pause inactive scenes. Correct noticeable drift at transition boundaries instead of repeatedly forcing video position every frame.
- Keep scroll progress, ambient phase and game simulation separate. Scrolling can open an aperture or advance a camera; it should not make music speed up or break physics.
- Pointer response is a small, immediate code-rendered ripple, spring or light bend. It must work without waiting for a video to regenerate.
- Sound remains a separate opt-in choice. A shared score can continue between pages after the visitor starts it; page navigation must not silently restart or enable it.
- Only one environmental video or optional simulation should dominate a viewport. Static project evidence and article copy are deliberate resting places.

## Copy-ready video prompts

Append the common constraints below to each scene prompt. Durations are targets; use settings actually supported by the selected generator. Use the original landscape images, not screenshots containing phone or website UI.

### Common constraints

Original hopeful solarpunk cinema. Emerald and sage greens, warm ivory, honey sunlight and restrained rose/lavender accents. Soft optical detail and grounded materials. Preserve the approved reference composition and object identity. No generated text, logos, website UI, sci-fi HUD, cyberpunk neon, strobing highlights, exposure pumping, new people, duplicate animals or melting geometry. Silent output. Environmental movement must remain quiet enough for real typography placed over it later.

### V01 — The meadow listens

**Use:** homepage ambient scene. **Source:** `public/workshop/meadow.webp`. **Target:** 8-second loop.

Animate this exact emerald meadow as a living, sun-warmed place. Preserve the hill contours, flock scale, diagonal sunlight and framing. Keep the camera locked. Begin and end in near-stillness. A faint breeze gathers through the closest grass during seconds 1–3, becomes one broad soft wave during seconds 3–5, then settles during seconds 5–7. Distant grass moves less than the foreground. Dew responds to the moving grass with tiny continuous highlights, never independent flashing particles. Keep the existing birds stable in this ambient loop. The feeling is that the world has noticed your arrival and gently made room for you. Match the opening and closing environmental pose, light and exposure.

**Code response:** a visitor's pointer bends a small local light field; it relaxes when input stops. The actual procedural flock can gather on explicit interaction without changing the recorded birds.

### V02 — Water carries the same breath

**Use:** shoreline frame and pause between work and play. **Source:** `public/workshop/shore.webp`. **Target:** 8-second loop.

Preserve this exact white horse, emerald bank and turquoise water. Use the same warm upper-right sunlight and eight-second breathing rhythm as the meadow. The horse remains in its grazing pose with stable anatomy and planted feet. Let only a nearly imperceptible breath suggest life; prioritize correct anatomy over visible animal movement. A soft ripple begins along the near water during seconds 1–3, carries a broad silver reflection through seconds 3–5, then dissipates by second 7. The grass follows a faint shared breeze. The camera, shoreline and exposure stay fixed. The final water pattern should connect naturally to the opening. Nowhere to rush, nothing demanding attention.

**Code response:** touching the water creates a separate local ripple overlay. It should not displace the horse or warp the bank.

### V03 — Dusk holds the light

**Use:** closing atmosphere near About/Contact. **Source:** `public/workshop/dusk.webp`. **Target:** 8-second loop.

Animate this exact rose-and-lavender lake with extremely fine, slow surface motion. Preserve the sun, horizon, shoreline and palette. The sun does not travel. A soft band of reflected light gently gathers and widens in the middle of the eight-second cycle, then becomes quiet again. Keep the sky unchanged and camera locked. Movement is continuous and modest, with matching opening and final states. It should feel like a peaceful ending with another beginning ahead, not a dramatic sunset time-lapse.

**Code response:** opening the contact invitation warms a small foreground glow. Real contact text stays perfectly sharp and still.

### V04 — Through a drop of morning

**Use:** optional expressive transition into Systems; never a loading gate. **Source:** new approved macro grass/dew first plate and greenhouse final plate. **Target:** 6–8-second one-shot.

Begin on a single fine emerald blade of grass holding a clear dew drop in warm morning sunlight. Hold long enough to understand the small scene. Move forward with one deliberate, smooth camera push toward the drop. Its curved reflection reveals a welcoming glass-and-timber greenhouse. As the drop fills the frame, pass through its light into the approved greenhouse ending composition. The journey is spatial, fluid and physically suggestive, with gentle acceleration in the middle and a soft landing at the end. Preserve the approved ending architecture and lighting. No spinning tunnel, camera shake, rainbow explosion, glitch, screen tearing or invented interface. The feeling is discovering a whole world inside a tiny ordinary thing.

**Code response:** the click or scroll activates a real circular aperture; the new route can become usable immediately. Under reduced motion, use the two approved stills with a simple transition.

### V05 — A greenhouse for useful ideas

**Use:** Systems index hero. **Source:** new approved still. **Target:** 8-second ambient loop.

A small, optimistic maker greenhouse built from pale timber, clear glass and aged brass, filled with fine green plants and a few carefully kept physical prototypes. Warm upper-right sun passes through the roof onto a clean central workbench. Keep the middle area spacious for real interface content added later. Locked camera. Across one eight-second cycle, a shared breeze gently moves only a few nearby leaves and a soft patch of reflected light travels across the bench, then settles back to the opening state. Tools and prototypes stay structurally stable. No floating screens, fake diagrams, UI text, moving machinery or decorative clutter. This is a place where somebody patiently makes useful things.

**Code response:** selecting a registry item lifts its real preview into the inspection view. Do not ask the video model to generate project evidence or readable diagrams.

### V06 — The resonance room

**Use:** Learning/Instrument entry, linking to the existing string experiment. **Source:** new approved still. **Target:** 8-second ambient loop.

A close, intimate view of a pale wooden workbench with a few taut fine brass strings suspended over it. Soft green leaves and warm diffused daylight sit far out of focus behind the instrument. The strings form clean, readable curves across the composition, with open space around them. Locked camera. One string receives a very small, gentle vibration near the middle of the eight-second cycle; the vibration slowly decays into complete stillness, returning to the opening arrangement. Reflected light responds modestly. Keep the materials and string attachments precise. No hands, performers, dramatic wave explosions, generated notation, text or audio. Tactile, curious and peaceful.

**Code response:** interactive strings are drawn and simulated in code above or alongside the footage. A real pluck creates the wave and optional note immediately; generated string vibration is background atmosphere only.

### V07 — A page catches the morning

**Use:** a short Blog/Notes header introduction. **Source:** new approved paper/desk still. **Target:** 4–6-second one-shot followed by a still.

An open, unprinted notebook of warm ivory paper on a worn timber desk beside a small green plant. Natural sunlight grazes the paper fibres. Frame the notebook edge, shallow page layers and a quiet patch of blank paper; do not generate words. A small breeze lifts one page edge a few millimetres, lets it hover, and settles it gently. Use a subtle camera approach and finish in the approved still composition. The physical moment feels thoughtful and human. No page-flipping cascade, flying sheets, swirling letters, ink animation or changes to the desk geometry.

**Code response:** the actual article title follows a shared position from index to article, then becomes ordinary readable typography. Stop decorative media when the reading column takes focus.

### V08 — The leaf becomes a world

**Use:** optional expressive invitation to Canopy. **Source:** new approved large-leaf plate matching the existing game's greens. **Target:** 5–6-second one-shot.

Begin with one small pale-green leaf resting in a sunlit emerald clearing. The camera gently approaches and rotates only enough to reveal its shallow, springy curved surface. A tiny seed rests above its centre; as it lands, the leaf bends a little, recovers, and gives the seed a soft lift. Finish with the leaf's shape and angle matching the approved first platform composition. Warm organic materials, simple large shapes, stable geometry, welcoming light. No cartoon face generated into the seed, no sudden launch, disintegration, combat, exaggerated elastic chaos or camera shake.

**Code response:** the living seedling and platform are procedural. The optional clip is a visual bridge; transition to the real game at an approved shared silhouette. Keep the current direct game launch available and skip the bridge in Still/Gentle modes.

## A reusable generation wrapper

Use this around any scene prompt:

1. Attach the approved first plate and, for a bridge, the approved final plate where supported.
2. Specify whether the shot is a loop or a one-shot. Never ask the same shot to be both.
3. State the subject that may move, the geometry that must remain fixed, light direction, framing and target emotional beat.
4. Paste the scene prompt and common constraints.
5. Review actual output for anatomy, temporal stability, movement cues and loop seams before accepting it.

## Copy-ready implementation prompt for the next development phase

Work inside the existing `shantanusoam/portfolio-main` codebase on the current review branch. Audit and run the actual routes before editing. Preserve the original projects, evidence, learning content, writing, games and source/privacy labels. Evolve the portfolio into one connected living workshop, using the page map in this document.

First unify page hierarchy, typography, navigation, spacing, back/next behavior and input ownership. Begin with `app/projects/[project_name]/page.tsx`, `app/systems/page.tsx`, `app/systems/[slug]/page.tsx`, `app/learning/page.tsx` and the archive templates. Replace repeated generic fade-ups with one distinctive motion idea per page. Make project copy selectable and provide a clear h1 without inventing evidence or metrics.

Then introduce a shared atmosphere and motion preference system that persists across route navigation while preserving the existing quiet-mode behavior. Use Still/Gentle/Expressive. Keep the existing GSAP, Framer Motion, shared clock and physics boundaries; do not create competing global scroll or audio engines. Add progressive scene transitions with real content visible immediately. Preserve scroll/back navigation and focus when transitions finish or are interrupted.

Create a small media/cue manifest for approved files only. Store source, poster, loop/one-shot intent, actual duration and measured visual cues. Do not attach nonexistent video URLs. Environment playback, optional audio, scroll-driven geometry and game simulation must remain separately controllable. Pause hidden/offscreen work and keep only the selected simulation active.

Make three strong expressive moments first: a project specimen opening, a dew/leaf aperture into the registry, and a coherent route into the instrument/learning space. Retain the warm palette and calm resting sections. Every transition must be skippable and collapse to a static presentation under reduced motion.

Expand genuine procedural behavior in the labs: parameter-driven springs, articulated chains, steering and gait. Keep the existing Canopy and Motion Garden controls and discrete still-mode completion. Remove redundant always-on overlays and debugging surfaces from ordinary browsing; expose diagnostics only through deliberate controls.

Divide implementation into clearly owned page/design, motion/media, and procedural-lab jobs. Integrate before an independent review. The reviewer checks actual screenshots and interactions, not a self-assigned score. Verify keyboard, touch, direct links, back/forward, rapid repeated navigation, motion toggles, hidden/offscreen pausing and failed-media fallback. Run TypeScript, the relevant physics/state tests and a production build. Push the reviewed result to the existing PR; do not merge the default branch without the requested release scope.

## Production acceptance

Start with one approved ambient loop and one expressive bridge. Measure their impact before adding more. Keep posters and useful content as the first render, with no media loading gate. Use explicit visual-playback control, independent music control and static defaults for data saving/reduced motion. Inspect phone crops before generating separate portrait versions. Reject malformed animals, drifting architecture, fake project screenshots, flashing highlights and visibly discontinuous loops. Do not claim exact model-generated sync, frame rate or measured performance without testing the actual media and site.

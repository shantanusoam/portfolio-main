# Tomorrow’s Workshop — asset production

## Current hero

Asset: `public/workshop/courtyard.webp`. Original generated 12 September 2026 using the built-in image generation tool. Atmospheric illustration of an imagined workshop, not Shantanu’s actual office or project evidence. Master: 1536 × 1024. WebP export: quality 82, 323,644 bytes. Desktop image uses a central-right focal crop; Next Image supplies responsive variants. No video is generated or loaded in this release.

### Actual generation prompt

Create an original premium editorial gouache architectural illustration for Shantanu Soam's solarpunk software portfolio, Tomorrow's Workshop. Landscape 3:2 composition. Imagined modest North Indian rooftop workshop courtyard, warm morning sunlight from upper left, lime plaster and repaired brick, terracotta pots with coherent sparse plants, forest-green serviceable equipment, modest rooftop solar canopy on believable brackets, jaali screen casting geometric shade. A timber worktable with small repairable electronics enclosure, notebook, ceramic cup, two stools, quiet open tool shelf. Clear accessible step-free circulation. Beautiful carefully drawn architectural perspective at human eye level, 35mm view; precise crisp silhouettes with tactile quiet pigment texture, sophisticated illustrated magazine aesthetic. Restrained cream #F3EEDC, forest #173C32, clay #A14F35, pale sky. Main table central-right, calm edges for crops. Hopeful, useful, cared for, not luxury resort. No text, lettering, logos, people, watermarks, readable screens, neon, floating architecture, impossible geometry, excessive jungle. This is atmospheric illustration, not actual office photography.

## Production note

The approved hero’s enclosure is open. Do not use it as the first frame of the closed-hinge V2 shot; generate the specified closed enclosure C first. V1 should animate only existing leaves. All following prompts are production briefs, not claims that these additional assets exist.

## 10. Copy-ready image prompts

### A. Hero master — the workshop

**Use:** establish the world. Target 3:2, around 2400 × 1600 or the tool’s closest supported master resolution. The page places copy beside the illustration, so do not bake text into this image.

> Create an original architectural illustration for the personal portfolio of a software engineer and maker. Show an imagined, hopeful near-future neighbourhood workshop in North India, on an ordinary accessible rooftop courtyard. A shaded worktable holds a repairable small electronic enclosure, a notebook, a few well-organized tools and a ceramic cup. A modest solar canopy stands on believable serviceable brackets; jaali screens cast soft geometric shade. Lime plaster, repaired brick, terracotta planters, a timber bench and matte forest-green equipment feel used and cared for. Show a clear step-free route through the space. Add only a few coherent plants and quiet signs of shared use, such as two stools and an open tool shelf. The mood is capable, generous, peaceful and alive. Hand-painted gouache-like architectural storytelling with crisp forms, subtle pigment texture and believable perspective. Warm morning sun enters from upper left, soft green shade, cream highlights, restrained clay and brass accents. Human eye-level, approximately a 35 mm lens perspective, balanced three-quarter view, no extreme wide-angle distortion. Keep the focal worktable in the central-right portion, with calm shapes around the edges so responsive crops remain possible. This is an imagined setting, not a documentary image of a real office. No lettering, logos, watermarks or legible screens.

**Exclusions / negative prompt where supported:** glossy luxury eco-resort, gigantic white towers, neon cyberpunk, floating architecture, decorative gears, excessive vines, indiscriminate tropical jungle, sterile showroom, cluttered tools, impossible stairs, fake text, oversaturated HDR, photorealistic AI faces, copied branded characters.

### B. Mobile composition — the same place

**Use:** reference the approved hero. Target 8:5 landscape, such as 1280 × 800. With 16 CSS px side margins, a 360 CSS px phone shows a 328 × 205 CSS px image without cropping. At 320 CSS px it is 288 × 180; at 430 CSS px, cap the 398 × 248.75 natural box to 220 px high, showing about 88% of the source height. Keep essential forms within the central 80% of the source height. Test the actual crop and collapse the art if larger text needs the space.

> Recompose the supplied approved workshop illustration into a compact landscape 8:5 image for a mobile page. Preserve exactly the established architecture, material palette, hand-painted finish, morning light direction and identity of the worktable. Show a closer, simpler view: the table, a portion of the solar canopy, one jaali shadow and a planter. Keep the important elements inside the central 80 percent of the image height, allowing a modest vertical crop on wider phones. Remove peripheral clutter by changing the framing, not by inventing a different building. Maintain clear forms and quiet edges at small display size. No text, logos, watermarks, new characters or new architectural style.

### C. Lab detail — repaired and understandable

**Use:** a secondary atmospheric still, not product evidence. Reference the master; target 4:3.

> Using the approved workshop as the visual reference, create a close architectural still of the same worktable. Show a modest repairable sensor enclosure with a closed, attached hinged inspection lid, a clearly visible hinge on its rear edge, visible ordinary screws and a neat cable path, a pencil and a notebook with simple non-legible sketch marks. Keep the space above the lid clear so it can open on that hinge. Add one terracotta pot at the edge and the same soft jaali shadow from upper-left morning light. Keep the enclosure credible as an illustrative prop without asserting an exact circuit design. Match the master’s gouache-like finish, matte materials, colour relationships and perspective. The feeling is patient understanding and useful craft. Leave space around the objects. No rendered interface, fake code, readable text, logos, magical holograms or excessive decorative plants.

### D. Social preview background

**Use:** supply the approved master. Compose actual name/headline afterward in a design tool or HTML.

> Adapt the approved workshop illustration to a wide 1200:630 composition. Keep the workshop recognizable on the right 55 percent, and create an uncluttered warm-paper area on the left 45 percent with very low visual detail for later typography. Preserve the same sun direction, materials and painterly finish. Keep important objects away from the outer 8 percent. This is an illustration background only. Do not render any text, logo, signature, frame or watermark.

### E. Optional arcade teaser

**Use:** a later supporting illustration; never a substitute for an actual game screenshot.

> Within the approved workshop world, show a small unbranded early-2000s handheld-style device resting beside a notebook on the timber table. Its monochrome green screen is blank and evenly lit, ready for a separately composited real game frame. Preserve the warm morning jaali shadow, restrained clay/forest palette and hand-painted architectural finish. Make the screen a clean planar rectangle with visible corners and minimal glare. No brand marks, lettering, invented gameplay or additional screens.

Real game footage or a screenshot is composited into the screen afterward. The player-facing arcade tile should include a genuine game capture.

## 11. Copy-ready video prompts and shot planning

Animate an approved still first. Image-to-video establishes continuity better than asking each video to reinvent the world. The exact loop, timing and geometry are acceptance targets; a text prompt alone cannot guarantee them.

### V1. Ambient hero — small life in a still frame

**Target:** 6–8 seconds, static camera, silent loop. Use the approved hero master as the image reference. Request first/last-frame constraints only if the chosen tool supports them.

> Animate the supplied workshop illustration while preserving the exact camera, architecture, palette, lighting and object identities. The camera is completely locked: no pan, orbit, zoom or lens change. Keep the solar canopy, tools, notebook, table and building rigid and stationary. Animate only the nearest planter leaves in one gentle, slow breeze cycle. Keep the movement subtle enough that the illustration remains easy to look at while reading nearby text. Maintain the original hand-painted surface without crawling texture. Light intensity and shadow direction remain constant. Begin and end in matching leaf poses, with matching motion direction and speed, aiming for an invisible loop. No new objects, people entering, birds crossing, object morphing, text, camera drift, flicker, exposure changes or audio.

Acceptance: watch at least three consecutive loops at final page size and in slow motion. Reject edge wobble, changing solar-panel geometry, texture crawl, leaf flicker and visible jumps. If the seam fails, simplify the movement or author a small deterministic layer animation from the still. Crossfading moving objects can create double images; it is not an automatic fix.

### V2. Optional lab vignette — an existing object becomes understandable

**Target:** 6 seconds, one deliberate action. Use Lab detail C. This is a played illustration, not a factual product demo.

> Use the supplied lab-detail illustration as the first frame and preserve its materials, perspective and colour palette. A single small hinged inspection cover on the illustrative enclosure opens slowly by about 35 degrees on a physically consistent hinge, revealing a simple stable interior compartment. It then rests. The camera remains locked. The table, tools, notebook, screws, cable and planter never move or change shape. Preserve the hinge pivot and enclosure dimensions throughout. The gesture should feel careful, serviceable and understandable. No hands, additional parts appearing, holograms, text, changing circuit geometry, camera motion or sound.

This is a risky articulation task for generative video. If geometry changes, use an authored SVG/3D animation or a real recorded prototype instead. It is optional and must not consume the first release’s proof-production time.

### V3. Portfolio launch film — edit three shots

**Target:** 12-second finished film assembled in an editor. Generate/capture shots separately; do not expect one prompt to produce exact cuts, UI and typography reliably.

| Time | Source | Shot | Message added in editing |
| --- | --- | --- | --- |
| 0–4 s | Approved hero image-to-video | Locked courtyard, one gentle breeze | Shantanu Soam / Useful software |
| 4–9 s | Actual portfolio or working-sketch screen recording | One task moves, state diagram updates, Undo returns it | Systems you can understand |
| 9–12 s | Approved social-preview still | Clean hold with optional subtle crop change | A future worth building / portfolio URL |

**World-shot prompt:**

> From the approved workshop illustration, produce one quiet four-second establishing shot with the camera locked and only the nearest leaves moving very gently. Preserve all architectural and object geometry, palette, textures and morning light. No text, transitions, logos, audio or new action. The shot must allow a clean editorial cut at any point.

Capture the middle shot from the actual running interaction with sample data. Compose titles, URL and captions afterward. Use original or appropriately licensed music if desired; ensure the film still communicates on mute. Do not place this promotional edit in the homepage’s initial download.


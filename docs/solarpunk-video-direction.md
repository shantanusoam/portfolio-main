# The world exhales — portfolio video direction

This expands the earlier six-second asset prompts. The emotional direction is hopeful solarpunk: useful technology belonging to a peaceful world, warm light, and the feeling of coming home. Calm emerges through the movement itself. Avoid a literal disaster-to-utopia story, dramatic weather, futuristic city spectacle or generic cinematic zooms.

These are production prompts, not generated videos. The current website still uses images and procedural effects. Generate each shot separately from its named approved image; add interface text and transitions in the website, never inside the generated footage.

## Sequence and purpose

| Shot | Use in the existing page | Source image | Target | Playback |
| --- | --- | --- | --- | --- |
| 01 / The world exhales | Hero arrival | `public/workshop/meadow.webp` | 8 seconds | Play once after visitor opts in; hold final frame |
| 02 / A field breathing | Meadow film frame | `public/workshop/meadow.webp` | 6–8 seconds | Reviewed seamless ambient loop |
| 03 / Nothing to rush | Shore film frame and visual pause | `public/workshop/shore.webp` | 8 seconds | Reviewed seamless ambient loop |
| 04 / A softer ending | Dusk frame or contact background | `public/workshop/dusk.webp` | 8 seconds | Reviewed seamless ambient loop |

Start with shots 01 and 03. They carry the biggest emotional change without making the whole page move. Durations are creative targets; adapt them to the generator's supported settings.

## 01 — Hero: the world exhales

Use the existing meadow image as the first-frame reference. Paste the following as one prompt:

> Animate this exact image into an eight-second, single-shot cinematic moment. Preserve the emerald hillside, diagonal bands of warm sunlight, tiny white birds, framing and fine grass texture. The feeling is hopeful solarpunk: warm, safe, quietly alive, like finally arriving home.
>
> Begin with a modest breeze passing across the grass in several small, overlapping ripples. Over the first four seconds, these ripples become one broad, slow wave moving from left to right. The landscape gradually settles. The small existing flock glides naturally a short distance across the hillside, with restrained, believable wing movement and stable individual bird shapes. Keep every bird within the frame and preserve the flock's scale. During the final two seconds the grass is almost still; hold a peaceful composition with only the faintest remaining breeze.
>
> Keep the camera locked. Create depth through nearby grass moving slightly more than the distant hillside. Preserve the original exposure and green palette, with soft golden highlights and very restrained dew sparkle. Keep detail behind the lower-left headline calm enough for readable text added later. This is a single arrival moment, not a repeating loop.
>
> No cuts, camera zoom, camera shake, time-lapse, new birds, morphing animals, changing terrain, melting grass, flashing glitter, exposure pumping, storm, buildings, vehicles, people, text, logos, interface or generated audio. The result should feel like the world taking a slow breath out.

If the bird motion breaks anatomy, reject that take. Generate a grass-only version from the same image or keep the approved still. Do not ship a broken flock to satisfy the motion brief.

## 02 — Meadow loop: a field breathing

> Create a six-to-eight-second seamless environmental loop from this exact meadow image. A broad, barely perceptible breeze slowly bends the finest grass and returns it to its opening pose. The hillside itself is completely stable. Fine dew highlights respond softly to that movement; there is no independent glitter animation. The distant grass has less movement than the foreground. Preserve the small existing birds and their exact positions as part of this quiet background composition; do not introduce flight into this loop. Preserve the green palette, diagonal sunlight, shadows, framing and exposure. Locked camera, no camera drift, no zoom, no cuts, no new objects, no warping, no flashing highlights, no text and no audio. Match the first and final frames in composition, grass pose and lighting. Warm, restorative and almost still.

This loop is a conservative alternative to the hero flight. Do not crossfade it against a different final flock position from shot 01. Either use it independently in the film frame or retain the hero's last frame.

## 03 — Shore: nothing to rush

> Animate this exact shoreline image into an eight-second seamless, single-shot scene. Preserve the small white horse's anatomy, grazing pose, size and position; preserve the emerald bank and the curve of the turquoise water. Only the horse's very subtle breathing suggests life. Its feet remain planted and its head remains steady. Tiny, slow water ripples carry soft silver sunlight across the existing water surface. A faint breeze moves the nearest grass. The water must feel soft and continuous, never glittering like a strobe. Keep the camera locked, the shoreline geometry fixed and the exposure unchanged. Return to matching water movement and horse breathing at the end. The emotional impression is a warm afternoon with nowhere else you need to be. No walking, trotting, head turns, extra limbs, changing mane, added animals, boats, people, changing sunlight, camera movement, dramatic waves, text or audio.

If breathing visibly deforms the horse, use a take where only grass and water move. Inspect the loop seam at normal playback and frame by frame; a prompt does not guarantee a seamless result.

## 04 — Dusk: a softer ending

> Create an eight-second seamless shot from this exact rose-and-lavender lake image. Preserve the sun, horizon, sky gradient and small green shoreline exactly. Very fine ripples gently soften and gather the existing reflection on the water. Their movement is slow and continuous; the lake remains peaceful, not glass-frozen. The sun never travels and the sky does not change colour during the clip. Keep the camera locked and exposure constant. First and final water states should connect naturally. The feeling is quiet gratitude and the warmth of a day well spent, with another beginning ahead. No time-lapse, moving clouds, sunset acceleration, lens flare sweep, new scenery, people, birds, boats, particles, dramatic glow, text or audio.

Use this as a visual hold near contact, not as a dramatic ending that competes with the invitation to get in touch.

## Optional 24-second portfolio film

For a separate shareable film, edit the approved footage rather than asking a model to invent scene transitions:

- 0–8 s: the meadow arrival, with space for the existing headline.
- 8–16 s: the white horse and water; let the new shot settle before introducing any project text.
- 16–24 s: dusk reflection and the actual name/URL, added by an editor.

Use gentle short dissolves only where matching light makes them feel continuous. Do not morph grass into horse anatomy or generated water into interface letters. Keep portfolio text as crisp real typography. This film is optional and is not the website's loading screen.

## Sound direction

Keep all generated video silent. The existing “Add a little music” control owns sound independently. Its original generative score can accompany the footage without restarting whenever a section changes.

For a future recorded score:

> A warm, intimate ambient miniature that feels like returning home after a busy day. Soft felt-piano-like tones and a very quiet rounded pad. C major gently visiting A minor, spacious single notes, long natural releases and generous silence. No percussion, vocals, urgent pulse, dramatic swell, obvious synth arpeggio or sudden bright notes. A restrained 60–90 second arrangement with a natural, unnoticeable loop. Keep the emotional character hopeful, familiar and peaceful.

Listen to the finished audio before using it. The prompt describes mood, not a guaranteed therapeutic effect.

## How the footage belongs in the existing site

1. Keep the meadow poster and readable headline as the immediate first render. Video is an enhancement, never a loading gate.
2. Offer an explicit “Bring the landscape to life” action. Starting visual motion must not automatically start music. Keep clear Pause/Play and the existing Motion off control.
3. Play the hero arrival once. Hold its final frame instead of looping the settling action back into the busier opening. Do not swap back to the first-frame poster at the end.
4. Keep GSAP camera movement shallow while video is playing. Since the generated camera is locked, the website controls the scene's spatial movement. Disable any image shader on a surface while that same surface is playing video.
5. Allow at most one visible environmental video to play at a time. Pause as it leaves view or the tab becomes hidden. Keep other film frames as images until needed.
6. Leave real project explanations, notes and biography visually steady. The footage belongs to arrival, short pauses and the closing atmosphere.
7. On touch devices, retain native scrolling and simpler depth movement. Prefer a well-composed poster over a crop that removes the horse or flock. Check a phone crop before requesting a new portrait generation.
8. Reduced-motion and data-saving preferences use still images by default. Never make text, navigation, project information or contact depend on media playback.

## Export and acceptance checklist

- Keep a clean high-quality master. Create separate web exports; start with 1280-pixel-wide desktop and 720-pixel-wide phone candidates, then judge the actual crop and detail. Do not stretch or change the reference aspect ratio accidentally.
- Budget approximately 1 MiB mobile / 2 MiB desktop per short loop as a target, not a promise. If convincing grass/water detail cannot survive that budget, use the still or shorten the shot. No large video downloads during initial page load.
- Export a matching poster from the exact first frame. For the one-shot arrival, also keep the final-frame poster as a fallback.
- Review motion at normal speed, including grass contours, individual birds, horse legs, reflected highlights, brightness stability and every loop seam.
- Reject texture crawl, breathing terrain, duplicated birds, morphing horse anatomy, camera drift, flashing speculars or a visible restart.
- Do not reverse bird flight or horse motion to fake a loop. Do not promise that a first/last-frame instruction alone will produce a seamless clip.
- Watch the page while reading real headings and project copy. If the eye keeps leaving the text, lower the motion or use a still.

Suggested filenames after approval: `meadow-arrival.mp4`, `meadow-breeze-loop.mp4`, `shore-stillness-loop.mp4`, `dusk-reflection-loop.mp4`. These files do not exist yet; do not add video sources to the website until the actual reviewed exports are available.

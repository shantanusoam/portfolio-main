# Room to imagine — a place to come home to

The latest user direction supersedes the brief coastal-city experiment: hopeful solarpunk, emerald landscapes, warm light, and calm emerging from complexity. The existing portfolio's real content remains the foundation.

## Audit and decisions

The complete repository was inspected and the full Next app was run before the motion changes. Existing foundations include GSAP, Lenis, Framer Motion, a WebGL/WebGPU field renderer, device-tier logic, procedural creatures, a soundroom, an arcade, real project narratives, and an interactive tree model. No dependency or architecture replacement was needed.

| Keep                                                    | Improve                       | Transform                                   | Remove from this direction        |
| ------------------------------------------------------- | ----------------------------- | ------------------------------------------- | --------------------------------- |
| Project narratives, engineering decisions, source links | Hierarchy and reading rhythm  | Meadow hero into a layered scene            | City/nightlife framing            |
| Meadow, horse, water and dusk imagery                   | Responsive crops and contrast | Scroll progress into changing natural light | Harsh RGB effects                 |
| Existing fonts, portrait and personal copy              | About composition             | Project rows into spacious chapters         | Game-menu language                |
| Tree experiment and other lab routes                    | Touch and keyboard access     | A still meadow into a settling light study  | Autoplay and permanent distortion |
| Existing route-specific runtime                         | Motion lifecycle and cleanup  | Optional original ambient score             | Duplicate fullscreen GPU scenes   |

Routes retained: homepage, project details, systems index/details, blog index/details, inspo, RAQ, worth-your-time, learning and instrument pages, procedural animation, creature/octopod/motion/SS labs, GPU demos, both arcade modes, testing, control-plane docs, and administrative/OAuth/API routes. The homepage alone mounts the new director. Other routes retain their original runtime, controls and soundroom.

## Narrative and interaction

Arrive in a sunlit meadow. White birds and folds of green provide the environment; readable editorial type sits in a separate plane. Walk through real work, play with a small experiment, read the notebook, meet the person, and end with a warm invitation. Rounded landscape frames retain the supplied reference's identity.

Light travels through morning, warmth, golden hour, a soft rose sky, still water, home, and first light. This is a visual story, not a real clock or weather feed. Project labels become Grow, Care and Play, with the original project descriptions and architecture summaries unchanged.

GSAP animates a shallow letter entrance and selected depth planes. Lenis is scoped to desktop fine pointers. Native touch scrolling remains. A demand-driven shared clock supplies scroll velocity, cursor movement and visible shader rendering. No section is forcibly pinned. Native sticky composition is limited to project copy on wide screens.

The refraction study progressively enhances a real image. Movement briefly bends light, then decays even if the pointer stops over the image. Mesh inspection is an explicit button. The original image remains available if WebGL fails, data saving is on, or reduced motion is requested. Canvas resources are released offscreen and in quiet mode; DPR is capped and can downgrade after sustained slow frames.

## Music

“Add a little music” starts an original generative sine-tone score in the browser. There are no external tracks, downloads, autoplay, voices, beats or claims of therapeutic benefit. A slow 16-note C-major/A-minor phrase has long envelopes, low-pass filtering and restrained delay. Volume and pause are accessible controls. Audio suspends while the document is hidden and closes when leaving the homepage. The existing soundroom remains available on its existing routes.

## Accessibility and performance boundaries

Motion can be turned off persistently; OS reduced-motion preferences take priority and update live. Content is rendered on the server and never depends on an entrance animation to become readable. Native cursors remain functional alongside the small decorative pointer. Touch controls retain normal scrolling. No video is loaded; the earlier image-to-video prompts remain optional production directions.

The existing root runtime statically imports substantial legacy functionality. This is an audit finding, not a measured bundle improvement in this patch. This revision avoids mounting those engines on the homepage and lazily imports GSAP/Lenis and the shader. Hardware frame-rate and field Core Web Vitals still require real-device measurement; 60 FPS is not claimed.

# Pretext experiments

Preferred order:

1. Render selected text inside the motion lab (`/motion-lab`) first, never
   directly in production.
2. Convert line rectangles into soft mascot surfaces (an obstacle-like
   region the mascot's steering is aware of, not a hard collision).
3. Create a limited exclusion-zone experiment (variable line width around
   a mascot region), updated at limited frequency.
4. Sample one word into dots on an offscreen canvas, capped sample count.
5. Animate those dots to and from the mascot using the existing
   `ParticlePool`/`CanvasDotRenderer` machinery rather than inventing a
   parallel rendering path.
6. Evaluate performance and readability before even considering portfolio
   use — this is optional, later-phase polish, not core functionality.

Never reflow the entire portfolio at animation-frame frequency. If an
experiment needs per-frame text measurement, it has already failed this
requirement and needs a different approach (precompute once, animate the
precomputed geometry).

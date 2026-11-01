# Character configuration and maintenance

The active character adapts the user-approved color concept to the existing rig.
Identity cues come from `public/msk_cartoon.png`; the concept is in
`docs/design/character-msk-concept.png`.
The reference uses procedural Three.js geometry and GSAP poses, not a GLB.
See `CHARACTER-REFERENCE.md` for source inspection and provenance.

## Editable sources

- `content/character.ts`: hair, beard, palette, and fallback URL.
- `components/character/model.ts`: geometry, spherical face anchors, dynamic
  mouth, chin beard, separated moustache, accessories, articulated hands.
- `components/character/quiff.ts`: a cropped cap and five swept, tapered locks.
- `components/character/sweatshirt.ts`: straight, relaxed torso, rounded shoulders,
  ribbed crew neck, and a shooting-star chest emblem conforming to the fabric.
  Matching sleeves/cuffs use the existing articulated arm pivots in `model.ts`.
- `components/character/sunglasses.ts`: thick Wayfarer-style frames, opaque
  smoked lenses, reflections, camera details, and temples. The bow tie is removed.
- `components/character/motion.ts`: facial/hand presets and owned timelines for
  tour gestures, grabbing, and all eleven tricks.
- `components/character/scene.tsx`: lights, camera, antialiased color framebuffer
  and a cropped 256px badge target. Both use four-sample MSAA and byte textures
  to bound memory. Output DPR is capped at 2; the main target at 1.5.
  Both targets are disposed.
- `components/character/composite.ts`: transparent color output, circular clipping,
  and vanish/photo trick effects, with a single linear-to-sRGB conversion.
- `lib/character-render.ts`: the camera/UV crop. The compact face keeps its
  own detailed render rather than magnifying pixels from the full viewport.
- `public/character/poster.png`: transparent still rendered from the actual rig.

Keep each action within the controller’s 4.2-second window, or update the runtime
completion timer. New actions must reset to the latest tour chapter. Repeated
punches restart the action; direct manipulation interrupts other performances.
All child timelines belong to one owned parent and must be killed on interruption.
Dispose geometries, materials, instancing buffers, and render targets on teardown.

## Likeness and poster

The color concept is implemented as editable geometry, not a raster billboard.
Expressions, tour poses, arm pivots and the sunglasses/hat/watch mounts retain
the existing controller. The source-inspired monochrome pass is retired.
The poster is a transparent 512px render of the same rig and lighting. Its square
camera spans 5.75 world units, with the head center at 50% x / 40% y; CSS maps
that to 5.75 / HEAD_RADIUS times the screen head radius. Keep this framing when
re-exporting so the quiff fits and the fallback aligns with the live character.
No separately modeled asset or GLB is required by the current runtime.

## Sound and failure modes

Effects are synthesized locally. Audio defaults to muted, with a saved preference;
playback still requires a browser-allowed gesture. No reference recordings load.
The matching PNG poster covers scene loading, unavailable WebGL, and context loss.
HTML content and navigation remain usable. Reduced motion retains a static pose
and text feedback, and hidden scenes pause their rendering and timelines.

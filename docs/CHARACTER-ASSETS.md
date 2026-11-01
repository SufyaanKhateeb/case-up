# Character configuration and maintenance

The active character reconstructs the sebg.ch appearance requested by the user.
The reference uses procedural Three.js geometry and GSAP poses, not a GLB.
See `CHARACTER-REFERENCE.md` for source inspection and provenance.

## Editable sources

- `content/character.ts`: hair, beard, palette, and fallback URL.
- `components/character/model.ts`: geometry, spherical face anchors, dynamic
  mouth, vertex-colored beard, instanced curls, accessories, articulated hands.
- `components/character/sweatshirt.ts`: straight, relaxed torso, rounded shoulders,
  ribbed crew neck, and a shooting-star chest emblem conforming to the fabric.
  Matching sleeves/cuffs use the existing articulated arm pivots in `model.ts`.
- `components/character/sunglasses.ts`: thick Wayfarer-style frames, opaque
  smoked lenses, reflections, camera details, and temples. The bow tie is removed.
- `components/character/motion.ts`: facial/hand presets and owned timelines for
  tour gestures, grabbing, and all eleven tricks.
- `components/character/scene.tsx`: lights, camera, low-resolution large-character
  framebuffer and a cropped, antialiased 256px badge target. Output DPR is capped
  at 2; only the compact crop gets extra scene detail. Both targets are disposed.
- `lib/character-print.ts`: continuous size-dependent print strength and the
  camera/UV crop. Small faces retain fine tonal shading; large faces retain the
  original ordered dither. This avoids magnified print cells inside the circle.
- `public/character/poster.png`: transparent still rendered from the actual rig.

Keep each action within the controller’s 4.2-second window, or update the runtime
completion timer. New actions must reset to the latest tour chapter. Repeated
punches restart the action; direct manipulation interrupts other performances.
All child timelines belong to one owned parent and must be killed on interruption.
Dispose geometries, materials, instancing buffers, and render targets on teardown.

## Optional future likeness

The chosen appearance is the reference character, not a claimed Sufyaan likeness.
A custom likeness can be made later by adjusting these editable sources, with
front/three-quarter references and preferred hair, facial hair, and clothing.
Review the result in the actual print renderer before authoring more poses.
No separately modeled asset or GLB is required by the current runtime.

## Sound and failure modes

Effects are synthesized locally. Audio defaults to muted, with a saved preference;
playback still requires a browser-allowed gesture. No reference recordings load.
The matching PNG poster covers scene loading, unavailable WebGL, and context loss.
HTML content and navigation remain usable. Reduced motion retains a static pose
and text feedback, and hidden scenes pause their rendering and timelines.

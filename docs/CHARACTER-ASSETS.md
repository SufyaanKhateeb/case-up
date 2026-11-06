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

After 20 seconds without pointer, key, touch or scroll activity, the character
yawns and settles into closed eyes with gentle breathing. Input wakes it and
returns to the tour; dragging, tricks, dialogs, reduced motion and hidden pages
take priority. `use-presence.ts` owns the cancellable idle deadline and temporarily
changes the title to “I’ll wait here — Sufyaan” while the page is hidden/unfocused.
Route-specific titles are restored on return. `motion.ts` owns sleep/wake timelines.

`lib/portfolio-audio.ts` synthesizes the reference-style triangle/sine blips,
vibrato, filtered noise, and short melodies locally. `runtime.tsx` connects speech
cues, grab/drop, accessories, the trick menu and all eleven tricks; project demos
connect scratch/reveal and view controls. Delayed effects match the local hiccup,
selfie, peekaboo and sneeze poses. Sleep uses a filtered breathing/yawn sweep and
wake uses two short rising notes. Word-reveal tweens emit rate-limited blips in
both scroll directions, including the biography. No recordings or remote audio
scripts load.
Audio starts muted on every page load/reload; the old saved sound preference is
ignored. Sound remains enabled during client-side navigation only when explicitly
enabled in the current visit. The toggle unlocks/resumes the
context inside a deliberate gesture and plays a confirmation. Muting, hiding the
tab, changing routes or interrupting a trick stops queued voices; unmount closes
the context. Speech and scratch effects are rate limited. Unsupported audio is
optional and cannot block navigation or character interactions.
The control reflects the context's actual state: enabled audio waiting
for browser activation is labeled “Activate sound”, rather than “Mute sound”.
Its first activation click resumes audio without toggling the current choice
off. Global activation listeners skip the sound button so pointerdown cannot
change its Activate action into Mute before click. Pending activation
shows “Tap for sound”. No context is created or resumed on load, idle, scroll,
focus or visibility alone before browser user activation. Once activated, effects
can recover a suspended context, and state changes update the control directly.
The matching PNG poster covers scene loading, unavailable WebGL, and context loss.
HTML content and navigation remain usable. Reduced motion retains a static pose
and text feedback, and hidden scenes pause their rendering and timelines.

## Scroll coordination

`use-smooth-scroll.ts` owns one Lenis instance on the native document scroller,
driven by the existing GSAP ticker and synchronized with ScrollTrigger. Touch
inertia stays native (`syncTouch: false`); reduced motion disables Lenis. Dialogs
pause it and nested résumé/character/scratch controls retain their input. Anchor
links and Get in touch use the same scroll owner. Cleanup removes the ticker and
destroys the instance on navigation. Do not also initialize Locomotive Scroll.

Word opacities are initialized before staggered reveal playback. Portrait tablets
use the four-column character grid; opening speech clears the headline, and the
phone biography font/spacing leaves room for the bottom-anchored character.

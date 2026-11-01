# Reference character reconstruction

The user explicitly requested using the character from https://www.sebg.ch/
on November 1, 2026, replacing the initial approximation.

## What the source actually does

The public page’s mascot bundle builds its character procedurally with Three.js;
there is no downloaded GLB. Its model contains a lathed sweater/body, spherical
facial anchors, instanced hair curls, a vertex-colored beard, a dynamically
updated mouth mesh, happy-eye arcs, and articulated shoulders, elbows, wrists,
fingers, and thumbs. GSAP timelines animate expressions and gestures.

The renderer lights a colored scene into a low-resolution render target. A
separate screen-space Bayer pass converts that lit image to ink/paper colors.
The desktop pixel scale is 2; mobile uses a device-pixel-aligned smaller scale.
This differs materially from applying a monochrome shader to every mesh.

Source inspected:

- https://www.sebg.ch/
- https://www.sebg.ch/_astro/Mascot.astro_astro_type_script_index_0_lang.02lhauFO.js
- https://www.sebg.ch/_astro/index.AmbHUgQm.css

The page’s `data-look` specifies curly hair, beard, skin `#fbf3ec`, hair `#77573d`,
beard `#c49c74`, sweater `#a4ad9b`, ink `#0b0b0c`, and paper `#fbfbf8`.

## Local adaptation

`model.ts` reconstructs those geometry proportions, palette, facial topology,
curly hair distribution, beard shading, accessories, and articulated hands with
readable Three.js code. `motion.ts` adapts the observed pose/timeline structure to
our controller, including proper interruption and cleanup. `scene.tsx` owns the
render target and single post-lighting print pass.

The vendor bundle and original page script are not executed or shipped. The
reference’s Astro router, analytics, browser globals, event listeners, and
infinite timer loops are not imported. Portfolio copy and navigation remain local.

The active character now follows the reference’s appearance, as requested.
A custom Sufyaan likeness can later be made through `content/character.ts` and
geometry changes; a separately authored GLB is not a prerequisite for this rig.

## Eye rendering correction

Eye anchors have a small outward clearance so smile arcs remain above the head
surface while blinking. Highlights sit in front of the pupils. Expression changes
swap geometry at the closed point of a synchronized blink rather than popping
between open eyes and arcs. Reduced motion switches directly to the static pose.
Regression tests cover surface clearance and both expression transitions.

## Landscape scroll choreography

Inspected the live reference at 1440 × 900 and its public homepage bundle:
https://www.sebg.ch/_astro/index.astro_astro_type_script_index_0_lang.-m3mc4oL.js

The source travels between head-centre/radius anchors over the viewport preceding
each section. Travel uses cubic power2 easing, logarithmic radius/clipping, a
50 ms scroll lag, and a direction-sensitive quarter-turn while crossing the page.
The local implementation now follows this structure instead of CSS corner swaps.
A single full-viewport orthographic scene preserves the projection while moving.

The biography retains the left character. Landscape projects alternate side
anchors with their media on the opposite side. Narration starts at 60svh, rows are
42svh tall, and the closing buffer is 52svh. Fades occur at row-top 60→46% and
18→6%; words reveal at 50→24%. Gestures enter at the viewport centre, with mirrored
arms, device aiming, mouth chatter, think/wrist-view/thumbs poses, and per-project
accessories. The guide contracts into a circular work badge and grows back into
the right contact anchor. Resize and reverse scrolling re-evaluate the same path.

Local project media and writing are still placeholders. These change the chapter
contents; they do not use original project images or claims. The reference’s
full media transition effects are not all reproduced by the local demonstrations.
The character does perform a device-aimed swipe before each new narration pose;
queued poses wait for the forward wrist beat, while direct manipulation cancels it.

## Requested accessory customization

The user subsequently removed the bow tie and requested sunglasses inspired by
Ray-Ban Meta Wayfarers. `sunglasses.ts` builds thick trapezoidal frames, opaque
smoked lenses with subtle glints, temples, and camera details. The accessory ID
remains `glasses` so existing poses and mounting continue to work. The first
chapter now wears only the watch, and the 404 offers a hat and sunglasses; its
completion message checks those two selectable accessories.

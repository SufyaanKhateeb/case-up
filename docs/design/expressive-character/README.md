# Expressive custom character

The user requested the source character's expressiveness, removal/fixing of
unflattering downward-facing poses, and alternatives to the hat.

## Visible expression channels

The supplied GLB remains `arms-continuous.glb`; its original positions, triangle
indices, textures and UVs are unchanged. `facial-expressions.ts` builds six small
relative position targets once at load: Blink, WideEyes, BrowLeft, BrowRight,
Smile and Surprise. `imported-model.ts` applies their weights from the existing
controller after `motion.update`, including the real timed blink. No separate
face patches or replacement eyeballs are drawn. The morphs happen before skinning
and follow the corrected rigid head/jaw motion.

Measured source-space landmarks: eye centres (-.060,.647)/(.048,.647), eyebrows
(-.063,.709)/(.050,.709), mouth (-.006,.547). Smooth compact masks restrict movement
to the front features; the low chin below .525, neck, hair and clothes stay out.
Morph weights are bounded and finite. Vertex buffers are created once; per-frame
updates only change influences. The imported geometry owns the morph resources
and is disposed with the asset. The reduced-motion rest has zero influences.

This is a restrained expression pass on a generated mesh. Mouth changes are not
phonemes, full lip-sync, sculpted teeth or a new oral cavity. Individual fingers
remain unrigged. The existing hand gestures and all trick interruptions remain.

## Upright head and accessories

The watch cue now presents its wrist with an upright face. Pointer pitch is
upward-only; idle and trick cues no longer pitch down. The live adapter also
clamps neck/tilt/idle X rotations individually to [-.12, 0] so legacy/future cues
cannot fold the face into the collar. Asymmetric brows and side tilts preserve
curiosity and anticipation.

The bucket hat and hair-shrink behavior are removed. `headphones.ts` creates
compact charcoal oval earcups, cream trim, blue details and a soft curved band
resting around the collar. It follows Body, preserving hair and facial visibility.
The third project wears headphones. The 404 catalogue offers headphones, the
existing Wayfarer sunglasses and watch, with the same keyboard, click and drag
paths. The shared catalogue validates dropped IDs and rejects retired hat IDs.
Sunglasses still follow Head; watch follows LeftHand.

## Validation

Focused real-mesh tests check visible eye/brow/mouth deformation, unmodified base
positions and triangles, protected chin/clothing, bounded expression weights,
upright wrist presentation, refusal of downward inputs and reduced-motion reset.
Existing tests retain arm gestures, UV continuity, jaw weights, trick interruption
and resource disposal. All 43 tests, lint, TypeScript and the production build
passed. Route/SSR checks passed against the isolated production preview on 3003,
including HTTP 404 for missing pages.

Browser review covered neutral, blink, friendly, curious and surprised presets
on the actual live adapter; desktop 404 click, keyboard and native drag accessory
paths; homepage recovery, scrolling and the third chapter's headphones; and 404
at 390×844, 390×667 and 900×390. The compact error placement now measures the
accessory tray and reserves room for the speech bubble above the character.
The reviewed tab reported no console errors. Automated reduced-motion and
interruption checks passed; this is not a claim of full source parity or a new
cross-browser/WebGL-failure audit.

`friendly-headphones.png`, `blink.png` and `surprised.png` are actual renderer
captures. `live-404-headphones.png` shows the final desktop 404. The temporary
expression-review page is saved under ignored `artifacts/character/expression-check/`
and is excluded from production routes. The arm workshop remains unchanged.

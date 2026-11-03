# Connected left and right arm study

The user requested the same continuous treatment for the left arm after reviewing
[the right-arm study](../right-arm/README.md). The route remains
`/character/articulation`, defaults to **Left arm**, and has one set of controls
for the selected arm. Switching sides retains both poses; reset affects only the
selected arm. Anatomical left is on the viewer's right in front view.

## Geometry and preparation

- Runtime: `public/character/arms-continuous.glb`, one original 200,000-triangle
  mesh, one skin, seven bones: Body plus UpperArm/Forearm/Hand for each side.
- Source remains the exact decoded approved smoothed character; no cuts, caps,
  mirrored geometry, extra clothing or facial changes. Original atlas/UVs remain.
- Both sides use the right-arm pipeline's connected sleeve core, 0.055-unit
  geodesic shoulder falloff, 24 graph-smoothing passes and rigid complete hand.
  Left joint landmarks and the search region are reflected, preserving the
  original asymmetric geometry. The two arm influence regions do not overlap.
- Head, chest and waist weights are fixed to Body. An arm at rest remains fixed
  when the opposite arm moves. Each vertex has at most four nonzero influences.
- `lib/continuous-arms-study.ts` applies both poses from the bind frames in one
  update, with mirrored shoulder/elbow signs. This avoids resetting the opposite
  arm when changing a pose. Ranges remain shoulder 0–35°, elbow 0–70°, wrist ±25°.
- Packed editable source: `artifacts/character/arms/continuous-arms.blend`.
  Runtime provenance: `content/character-arms.json`.

Reproduce with the existing local Blender installation:

```sh
blender --background --disable-autoexec --python scripts/character/prepare-right-arm.py -- --both
node scripts/character/decode-runtime.cjs public/character/arms-continuous.glb artifacts/character/arms/exact-decoded.glb
```

The script invokes the existing local Draco normalizer and does not overwrite
the previous right-only export. The user subsequently approved this model for the live website.
`imported-model.ts` now keeps its arm skin, adds the existing head motion above the
collar and registers it to the shared tour. `connected-arm-motion.ts` adds bounded
arm channels to the existing gesture/trick timelines. The manual workshop remains
unchanged. There is no finger posing,
facial morphs or automatic animation. Inner-elbow cloth compression persists at
stronger bends, as in the right-arm study.

## Verification

`tests/continuous-arms-study.test.ts` decodes the real runtime skin and bind
matrices, verifies the rest surface and triangle budget, independently raises
either hand while protecting the torso/opposite arm, checks that simultaneous
poses retain joined UV seams, and confirms that geometry is never mutated.
The original right-only tests remain intact.

On 2026-11-03: TypeScript, lint, all 39 tests, production build and route checks
passed. Compressed and exact decoded GLBs validate with zero errors and warnings.
Browser checks include left bend/raised-hand/wrist controls, side switching,
independent simultaneous poses, selected-arm reset and keyboard slider input.
Responsive checks covered 390×844, 768×1024, 900×390 and 1440×1000 viewports.
No continuous-arm renderer errors were logged during these checks.
`both-arms.png` records the full character; `left-bend.png` records the left detail.

## Live integration validation

`tests/imported-character.test.ts` loads the actual decoded connected asset and
checks unchanged rest geometry/registration, visibly raised hands in both tour
directions, fixed central chest/waist, bounded tricks, swipe/drag interruption,
reduced-motion rest, a wrist-following watch and single resource disposal.
Live gestures animate complete hands; no individual finger poses are claimed.

Live integration checked on 2026-11-03: lint, TypeScript, all 39 tests, isolated
production build and HTTP route checks pass. Browser review covered desktop
scrolling in both directions, raised-hand tricks in project sections, the compact
badge, mobile/short-landscape home, tablet project navigation, and 404 accessory
toggles/recovery. No browser console errors were captured. The saved
`live-hand-animation.png` shows the connected hand during a project scene.

## Chin correction

The earlier height-only head ramp crossed the actual low chin (around source
y=.471, z=.122), pinning it partly to Body. Head weights now use the angled
under-jaw field `y + .28*z`, blended from .480 to .495. This changes only runtime
weights; source geometry, textures, rest silhouette and arm weights stay intact.
The earlier point check at y=.55 did not exercise the actual chin.

The added real-mesh regression covers over 5,000 jaw vertices through left/right
turns, forward/backward tilts and combined poses, comparing them to a rigid Head
transform. Separate collar vertices must remain fixed. On 2026-11-03 all 40 tests,
lint, TypeScript and the production build pass. Matching browser renders of the
previous/fixed weights confirm the correction; `chin-fix-comparison.png` shows
the result. The temporary comparison page is a local QA artifact, outside the
application routes.

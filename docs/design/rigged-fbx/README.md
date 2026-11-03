# Supplied full-body rig review — November 4, 2026

Inputs are preserved at the repository root:
- full_body_model_parted.fbx: 18 separate objects, 1,033,175 triangles, no UVs, skeleton or shape keys. Flat vertex colors are segmentation labels, not appearance.
- Strut Walking.fbx: one joined skinned mesh, 497,582 triangles, 65 Mixamo bones, one walking action at 30 fps. No UVs, image maps or facial shape keys.

The rigged rest surface matches the parted reference closely (median nearest-surface distance .000115 source units; maximum .00355). A BVH transfers semantic part labels to the rigged mesh's faces. Six simple materials provide warm skin, brown hair, cream clothing, dark trousers, black eyes and white eye highlights. This is a material pass, not restoration of absent texture images.

The source hair shell also contains the neck; its low region receives skin material. The collar is cream. The mouth/lips remain on the head, and the body rig has head/neck bones but no facial bones. Separate facial objects from the first FBX remain useful as guides for a future expression rig.

## Files and reproduction

Blender 4.5.9 LTS was used locally with --background --disable-autoexec --python.

1. Run scripts/character/prepare-parted-fbx.py.
2. Run scripts/character/prepare-rigged-fbx.py.
3. Run node scripts/character/normalize-skin-export.cjs public/character/rigged-walk-review.glb.
4. Run node scripts/character/decode-runtime.cjs public/character/rigged-walk-review.glb artifacts/character/rigged-fbx/exact-decoded.glb.
5. Run node scripts/character/validate-rigged-review.mjs.

The original full-density imports and palette authoring copies are under ignored artifacts/character/parted-fbx/ and artifacts/character/rigged-fbx/. The original FBXs are never overwritten. The optimized GLBs are public/character/parted-review.glb (158,991 triangles) and public/character/rigged-walk-review.glb (180,000 triangles). Local Draco compression is used.

The input can have eight vertex influences; the browser export keeps the strongest four, normalized to sum to one. The normalization script re-encodes the actual decoded weights as exact-sum integers. No animation is retargeted: the supplied clip is preserved on its own skeleton.

## Review pages

- /character/rigged: walking, pause/play, rest pose, speed, skeleton, clay/color, camera views.
- /character/parted: individual object isolation, reversible separation and a rigid head pivot test.

The walk loops in place only in the viewer's cloned animation. The downloaded GLB retains the supplied root motion. Reduced motion starts paused; hidden tabs skip animation updates. Animation mixers, scene resources, skeleton helpers, controls and loaders are disposed on navigation.

Mixamo's root joint has a rotated non-bone parent. The viewer derives each local bind transform from inverse-bind world matrices before applying preview normalization. Calling Skeleton.pose() directly here rotates the root incorrectly. The corrected rest restoration is covered by the actual-model validation script.

These are separate review routes. The portfolio still uses the approved connected-arm model; facial/controller integration of the supplied rig remains outstanding.

## Validation

- All 43 existing behavior tests passed; lint and TypeScript passed.
- The production build includes both noindex review routes.
- Five actual exported walk samples and the registered rest pose are finite and correctly scaled; the maximum sampled weight-sum error is about 4.5e-8.
- Khronos validation of the exact decoded export reports zero errors. It retains one skinned-mesh-parent warning from the supplied armature hierarchy; actual Three.js playback and registered rest restoration are checked separately.
- Reports: source-inspection.json, preparation.json, runtime-validation.json and animation-validation.json.

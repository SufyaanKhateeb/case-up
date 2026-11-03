# Continuous right-arm study

The user rejected the disconnected part study and requested only the right side,
kept as one continuous piece. The user then requested the same for the left arm;
`/character/articulation` now shows the [two-arm extension](../connected-arms/README.md).
This right-only export remains available for comparison.
Right means the character's anatomical right, on the viewer's left in front view.
The homepage still uses its existing approved mesh/adapter.

## Asset and controls

- `public/character/right-arm-continuous.glb`: one mesh, 200,000 original triangles,
  one skin, four bones (`Body`, `RightUpperArm`, `RightForearm`, `RightHand`).
- No cuts, caps, floating patches, remeshing, head/face motion or left-arm motion.
- `artifacts/character/right-arm/continuous-right-arm.blend`: packed editable
  armature and vertex groups. All supplied originals remain intact.
- `lib/right-arm-study.ts`: bind-frame-aware shoulder lift, elbow bend and wrist
  twist. Limits are 35°, 70° and ±25° respectively; no legacy Euler transfer.
- `components/character/right-arm-study.tsx`: held poses, three sliders, textured
  and clay surfaces, detail/full-character camera and front/side/back views.
  There is no autoplay. Rendering is demand-driven, DPR-capped, and disposed on
  navigation. Poster/error fallbacks and keyboard controls remain available.

## Preparation

This uses conventional linear skeletal skinning and explicit vertex groups.
Blender's [vertex-group guidance](https://docs.blender.org/manual/en/4.2/sculpt_paint/weight_paint/usage.html)
also calls for refining weights around joints rather than relying on automatic
weighting alone.

1. Decode the approved runtime using `scripts/character/decode-runtime.cjs` into
   `artifacts/character/full-model-hq/smoothed-exact-decoded.glb`.
2. Run Blender 4.5 with `--background --disable-autoexec --python
   scripts/character/prepare-right-arm.py`.
3. The script welds coincident UV vertices without changing any face-corner UV,
   preserving a single closed manifold surface. It finds the connected sleeve/
   hand core and computes a short geodesic shoulder falloff on that surface.
   This excludes nearby-looking but topologically distant sweatshirt waist
   vertices. Central chest, head and opposite side are pinned to `Body`.
4. Joint transitions receive normalized, adjacency-smoothed weights. Complete
   hand skin is pinned to the hand bone; blending happens on the cuff side.
   The editable source uses linear deformation to match Three/glTF.
5. `normalize-skin-export.cjs` checks actual decoded attributes, fixes collapsed
   tangent vectors and encodes skin weights as normalized uint16 values summing
   to exactly 65535. It uses the local bundled Draco decoder and Three's existing
   Draco encoder; no network service or additional dependency is involved.
6. `content/character-right-arm.json` records output size/hash, source hash,
   protected-vertex count and preparation method. Validate the compressed asset
   and actual decoded skin, not just the compressed wrapper.

The previous separated assets and code remain as historical experiments; they
are not rendered in this route. This is a limited right-arm deformation study,
not a complete expressive or production animation rig. Dense reconstructed cloth
can still compress at the inner elbow; further topology/corrective-shape work
would address that, while preserving continuity.

## Checks

`tests/right-arm-study.test.ts` loads the real runtime geometry, skin weights and
bind matrices. It verifies the original 200k-triangle surface/rest pose, fixed
head/chest/waist/opposite arm, an actually raised right hand, and coincident UV
vertices staying together through all poses and a wrist turn. It also verifies
that posing does not mutate geometry or triangle indices.

The adjacent validator reports cover both compressed and exact decoded GLBs.

Verified on 2026-11-03: TypeScript, lint, all 36 tests, isolated production build
and route checks pass. Both GLB validation reports have zero errors and warnings.
Browser checks covered textured bend/raised-hand poses, wrist rotation, keyboard
slider input, close-up/full-character framing and 390×844, 900×390 and 1440×1000
layouts. The waist stays fixed in the final geodesic-weight export. The front
bend capture is `continuous-bend.png`; some inner-elbow cloth compression remains.

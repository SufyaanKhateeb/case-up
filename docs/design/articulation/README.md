# Separated character study — first stage

**Historical experiment, rejected by the user.** The route now shows the
[continuous right-arm study](../right-arm/README.md). The source/assets and record
below are retained for reference; they are not the active review experience.

Review at `/character/articulation`. The homepage's mesh, adapter and animations
are deliberately unchanged. This is a preparation and joint-placement study,
not a finished skinning or facial-animation implementation.

## What is actually in the asset

`public/character/articulation-study.glb` derives from the approved smoothed
200k-triangle mesh. It has nine rigid body meshes: torso, neck, head, two upper
arms, two forearms and two hands. Nine additional named surface patches isolate
hair, eyes, eyebrows, nose, mouth, moustache and beard. The patches retain the
original geometry/atlas, including eye highlights; they are not complete facial
anatomy. In particular there are no eyelids, mouth internals, morphs or finger
joints. The source face is one continuous reconstructed surface, not prebuilt
independent eyes and lips.

Each part has a `joint_id` parent node and a `part_id` mesh node. The hierarchy is:

```
torso
├─ neck → head → facial surface patches
├─ upper_arm.L → forearm.L → hand.L
└─ upper_arm.R → forearm.R → hand.R
```

Left/right refer to the character. All exported local axes use glTF Y-up;
neutral joint rotations are identity. Shoulder pivots use anatomical landmarks,
not the centroid of an irregular cut. Joint X pitches, Y turns, Z tilts. The
head/chin are rigid: no gradient of head weights crosses the jaw.

## Method and reproduction

This uses ordinary mesh separation and object parenting to establish topology
and pivots before deformation. Blender documents [mesh splitting and
separation](https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/split.html)
and its [armature, weight-paint and shape-key toolset](https://www.blender.org/features/animation/).
Rigid separation makes structural mistakes visible without concealing them in
automatic weights. It does not guarantee seamless animation.

1. Decode the approved runtime with the bundled local decoder:

   ```sh
   node scripts/character/decode-runtime.cjs public/character/sufyaan-full-hq-smooth.glb artifacts/character/full-model-hq/smoothed-exact-decoded.glb
   ```

2. Run Blender 4.5 with `--background --disable-autoexec --python
   scripts/character/prepare-articulation.py`. The script derives all paths from
   the repository, never overwrites the source, and saves the packed editable
   `artifacts/character/articulation/separated-study.blend` before runtime export.
   It invokes the local Node tangent repair script after export.

3. The script cuts closed shoulder contours using an interpolated scalar field,
   plus transverse elbow cuts. Hands follow the actual skin-to-cuff material
   boundary so a diagonal cutting plane cannot clip the thumbs.
   New vertices remain on original triangles;
   face-corner UVs and normals interpolate across cuts. The collar boundary uses
   the skin/cloth texture distinction with topology cleanup. All original exterior
   faces belong to exactly one part; exterior area conservation is asserted.

4. Each body piece is checked as a closed manifold before facial patch extraction.
   New cap vertices prevent cap triangulation from reusing exterior edges. Caps
   have separate, untextured interior materials and are inspection geometry.
   A few tiny new UV triangles produce collapsed Blender tangents; the repair
   script examines actual decoded vectors, normalizes the affected streams and
   preserves the original compressed positions/normals/UVs/indices.

5. `content/character-articulation.json` records identifiers, pivots, provenance,
   hashes and surface conservation. A copy lives in `preparation.json`. Validate
   both the compressed file and its exact decoded copy: a validator cannot check
   vertex values hidden inside Draco streams.

## What to review in the demo

- Neutral against the original textured model: likeness, chin and clothing.
- Part colors and explosion: ownership, neckline, shoulder, elbow and cuff cuts.
- Head turn/look down: chin stays with head; face patches follow it together.
- Hand raised/open arms/wrist turn: joint directions and parent/child motion.
- Per-part X/Y/Z controls, isolated meshes, axes and front/side/back cameras.
- Face explosion: which patches can be extracted, and where moving anatomy must
  be rebuilt. Surface patches must not be advertised as blinking/speaking controls.

Joint gaps and intersections in rigid poses are expected. These cuts are a
reviewable segmentation baseline, not approved production seam topology.
The dense reconstructed shoulder/armpit surfaces are asymmetric. Their boundaries
need review in side/back views before a deformation rig is accepted.

## Next stage, after reviewing the separation

Create a conventional rest-pose armature and explicit vertex groups from these
regions. Keep the head/jaw rigid. Blend the neck below the jaw; restrict arm
weights to the sleeve and shoulder joint region. Rebuild short, clean joint loops
around shoulders/elbows/wrists and add corrective shapes where bending collapses
the fabric. The capped cut surfaces are diagnostic, not a substitute for continuous
deformable clothing topology. Test held extremes before adding timelines.

Reconstruct independent eyes/eyelids and mouth topology before authoring blink,
smile or speech shape keys. Preserve the source neutral likeness. Integrate the
reviewed rig into the site's motion controller only after these pose checks pass;
do not transfer the old procedural rig's Euler angles blindly.

The browser renderer is demand-driven, caps DPR at 1.5, has keyboard-accessible
controls, supports orbit/zoom, pauses when hidden, provides a poster/error fallback
and disposes owned materials, helpers, decoded assets and workers on navigation.
There is no autoplay, sound or connection to the scroll director.

# Hunyuan character study

The current live website uses the [connected-arm derivative](../connected-arms/README.md)
selected by `content/character.ts`. The notes below record the earlier smoothed
source and the intermediate rigid-arm adapter; source exports remain unchanged.

## Approved smoothed source and earlier live adapter

The user approved the gently smoothed high-quality model for the website.
`public/character/sufyaan-full-hq-smooth.glb` supplied the shared live scene before
the connected-arm derivative. It remains the default unrigged inspection model. The unsmoothed
high-quality version remains selectable for comparison.

Five alternating positive/negative smoothing passes are applied to the welded
1.5-million-triangle mesh before a separate 200k runtime export. Mean source
vertex displacement is 0.0001002 model units and maximum displacement is
0.001406, for a 0.916-unit-tall character. No UV face corners are changed by
smoothing. Packed 4K source textures and the full-density smoothed mesh remain
in `artifacts/character/full-model-hq/sufyaan-full-hq-smooth.blend`.
The runtime file is 4,700,924 bytes with 4K WebP maps and explicit tangents.
Use the high-quality command below with `--smooth-iterations 5` and the
`sufyaan-full-hq-smooth` output/report/authoring filenames to reproduce it.

The intermediate live adapter used a simple three-bone body/neck/head skin. The initial
automatic arm transfer was removed after it distorted the sweatshirt. Arms,
cuffs and clothing remain in the modeled pose, while the existing controller
drives head and whole-character motion. The hat was lowered and leveled to sit
on the forehead. It preserves the rest silhouette and refits sunglasses, hat and watch
mounts. The existing tour, badge camera, drag priorities, root-based tricks and
reduced-motion behavior remain. Eyes, brows, mouth and individual fingers keep
their approved authored shapes; no facial morphs or finger articulation are
claimed. The inspection page remains an unrigged view of the source export.

The exact Draco-decoded smoothed data validates with zero errors or warnings;
its only informational message identifies the unused compressed buffer retained
by the diagnostic copy. The runtime report likewise has no errors or warnings
and notes the validator's unsupported Draco extension. These local reports are
`full-model-hq-smooth-{runtime,decoded}-validation.json`. The historical
unsmoothed re-export diagnostic has tangent edge cases and is retained as a
diagnostic record, not as evidence for the approved smoothed export.

`public/character/smoothed-poster.png` is the matching transparent loading and
WebGL-failure fallback. Re-export through `/character/hunyuan?poster`, whose
download link exposes a 512px render with the same camera framing and lights.

Live integration verification: lint, TypeScript, production build and all 29
behavior tests pass. The added tests check normalized/mirrored skin weights,
unchanged bind-pose silhouette, stable arms/cuffs/clothing across gestures,
finite deformations across all tricks, and one-time skeleton/material disposal.
Production HTTP checks cover portfolio/project/error routes, the approved GLB,
the local decoder and the matching poster. Browser checks cover the opening,
project tour, sharp work badge, dragging, dance, project detail and fitted 404
accessories, with no console errors. Layouts were also checked in a sized iframe
at 1440×900, 900×390 and 390×844. This is not a claim of facial-animation parity
or a hardware performance certification.

## Higher-quality full character — current source

The latest source is `generated_full_high_quality.glb`: 78,577,808 bytes,
1,500,000 triangles, three embedded 4K PBR maps and no skeleton, animation clips
or facial morphs. The original file remains unchanged. `full-model-hq.json`
records its source hash and all conversion measurements.

`public/character/sufyaan-full-hq.glb` is the unsmoothed comparison model: 200,000
triangles and 4K quality-95 WebP maps, approximately 4.71 MB. It retains the
improved source detail without applying the lower-resolution model's smoothing.
Full-density welded geometry and packed original 4K textures are preserved in
`artifacts/character/full-model-hq/sufyaan-full-hq-clean.blend` before runtime
decimation. The former 50k full character remains available as "Previous full ·
50k"; all prior source and runtime files remain intact.

Cleanup joins 96,098 coincident seam vertices without changing source UV face
corners. The high-density authoring model has one closed manifold component,
zero degenerate/duplicate faces, finite positions and no inconsistent winding.
No holes, fragments or inverted faces needed repair. Runtime decimation changes
surface sampling and interpolates the existing atlas UVs; it does not repack
textures. Explicit tangents and local Draco compression are retained.

```sh
blender -b --disable-autoexec --python scripts/character/clean-textured-model.py -- \
  --input generated_full_high_quality.glb \
  --output public/character/sufyaan-full-hq.glb \
  --report docs/design/hunyuan/full-model-hq.json \
  --authoring artifacts/character/full-model-hq/sufyaan-full-hq-clean.blend \
  --smooth-iterations 0 --faces 200000 --texture-size 4096
```

Use this higher-density authoring copy for future sculpting and rigging. Do not
substitute the 50k mesh or apply smoothing by default. Runtime copies can be
regenerated at other budgets after comparing the face, hair and fingers.

## Full character with arms

The latest supplied file is `generated_full.glb`, 33,066,680 bytes, with 50,000
triangles, one material, three embedded 4K PBR maps, and no skeleton, animation
clips or facial morphs. The original remains untouched. Its source hash and
cleanup measurements are in `full-model.json`.

The previous full model is `public/character/sufyaan-full.glb`, compared with
the complete-arm references in `../character-with-arms/`. The previous bust and
geometry studies are still selectable. Front, three-quarter, both profile and
back camera controls, plus textured/clay/wireframe modes, support inspection.

Cleanup joins 8,338 coincident UV-seam vertices into one closed manifold surface
in the authoring mesh. These were atlas splits, not floating fragments. It
retains all 50,000 triangles and every UV face corner. Three gentle alternating
smoothing passes reduce generated ridges (mean vertex displacement 0.00043 model
units, maximum 0.00538, for a 0.9174-unit-tall model). Normals were checked;
no inverted faces needed reversing. The closed surface uses back-face culling.
No remeshing, decimation, hole filling, or island deletion was needed.

The runtime export is 1,360,796 bytes (approximately 96% smaller), with embedded
2K quality-95 WebP PBR maps, explicit tangent vectors and Draco compression.
Exporting UV and normal seams splits some vertex records again as required by
glTF; it does not mean the surface has become disconnected. Local authoring file
`artifacts/character/full-model/sufyaan-full-clean.blend` retains the packed 4K
textures and welded geometry for further work. The unsmoothed candidate is also
preserved locally for comparison.

```sh
blender -b --disable-autoexec --python scripts/character/clean-textured-model.py -- \
  --input generated_full.glb \
  --output public/character/sufyaan-full.glb \
  --report docs/design/hunyuan/full-model.json \
  --authoring artifacts/character/full-model/sufyaan-full-clean.blend
```

Use `--smooth-iterations 0` for the welded but unsmoothed version. The cleaner
refuses rigged assets, changed UV corners, unexpected degenerates or duplicate
faces, and an output path that would overwrite the input.

The source validator report has one warning about missing tangent vectors.
The cleaned export fixes it: zero errors and warnings, with informational
messages for Draco (the validator cannot decode that extension) and its buffer.
`full-model-roundtrip.json` records a separate Blender decode/import topology
check; the decoded copy is validated separately to cover the actual accessor
data. Validation runs locally; the model was not uploaded to a service.
Reports are adjacent to this file. The Khronos validator is an optional local
inspection tool, not a new application dependency.

The decoded validation copy reports zero errors, warnings, informational
messages or hints. Blender's compressed round trip preserves 50,000 triangles,
finite positions and UVs, zero degenerate faces and a closed manifold surface.
The project passes lint, TypeScript, all 25 behavior tests and the production
build. Production route checks include the new GLB's size, triangle count,
embedded PBR maps, WebP and local Draco decoding assets. Browser review covers
front, both profiles, three-quarter, back, clay and wireframe at the available
desktop/narrow layouts; no browser console errors or warnings were recorded.
This is a static-model inspection, not an animation or device performance
certification. `full-model-preview.png` records the textured three-quarter view.

Some generated shaping around the eyebrows, mouth and cuffs remains. Cleanup
does not reconstruct a smooth production face or animation topology. A closed
triangle mesh is not a deformation-ready rig: facial controls and arm/hand
skinning remain necessary before integrating this asset with the guide's
gestures. It remains in the isolated study rather than replacing the homepage
guide.

## Supplied textured model

The user previously supplied `generated_model.glb`. This remains available as
"Previous bust" in the comparison page. The original remains unchanged in the repository
root (not copied to `public/`). Its generator provenance is not inferred from
the filename. `supplied-model.json` records its hash and conversion details.

The source has 1,500,002 triangles, three embedded 4K PNG PBR maps and no skeleton,
animation clips or morph targets. `scripts/character/prepare-supplied-model.py`
retains the UVs and PBR material connections while making a 100,000-triangle
derivative with 2K WebP maps at quality 95 and Draco-compressed geometry. The
runtime file is approximately 1.8 MB instead of the original 78.8 MB. The
lossless 2K PNG derivative is retained locally in
`artifacts/character/supplied-model/textured-png.glb` for comparison.

```sh
blender -b --disable-autoexec --python scripts/character/prepare-supplied-model.py -- \
  --input generated_model.glb
```

The shared asset loader uses a bundled local WASM decoder with one worker;
no remote model service, texture URL or decoder CDN is required. The existing
animated guide remains active on portfolio routes until this unrigged bust has
been given appropriate head/body and facial controls. Imported color textures
alone cannot drive the current blink, smile, mouth and hand animation APIs.

The restrictions documented for the earlier Hunyuan studies are not assumed to
describe this supplied asset's provenance or license.

## Earlier geometry studies

The user approved the color concept, uploading its isolated reference to
Tencent's Hunyuan3D-2.1 demo, then producing a turnaround and uploading all four
views to the separate Hunyuan3D-2mv demo. This is an asset study, separate from
the live portfolio character. The meshes have no skeleton, facial morphs or
color textures and must not be presented as the finished animated character.

## References

`character-reference.png` isolates the color panel of
`../character-msk-concept.png`. `front.png`, `left.png`, `right.png`, and `back.png`
are AI-generated turnaround interpretations of that same character. The side
and back geometry is inferred, rather than recovered from an original 3D file.
All were produced with the built-in image-generation tool. The invariant prompt
set is recorded in `prompts.md`.

## Actual generations

- Hunyuan3D-2.1: one image, 30 steps, seed 1234, octree 256. Raw mesh:
  379,304 triangles. Clean inspection export: approximately 80,000 triangles.
- Hunyuan3D-2mv Turbo: four views, 5 steps, seed 1234, octree 256. The raw export
  contains 742,744 triangles including 348,471 duplicates. The cleaner removes
  duplicate/degenerate faces and small disconnected fragments, recalculates
  normals, and simplifies to approximately 80,000 triangles.
- The 2.1 textured request was rejected by the free hosted GPU limit: it asked
  for 270 seconds. No textured model was generated and no subscription was bought.

The exact served models, reference hashes, parameters, timings and mesh counts
are recorded in the adjacent generation JSON files. Original exports and cached
downloads remain locally in `artifacts/character/` (ignored by git); optimized
inspection GLBs are under `public/character/`.

The local comparison is `/character/hunyuan`. It supports switching model,
reference image and camera angle, plus dragging/zooming and downloading the
mesh. The portfolio's animated guide is hidden on this inspection page.

## Reproducing

Use a separate Python environment, not the Next.js dependencies:

```sh
python3 -m venv /tmp/case-up-hunyuan-client
/tmp/case-up-hunyuan-client/bin/pip install gradio_client==2.7.2
/tmp/case-up-hunyuan-client/bin/python scripts/character/generate-hunyuan.py \
  --multiview docs/design/hunyuan --output artifacts/character/new-multiview
blender -b --disable-autoexec --python scripts/character/optimize-hunyuan.py -- \
  --input artifacts/character/new-multiview/shape.glb \
  --output public/character/hunyuan-multiview-study.glb
```

The generation command uploads the selected images to the named Tencent
Hugging Face Space. It writes a manifest and refuses to overwrite an existing
generation. Hosted free quotas and availability can change. The cleaner operates
only on untextured, unrigged geometry and preserves the raw input.

Hunyuan3D-2.1's demo exposes multi-view arguments in its API, but ignores them
unless the actual model is an `mv` checkpoint. Do not send a collage or claim
that 2.1 performed four-view reconstruction. The multi-view geometry here was
generated by `tencent/Hunyuan3D-2mv/hunyuan3d-dit-v2-mv-turbo`.

## Integration still required

Evaluate the mesh silhouettes against all references; repair remaining surface
defects; produce suitable topology, UVs and color/PBR textures; separate facial
features and add blink/smile/mouth controls. Adapt the existing guide's head
pivot, body/hand poses and accessory mounts to the approved asset, retain loading
and WebGL fallbacks, and profile rendering cost. A generated static bust does
not replace the current expression/interaction controller by itself.

Keep this as a local study pending the deployment decision. The Hunyuan community
licenses include territorial restrictions, including on output display, affecting
use in the EU, UK and South Korea. Do not describe these assets as unrestricted
CC0 or deploy them worldwide without resolving that restriction. The model
weights and upstream generator code are not bundled in this repository.

Primary sources:

- [Hunyuan3D-2.1](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1)
- [2.1 demo source and MV_MODE logic](https://huggingface.co/spaces/tencent/Hunyuan3D-2.1/blob/main/gradio_app.py)
- [Hunyuan3D-2mv model](https://huggingface.co/tencent/Hunyuan3D-2mv)
- [2mv hosted demo](https://huggingface.co/spaces/tencent/Hunyuan3D-2mv)
- [2.1 license](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE)
- [2mv license](https://huggingface.co/tencent/Hunyuan3D-2mv/blob/main/LICENSE)

## Validation

The Next.js production build, lint, TypeScript and 25 focused behavior tests
passed. Production HTTP checks cover existing portfolio routes plus the study's
SSR content, noindex metadata, hidden guide and both valid optimized GLB files.
Browser review covered reference/model switching and front, three-quarter and
back views at the available narrow viewport, with no console errors. Desktop
parity, finished likeness, animation and textured rendering are not claimed.
`model-study-preview.png` shows the actual browser-rendered study.
`supplied-model-preview.png` shows the user's textured asset after optimization.
Its color, normal and packed roughness/metallic maps and local WASM decoder were
verified in the production route checks. Front/rear rendering and switching
between textured and untextured models were checked in the browser with no
console errors. Shared decoded ImageBitmaps are explicitly closed on teardown.

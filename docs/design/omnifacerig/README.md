# OmniFaceRig availability and asset audit — November 4, 2026

The user requested **OmniFaceRig only**, including a proper inner mouth, for the
next facial-rig experiment. This supersedes the unfinished hand-authored laugh
prototype. The user confirmed they do not have a private fitter, service or
OmniFaceRig-rigged export.

## What the official release provides

- [Project and paper](https://omnifacerig.github.io/): describes automatic face
  registration, inner-mouth construction and FACS blendshape transfer.
- [Official repository](https://github.com/facebookresearch/omnifacerig): a dataset
  of rigged characters, canonical templates, metadata and dataset-validation code.
- The complete release tree was inspected through GitHub's recursive tree API.
  `official-release-tree.json` records tree SHA
  `5bf4f805a2d8808baf58187e27dce2fb2e1c6c0f`.
- Its only Python files are `scripts/validate_release.py` and
  `tests/test_validate_release.py`. Neither is a character-rigging entry point.
  There are no released fitting modules, inference weights or custom-model upload
  service linked from the official project page. A separate web search did not
  locate a runnable official pipeline.

The paper's automatic pipeline and the released dataset are different things.
Downloading a rigged example does not run OmniFaceRig on the supplied model.
Transferring a donor's shapes without the original registration and mouth-fitting
stages would be a different implementation and must not be represented as an
OmniFaceRig-generated custom rig.

## Inspected official artifact

Only one example and its corresponding source were downloaded, rather than the
24 GB dataset. Files are under ignored `artifacts/character/omnifacerig/release/`:

- `007_rig.glb`: https://omnifacerig.github.io/dataset_viewer/007_rig.glb
- `007_orig.glb`: https://omnifacerig.github.io/dataset_viewer/007_orig.glb
- `007_body.png`: https://omnifacerig.github.io/dataset_viewer/007_body.png

The rig contains 20,999 vertices, 33,957 triangles, 155 named facial blendshapes,
an embedded texture and a 3.458-second native animation. Jaw, lip-corner, cheek and
eye-closure controls are present and deform vertices. The official project
describes its exported rigs as including teeth, gums and tongue; these components
are fused into this example's single textured mesh, rather than separate named
objects. No claim is made that a mouth interior has been fitted to Sufyaan's model.

`node scripts/character/inspect-omnifacerig.mjs` decodes the original Meshopt sample
with Three.js, checks every facial delta for finite values, verifies required
laugh channels and samples four points of the native animation. Geometry tests
omit texture loading explicitly. `sample-inspection.json` stores the exact asset
SHA-256 digests, geometry, control names, displacements and sampled bounds.
This is a geometry/runtime audit, not a visual fit or collision certification.

## Licensing and isolation

The official repository uses the
[FAIR Noncommercial Research License v1](https://github.com/facebookresearch/omnifacerig/blob/main/LICENSE).
Section 1.b.i restricts both the materials and their outputs/results to
noncommercial research. This does not establish permission to use them in a
portfolio that advertises freelance services. A copy is retained at
`artifacts/character/omnifacerig/LICENSE.txt`.

Keep these artifacts in local research storage. Do not copy them into `public/`,
deploy them with the portfolio, or replace the approved live character with the
donor. The user's models have not been uploaded to a third party.

## Current blocker and resumption

The custom facial-rig integration remains **incomplete**. It requires access to
the original OmniFaceRig fitter or an actual OmniFaceRig-generated FBX/GLB of the
user's character. Portfolio use also requires appropriate rights for those
materials/outputs. No alternate manual or FACS-only rig is authorized as a
substitute for this request.

When an appropriate custom output becomes available:

1. Preserve the source and record its generation provenance and rights.
2. Inspect its neutral face, mouth bag, upper/lower teeth, gums and tongue.
3. Check supplied jaw/smile/cheek/eyelid shapes in combination and test lip/teeth
   intersections before introducing a laugh timeline.
4. Integrate in a separate workshop first; preserve the body/hand rig, hair and
   approved likeness. Only replace the portfolio character after visual review.

The superseded manual experiment was moved out of `public/`, `content/`, active
scripts and design docs into
`artifacts/character/laugh-study/manual-prototype/`. It is not OmniFaceRig output.
The current live character and existing body-rig review pages were not changed by
this audit.

# Sufyaan — upper-body character with arms

Five transparent PNG concept references, generated with the built-in image-generation tool on 2026-11-02. The approved bust in `../hunyuan/front.png` supplied the identity; the new front supplied the master for the other views. Original references and the supplied GLB are preserved.

| File | View / purpose |
| --- | --- |
| `front.png` | Primary identity, proportions, five-digit hands, sweatshirt and chest emblem |
| `left-profile.png` | Nose faces image left; side depth and edge-on wrist |
| `right-profile.png` | Nose faces image right; opposite side depth and edge-on wrist |
| `back.png` | Rear hair, plain sweatshirt back and arm separation |
| `three-quarter.png` | Supplemental likeness and volume reference |

Names describe the direction on the image, not an anatomical side. Each PNG is a single upper-body character on transparent background, including waist hem, long sleeves, ribbed cuffs and complete hands. No legs, glasses, hat or bow tie are included. Arms are held away from the torso in an A-pose, with almost straight elbows and open hands. The shooting star belongs only on the wearer's left chest.

## Model generation

Use `front.png` as the primary reference. For tools with multiple image slots, assign front/back/profile images by their visible camera direction. Use the three-quarter image as supplementary guidance if supported; do not upload the ZIP as an image or combine these into one tiled input.

These are generated design references, rather than exact camera renders of one mesh. Small differences remain in hair details, fabric folds and hand silhouette. Prioritize the front for likeness, proportions and emblem placement. The side hands are deliberately edge-on; fingers overlap in projection rather than being missing.

Request a complete upper-body mesh with naturally attached arms, separated fingers and embedded color/PBR textures. Keep the A-pose and visible gaps around the arms and between fingers. Export GLB with textures embedded. If the generator offers a skeleton, include shoulder, elbow, wrist and finger joints, but an unrigged mesh can also be supplied for later rigging. A generated mesh still needs inspection and rigging before its arms can perform the website's gestures.

## Provenance

`prompts.json` records the master, turnaround prompts and targeted refinements used with the built-in tool. Side-view drafts were preserved in the local ignored `artifacts/character/arms-reference-drafts/` directory. The interrupted procedural-arm experiment was archived separately, and the existing textured preview remains active.

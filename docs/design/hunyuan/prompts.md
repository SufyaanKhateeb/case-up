# Reference prompt set

Created with the built-in image-generation tool, using the approved concept as
the edit target. The original concept is `../character-msk-concept.png`.

## Shared identity and constraints

The same Sufyaan stylized 3D bust: large slightly elongated head, warm medium
brown skin, black vertical oval eyes with small white glints, thick rounded dark
brows, integrated long rounded nose, separated small moustache, short pointed
chin beard, friendly small closed-mouth smile, dark brown swept-up flowing quiff
with fine strands and cropped sides, cream relaxed crew-neck sweatshirt with
ribbed collar and a black shooting star only on the wearer's left front chest.
No glasses, hat or bow tie. Preserve the face/head/shoulder proportions, material
colors and studio rendering. Single centered bust on a genuinely transparent
background. No labels, panels, extra characters, floating pixels, watermark or
external shadows. Complete hair near 4% image height and flat bust crop near 96%.

## Isolation

Use case: background-extraction. From the original two-panel concept, preserve
the LEFT full-color character alone. Remove the blue background and entire
right monochrome panel. Keep the same near-front three-quarter camera angle,
likeness, facial proportions, hair, expression, clothing and emblem. Center it
with transparent padding, showing the whole hair, ears, neck and shoulders.

Saved as `character-reference.png`.

## Front

Use case: identity-preserve. Edit the isolated approved character. Change only
the camera angle: rotate this SAME exact 3D character to face directly forward,
head upright with both ears equally visible and both eyes symmetric in apparent
width. Orthographic eye-level camera; no head tilt, body twist or perspective
distortion. Preserve every shared identity constraint and the original small
closed-mouth smile, bust crop and shoulder/head ratio.

Saved as `front.png`.

## Left

Use case: identity-preserve. Inputs: frontal reference plus isolated concept.
Rotate the SAME entire bust exactly 90 degrees into full profile, nose pointing
toward IMAGE LEFT, only one eye visible. Keep the same eye-level orthographic
scale and vertical extent. Maintain the original rounded rear skull volume,
hair sweep, ear position, jaw, modest nose projection and neck proportions.
No body/head twist or enlarged nose. Preserve the shared identity and lighting.

Saved as `left.png`.

## Right

Use case: identity-preserve. Inputs: frontal reference and generated first side.
Produce the OPPOSITE strict 90-degree profile, nose pointing toward IMAGE RIGHT,
only one eye visible. Match the first side's skull, nose, ear and neck depth,
scale and crop. Preserve the quiff's natural asymmetry. Do not mirror the chest
emblem onto the other side: omit it if hidden. Preserve all shared constraints.

Saved as `right.png`.

## Back

Use case: identity-preserve. Inputs: frontal reference and generated first side.
Rotate this EXACT same entire bust 180 degrees directly away from the camera.
Show the back of the head and sweatshirt, with both ears equally visible.
No face, eyes, eyebrows, moustache or beard visible in this rear angle. Rounded
rear skull, cropped dark brown nape and sides, strand texture, taller flowing
quiff at the crown consistent with the other views. No long hair or bun. Plain
cream sweatshirt back with ribbed collar and NO chest logo on its back. Match
the original head/body proportions, scale, crop, lighting and other constraints.

Saved as `back.png`.

These are a consistent design interpretation, not guaranteed camera views from
one underlying 3D scene. Compare the generated mesh against all views before
building the animation rig.

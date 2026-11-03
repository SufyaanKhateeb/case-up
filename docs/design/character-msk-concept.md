# Sufyaan likeness concept

Generated with the built-in imagegen tool on November 1, 2026.
Preview: `character-msk-concept.png`. This is a raster concept, not a finished
Three.js model or animation. The user approved the left color panel; it is now
adapted to the live procedural model and matching fallback.

Inputs:

1. `public/msk_cartoon.png` restored from content-test: identity reference.
2. `public/character/poster.png`: current mascot proportions and sweatshirt style.

Final prompt:

Use case: stylized-concept. Create a polished, wide TWO-PANEL CHARACTER DESIGN
MOCKUP for Sufyaan's software engineering portfolio. Image 1 is the IDENTITY
REFERENCE: preserve that illustrated man's distinctive dark swept-up wavy quiff
with cropped sides (not a round mass of curls), thick straight expressive brows,
long curved nose, warm medium-brown skin, light separated moustache and small
chin/jaw beard (not a full thick beard), gentle confident closed-mouth smile,
and slightly elongated face. Image 2 is the EXISTING WEBSITE MASCOT STYLE reference
only: oversized playful head, compact rounded 3D body, simple expressive vertical
black eyes, toy-like sculpted geometry. Adapt the person in image 1 to this mascot
style. Keep likeness cues from image 1 visibly recognizable. Outfit is our approved
relaxed light crew-neck sweatshirt with defined neckline, soft shoulders and a
small black shooting-star/arrow emblem on the wearer's left chest: four-point star
with a long thin point shooting diagonally upward right. No bow tie, no jacket,
no hat, no glasses covering the main faces. BOTH panels show the exact same new
character from head to mid torso in a relaxed friendly neutral pose; LEFT is a
clean softly shaded 3D character in natural colors; RIGHT is the same sculpted
character in monochrome black/off-white with a finely ordered halftone dither,
like the portfolio's print renderer. The dither must preserve the nose, brows and
lighter facial hair clearly. Both on a clean solid blue #365de6 background,
generous margins, simple restrained presentation, no text, no UI, no props, no
watermark. Preserve an oversized head but make it a little less round than image 2,
and let the hair and facial-hair differences carry the identity. This is a concept
portrait only, not a website screenshot and not a rig.

## Implementation

The existing code-native rig now carries the swept locks, cropped sides, taller
face, longer nose, thicker brows, separate moustache and chin beard. Cream fabric
and warm skin render in full color through an antialiased transparent composite.
Expressions, arm pivots, sunglasses, controller priority, crisp compact rendering
and pointer-event behavior remain intact. The raster is a design reference; the
site renders actual animated geometry. The matching fallback was exported from
the final rig with enough room for the raised quiff.

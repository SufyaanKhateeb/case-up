# Mobile UI fixes on backup-reimplementation

## Behavior

- Preserve the original torso and large, bottom-anchored mobile composition,
  including the existing hand animations and desktop tour placements.
- Size the fixed character overlay with `100dvh` and measure its client size so
  the canvas and tour coordinates agree as the viewport height changes.
- Keep mobile narration beside the character. Update each bubble tail's edge and
  position from the current head coordinates while scrolling or dragging.
- Compact the phone header and footer, preserve 44px footer link targets, and move
  the project sound control away from narration.
- Scroll Get in touch to the document end and focus the contact landmark, with
  reduced-motion support. Font loading does not replay a newly clicked hash.

## Verification

- All 23 behavior tests and a clean production build (including lint and TypeScript)
  pass. The clean snapshot excludes unrelated untracked character experiments
  whose imports belong to another branch.
- The geometry regression checks the bottom-cropped composition at 320×568,
  393×852 (iPhone 15 Pro) and 430×932.
- Browser review covers mobile scrolling, arrow tracking, viewport height changes,
  footer link access, contact scroll/focus, and desktop layout. Earlier route
  checks passed for the homepage, projects, résumés, assets and 404s.
- Testing uses emulated viewports; physical iOS/Android browser chrome remains
  unverified.

Latest screenshots:

- `iphone15pro-bottom-anchored.png`
- `bubble-arrow-after.png`

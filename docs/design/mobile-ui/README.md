# Mobile UI fixes on backup-reimplementation

## Behavior

- Preserve the original torso and large, bottom-anchored mobile composition,
  including the existing hand animations and desktop tour placements.
- On phones/touch devices use a stable `100lvh` render surface fixed to the bottom.
  Browser toolbar animation moves the layer instead of resizing the camera and
  re-scaling the character. Desktop retains `100dvh`. Disable R3F's debounced scroll
  measurement (`resize={{ scroll: false, debounce: 0 }}`); actual resizes still
  update through ResizeObserver. Tour coordinates use the surface's client size,
  while pointer tracking and chapter arrows account for its viewport origin.
- Keep mobile narration beside the character. Update each bubble tail's edge and
  position from the current head coordinates while scrolling or dragging.
- Keep mobile project headings opposite the character and place sound controls
  on the character's side. Reserve the opening headline/header and footer controls
  from speech overlays; the footer bubble sits beside the head.
- Compact the phone header and footer, preserve 44px footer link targets, and move
  the project sound control away from narration.
- Scroll Get in touch to the document end and focus the contact landmark, with
  reduced-motion support. Font loading does not replay a newly clicked hash.
- Keep chapter headings in normal flow and fit device previews into the remaining
  stage height. Wrapped titles and project buttons must clear the browser frame.

## Verification

- All 45 behavior tests and a clean production build (including lint and TypeScript)
  pass. The clean snapshot excludes unrelated untracked character experiments
  whose imports belong to another branch.
- The geometry regression checks the bottom-cropped composition at 320×568,
  393×852 (iPhone 15 Pro) and 430×932 through repeated 112px toolbar expansion and
  collapse, keeping the render surface stable while its viewport origin moves.
- Browser review covers mobile scrolling, arrow tracking, viewport height changes,
  footer link access, contact scroll/focus, and desktop layout. Earlier route
  checks passed for the homepage, projects, résumés, assets and 404s.
- Testing uses emulated resizes and geometry regressions; these cannot reproduce
  real toolbar/compositor animation. Physical iOS/Android verification remains
  necessary for the reported first downward scroll and up/down reversal.

Latest screenshots:

- `chapter-heading-clearance.jpg` (wrapped chat heading clears the preview at
  1024×640; clearance also checked at 393×852, 768×1024 and 844×390)
- `iphone15pro-bottom-anchored.png`
- `bubble-arrow-after.png`
- `idle-character.png` (20-second doze)
- `ambient-contact.png` (footer clearance)
- `continuous-bubble-tail.png` (current continuously aimed mobile footer tail)

## Ambient interaction review

The local production preview demonstrates the 20-second idle/doze and input-driven
wake, word reveal sounds, Lenis wheel/anchor smoothing, and dialog scroll locking.
Away-title policy and restoration of route metadata are covered by a unit test;
the embedded browser does not reproduce a normal tab visibility/focus lifecycle.
Phone (393×852 and 320×568), portrait tablet (768×1024), desktop and short landscape
(844×390) layouts were reviewed. The footer reaches the document end and its
speech bubble clears the social links, copyright, trick button and back-to-top.

The interaction follow-up checks elastic mouse pickup/release, continuously aimed
hero/contact/chapter tails, and wheel scrolling over the chat scratch display at
393×852. Vertical touch gesture selection, soft drag limits, corner continuity,
and pending audio activation/mute behavior have regression coverage. Production
route checks pass, and the reviewed preview reports no console errors. Actual
phone long-press and browser autoplay policy still require device verification.

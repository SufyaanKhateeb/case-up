# Design baseline and QA

## Reference

Reference: https://www.sebg.ch/, inspected live on November 1, 2026.
This is an authored implementation in the existing repository. At the user’s
request, the character geometry and animation structure were reconstructed from
the public reference implementation; see `CHARACTER-REFERENCE.md`. Project
screenshots and recordings remain local placeholders.

Observed design system:

- Funnel Display variable type, tight heading tracking and line height, strong
  weight contrast inside large headlines.
- Blue opening/error scenes; off-white biography/work collection; navy, lilac,
  and yellow featured chapters; near-black contact section.
- Subtle vertical grid, generous gutters, rounded cream controls, offset dark
  shadows, monochrome ordered-dither character, and dotted image transitions.
- Long scroll chapters with desktop/phone compositions and changing narration.
- Case-study routes with metadata, media, written sections, and next-project links.
- Muted sound control, character trick menu, and an accessory game on `/404`.

Implementation tokens are in `app/globals.css`; stage narrative and content are
in `content/portfolio.ts`. Main breakpoints are 600, 900, and 1000 pixels, with a
separate short-landscape treatment. Placeholder artwork is original CSS geometry.

The first implementation could only capture a native 488 × 755 reference. During
the landscape revision, the reference was successfully inspected at 1440 × 900,
including its measured head/section anchors and scrolling narration. Exact visual
parity at all remaining reference widths is still unverified.

## Implemented checklist

- [x] Local font, identity/title, grid, opening, biography, featured chapters.
- [x] Shared HTML narration and lazy WebGL guide with local fallback poster.
- [x] Reference procedural rig, post-lighting dither, idle/blink and eleven actions.
- [x] Pointer capture and keyboard character movement with controller priority.
- [x] Native scroll/sticky stages, reverse-scroll chapter selection, GSAP reveals.
- [x] Comparison slider, scratch surface with hint/reveal/reset, viewport switching.
- [x] Work grid, static case studies, next-project cycle, true unknown-route 404s.
- [x] Email/copy feedback, saved sound/visit preferences, native trick dialog.
- [x] Three toggled/drag-target accessories, with keyboard/tap equivalents.
- [x] Reduced-motion CSS/runtime behavior, visibility-based renderer pause.
- [x] Reference appearance, articulated hands, dynamic expressions, matching poster.
- [ ] Final project media, project-specific narration/demonstrations, and copy.
- [ ] Exact cross-viewport reference comparison and final motion/fidelity review.

## Validation

Production build compiles, checks types/lint, and generates all three case studies.
The old `document is not defined` prerender failure is resolved. The unused old
loader and its lint warning have been removed.

Focused behavior tests cover drag/trick priority, stale timeouts, tour
resumption, all action transitions, reversible chapter steps, scratch area
thresholds, denied storage, static route identity, and placeholder safeguards.

The HTTP smoke check covers seven paths: homepage and all three project pages
return 200; `/404`, an arbitrary missing URL, and an unknown project return 404
with usable error content in server-rendered HTML. Unknown project parameters
are explicitly disabled so their response does not depend on hydration.

Browser checks performed:

- Homepage at 390 × 844, 768 × 1024, 1440 × 900, and 844 × 390.
- No horizontal document overflow at the inspected mobile/tablet/desktop widths.
- Actual pointer scratch strokes crossed the area threshold and revealed the art.
- Character pointer drag and keyboard movement/reset were exercised.
- Mobile featured layouts, hint/reveal, viewport switching, case-study layout,
  404 accessory toggles, and home recovery.
- All eleven trick controls update the guide; native dialog focus/close behavior.
- Email-copy confirmation and sound toggle. The preference persisted on navigation.
- WebGL rig loads and remains shared through routes; compact framing was corrected.
- Short-landscape heading/guide overlap was corrected.

Still requiring dedicated device/asset QA: touch long-press feel, reduced-motion
preference emulation, forced WebGL loss,
slow/failed scene loading and sustained mobile frame rate. These paths are implemented but were not all exercised through the
available browser controls. Audio was toggled; its subjective quality was not
audited. The current simple synthesized effects are not a recreation of the
reference’s full sound design.

Before release, repeat these checks against real media, long titles, approved
copy, and compare both visual composition and motion.

Final production captures were saved at `/tmp/case-up-qa/home-390.png`,
`/tmp/case-up-qa/home-768.png`, and `/tmp/case-up-qa/project-1440.png` in this session.
The desktop homepage preview is also saved in the task’s visualization directory
as `portfolio-preview.png`. Direct hash-link restoration after a full reload was
verified, and final desktop heading/mockup separation was checked.

## Character revision — November 1, 2026

Inspected the public mascot source and rebuilt its actual procedural geometry,
articulated gestures, and post-lighting print pipeline. Replaced the old poster
with a matching transparent render. See `CHARACTER-REFERENCE.md`.

The revision was checked in-browser at 390 × 844 and 1440 × 900, including trick
activation, pointer drag/release, route recovery, and all three accessory toggles.
Twelve focused tests now include finite transforms throughout every trick, neutral
restoration for reduced motion, cancellation of vanish, repeated-action IDs, eye/face clearance, and closed-lid
expression changes.
Sustained device performance and exact frame-by-frame motion parity remain outside
this validation scope.

## Landscape choreography revision

Replaced section corner switches with a viewport-space path sampled from measured
section positions. The guide stays visible through the biography, turns while
crossing, scales logarithmically into the work badge, and returns at contact.
Project narration now scrolls through real 42svh rows in landscape; its fades,
word reveal, mirrored poses, device aiming, queued swipes, and accessory changes
use the same row cues. Short landscape media clears the heading.

Eighteen tests pass, including source anchor values, reverse travel, rapid seeks,
scale/clipping interpolation, narration fades, mirrored watch poses, and swipe
interruption. Lint/types and an isolated production build pass. Browser checks
cover 1440 × 900, 844 × 390, forward/backward chapter traversal, hash entry,
work-badge clipping, contact growth, and portrait regression at 390 × 844.
Placeholder media and copy still differ from the reference. Full device/media
transition parity and sustained real-device performance remain separate QA.

## Click handling correction

R3F's outer Canvas div defaults to inline `pointer-events: auto`; after the move
to a full-viewport renderer, it intercepted page links and controls. The Canvas
wrapper now explicitly uses `pointerEvents: "none"`. Character input remains on
its separate HTML handle. The mobile contact anchor also fits below measured
footer text, keeping its handle away from navigation links.

Real browser clicks verified project navigation, hint/reveal, view switching,
trick-dialog open/close, mobile contact navigation, email-copy feedback, and the
previously covered mobile work link. DOM hit tests show all mobile footer controls
receive their own pointer events. Nineteen behavior tests pass, including a new
footer-clearance regression.

## Approved color likeness — November 2, 2026

Adapted the approved left-hand color concept to the procedural rig: swept dark
quiff, taller face, longer nose, separate moustache/chin beard, warm skin and
cream shooting-star sweatshirt. Skin-colored articulated hands replace the
white gloves. The clean color composite replaces the dither pass, retaining
circular clipping and the vanish/photo effects. The badge keeps its 256px crop.
Hat transitions compress the taller hair to prevent crown intersections.
The transparent fallback and portfolio homepage screenshots now match the model.

Validation: lint, TypeScript, all 22 behavior tests, final production build, and
all 17 HTTP route/asset checks pass. The obsolete size-dependent dither test was
removed; camera-crop coverage remains, and a new responsive framing regression
covers portrait tablets and short-landscape speech. Browser checks at 390 × 844,
768 × 1024, 1440 × 900 and 844 × 390 covered the opening, the compact badge,
project-two narration/sunglasses, forward/backward scrolling, reveal-button
feedback, trick activation and 404 hat/sunglasses toggles. Portrait tablet
placement was centered below the headline; short-landscape opening speech moves
beside the guide to clear the header. The final production homepage loads the
live canvas with no captured console errors. The development preview was
restarted and checked after build verification.

This is a geometric adaptation of the approved concept, not an identical sculpt.
Forced WebGL loss, reduced-motion browser emulation, touch feel and sustained
real-device performance were not newly audited in this revision. Automated
coverage still verifies reduced-motion neutral poses and trick interruption.

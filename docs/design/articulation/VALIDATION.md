# Review record — 3 November 2026

This verifies the separate preparation study, not a finished production rig.

- Lint and TypeScript: pass.
- Node tests: 33 pass, including actual exported joint hierarchy/axis checks,
  rigid jaw preservation, arm/hand ownership, upward hand positioning and exact
  rest-pose reset after pose/explosion changes.
- Production build: pass in an isolated repository snapshot. The review server
  runs that build on `http://127.0.0.1:3003/character/articulation`.
- Route checks: workshop HTML and binary GLB return 200, noindex metadata is
  present, and the portfolio guide is excluded. Existing project/resume/404
  route checks pass.
- Khronos validation: zero errors/warnings for both the compressed export and
  actual locally Draco-decoded geometry. See the adjacent JSON reports.
- The authoring script rejects open anatomical cuts, pinched material boundaries
  and nonmanifold body caps. It asserts exterior surface area conservation.
- Original high-quality supplied GLB and approved live smoothed GLB retain their
  previous SHA-256 hashes. Neither was modified.

Browser checks used the production build with the final derived GLB:

| Viewport | Checked |
|---|---|
| 1440 × 1000 | Head turn/chin, full hand and thumb isolation, manual wrist turn, face/eye patch isolation, explosion, axes, clay, colors, reset, front and three-quarter views |
| 390 × 844 | Responsive stacked layout, full model fits canvas, accessible controls below the stage |
| 768 × 1024 | Raised-hand pose fits the narrow canvas without clipping the hands |
| 900 × 390 | Full-page layout, controls and normal document scrolling |

The wrist Y slider responded to the Right key and showed a visible focus outline.
The loading poster was observed; its local file and download route were checked.
Console review found no errors from the production workshop; earlier errors in
the same tab belong to the pre-existing port-3000 development server's timed-out
Hunyuan route chunks. Unavailable WebGL/context loss and actual touch hardware
were not simulated. The scene is static between interactions and has no autoplay.

Saved captures include `separation-demo.png`, `head-turn.png`,
`facial-patches.png`, `isolated-hand.png`, `mobile.png`, `tablet-pose.png`, and
`landscape.png`. They show rigid inspection poses. Sleeve/neck joint seams in
rotated poses remain work for retopology and skin weights, not an acceptance claim
for final animation. Facial surface patches do not establish blinking/speech.

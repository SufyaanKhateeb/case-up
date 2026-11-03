# AI-assisted work

## Project context

Sufyaan Khateeb’s portfolio (`case-up`) is being rebuilt to reproduce the visual
and interactive experience of https://www.sebg.ch/. The user approved a faithful
rebuild: the same design language, reference character, three featured
projects, all-work grid, project pages, tricks, sound, and interactive 404.
The audience includes both employers and freelance clients.

The current implementation is a staged milestone. Project records and social
links were migrated from `origin/content-test` at `9471953` (May 2025) with the
user’s authorization. Biography, Wells Fargo/CAST experience, skills, dates and
selected impact figures now follow the latest full-stack and data résumés supplied
in this chat (September 2026 PDFs). Software engineering is the primary résumé;
data engineering is an alternative at `/resume/data`. Do not restore old CAST
“Present” dates or old metrics from content-test.
Placement App and Real-Time Chat still need screenshots; their abstract previews
are labeled as illustrations. The original résumé PDFs are copied without edits,
with local page images for browser-independent previews.
The character’s procedural geometry and animation structure were reconstructed
locally. The user approved the color panel in `docs/design/character-msk-concept.png`,
based on `public/msk_cartoon.png`. The live rig now has a swept dark quiff, warm
skin, elongated face, separated moustache, small chin beard and cream sweatshirt.
Use clean shaded color rather than the reference’s monochrome dither.
The brand
direction retains the arrow/shooting-star mark: it represents the user’s
aspiration to rise in the world. Preserve it as a personal signature in the
favicon, homepage identity, and footer back-to-top link.
The user’s latest appearance overrides remove the bow tie entirely and replace the round glasses
with opaque Wayfarer-style sunglasses. Preserve these overrides when following
the reference. The torso is a relaxed crew-neck sweatshirt with a straight body,
soft shoulders, ribbed collar/cuffs, and the shooting star on the left chest.
Do not invent credentials, projects, outcomes, or testimonials.

## Stack and commands

Next.js 14 App Router, React 18, strict TypeScript, Tailwind 3, GSAP ScrollTrigger,
Three.js, and React Three Fiber 8. Use Node 22 (validated on 22.19.0), npm, and the
committed lockfile. R3F 9 requires React 19; do not mix those major versions.

- `npm ci`: install locked dependencies.
- `npm run dev`: development server.
- `npm run lint`: ESLint.
- `npm run typecheck`: TypeScript.
- `npm test`: focused behavior tests with Node’s test runner through tsx.
- `npm run build`: production/static route build.
- `npm start`: production server after building.
- `npm run test:routes`: HTTP/SSR checks against the running local server. Use
  `PORTFOLIO_TEST_URL` to change its base URL.

No environment variables or backend are required. Funnel Display is local;
its OFL license must remain with the font. The previous Google-font/prerender
build failure was resolved by the rebuild.

## Architecture

- `content/portfolio.ts`: typed identity, draft copy, project records, and scene
  configuration. Keep text/media edits here. `status: "placeholder"` distinguishes
  development content; placeholder detail pages have noindex metadata.
- `content/character.ts`: approved color appearance, palette, provenance, and matching
  fallback poster.
- `app/page.tsx`: semantic, server-rendered homepage. Project chapters use native
  scrolling with CSS sticky stages. Three featured projects map to comparison,
  scratch, and viewport-switching demos.
- `app/projects/[slug]/page.tsx`: static case studies, metadata, missing-slug
  handling, and circular next-project navigation.
- `app/resume/page.tsx`, `app/resume/data/page.tsx`: résumé versions, preview and
  PDF downloads. `components/portfolio/resume-document.tsx` shares the page layout.
- `app/404/page.tsx`, `app/not-found.tsx`: shared interactive error scene;
  unknown URLs must retain HTTP 404 status.
- `components/portfolio/runtime.tsx`: shared context, GSAP scroll director,
  preferences, synthesized audio, trick dialog, email-copy feedback.
- `components/portfolio/project-demo.tsx`: accessible local demonstrations.
- `components/portfolio/project-art.tsx`: real-media rendering and clearly marked
  illustrative fallback artwork. Do not present fallback art as client work.
- `components/character/shell.tsx`: one shared guide per active page, HTML speech,
  pointer/keyboard manipulation, compact mode, lazy scene, poster fallback.
- `components/character/model.ts`: procedural face, hair, body, articulated hands,
  and accessories. `motion.ts`: owned GSAP pose/expression timelines.
- `lib/character-tour.ts`: pure grid placements, continuous travel/turn/scale,
  narration progress/fades, and section gesture selection.
- `components/character/tour.ts`: measured document anchors and smoothed viewport
  head coordinates. `scene.tsx` renders one full-viewport canvas, antialiased color composite, badge
  clipping, accessory transitions, and synchronized mirrored gestures.
- `.chapter-lines` / `[data-story-step]`: semantic scrolling narration and gesture
  cues. The biography keeps the character visible; do not restore corner jumps.
- `lib/character-state.ts`: pure interaction controller; drag has priority over
  tricks, and tricks have priority over the tour. Scroll updates continue during
  interactions so release/finish returns to the latest chapter.
- `app/globals.css`: design tokens, typography, grid, responsive layout, media
  frames, and reduced-motion behavior. `next.config.js` is the sole Next config.

Legacy utility/SVG components and public assets remain. The old page loader,
scroll header, experimental scroll path, and smooth-scroll setup are retired.

## Working conventions

Read affected code first and preserve unrelated edits. Use `@/*` imports. Keep
changes scoped and avoid incidental reformatting or asset rewrites. Follow the
reference design rather than introducing generic UI patterns.

Keep readable portfolio content in HTML. Browser-only APIs and WebGL belong in
client components; preserve the dynamic SSR boundary around the scene. Keep
loading/failure fallbacks. Dispose listeners, animation contexts, timers, audio,
and owned Three resources when their lifecycle ends. Do not treat intentional
renderer teardown as WebGL failure. Keep `pointerEvents: "none"` on the R3F
`Canvas` wrapper itself: its default inline `auto` otherwise intercepts the whole
viewport. Only `.character-grab` should receive character pointer input.

Animation selectors (`data-character`, `data-reveal`, `.bio-word`), scene IDs,
sticky chapter lengths, and character positions are coupled. Check forward and
backward scrolling, resizes, and route transitions when changing them. Keep native
scrolling and avoid introducing a second scroll owner.

For character changes and content integration, follow `docs/CHARACTER-ASSETS.md`
and `docs/CONTENT.md`. See `docs/CHARACTER-REFERENCE.md` for inspected source and
implementation findings. The reference itself uses procedural geometry, not GLB;
do not reintroduce a mandatory asset-production dependency.

The user subsequently approved an optional Hunyuan image-to-3D study. The route
`/character/hunyuan` compares 2.1 single-view and 2mv Turbo four-view geometry;
it intentionally hides the animated guide. The early studies have no textures or rig.
The user approved the smoothed high-quality model, then the connected-arm
workshop model for the live website while retaining hand animation.
`content/character.ts` now selects `/character/arms-continuous.glb` (seven-bone
body/arms skin). `imported-model.ts` preserves the tested arm weights and bind
frames, registers the asset to the existing head-centre tour, and adds Neck/Head
bones at runtime. Use the angled under-jaw field (`y + .28*z`, .480–.495) for
head weights: a horizontal height ramp pins the actual low/front chin to the
body. The real-mesh regression checks jaw rigidity through turns/tilts and a
fixed collar; keep it intact.
`connected-arm-motion.ts` drives the workshop's tested shoulder/elbow/wrist
channels from the existing owned GSAP timelines; do not copy procedural Euler
angles to these bones. Keep sleeve continuity and fixed central chest/waist.
This approval supersedes the earlier temporary requirement to keep arms rigid.
The unrigged smoothed source remains the default `/character/hunyuan` inspection
model. `/character/articulation` remains the manual arm review.
The old procedural rig remains as the controller with its surfaces hidden.
Preserve scroll choreography, drag priorities, clipping, tricks, muted audio and
reduced-motion rest. `facial-expressions.ts` now generates six restrained relative
blendshapes on the approved surface: blink, wide eyes, separate brows, smile and
open-mouth reaction. `motion.ts` drives them through the existing face channels.
Keep the nose, low chin, neck, hair and clothing outside these masks. This is not
full lip-sync or individual finger animation. Remove downward-facing cues; the
live adapter's `safeHeadPitch` also guards neck, tilt and idle rotations at -.12–0.
The hat is retired. `character-accessories.ts` defines headphones, sunglasses and
watch for UI/drop validation. Headphones rest around the collar and follow Body;
sunglasses follow Head and watch follows LeftHand. Read
`docs/design/expressive-character/README.md`.
The matching loading/failure fallback is `/character/smoothed-poster.png`,
exported at `/character/hunyuan?poster` with the same rest silhouette. Keep local
decoding and dispose owned textures, ImageBitmaps and skeletons on unmount.
The higher-quality full model was supplied
as `generated_full_high_quality.glb` (1.5m triangles) and cleaned into
`public/character/sufyaan-full-hq-smooth.glb` (200k runtime triangles, 4K WebP PBR maps,
explicit tangents, local Draco compression).
`scripts/character/clean-textured-model.py` welds coincident UV-seam vertices
without altering source face-corner UVs and saves the full-density packed 4K
authoring file before runtime decimation in `artifacts/character/full-model-hq/`.
Use `--smooth-iterations 5 --faces 200000 --texture-size 4096` for the approved
smoothed version; preserve the unsmoothed derivative for comparison. It has no embedded rig or facial
morphs. Textured/clay/wireframe modes and five camera views support inspection;
complete-arm reference images live in `docs/design/character-with-arms/`.
The previous full model remains `public/character/sufyaan-full.glb` (50k
triangles, 2K maps). The previous bust remains `public/character/sufyaan-textured.glb`
(100k triangles) using `scripts/character/prepare-supplied-model.py`.
Preserve all supplied originals and unrelated procedural character edits.
Decoder files and Apache license live in
`public/character/draco/`; loading must not depend on a remote decoder CDN.
Inputs, generation records and authoring scripts are documented in
`docs/design/hunyuan/README.md`. Preserve the procedural source and all supplied
originals. The user's approval to use the smoothed model supersedes the earlier
instruction to keep it confined to the study. Deployment was subsequently
authorized on November 4, 2026: create a PR, merge the approved current portfolio
into `main`, and publish through the existing Vercel project. Preserve the approved
live character for this release. Future facial work must use OmniFaceRig only;
its public release currently lacks the custom-model fitter. No OmniFaceRig dataset
assets or manual laugh prototype are part of the live portfolio. See
`docs/design/omnifacerig/README.md`.

## Verification and handoff

The user also supplied `full_body_model_parted.fbx` and `Strut Walking.fbx` on
November 4. These remain separate review assets: `/character/parted` inspects 18
unrigged parts; `/character/rigged` plays the supplied 65-bone Mixamo walk with
simple colors transferred from the parted geometry. Neither FBX has UVs or
facial blendshapes. The mouth stays on the head and the source hair shell includes
the neck. Preserve originals and the active connected-arm character. Read
`docs/design/rigged-fbx/README.md` for preparation, weight normalization, rest-pose
parent handling and outstanding facial integration. Hide the guide on review routes.

The user rejected the disconnected part experiment and requested a continuous
right-arm study, then the same treatment for the left arm. `/character/articulation`
now renders `arms-continuous.glb`: one original manifold mesh, seven-bone skin,
independent shoulder/elbow/wrist chains and a shared fixed body. The demo defaults
to the left arm; selecting a side retains both poses. `prepare-right-arm.py -- --both`
prepares the new asset while preserving the earlier right-only export; run it
through Blender with `--background --disable-autoexec --python`.
`normalize-skin-export.cjs` validates/normalizes decoded skin attributes;
`lib/continuous-arms-study.ts` poses bones in their bind frames. Read
`docs/design/connected-arms/README.md`. Keep the head, chest and waist fixed,
protect the unposed arm. The homepage now uses this same asset with its live
head and gesture adapter; keep manual review controls confined to the workshop. The old
right-only and split-part sources/assets remain historical experiments.

Run lint, typecheck, focused tests, and production build for application changes.
Check route HTTP status and SSR after routing changes. Use browser QA for mobile,
tablet, desktop, and short landscapes, including intro visibility, chapters,
demos, tricks, dragging, contact, 404 recovery, and console errors.

Verify keyboard access, reduced motion, unsupported WebGL, and muted audio.
Compilation alone does not verify visuals, motion quality, or character likeness.
Record the actual validation scope; do not claim missing asset review or exact
cross-viewport reference parity. Keep docs aligned with architecture/workflow.

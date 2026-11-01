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
it intentionally hides the animated guide. These GLBs have no textures or rig.
Inputs, generation records and authoring scripts are documented in
`docs/design/hunyuan/README.md`. Preserve the procedural guide until a generated
asset has passed likeness, expression, accessory, performance and license review.

## Verification and handoff

Run lint, typecheck, focused tests, and production build for application changes.
Check route HTTP status and SSR after routing changes. Use browser QA for mobile,
tablet, desktop, and short landscapes, including intro visibility, chapters,
demos, tricks, dragging, contact, 404 recovery, and console errors.

Verify keyboard access, reduced motion, unsupported WebGL, and muted audio.
Compilation alone does not verify visuals, motion quality, or character likeness.
Record the actual validation scope; do not claim missing asset review or exact
cross-viewport reference parity. Keep docs aligned with architecture/workflow.

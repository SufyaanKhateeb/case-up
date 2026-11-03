# Case-up — Sufyaan Khateeb’s portfolio

A portfolio inspired by [sebg.ch](https://www.sebg.ch/): bold typography, colored
project chapters, scroll-driven storytelling, a full-color 3D guide, interactive
previews, project case studies, and a dress-up 404.

Built with Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, GSAP, Three.js,
and React Three Fiber 8. Funnel Display is hosted locally with its OFL license.

## Run locally

Use Node.js 22 (validated with 22.19.0) and npm:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment variables, API keys,
backend, or remote fonts are needed.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

With a server running, `npm run test:routes` checks HTML rendering and HTTP status
codes for the homepage, case studies, and missing routes. Set `PORTFOLIO_TEST_URL`
to test another local port.

## Personalization and current milestone

The interaction system and responsive page structure are implemented. Content from
`content-test` supplies social links and three real project records. The latest
supplied résumés now provide the biography, Wells Fargo/CAST experience and skills. Placement App and Chat still use labeled
illustrative previews while screenshots are pending. `/resume` previews and
downloads the latest software-engineering PDF; `/resume/data` provides the
data-engineering version. The character uses the approved smoothed, textured
model with continuous articulated arms, head movement, a shooting-star sweatshirt
and interactive accessories. Its controller preserves the scroll tour and tricks.
The approved color concept in `docs/design/character-msk-concept.png` supplied its
design direction. The Personal Portfolio project previews show desktop and mobile
captures of the current implementation.

- [Content checklist](docs/CONTENT.md): what to supply and how to integrate it.
- [Character configuration](docs/CHARACTER-ASSETS.md): appearance, poses, fallback,
  and further personalization.
- [Character reference](docs/CHARACTER-REFERENCE.md): source inspection and reconstruction.
- [Reference and QA notes](docs/REFERENCE.md): design baseline and validation scope.
- [AI guidance](AGENTS.md): architecture and working conventions.

## Source map

| Path | Purpose |
| --- | --- |
| `content/portfolio.ts` | Identity, draft copy, project records, scene configuration |
| `content/character.ts` | Character asset manifest |
| `app/page.tsx` | Server-rendered homepage and three featured chapters |
| `app/projects/[slug]/page.tsx` | Statically generated case studies |
| `app/404/`, `app/not-found.tsx` | Dress-up scene and real HTTP 404 handling |
| `components/portfolio/` | Runtime, scroll director, demo controls, local art |
| `components/character/` | Shared shell, imported character adapter, articulated motion, color renderer |
| `lib/character-state.ts` | Interaction priority, chapter selection, preferences |
| `lib/character-tour.ts` | Grid anchors, continuous scroll travel, narration timing |
| `app/globals.css` | Design system, layouts, responsive and reduced-motion styles |
| `tests/`, `scripts/check-routes.mjs` | Behavior tests and HTTP smoke checks |

The previous loader/header and Locomotive Scroll initialization have been retired.
Unreferenced legacy SVGs, utility components, and asset files remain available.
The user approved publishing this milestone on November 4, 2026 through a pull
request into `main`. The existing production portfolio is hosted on Vercel at
[sufyaankhateeb.site](https://sufyaankhateeb.site). Keep raw model originals and
research-only third-party assets out of deployments. Future OmniFaceRig work
remains separate; see [the release audit](docs/design/omnifacerig/README.md).

## Version history

- `1.0.0`: the original `main` portfolio, commit `432a5e8`.
- `2.0.0`: the latest `content-test` portfolio, commit `9471953`.
- `3.0.0`: this rebuilt portfolio; tag the final merged release commit on `main`.

Node.js is pinned to `22.x` for hosting and local builds. Next.js uses the
compatible `14.2.35` patch while retaining React 18 and React Three Fiber 8.

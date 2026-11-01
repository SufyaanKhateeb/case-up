# Portfolio content

`content/portfolio.ts` owns identity, copy, project records, experience, skills,
links and scene narration. No CMS or backend is needed.

## Sources and résumé versions

Projects and social links were migrated from `origin/content-test`, commit
`9471953`, dated May 16, 2025. The user subsequently supplied two latest résumés:
`Sufyaan_resume_fullstack.pdf` and `Sufyaan_resume_data.pdf` (September 2026).
They supersede the old résumé for biography, skills and employment. The preferred
professional title remains **Software engineer**.

Current experience: Wells Fargo, Software Engineer, June 2025–Present; CAST,
Junior Full Stack Software Engineer, September 2023–June 2025; CAST internship,
January–August 2023. Selected metrics are taken from the latest supplied PDFs:
95% less manual ingestion work, 99% lower BigQuery spend, 4× faster source
onboarding, 40% lower API latency and 30–40% higher job completion. These are the
user’s supplied résumé claims; do not invent or combine new outcomes.

`/resume` defaults to the software-engineering version. `/resume/data` provides
the data-engineering version. The shared `ResumeDocument` component renders both
with real navigation links, active-version indication, a direct PDF link and a
download. PDFs under `public/resume/` are copied without rewriting. Page images
are generated using Poppler so previews work without a PDF plugin. The original
`/resume-fs-1.pdf` URL now serves a compatibility copy of the latest primary PDF.
The 2025 rendered pages were removed.

The restored `public/msk_cartoon.png` remains the identity reference. The old SMTP
form was not copied into this email-based design; contact remains mailto, copy
email, GitHub and LinkedIn.

## Projects and scenes

Featured order: Placement App, Real-Time Chat App, Personal Portfolio. Each has
real summaries, contribution notes and source links. Missing project dates are
omitted, not invented. `status: "draft"` keeps unfinished case studies noindex;
`ready` requires complete content and actual media.

Scene IDs `project-one`, `project-two`, `project-three` remain independent of URL
slugs. Both the homepage’s `data-character` and `ProjectDemo.sceneId` use these IDs
so animation, gesture cues and accessories still match the chapters.

## Media handoff

Placement App and Chat currently use explicitly labeled illustrative artwork;
it is not presented as a screenshot or faithful application demonstration.
Supply desktop/mobile screenshots for them under `public/projects/<slug>/`.
Set `desktop`, `mobile`, `thumbnail`, and optional `tablet` / `comparison` to
`{ src, alt }`. Case-study sections can also supply `media`.

The comparison, scratch and viewport controls remain local demonstrations of the
presentation. Update their narration and media together. The portfolio uses
actual desktop/mobile captures of the current local build under
`public/projects/portfolio/`.

## Character review

`docs/design/character-msk-concept.png` is a likeness concept based on the restored
portrait, with the approved sweatshirt and star. It does not change the animated
model. See the adjacent prompt/production notes before implementing that look.

## Remaining release inputs

- Placement App and Chat screenshots, project dates and richer case-study detail.
- Availability wording, any desired changes to the imported biography and links.
- Review of the character likeness concept before changing the procedural rig.

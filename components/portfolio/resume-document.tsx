import Image from "next/image";
import Link from "next/link";
import { portfolio } from "@/content/portfolio";

export type ResumeVariant = keyof typeof portfolio.resume.variants;

export function ResumeDocument({ variant }: { variant: ResumeVariant }) {
  const document = portfolio.resume.variants[variant];
  return <main id="main" className="resume-page grid-surface" data-character="detail">
    <header className="resume-header"><Link className="pill" href="/#experience"><span aria-hidden="true">←</span> Back to portfolio</Link><a className="pill" href={document.url} download={document.filename}>Download PDF <span aria-hidden="true">↓</span></a></header>
    <h1>Résumé.</h1><p className="resume-caption">{portfolio.name} · {portfolio.resume.date}</p>
    <nav className="resume-versions" aria-label="Résumé versions">{Object.entries(portfolio.resume.variants).map(([key, item]) => <Link key={key} href={item.route} className="resume-version" aria-current={key === variant ? "page" : undefined}>{item.label}</Link>)}</nav>
    <p className="resume-fallback">You can also <a href={document.url} target="_blank" rel="noopener noreferrer">open the PDF in a new tab ↗</a>.</p>
    <section key={variant} className="resume-preview" aria-label={`${document.label} résumé preview`} tabIndex={0}>
      {document.pages.map((page, index) => <Image key={page.src} src={page.src} width={1237} height={1600} sizes="95vw" alt={page.alt} priority={index === 0} />)}
    </section>
  </main>;
}

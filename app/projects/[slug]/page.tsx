import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { getNextProject, getProject, projects } from "@/content/portfolio";
import { DeviceFrame } from "@/components/portfolio/project-art";

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }
export const dynamicParams = false;
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProject(params.slug);
  if (!project) notFound();
  return { title: project.title, description: project.summary, robots: project.status !== "ready" ? { index: false, follow: false } : undefined };
}
export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug); if (!project) notFound();
  const next = getNextProject(project.slug)!;
  return <main id="main" className="case-study grid-surface" data-character="detail" style={{ "--section-color": project.color, "--section-ink": project.ink } as CSSProperties}>
    <header className="case-header"><Link className="pill" href="/#work"><span aria-hidden="true">←</span> All work</Link><div className="case-external-links">{project.repositories?.map((link) => <a key={link.url} href={link.url} className="pill" target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}{project.repositoryUrl && <a href={project.repositoryUrl} className="pill" target="_blank" rel="noopener noreferrer">Source <span aria-hidden="true">↗</span></a>}{project.url && <a href={project.url} className="pill" target="_blank" rel="noopener noreferrer">Visit site <span aria-hidden="true">↗</span></a>}</div></header>
    <div className="case-title"><p className="eyebrow">SELECTED WORK</p><h1>{project.title}</h1><dl className="case-facts">{project.year && <div><dt>Year</dt><dd>{project.year}</dd></div>}<div><dt>Role</dt><dd>{project.role}</dd></div><div><dt>Stack</dt><dd>{project.stack.join(", ")}</dd></div></dl></div>
    <div className="case-hero"><DeviceFrame project={project} /></div>{!project.desktop && <p className="case-media-note">Illustrative preview. Project screenshots are still to come.</p>}
    <div className="case-intro" data-reveal><p>{project.summary}</p>{project.contributions.length > 0 && <ul>{project.contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}</ul>}</div>
    {project.sections.map((section, index) => <section className="case-section" key={section.title}><div className="case-text" data-reveal><span className="eyebrow">0{index + 1}</span><h2>{section.title}</h2><p>{section.body}</p></div>{section.media ? <div className="case-custom-media"><Image src={section.media.src} alt={section.media.alt} width={1600} height={1000} sizes="95vw" /></div> : <div className={`case-devices case-devices-${index}`} data-reveal><DeviceFrame project={project} variant={index} /><DeviceFrame project={project} mobile variant={index} /></div>}</section>)}
    <Link href={`/projects/${next.slug}`} className="next-project"><span>Next project</span><strong>{next.title}</strong><span aria-hidden="true">↗</span></Link>
  </main>;
}

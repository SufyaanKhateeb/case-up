import Image from "next/image";
import type { CSSProperties } from "react";
import type { Project, ProjectMedia } from "@/content/portfolio";

export function ProjectArt({ project, variant = 0, thumbnail = false, mediaOverride }: { project: Project; variant?: number; thumbnail?: boolean; mediaOverride?: ProjectMedia }) {
  const media = mediaOverride ?? (thumbnail ? project.thumbnail ?? project.desktop : project.desktop);
  if (media) return <div className="project-art has-media"><Image src={media.src} alt={media.alt} fill sizes="(max-width: 700px) 92vw, 75vw" className="project-media" /></div>;
  return <div className={`project-art art-${project.illustration} variant-${variant}`} style={{ "--art-accent": project.color } as CSSProperties} aria-label={`Illustrative preview of ${project.title}; not an application screenshot`}>
    <div className="art-nav"><span>SK<span className="art-asterisk">✳</span></span><span>EXPLORATION / 0{variant + 1}</span><span>↗</span></div>
    <div className="art-copy">{project.previewCopy.firstLine}<br /><i>{project.previewCopy.emphasis}</i></div>
    <div className="art-object" aria-hidden="true">{project.illustration === "type" ? <span>a*</span> : <><span /><span /><span /></>}</div>
    <div className="art-bottom"><span>Illustrative preview</span><span>SCROLL TO EXPLORE ↓</span></div>
    <div className="art-grain" aria-hidden="true" />
  </div>;
}

export function DeviceFrame({ project, mobile = false, variant = 0 }: { project: Project; mobile?: boolean; variant?: number }) {
  return <div className={mobile ? "device-phone" : "device-browser"}>
    {mobile ? <div className="phone-top" aria-hidden="true"><span>9:41</span><i /><span>▰</span></div> : <div className="browser-bar" aria-hidden="true"><span className="browser-dots"><i /><i /><i /></span><span className="browser-address">{project.url ? new URL(project.url).hostname : project.title}</span><span>↗</span></div>}
    {mobile && project.mobile ? <div className="project-art has-media"><Image src={project.mobile.src} alt={project.mobile.alt} fill sizes="260px" className="project-media" /></div> : <ProjectArt project={project} variant={variant} mediaOverride={variant === 1 ? project.tablet : undefined} />}
  </div>;
}

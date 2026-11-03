import type { Metadata } from "next";
import { ContinuousArmsStudy } from "@/components/character/continuous-arms-study";
import styles from "./study.module.css";

export const metadata: Metadata = { title: "Character articulation workshop", robots: { index: false, follow: false } };

export default function ArticulationPage() {
  return <main id="main" className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>CHARACTER WORKSHOP / CONNECTED ARMS</p><h1>Both arms, connected.</h1><p className={styles.intro}>Shoulder, elbow and wrist on one continuous surface.</p></div>
      <nav aria-label="Workshop navigation"><a href="/character/hunyuan">Original model ↗</a><a href="/">Portfolio ↗</a></nav>
    </header>
    <ContinuousArmsStudy />
    <section className={styles.notes} aria-label="About the continuous arm study">
      <div><span>01 / SURFACE</span><h2>Keep it connected.</h2><p>The approved character keeps its original surface and textures. There are no cut joints, floating parts or added caps.</p></div>
      <div><span>02 / MOVEMENT</span><h2>Three joints per arm.</h2><p>Blended skin weights carry movement through the shoulder, elbow and cuff. The palm, thumb and fingers move together as a complete hand.</p></div>
      <div><span>03 / FOCUS</span><h2>Review either side.</h2><p>Use the pose buttons and sliders to inspect the sleeve through its range. Switch between the left and right arms to adjust their poses independently. The head, central chest and waist stay fixed.</p></div>
    </section>
  </main>;
}

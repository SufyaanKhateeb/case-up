import type { Metadata } from "next";
import { HunyuanStudy } from "@/components/character/hunyuan-study";
import { CharacterReferenceViews } from "@/components/character/reference-views";
import styles from "./study.module.css";

export const metadata: Metadata = {
  title: "Character model study",
  robots: { index: false, follow: false },
};

export default function HunyuanStudyPage() {
  return <main id="main" className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>CHARACTER EXPLORATION · 01</p><h1>From concept to form.</h1></div>
      <a href="/" className={styles.home}>Back to portfolio ↗</a>
    </header>
    <div className={styles.comparison}>
      <section className={styles.panel}>
        <div className={styles.label}><h2>Color references</h2><span>Concept turnaround</span></div>
        <CharacterReferenceViews />
      </section>
      <section className={styles.panel}>
        <div className={styles.label}><h2>Generated geometry</h2><span>Hunyuan3D</span></div>
        <HunyuanStudy />
      </section>
    </div>
    <footer className={styles.footer}>
      <p>AI-generated shape study. Color textures and an animation rig are still needed. This model is separate from the portfolio’s animated guide.</p>
      <a href="https://huggingface.co/spaces/tencent/Hunyuan3D-2mv">Multi-view source ↗</a>
    </footer>
  </main>;
}

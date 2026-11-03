import type { Metadata } from "next";
import { RiggedModelStudy } from "@/components/character/rigged-model-study";
import manifest from "@/content/character-rigged.json";
import styles from "../articulation/study.module.css";
export const metadata: Metadata = { title: "Rigged character review", robots: { index: false, follow: false } };
export default function RiggedPage() {
  return <main id="main" className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>CHARACTER WORKSHOP / SUPPLIED RIG</p><h1>Ready to move.</h1><p className={styles.intro}>{manifest.bones} bones, your walking clip, and a fresh color pass.</p></div>
      <nav aria-label="Workshop navigation"><a href="/character/parted">Separate parts ↗</a><a href="/">Portfolio ↗</a></nav>
    </header>
    <RiggedModelStudy />
    <section className={styles.notes} aria-label="Rig inspection findings">
      <div><span>01 / RIG</span><h2>A complete body skeleton.</h2><p>Spine, neck, head, shoulders, elbows, wrists, fingers, legs and feet come from the supplied Mixamo rig. The original walking animation is preserved in the download.</p></div>
      <div><span>02 / COLOR</span><h2>Materials reapplied.</h2><p>The separate model guides the placement of skin, hair, eyes, cream clothing and dark trousers. This file has no UVs or image textures; these are simple shaded colors.</p></div>
      <div><span>03 / FACE</span><h2>Facial controls come next.</h2><p>The body is rigged, but there are no facial bones or expression blendshapes. Eyes, eyebrows, eyelids and the mouth still need their own expression controls.</p></div>
    </section>
  </main>;
}

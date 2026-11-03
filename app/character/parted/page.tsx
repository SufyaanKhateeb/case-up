import type { Metadata } from "next";
import { PartedModelStudy } from "@/components/character/parted-model-study";
import styles from "../articulation/study.module.css";

export const metadata: Metadata = { title: "Parted character review", robots: { index: false, follow: false } };
export default function PartedPage() {
  return <main id="main" className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>CHARACTER WORKSHOP / SUPPLIED FBX</p><h1>A new foundation.</h1><p className={styles.intro}>18 separate parts, with a first material pass.</p></div>
      <nav aria-label="Workshop navigation"><a href="/character/rigged">Rigged model ↗</a><a href="/">Portfolio ↗</a></nav>
    </header>
    <PartedModelStudy />
    <section className={styles.notes} aria-label="Model inspection findings">
      <div><span>01 / MATERIALS</span><h2>Color without textures.</h2><p>Warm skin, dark hair and a cream sweatshirt use simple shaded materials. These are review colors applied to the supplied geometry.</p></div>
      <div><span>02 / SEPARATION</span><h2>Inspect each piece.</h2><p>Head, hair, eyebrows, eyes, eye details, moustache, beard, torso, sleeves, hands, collar, waistband and lower body are separate objects. The lips and mouth remain part of the head.</p></div>
      <div><span>03 / ANIMATION</span><h2>Ready for rigging.</h2><p>The FBX contains no skeleton, animation clips or facial blendshapes. The head control here is a rigid pivot test. Smooth elbows, eyelids and an opening mouth still need dedicated controls.</p></div>
    </section>
  </main>;
}

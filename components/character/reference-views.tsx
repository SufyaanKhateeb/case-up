"use client";

import { useState } from "react";
import Image from "next/image";
import concept from "@/docs/design/character-with-arms/three-quarter.png";
import front from "@/docs/design/character-with-arms/front.png";
import left from "@/docs/design/character-with-arms/left-profile.png";
import right from "@/docs/design/character-with-arms/right-profile.png";
import back from "@/docs/design/character-with-arms/back.png";
import styles from "@/app/character/hunyuan/study.module.css";

const references = [
  { label: "Front", image: front }, { label: "Three-quarter", image: concept },
  { label: "Left", image: left }, { label: "Right", image: right }, { label: "Back", image: back },
];

export function CharacterReferenceViews() {
  const [selected, setSelected] = useState(0);
  return <div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "14px 20px 0" }} aria-label="Choose reference view">
      {references.map((reference, index) => <button type="button" key={reference.label} aria-pressed={selected === index} onClick={() => setSelected(index)} style={{ minHeight: 44, padding: "9px 14px", borderRadius: 40, background: selected === index ? "#f8f9f2" : "#ffffff18", color: selected === index ? "#111210" : "inherit" }}>{reference.label}</button>)}
    </div>
    <div className={styles.reference}><Image src={references[selected].image} alt={`${references[selected].label} color reference of the Sufyaan character`} priority={selected === 0} sizes="(max-width: 760px) 100vw, 50vw" /></div>
  </div>;
}

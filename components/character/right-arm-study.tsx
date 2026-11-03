"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCharacterAssetLoader, disposeCharacterAsset } from "@/lib/character-assets";
import { armPresets, createRightArmStudy, type ArmPose } from "@/lib/right-arm-study";
import manifest from "@/content/character-right-arm.json";
import styles from "@/app/character/articulation/study.module.css";

type StudyControls = { pose: (pose: ArmPose) => void; surface: (clay: boolean) => void; view: (detail: boolean, angle: number) => void };

export function RightArmStudy() {
  const mount = useRef<HTMLDivElement>(null);
  const control = useRef<StudyControls>();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [pose, setPose] = useState<ArmPose>({ shoulder: 0, elbow: 0, wrist: 0 });
  const [preset, setPreset] = useState<string>("rest");
  const [clay, setClay] = useState(false);
  const [detail, setDetail] = useState(true);
  const [angle, setAngle] = useState(0);
  const ready = status === "ready";
  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { setStatus("failed"); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute("aria-label", "Continuous character right-arm study. Use the pose buttons or sliders to move the arm.");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#f5f4ed", "#626987", 1.2));
    for (const [position, intensity] of [[[-3, 4, 5], 2.5], [[4, 1, -3], 1.4]] as const) {
      const light = new THREE.DirectionalLight("#ffffff", intensity); light.position.set(position[0], position[1], position[2]); scene.add(light);
    }
    const camera = new THREE.PerspectiveCamera(30, 1, .01, 25);
    camera.position.set(-.25, .25, 2);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(-.25, .25, 0); orbit.enablePan = false; orbit.minDistance = .4; orbit.maxDistance = 6;
    const render = () => { if (!document.hidden) renderer.render(scene, camera); };
    orbit.addEventListener("change", render);
    let rig: ReturnType<typeof createRightArmStudy> | undefined, model: THREE.Object3D | undefined;
    let focused = true;
    const frame = (rotation?: number) => {
      if (!rig) return;
      const direction = rotation === undefined ? camera.position.clone().sub(orbit.target).normalize() : new THREE.Vector3(Math.sin(rotation), 0, Math.cos(rotation));
      const box = rig.bounds(focused), size = box.getSize(new THREE.Vector3());
      box.getCenter(orbit.target);
      const distance = Math.max(size.y, size.x / camera.aspect) / (2 * Math.tan(Math.PI / 12)) * 1.12 + size.z / 2;
      camera.position.copy(orbit.target).addScaledVector(direction, distance); orbit.update(); render();
    };
    const resize = new ResizeObserver(() => {
      if (!element.clientWidth || !element.clientHeight) return;
      renderer.setSize(element.clientWidth, element.clientHeight); camera.aspect = element.clientWidth / element.clientHeight;
      camera.updateProjectionMatrix(); frame();
    });
    resize.observe(element);
    const loader = createCharacterAssetLoader();
    const clayMaterial = new THREE.MeshStandardMaterial({ color: "#e8e1d3", roughness: .85 });
    let original: THREE.Material | THREE.Material[] | undefined, cancelled = false;
    const lost = (event: Event) => { event.preventDefault(); setStatus("failed"); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", render);
    loader.loader.load(manifest.runtime, (gltf) => {
      if (cancelled) { disposeCharacterAsset(gltf.scene); return; }
      model = gltf.scene;
      try {
        rig = createRightArmStudy(model); scene.add(model); original = rig.mesh.material;
        control.current = {
          pose(value) { rig!.pose(value); frame(); },
          surface(value) { rig!.mesh.material = value ? clayMaterial : original!; render(); },
          view(value, rotation) { focused = value; frame(rotation); },
        };
        rig.pose(armPresets.rest); frame(0); setStatus("ready");
      } catch (error) { console.error("Continuous right-arm study failed", error); setStatus("failed"); }
    }, undefined, () => { if (!cancelled) setStatus("failed"); });
    return () => {
      cancelled = true; control.current = undefined; resize.disconnect(); orbit.removeEventListener("change", render); orbit.dispose();
      document.removeEventListener("visibilitychange", render); renderer.domElement.removeEventListener("webglcontextlost", lost);
      if (rig) { if (original) rig.mesh.material = original; rig.dispose(); }
      if (model) disposeCharacterAsset(model);
      clayMaterial.dispose(); loader.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  const choose = (key: keyof typeof armPresets) => {
    const { shoulder, elbow, wrist } = armPresets[key];
    const value = { shoulder, elbow, wrist }; setPose(value); setPreset(key); control.current?.pose(value);
  };
  return <div className={`${styles.workbench} ${styles.armWorkbench}`}>
    <section className={styles.stage} aria-label="Continuous right-arm preview">
      <div className={styles.stageTop}><span>ONE MESH / ZERO CUTS</span><span className={styles.status} role="status">{ready ? "READY" : status === "failed" ? "PREVIEW UNAVAILABLE" : "LOADING…"}</span></div>
      <div ref={mount} className={styles.viewport}>
        {!ready && <div className={styles.fallback}><Image src="/character/smoothed-poster.png" width={512} height={512} unoptimized alt="Approved character" /><p>{status === "failed" ? "3D preview unavailable. You can still download the model." : "Loading the connected mesh…"}</p></div>}
      </div>
      <div className={styles.stageBottom}><div className={styles.viewButtons}>
        {([["Front", 0], ["¾ view", -.65], ["Side", -Math.PI / 2], ["Back", Math.PI]] as const).map(([label, value]) => <button key={label} type="button" disabled={!ready} aria-pressed={angle === value} onClick={() => { setAngle(value); control.current?.view(detail, value); }}>{label}</button>)}
      </div><p>Drag to orbit · scroll to zoom</p></div>
    </section>
    <aside className={styles.controls} aria-label="Right-arm controls">
      <section className={styles.section}><h2>Right arm only</h2><p className={styles.hint}>The character’s right arm is on your left when facing it.</p><div className={styles.poses} style={{ marginTop: 14 }}>
        {(Object.keys(armPresets) as (keyof typeof armPresets)[]).map((key) => <button type="button" key={key} disabled={!ready} aria-pressed={preset === key} onClick={() => choose(key)}>{armPresets[key].label}</button>)}
      </div></section>
      <section className={styles.section}><h2>Move the connected arm</h2>
        {([{ key: "shoulder", label: "Shoulder lift", min: 0, max: 35 }, { key: "elbow", label: "Elbow bend", min: 0, max: 70 }, { key: "wrist", label: "Wrist turn", min: -25, max: 25 }] as const).map(({ key, label, min, max }) => <div key={key}>
          <label htmlFor={`arm-${key}`} className={styles.rangeLabel}>{label}<output>{pose[key]}°</output></label>
          <input id={`arm-${key}`} type="range" disabled={!ready} min={min} max={max} value={pose[key]} onChange={(event) => { const next = { ...pose, [key]: Number(event.target.value) }; setPose(next); setPreset("custom"); control.current?.pose(next); }} />
        </div>)}
      </section>
      <section className={styles.section}><h2>Inspect</h2><div className={styles.surface}>
        <button type="button" disabled={!ready} aria-pressed={!clay} onClick={() => { setClay(false); control.current?.surface(false); }}>Original</button>
        <button type="button" disabled={!ready} aria-pressed={clay} onClick={() => { setClay(true); control.current?.surface(true); }}>Clay</button>
      </div><label className={styles.check}><input type="checkbox" disabled={!ready} checked={detail} onChange={(event) => { setDetail(event.target.checked); control.current?.view(event.target.checked, angle); }} />Right arm close-up</label>
        <p className={styles.hint}>One continuous surface from the shoulder to the fingertips. The rest of the character stays in its original pose.</p>
        <div className={styles.actions}><button type="button" disabled={!ready} onClick={() => choose("rest")}>Reset pose</button><a href={manifest.runtime} download>Download GLB ↓</a></div>
      </section>
    </aside>
  </div>;
}

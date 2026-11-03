"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCharacterAssetLoader, disposeCharacterAsset } from "@/lib/character-assets";
import manifest from "@/content/character-parted.json";
import styles from "@/app/character/articulation/study.module.css";

type Surface = "palette" | "clay" | "wireframe";
type Settings = { surface: Surface; part: string; isolate: boolean; spread: number; turn: number; view: "full" | "face" | "side" | "back" };
const initial: Settings = { surface: "palette", part: "all", isolate: false, spread: 0, turn: 0, view: "full" };
const label = (name: string) => name.replaceAll("_", " ");
const headNames = new Set(["Head", "Hair", "Eye_L", "Eye_R", "Eye_detail_L", "Eye_detail_R", "Brow_L", "Brow_R", "Moustache", "Chin_beard"]);

export function PartedModelStudy() {
  const mount = useRef<HTMLDivElement>(null);
  const apply = useRef<(settings: Settings) => void>(() => {});
  const [settings, setSettings] = useState<Settings>(initial);
  const latest = useRef(settings); latest.current = settings;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const update = (values: Partial<Settings>) => setSettings(current => ({ ...current, ...values }));
  useEffect(() => { apply.current(settings); }, [settings]);
  useEffect(() => {
    const element = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { setStatus("failed"); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#f5f4ed", "#626987", 1.2));
    for (const [position, intensity] of [[[-3, 4, 5], 2.5], [[4, 1, -3], 1.4]] as const) {
      const lamp = new THREE.DirectionalLight("#ffffff", intensity); lamp.position.set(position[0], position[1], position[2]); scene.add(lamp);
    }
    const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false; controls.minDistance = .55; controls.maxDistance = 6;
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth, height = element.clientHeight;
      if (width && height) {
        renderer.setSize(width, height); camera.aspect = width / height;
        camera.zoom = Math.min(1, Math.max(.65, camera.aspect * 1.2)); camera.updateProjectionMatrix(); render();
      }
    }); resize.observe(element);
    const clay = new THREE.MeshStandardMaterial({ color: "#e6e2d7", roughness: .8 });
    const wire = new THREE.MeshBasicMaterial({ color: "#fff8ed", wireframe: true });
    const loader = createCharacterAssetLoader();
    let model: THREE.Object3D | undefined, cancelled = false;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    let previousView: Settings["view"] | undefined;
    const lost = (event: Event) => { event.preventDefault(); setStatus("failed"); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    loader.loader.load(manifest.model, gltf => {
      if (cancelled) { disposeCharacterAsset(gltf.scene); return; }
      model = gltf.scene; model.updateMatrixWorld(true);
      const meshes: THREE.Mesh[] = [];
      model.traverse(object => { if (object instanceof THREE.Mesh) {
        object.userData.reviewPart = manifest.parts.find(part => part.name === object.name || part.name === object.parent?.name)?.name ?? object.name;
        meshes.push(object); originals.set(object, object.material);
      } });
      meshes.forEach(mesh => model!.attach(mesh));
      const head = new THREE.Group(); head.name = "ReviewHeadPivot"; head.position.set(0, .65, 0); model.add(head);
      meshes.filter(mesh => headNames.has(mesh.userData.reviewPart)).forEach(mesh => head.attach(mesh));
      model.updateMatrixWorld(true);
      const parts = meshes.map(mesh => ({ mesh, rest: mesh.position.clone(), centre: new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()) }));
      const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      const scale = 1.8 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale); model.position.set(0, -.565 * scale, 0); scene.add(model);
      apply.current = values => {
        head.rotation.y = THREE.MathUtils.degToRad(values.turn);
        for (const { mesh, rest, centre } of parts) {
          mesh.position.copy(rest);
          const direction = centre.clone().sub(new THREE.Vector3(0, .6, 0));
          if (direction.lengthSq() > 0) direction.normalize();
          mesh.position.addScaledVector(direction, values.spread / 100 * .25);
          mesh.visible = !values.isolate || values.part === "all" || mesh.userData.reviewPart === values.part;
          mesh.material = values.surface === "clay" ? clay : values.surface === "wireframe" ? wire : originals.get(mesh)!;
        }
        if (previousView !== values.view) {
          previousView = values.view;
          const target = values.view === "face" ? new THREE.Vector3(0, .79 * scale - .565 * scale, 0) : new THREE.Vector3(0, 0, 0);
          controls.target.copy(target);
          const angle = values.view === "side" ? -.65 : values.view === "back" ? Math.PI : 0;
          const distance = values.view === "face" ? 1.5 : 3.6;
          camera.position.set(Math.sin(angle) * distance, target.y, Math.cos(angle) * distance); controls.update();
        }
        render();
      };
      apply.current(latest.current); setStatus("ready");
    }, undefined, () => { if (!cancelled) setStatus("failed"); });
    return () => {
      cancelled = true; apply.current = () => {};
      resize.disconnect(); controls.removeEventListener("change", render); controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      originals.forEach((material, mesh) => { mesh.material = material; });
      if (model) disposeCharacterAsset(model);
      clay.dispose(); wire.dispose(); loader.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  const disabled = status !== "ready";
  return <div className={styles.workbench}>
    <section className={styles.stage} aria-label="Parted model preview">
      <div className={styles.stageTop}><span>SUPPLIED FBX / MATERIAL STUDY</span><span className={styles.status}>{status === "ready" ? "18 PARTS · UNRIGGED" : status.toUpperCase()}</span></div>
      <div ref={mount} className={styles.viewport} role="img" aria-label="Full body character with separate parts. Drag to rotate; use the controls to inspect its structure.">
        {status !== "ready" && <div className={styles.fallback}><p role="status">{status === "loading" ? "Loading parted model…" : "3D preview unavailable. The model download is still available."}</p></div>}
      </div>
      <div className={styles.stageBottom}><div className={styles.viewButtons}>{([["full","Full body"],["face","Face"],["side","¾ view"],["back","Back"]] as const).map(([view, title]) => <button key={view} disabled={disabled} aria-pressed={settings.view === view} onClick={() => update({ view })}>{title}</button>)}</div><p>Drag to orbit · scroll to zoom</p></div>
    </section>
    <aside className={styles.controls} aria-label="Model review controls">
      <section className={styles.section}><h2>Surface</h2><div className={styles.surface}>{(["palette", "clay", "wireframe"] as const).map(surface => <button key={surface} disabled={disabled} aria-pressed={settings.surface === surface} onClick={() => update({ surface })}>{surface === "palette" ? "Color" : surface === "clay" ? "Clay" : "Wire"}</button>)}</div><p className={styles.hint}>Simple materials, without an image texture.</p></section>
      <section className={styles.section}><label htmlFor="part-choice" className={styles.controlLabel}>Inspect a part</label><select id="part-choice" disabled={disabled} value={settings.part} onChange={event => update({ part: event.target.value, isolate: event.target.value !== "all" })}><option value="all">All 18 parts</option>{manifest.parts.map(part => <option value={part.name} key={part.name}>{label(part.name)}</option>)}</select><label className={styles.check}><input type="checkbox" disabled={disabled || settings.part === "all"} checked={settings.isolate} onChange={event => update({ isolate: event.target.checked })}/>Show only selected part</label></section>
      <section className={styles.section}><label className={styles.rangeLabel} htmlFor="part-spread">Separate parts <output>{settings.spread}%</output></label><input id="part-spread" type="range" min="0" max="100" disabled={disabled} value={settings.spread} onChange={event => update({ spread: Number(event.target.value) })}/><label className={styles.rangeLabel} htmlFor="head-turn">Head turn <output>{settings.turn}°</output></label><input id="head-turn" type="range" min="-20" max="20" disabled={disabled} value={settings.turn} onChange={event => update({ turn: Number(event.target.value) })}/><p className={styles.hint}>A rigid pivot test. Hair and facial pieces follow the head together.</p></section>
      <div className={styles.actions}><button disabled={disabled} onClick={() => setSettings({ ...initial })}>Reset review</button><a href={manifest.model} download>Download review GLB ↓</a></div>
    </aside>
  </div>;
}

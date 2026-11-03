"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCharacterAssetLoader, disposeCharacterAsset } from "@/lib/character-assets";
import { bodyParts, createArticulationController, partLabels, studyPoses, type Angles, type BodyPart, type StudyPose } from "@/lib/character-articulation";
import manifest from "@/content/character-articulation.json";
import styles from "@/app/character/articulation/study.module.css";

type Surface = "textured" | "regions" | "clay";
type Controls = {
  pose: (pose: StudyPose) => void;
  rotate: (id: BodyPart, angles: Angles) => void;
  inspect: (surface: Surface, id: string, isolate: boolean, axes: boolean) => void;
  explode: (amount: number, face: boolean) => void;
  camera: (angle: number, face: boolean) => void;
};
const colors = ["#eaad77", "#a6cbae", "#edbd80", "#ed9c97", "#aeabe4", "#efce78", "#e7978a", "#a8b5e9", "#edcb7c"];

/** Isolated, on-demand renderer. This does not import the portfolio's rig/motion. */
export function ArticulationStudy() {
  const mount = useRef<HTMLDivElement>(null);
  const controls = useRef<Controls>();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [pose, setPose] = useState<StudyPose | "custom">("neutral");
  const [selected, setSelected] = useState("head");
  const [angles, setAngles] = useState<Angles>([0, 0, 0]);
  const [explosion, setExplosion] = useState(0);
  const [faceSpread, setFaceSpread] = useState(false);
  const [surface, setSurface] = useState<Surface>("textured");
  const [isolate, setIsolate] = useState(false);
  const [axes, setAxes] = useState(false);
  const [camera, setCamera] = useState(0);
  const [faceCamera, setFaceCamera] = useState(false);
  const current = useRef({ surface, selected, isolate, axes });
  current.current = { surface, selected, isolate, axes };
  const isFeature = selected.startsWith("face.");
  const ready = status === "ready";

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { setStatus("failed"); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.setAttribute("aria-label", "Separated character with orbit controls. Use the adjacent buttons and sliders for keyboard access.");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#f5f4ed", "#626987", 1.2));
    for (const [position, intensity] of [[[-3, 4, 5], 2.5], [[4, 1, -3], 1.4]] as const) {
      const lamp = new THREE.DirectionalLight("#ffffff", intensity);
      lamp.position.set(position[0], position[1], position[2]); scene.add(lamp);
    }
    const camera = new THREE.PerspectiveCamera(30, 1, .01, 25);
    camera.position.set(0, .47, 2.3);
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, .47, 0); orbit.enablePan = false; orbit.minDistance = .5; orbit.maxDistance = 8;
    const render = () => { if (!document.hidden) renderer.render(scene, camera); };
    orbit.addEventListener("change", render);
    let closeUp = false, framingRoot: THREE.Object3D | undefined, framingHead: THREE.Object3D | undefined;
    let focusPart = "head";
    const focusMeshes = new Map<string, THREE.Mesh[]>();
    const frameParts = (angle?: number) => {
      const direction = angle === undefined ? camera.position.clone().sub(orbit.target).normalize() : new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const object = closeUp ? framingHead : framingRoot;
      if (!object) return;
      const box = new THREE.Box3();
      if (closeUp && focusPart !== "head" && focusMeshes.has(focusPart)) focusMeshes.get(focusPart)!.forEach((mesh) => box.expandByObject(mesh));
      else box.setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      box.getCenter(orbit.target);
      // Fit the actual posed/exploded bounds in both dimensions. Narrow tablet
      // and phone canvases need more distance than the wide desktop stage.
      const halfView = Math.max(size.y / 2, size.x / (2 * camera.aspect));
      const distance = halfView / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.18 + size.z / 2;
      camera.position.copy(orbit.target).addScaledVector(direction, distance);
      orbit.update(); render();
    };
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height;
      camera.updateProjectionMatrix(); frameParts(); render();
    });
    resize.observe(element);
    const resume = () => render();
    document.addEventListener("visibilitychange", resume);
    let cancelled = false, model: THREE.Object3D | undefined;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    const partIds = new Map<THREE.Mesh, string>();
    const regionMaterials: THREE.Material[] = [];
    const clay = new THREE.MeshStandardMaterial({ color: "#e8e1d3", roughness: .85 });
    const axisHelpers: THREE.AxesHelper[] = [];
    const loader = createCharacterAssetLoader();
    const lost = (event: Event) => { event.preventDefault(); setStatus("failed"); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    loader.loader.load(manifest.runtime, (gltf) => {
      if (cancelled) { disposeCharacterAsset(gltf.scene); return; }
      model = gltf.scene;
      try {
        const rig = createArticulationController(model);
        framingRoot = model; framingHead = rig.joints.get("head");
        scene.add(model);
        const regions = new Map<string, THREE.MeshStandardMaterial>();
        manifest.parts.forEach((part, index) => {
          const color = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: .8 });
          regions.set(part.id, color); regionMaterials.push(color);
        });
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          originals.set(child, child.material);
          let owner: THREE.Object3D | null = child;
          while (owner && !owner.userData.part_id) owner = owner.parent;
          if (!owner) throw new Error("Mesh has no prepared part identifier");
          partIds.set(child, owner.userData.part_id);
          const id = owner.userData.part_id as string;
          focusMeshes.set(id, [...(focusMeshes.get(id) ?? []), child]);
        });
        rig.joints.forEach((joint, id) => {
          if (id.startsWith("face.")) return;
          const helper = new THREE.AxesHelper(.065);
          helper.visible = false; helper.renderOrder = 2;
          (helper.material as THREE.LineBasicMaterial).depthTest = false;
          joint.add(helper); axisHelpers.push(helper);
        });
        controls.current = {
          pose(name) { rig.pose(name); frameParts(); },
          rotate(id, values) { rig.rotate(id, values); frameParts(); },
          explode(amount, face) { rig.explode(amount, face); frameParts(); },
          inspect(mode, id, solo, showAxes) {
            focusPart = id;
            originals.forEach((material, mesh) => {
              const part = partIds.get(mesh)!;
              mesh.material = mode === "textured" ? material : mode === "clay" ? clay : regions.get(part)!;
              mesh.visible = !solo || part === id || (id === "head" && part.startsWith("face."));
            });
            axisHelpers.forEach((helper) => { helper.visible = showAxes && (!solo || helper.parent?.userData.joint_id === id); });
            if (closeUp) frameParts(); else render();
          },
          camera(angle, face) {
            closeUp = face; frameParts(angle);
          },
        };
        const state = current.current;
        controls.current.inspect(state.surface, state.selected, state.isolate, state.axes);
        frameParts(0); setStatus("ready");
      } catch (error) { console.error("Articulation study preparation failed", error); scene.remove(model); disposeCharacterAsset(model); model = undefined; setStatus("failed"); }
    }, undefined, () => { if (!cancelled) setStatus("failed"); });
    return () => {
      cancelled = true; controls.current = undefined;
      resize.disconnect(); orbit.removeEventListener("change", render); orbit.dispose();
      document.removeEventListener("visibilitychange", resume);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      axisHelpers.forEach((helper) => { helper.removeFromParent(); helper.dispose(); });
      originals.forEach((material, mesh) => { mesh.material = material; });
      if (model) disposeCharacterAsset(model);
      regionMaterials.forEach((material) => material.dispose()); clay.dispose();
      loader.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  useEffect(() => { controls.current?.inspect(surface, selected, isolate, axes); }, [surface, selected, isolate, axes]);
  const choosePose = (name: StudyPose) => {
    setPose(name); controls.current?.pose(name);
    const rotations = studyPoses[name].rotations as Partial<Record<BodyPart, number[]>>;
    setAngles([...(rotations[selected as BodyPart] ?? [0, 0, 0])] as Angles);
  };
  const choosePart = (id: string) => {
    setSelected(id);
    if (pose !== "custom") {
      const rotations = studyPoses[pose].rotations as Partial<Record<BodyPart, number[]>>;
      setAngles([...(rotations[id as BodyPart] ?? [0, 0, 0])] as Angles);
    } else setAngles(jointAngles.current.get(id) ?? [0, 0, 0]);
  };
  // Keep each manual joint's values when selecting a different part.
  const jointAngles = useRef(new Map<string, Angles>());
  const rotate = (axis: number, value: number) => {
    const next = [...angles] as Angles; next[axis] = value;
    if (pose !== "custom") {
      const rotations = studyPoses[pose].rotations as Partial<Record<BodyPart, number[]>>;
      bodyParts.forEach((id) => jointAngles.current.set(id, [...(rotations[id] ?? [0, 0, 0])] as Angles));
    }
    jointAngles.current.set(selected, next); setAngles(next); setPose("custom"); controls.current?.rotate(selected as BodyPart, next);
  };
  const parent = manifest.parts.find((part) => part.id === selected)?.parent;
  const limit = selected === "neck" || selected === "torso" ? 20 : selected === "head" ? 45 : 120;

  return <div className={styles.workbench}>
    <section className={styles.stage} aria-label="Character preview">
      <div className={styles.stageTop}><span>{manifest.parts.length} NAMED PARTS / RIGID STUDY</span><span className={styles.status} role="status">{ready ? "READY TO INSPECT" : status === "failed" ? "PREVIEW UNAVAILABLE" : "PREPARING MESH…"}</span></div>
      <div ref={mount} className={styles.viewport}>
        {!ready && <div className={styles.fallback}><Image src="/character/smoothed-poster.png" width={512} height={512} unoptimized alt="Approved character in its neutral pose" /><p>{status === "failed" ? "3D unavailable. The mesh download and preparation notes remain available." : "Loading the separated character…"}</p></div>}
      </div>
      <div className={styles.stageBottom}><div className={styles.viewButtons}>
        {([["Front", 0], ["¾ view", -.6], ["Side", -Math.PI / 2], ["Back", Math.PI]] as const).map(([label, value]) => <button key={label} type="button" disabled={!ready} aria-pressed={camera === value} onClick={() => { setCamera(value); controls.current?.camera(value, faceCamera); }}>{label}</button>)}
      </div><p>Drag to orbit · scroll to zoom</p></div>
    </section>
    <aside className={styles.controls} aria-label="Articulation controls">
      <section className={styles.section}><h2>Held poses</h2><div className={styles.poses}>
        {(Object.entries(studyPoses) as [StudyPose, typeof studyPoses[StudyPose]][]).map(([id, item]) => <button key={id} type="button" disabled={!ready} aria-pressed={pose === id} onClick={() => choosePose(id)}>{item.label}</button>)}
      </div></section>
      <section className={styles.section}><h2>Inspect the separation</h2><div className={styles.surface}>
        {(["textured", "regions", "clay"] as const).map((mode) => <button key={mode} type="button" disabled={!ready} aria-pressed={surface === mode} onClick={() => setSurface(mode)}>{mode === "regions" ? "Part colors" : mode === "clay" ? "Clay" : "Original"}</button>)}
      </div>
        <label className={styles.rangeLabel} htmlFor="explode">Exploded view<output>{Math.round(explosion * 100)}%</output></label>
        <input id="explode" type="range" min="0" max="100" value={Math.round(explosion * 100)} disabled={!ready} onChange={(event) => { const value = Number(event.target.value) / 100; setExplosion(value); controls.current?.explode(value, faceSpread); }} />
        <label className={styles.check}><input type="checkbox" checked={faceSpread} disabled={!ready} onChange={(event) => { setFaceSpread(event.target.checked); controls.current?.explode(explosion, event.target.checked); }} />Separate facial patches too</label>
        <label className={styles.check}><input type="checkbox" checked={axes} disabled={!ready} onChange={(event) => setAxes(event.target.checked)} />Show joint axes</label>
      </section>
      <section className={styles.section}>
        <label className={styles.controlLabel} htmlFor="part">Selected part</label>
        <select id="part" value={selected} disabled={!ready} onChange={(event) => choosePart(event.target.value)}><optgroup label="Body · character’s left and right">{bodyParts.map((id) => <option key={id} value={id}>{partLabels[id]}</option>)}</optgroup><optgroup label="Face · inspection patches">{manifest.parts.filter((part) => part.id.startsWith("face.")).map((part) => <option key={part.id} value={part.id}>{partLabels[part.id] ?? part.id}</option>)}</optgroup></select>
        <p className={styles.path}>{parent ? `${partLabels[parent] ?? parent} → ` : "Root → "}{partLabels[selected]}</p>
        <label className={styles.check}><input type="checkbox" checked={isolate} disabled={!ready} onChange={(event) => setIsolate(event.target.checked)} />Isolate selected part</label>
        <label className={styles.check}><input type="checkbox" checked={faceCamera} disabled={!ready} onChange={(event) => { setFaceCamera(event.target.checked); controls.current?.camera(camera, event.target.checked); }} />Focus selected part</label>
        {isFeature ? <p className={styles.hint}>This is a separated surface patch. Use the exploded view to inspect it. Expression controls come after rebuilding the moving facial anatomy.</p> : <>
          {(["Pitch · X", "Turn · Y", "Tilt · Z"] as const).map((label, axis) => <div key={label}><label className={styles.rangeLabel} htmlFor={`joint-${axis}`}>{label}<output>{angles[axis]}°</output></label><input id={`joint-${axis}`} type="range" min={-limit} max={limit} step="1" disabled={!ready} value={angles[axis]} onChange={(event) => rotate(axis, Number(event.target.value))} /></div>)}
          <p className={styles.hint}>Rigid joint check. Seams in rotated poses are expected; fabric deformation is the next stage.</p>
        </>}
        <div className={styles.actions}><button type="button" disabled={!ready} onClick={() => { choosePose("neutral"); setExplosion(0); setFaceSpread(false); setIsolate(false); setAxes(false); setCamera(0); setFaceCamera(false); controls.current?.explode(0, false); controls.current?.camera(0, false); }}>Reset study</button><a href={manifest.runtime} download>Download GLB ↓</a></div>
      </section>
    </aside>
  </div>;
}

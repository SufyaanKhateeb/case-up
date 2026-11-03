"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCharacterAssetLoader, disposeCharacterAsset } from "@/lib/character-assets";
import manifest from "@/content/character-rigged.json";
import styles from "@/app/character/articulation/study.module.css";

type Settings = { playing: boolean; skeleton: boolean; clay: boolean; speed: number; pose: "walk" | "rest"; view: "front" | "side" | "back" | "face" };
const defaults: Settings = { playing: true, skeleton: false, clay: false, speed: 1, pose: "walk", view: "front" };
export function RiggedModelStudy() {
  const mount = useRef<HTMLDivElement>(null), apply = useRef<(settings: Settings) => void>(() => {});
  const [settings, setSettings] = useState(defaults), [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [duration, setDuration] = useState(0);
  const latest = useRef(settings); latest.current = settings;
  const update = (values: Partial<Settings>) => setSettings(current => ({ ...current, ...values }));
  useEffect(() => { apply.current(settings); }, [settings]);
  useEffect(() => {
    const element = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); } catch { setStatus("failed"); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight("#f5f4ed", "#626987", 1.2));
    for (const [point, intensity] of [[[-3, 4, 5], 2.5], [[4, 1, -3], 1.4]] as const) { const lamp = new THREE.DirectionalLight("#ffffff", intensity); lamp.position.set(point[0], point[1], point[2]); scene.add(lamp); }
    const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.minDistance = .6; controls.maxDistance = 6;
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    const resize = new ResizeObserver(() => { if (element.clientWidth && element.clientHeight) {
      renderer.setSize(element.clientWidth, element.clientHeight); camera.aspect = element.clientWidth / element.clientHeight;
      camera.zoom = Math.min(1, Math.max(.65, camera.aspect * 1.2)); camera.updateProjectionMatrix(); render();
    } }); resize.observe(element);
    const loader = createCharacterAssetLoader(), clay = new THREE.MeshStandardMaterial({ color: "#e6e2d7", roughness: .8 });
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    let model: THREE.Object3D | undefined, mixer: THREE.AnimationMixer | undefined, action: THREE.AnimationAction | undefined, helper: THREE.SkeletonHelper | undefined, cancelled = false, previous: Settings | undefined;
    let frame = 0, lastTime = performance.now(), scale = 1, centerY = 0;
    const lost = (event: Event) => { event.preventDefault(); setStatus("failed"); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      const delta = Math.min((time - lastTime) / 1000, .05); lastTime = time;
      if (!document.hidden && model && mixer && latest.current.playing && latest.current.pose === "walk") { mixer.update(delta * latest.current.speed); render(); }
    };
    frame = requestAnimationFrame(tick);
    loader.loader.load(manifest.model, gltf => {
      if (cancelled) { disposeCharacterAsset(gltf.scene); return; }
      model = gltf.scene;
      model.updateMatrixWorld(true);
      const bindWorld = new Map<THREE.Bone, THREE.Matrix4>();
      model.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.skeleton.bones.forEach((bone, index) => {
        bindWorld.set(bone, object.skeleton.boneInverses[index].clone().invert());
      }); });
      // Mixamo has a rotated non-bone armature parent. Include that parent when
      // deriving the root joint's local bind transform, before preview scaling.
      const bindPose = Array.from(bindWorld, ([bone, world]) => {
        const parent = bone.parent instanceof THREE.Bone ? bindWorld.get(bone.parent)! : bone.parent?.matrixWorld ?? new THREE.Matrix4();
        const local = parent.clone().invert().multiply(world);
        const position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
        local.decompose(position, quaternion, scale); return { bone, position, quaternion, scale };
      });
      const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      scale = 1.8 / size.y; centerY = center.y;
      model.scale.setScalar(scale); model.position.copy(center).multiplyScalar(-scale); scene.add(model);
      model.traverse(object => { if (object instanceof THREE.Mesh) originals.set(object, object.material); });
      helper = new THREE.SkeletonHelper(model); (helper.material as THREE.LineBasicMaterial).depthTest = false; helper.renderOrder = 2; helper.visible = false; scene.add(helper);
      if (!gltf.animations.length) { setStatus("failed"); return; }
      // Keep the downloaded clip intact. Only this review copy removes floor travel.
      const clip = gltf.animations[0].clone();
      for (const track of clip.tracks) if (/Hips\.position$/.test(track.name) && track.getValueSize() === 3) { const x = track.values[0], z = track.values[2]; for (let i = 0; i < track.values.length; i += 3) { track.values[i] = x; track.values[i + 2] = z; } }
      mixer = new THREE.AnimationMixer(model); action = mixer.clipAction(clip); action.play(); setDuration(clip.duration);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { latest.current = { ...latest.current, playing: false }; setSettings(current => ({ ...current, playing: false })); }
      apply.current = values => {
        originals.forEach((material, mesh) => { mesh.material = values.clay ? clay : material; });
        helper!.visible = values.skeleton;
        if (previous?.pose !== values.pose) {
          if (values.pose === "rest") {
            mixer!.stopAllAction();
            bindPose.forEach(({ bone, position, quaternion, scale }) => { bone.position.copy(position); bone.quaternion.copy(quaternion); bone.scale.copy(scale); });
            model!.updateMatrixWorld(true);
          }
          else { action!.reset().play(); mixer!.update(0); }
        }
        if (previous?.view !== values.view) {
          const target = values.view === "face" ? new THREE.Vector3(0, (.84 - centerY) * scale, 0) : new THREE.Vector3();
          const angle = values.view === "side" ? -.65 : values.view === "back" ? Math.PI : 0;
          const distance = values.view === "face" ? 1.55 : 3.7;
          controls.target.copy(target); camera.position.set(Math.sin(angle) * distance, target.y, Math.cos(angle) * distance); controls.update();
        }
        previous = { ...values }; render();
      };
      apply.current(latest.current); setStatus("ready");
    }, undefined, () => { if (!cancelled) setStatus("failed"); });
    return () => {
      cancelled = true; cancelAnimationFrame(frame); apply.current = () => {};
      resize.disconnect(); controls.removeEventListener("change", render); controls.dispose(); renderer.domElement.removeEventListener("webglcontextlost", lost);
      mixer?.stopAllAction(); if (model) { mixer?.uncacheRoot(model); originals.forEach((material, mesh) => { mesh.material = material; }); disposeCharacterAsset(model); }
      helper?.geometry.dispose(); if (helper) (helper.material as THREE.Material).dispose();
      clay.dispose(); loader.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  const disabled = status !== "ready";
  return <div className={styles.workbench}>
    <section className={styles.stage} aria-label="Rigged character preview"><div className={styles.stageTop}><span>STRUT WALKING / MIXAMO RIG</span><span className={styles.status}>{status === "ready" ? "65 BONES · " + duration.toFixed(2) + "s CLIP" : status.toUpperCase()}</span></div><div ref={mount} className={styles.viewport} role="img" aria-label="Rigged character with supplied walking animation. Drag to orbit.">{status !== "ready" && <div className={styles.fallback}><p role="status">{status === "loading" ? "Loading rigged character…" : "3D preview unavailable. The model download remains available."}</p></div>}</div><div className={styles.stageBottom}><div className={styles.viewButtons}>{([["front","Front"],["side","¾ view"],["back","Back"],["face","Face"]] as const).map(([view,title]) => <button key={view} disabled={disabled} aria-pressed={settings.view === view} onClick={() => update({ view })}>{title}</button>)}</div><p>Drag to orbit · scroll to zoom</p></div></section>
    <aside className={styles.controls} aria-label="Rig review controls">
      <section className={styles.section}><h2>Animation</h2><div className={styles.poses}><button disabled={disabled} aria-pressed={settings.pose === "walk"} onClick={() => update({ pose: "walk" })}>Strut walk</button><button disabled={disabled} aria-pressed={settings.pose === "rest"} onClick={() => update({ pose: "rest", playing: false })}>Rest pose</button></div><div className={styles.actions}><button disabled={disabled || settings.pose === "rest"} onClick={() => update({ playing: !settings.playing })}>{settings.playing ? "Pause" : "Play"}</button></div><label className={styles.rangeLabel} htmlFor="walk-speed">Speed <output>{settings.speed.toFixed(2)}×</output></label><input id="walk-speed" type="range" min=".25" max="1.5" step=".25" disabled={disabled} value={settings.speed} onChange={event => update({ speed: Number(event.target.value) })}/><p className={styles.hint}>Loops in place for review. The exported file retains the supplied motion.</p></section>
      <section className={styles.section}><h2>Inspection</h2><label className={styles.check}><input type="checkbox" checked={settings.skeleton} disabled={disabled} onChange={event => update({ skeleton: event.target.checked })}/>Show skeleton</label><label className={styles.check}><input type="checkbox" checked={settings.clay} disabled={disabled} onChange={event => update({ clay: event.target.checked })}/>Clay materials</label><p className={styles.hint}>Body and fingers are rigged. Facial expressions still need their own controls.</p></section>
      <div className={styles.actions}><button disabled={disabled} onClick={() => setSettings({ ...defaults })}>Reset review</button><a href={manifest.model} download>Download rigged GLB ↓</a></div>
    </aside>
  </div>;
}

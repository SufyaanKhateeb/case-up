"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function disposeModel(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

/** Isolated asset inspection: no changes to the portfolio's animated rig. */
export function HunyuanStudy() {
  const mount = useRef<HTMLDivElement>(null);
  const view = useRef<(angle: number) => void>(() => {});
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [angle, setAngle] = useState(0);
  const [modelChoice, setModelChoice] = useState<"multi" | "single">("multi");
  const modelUrl = modelChoice === "multi" ? "/character/hunyuan-multiview-study.glb" : "/character/hunyuan-shape-study.glb";
  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    setStatus("loading"); setAngle(0);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { setStatus("failed"); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight("#f5f4ed", "#626987", 2));
    for (const [position, intensity] of [[[-3, 4, 5], 3], [[4, 1, -3], 2]] as const) {
      const lamp = new THREE.DirectionalLight("#ffffff", intensity); lamp.position.set(position[0], position[1], position[2]); scene.add(lamp);
    }
    const camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
    camera.position.set(0, 0, 3.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false; controls.minDistance = 1.7; controls.maxDistance = 7;
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    });
    resize.observe(element);
    let cancelled = false, model: THREE.Object3D | undefined;
    const lost = (event: Event) => { event.preventDefault(); setStatus("failed"); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    new GLTFLoader().load(modelUrl, (gltf) => {
      if (cancelled) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      const scale = 1.8 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale); model.position.copy(center).multiplyScalar(-scale);
      scene.add(model); controls.update(); render(); setStatus("ready");
    }, undefined, () => { if (!cancelled) setStatus("failed"); });
    view.current = (rotation) => {
      camera.position.set(Math.sin(rotation) * 3.6, 0, Math.cos(rotation) * 3.6);
      controls.target.set(0, 0, 0); controls.update(); render();
    };
    return () => {
      cancelled = true; view.current = () => {};
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      resize.disconnect(); controls.removeEventListener("change", render); controls.dispose();
      if (model) disposeModel(model);
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [modelUrl]);
  return <div>
    <div style={{ display: "flex", gap: 8, padding: "14px 20px 0" }} aria-label="Choose generated model">
      {([["multi", "Four views · 2mv"], ["single", "One view · 2.1"]] as const).map(([choice, label]) => <button key={choice} type="button" aria-pressed={modelChoice === choice} onClick={() => setModelChoice(choice)} style={{ minHeight: 44, padding: "9px 16px", borderRadius: 40, background: modelChoice === choice ? "#f8f9f2" : "#ffffff18", color: modelChoice === choice ? "#111210" : "inherit" }}>{label}</button>)}
    </div>
    <div ref={mount} role="img" aria-label="Interactive untextured Hunyuan3D character mesh. Use the view buttons to inspect all sides." style={{ aspectRatio: "1", width: "100%", position: "relative" }}>
      {status !== "ready" && <p role="status" style={{ position: "absolute", inset: 24, pointerEvents: "none" }}>{status === "loading" ? "Loading generated mesh…" : "3D preview unavailable. The reference and mesh download remain available."}</p>}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 20px 18px", alignItems: "center" }}>
      {([["Front", 0], ["Three-quarter", -.55], ["Back", Math.PI]] as const).map(([label, rotation]) => <button key={label} type="button" disabled={status !== "ready"} aria-pressed={angle === rotation} onClick={() => { setAngle(rotation); view.current(rotation); }} style={{ minHeight: 44, padding: "9px 16px", borderRadius: 40, background: angle === rotation ? "#f8f9f2" : "#ffffff18", color: angle === rotation ? "#111210" : "inherit" }}>{label}</button>)}
      <a href={modelUrl} download style={{ padding: "12px 4px", fontSize: 13, marginLeft: "auto" }}>Download mesh ↓</a>
    </div>
  </div>;
}

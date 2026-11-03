"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { characterManifest } from "@/content/character";
import type { CharacterState } from "@/lib/character-state";
import gsap from "gsap";
import { chapterGesture, type TourFrame } from "@/lib/character-tour";
import { HEAD_HEIGHT, HEAD_RADIUS } from "./model";
import { chapterStep } from "@/lib/character-state";
import { characterRenderWindow } from "@/lib/character-render";
import { createCharacterAssetLoader, disposeCharacterAsset } from "@/lib/character-assets";
import { createImportedCharacter, type ImportedCharacterRig } from "./imported-model";
import { createCharacterMotion } from "./motion";
import { createCharacterComposite } from "./composite";

function FitCamera() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    camera.zoom = 1;
    camera.position.set(size.width / 2, -size.height / 2, 2000);
    camera.lookAt(size.width / 2, -size.height / 2, 0);
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.height, size.width, invalidate]);
  return null;
}

function ContextHealth({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}


type Props = {
  state: CharacterState;
  tour: MutableRefObject<TourFrame>;
  accessories: string[];
  active: boolean;
  reducedMotion: boolean;
  onFailure: () => void;
  onReady: () => void;
  look: MutableRefObject<{ x: number; y: number }>;
};

function ColorCharacter({ state, tour, accessories, active, reducedMotion, look, rig }: Omit<Props, "onFailure" | "onReady"> & { rig: ImportedCharacterRig }) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const animation = useMemo(() => createCharacterMotion(rig), [rig]);
  const previousMode = useRef(state.mode);
  const previousCue = useRef({ chapter: state.chapter, step: 0 });
  const travel = useRef({ x: tour.current.x, lean: 0 });
  const chapter = state.mode === "tour" ? state.chapter : null;
  const cueActive = !chapter?.startsWith("project") || state.progress > 0;
  const step = state.mode === "tour" ? chapterStep(state.progress) : 0;
  const swipeStep = size.width >= 768 && size.width > size.height ? chapterStep(state.progress + .1 / (.42 * 3)) : step;
  const composite = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 });
    const detailTarget = new THREE.WebGLRenderTarget(256, 256, { type: target.texture.type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 });
    const material = createCharacterComposite(target.texture);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const output = new THREE.Scene(); output.add(new THREE.Mesh(geometry, material));
    return { target, detailTarget, detailCamera: new THREE.OrthographicCamera(), material, geometry, output, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, []);

  useEffect(() => {
    const dpr = Math.min(gl.getPixelRatio(), 1.5);
    composite.target.setSize(Math.ceil(size.width * dpr), Math.ceil(size.height * dpr));
    invalidate();
  }, [size.width, size.height, gl, composite, invalidate]);
  useEffect(() => { animation.setActive(active && !reducedMotion); invalidate(); }, [animation, active, reducedMotion, invalidate]);
  useEffect(() => {
    if (!reducedMotion) return;
    const repaint = () => invalidate();
    window.addEventListener("scroll", repaint, { passive: true });
    return () => window.removeEventListener("scroll", repaint);
  }, [reducedMotion, invalidate]);
  useEffect(() => {
    if (reducedMotion) { animation.rest(true); invalidate(); return; }
    if (state.mode === "drag") animation.grab();
    else if (state.trick) animation.perform(state.trick);
    else {
      const gesture = cueActive ? chapterGesture(chapter ?? "", step) : null;
      const direction = tour.current.x > size.width / 2 ? -1 : 1;
      if (gesture) {
        const target = chapter?.startsWith("project") ? document.querySelector<HTMLElement>(`#${chapter} .phone-demo, #${chapter} .scratch-demo, #${chapter} .variant-device`)?.getBoundingClientRect() : undefined;
        const scale = tour.current.radius / HEAD_RADIUS;
        const aim = target ? { x: (target.left + target.width / 2 - tour.current.x) / scale, y: (tour.current.y - target.top - target.height / 2) / scale } : undefined;
        if (chapter?.startsWith("project") && previousCue.current.chapter === chapter && previousCue.current.step !== swipeStep) animation.swipe(direction, aim);
        animation.gesture(gesture, direction, aim);
      }
      else if (previousMode.current === "drag") animation.release();
      else animation.rest();
    }
    previousMode.current = state.mode;
    previousCue.current = { chapter: chapter ?? "", step: swipeStep };
    invalidate();
  }, [animation, state.mode, state.trick, state.actionId, chapter, step, swipeStep, cueActive, reducedMotion, tour, size.width, size.height, invalidate]);
  const accessoryKey = Array.from(new Set(accessories)).sort().join(",");
  useEffect(() => {
    const names = accessoryKey.split(",");
    const timeline = gsap.timeline();
    Object.entries(rig.accessories).forEach(([name, object]) => {
      const worn = names.includes(name);
      if (worn) object.visible = true;
      timeline.to(object.scale, { x: worn ? 1 : 0, y: worn ? 1 : 0, z: worn ? 1 : 0, duration: reducedMotion ? 0 : worn ? .5 : .2, ease: worn ? "back.out(2.5)" : "power2.in", onUpdate: invalidate, onComplete: () => { object.visible = worn; invalidate(); } }, 0);
    });
    return () => { timeline.kill(); };
  }, [accessoryKey, reducedMotion, rig, invalidate]);
  useEffect(() => () => {
    animation.dispose(); composite.target.dispose(); composite.detailTarget.dispose(); composite.material.dispose(); composite.geometry.dispose();
  }, [animation, rig, composite]);

  // Shade in linear light, then composite once into the transparent color canvas.
  useFrame(({ clock }, delta) => {
    animation.update(clock.elapsedTime, Math.min(delta, .05), look.current, reducedMotion);
    rig.sync();
    const frame = tour.current;
    const scale = frame.radius / HEAD_RADIUS;
    const velocity = (frame.x - travel.current.x) / Math.max(frame.radius, 1) / Math.max(delta * 60, .1);
    travel.current.x = frame.x;
    travel.current.lean = reducedMotion ? 0 : THREE.MathUtils.damp(travel.current.lean, THREE.MathUtils.clamp(-velocity * .5, -.12, .12), 6, Math.min(delta, .05));
    const lean = rig.motion.lean + travel.current.lean;
    const stem = (HEAD_HEIGHT - rig.motion.hop) * scale;
    rig.root.scale.setScalar(scale);
    rig.root.rotation.set(0, frame.turn + rig.motion.turn, lean);
    rig.root.position.set(frame.x + Math.sin(lean) * stem, -frame.y - Math.cos(lean) * stem, 0);
    composite.material.uniforms.clipCircle.value.set(frame.x, size.height - frame.y, frame.clip);
    composite.material.uniforms.cover.value = rig.motion.cover;
    composite.material.uniforms.develop.value = rig.motion.develop;
    const detail = characterRenderWindow(frame.x, frame.y, frame.clip, size.width, size.height);
    composite.material.uniforms.outputDpr.value = gl.getPixelRatio();
    if (detail && camera instanceof THREE.OrthographicCamera) {
      composite.detailCamera.copy(camera);
      composite.detailCamera.setViewOffset(size.width, size.height, detail.left, detail.top, detail.diameter, detail.diameter);
      composite.material.uniforms.sourceRect.value.set(...detail.sourceRect);
      composite.material.uniforms.sceneTexture.value = composite.detailTarget.texture;
      gl.setRenderTarget(composite.detailTarget); gl.clear(); gl.render(scene, composite.detailCamera);
    } else {
      composite.material.uniforms.sourceRect.value.set(0, 0, 1, 1);
      composite.material.uniforms.sceneTexture.value = composite.target.texture;
      gl.setRenderTarget(composite.target); gl.clear(); gl.render(scene, camera);
    }
    gl.setRenderTarget(null); gl.clear(); gl.render(composite.output, composite.camera);
  }, 1);
  return <primitive object={rig.root} dispose={null} />;
}

function ApprovedCharacter(props: Props) {
  const [rig, setRig] = useState<ImportedCharacterRig | null>(null);
  const callbacks = useRef({ onReady: props.onReady, onFailure: props.onFailure });
  callbacks.current = { onReady: props.onReady, onFailure: props.onFailure };
  useEffect(() => {
    let cancelled = false, ownedRig: ImportedCharacterRig | undefined;
    const asset = createCharacterAssetLoader();
    asset.loader.load(characterManifest.model, (gltf) => {
      if (cancelled) { disposeCharacterAsset(gltf.scene); return; }
      try {
        ownedRig = createImportedCharacter(gltf.scene, characterManifest.look);
        setRig(ownedRig); callbacks.current.onReady();
      } catch {
        disposeCharacterAsset(gltf.scene); callbacks.current.onFailure();
      }
    }, undefined, () => { if (!cancelled) callbacks.current.onFailure(); });
    return () => { cancelled = true; ownedRig?.dispose(); asset.dispose(); };
  }, []);
  return rig ? <ColorCharacter {...props} rig={rig} /> : null;
}

export default function CharacterScene(props: Props) {
  // R3F defaults its wrapper to pointer-events:auto, overriding the paint layer.
  // All character input belongs to the separate, tightly bounded HTML handle.
  return <Canvas style={{ pointerEvents: "none" }} aria-hidden="true" orthographic camera={{ position: [0, 0, 2000], zoom: 1, near: .1, far: 4000 }} dpr={[1, 2]} frameloop={props.active && !props.reducedMotion ? "always" : "demand"} gl={{ alpha: true, antialias: false, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; }} fallback={<span>Character preview unavailable</span>}>
    <FitCamera />
    <ContextHealth onFailure={props.onFailure} />
    <hemisphereLight args={["#f5f4ed", "#626987", 1.2]} />
    <directionalLight position={[-3, 4, 5]} color="#ffffff" intensity={2.5} />
    <directionalLight position={[4, 1, -3]} color="#ffffff" intensity={1.4} />
    <ApprovedCharacter {...props} />
  </Canvas>;
}

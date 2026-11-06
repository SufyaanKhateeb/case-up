"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { characterManifest } from "@/content/character";
import type { CharacterState } from "@/lib/character-state";
import gsap from "gsap";
import { chapterGesture, type TourFrame } from "@/lib/character-tour";
import { HEAD_HEIGHT, HEAD_RADIUS } from "./model";
import { chapterStep } from "@/lib/character-state";
import { characterPrintSettings, characterPrintWindow } from "@/lib/character-print";
import { createCharacter } from "./model";
import { createCharacterMotion } from "./motion";

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

const vertexShader = `varying vec2 vUv;
void main() { vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;
const fragmentShader = `
uniform sampler2D sceneTexture;
uniform vec3 ink;
uniform vec3 paper;
uniform float pixelSize;
uniform float outputDpr;
uniform float ditherStrength;
uniform vec4 sourceRect;
uniform float cover;
uniform float develop;
uniform vec3 clipCircle;
varying vec2 vUv;
float bayer2(vec2 p) { p=floor(p); return fract(p.x*.5+p.y*p.y*.75); }
float bayer4(vec2 p) { return bayer2(p*.5)*.25+bayer2(p); }
void main() {
  vec2 screen=gl_FragCoord.xy/outputDpr;
  if(distance(screen,clipCircle.xy)>clipCircle.z) discard;
  vec4 color=texture2D(sceneTexture,(vUv-sourceRect.xy)/sourceRect.zw);
  vec2 pixel=floor(screen/pixelSize);
  float grain=fract(sin(dot(pixel,vec2(12.9898,78.233)))*43758.5453);
  float key=(grain+1.0-vUv.y)*.5;
  if(color.a<.5 || key>=cover) discard;
  float luminance=pow(max(0.0,dot(color.rgb,vec3(.2126,.7152,.0722))),1.0/2.2);
  float printed=luminance>bayer4(pixel) ? 1.0 : 0.0;
  float tone=key<develop ? mix(luminance,printed,ditherStrength) : 0.0;
  gl_FragColor=vec4(mix(ink,paper,tone),1.0);
  #include <colorspace_fragment>
}`;

type Props = {
  state: CharacterState;
  tour: MutableRefObject<TourFrame>;
  accessories: string[];
  active: boolean;
  reducedMotion: boolean;
  sleeping: boolean;
  onFailure: () => void;
  look: MutableRefObject<{ x: number; y: number }>;
};

function PrintedCharacter({ state, tour, accessories, active, reducedMotion, sleeping, look }: Omit<Props, "onFailure">) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const rig = useMemo(() => createCharacter(characterManifest.look), []);
  const animation = useMemo(() => createCharacterMotion(rig), [rig]);
  const previousMode = useRef(state.mode);
  const wasSleeping = useRef(false);
  const previousCue = useRef({ chapter: state.chapter, step: 0 });
  const travel = useRef({ x: tour.current.x, lean: 0 });
  const basePixelSize = useRef(2);
  const chapter = state.mode === "tour" ? state.chapter : null;
  const cueActive = !chapter?.startsWith("project") || state.progress > 0;
  const step = state.mode === "tour" ? chapterStep(state.progress) : 0;
  const swipeStep = size.width >= 768 && size.width > size.height ? chapterStep(state.progress + .1 / (.42 * 3)) : step;
  const print = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: gl.extensions.has("EXT_color_buffer_float") ? THREE.HalfFloatType : THREE.UnsignedByteType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    const detailTarget = new THREE.WebGLRenderTarget(256, 256, { type: target.texture.type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 });
    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        sceneTexture: { value: target.texture }, ink: { value: new THREE.Color(characterManifest.look.colors.ink) }, paper: { value: new THREE.Color(characterManifest.look.colors.paper) },
        clipCircle: { value: new THREE.Vector3(0, 0, 10000) }, pixelSize: { value: 2 }, outputDpr: { value: 1 }, ditherStrength: { value: 1 }, sourceRect: { value: new THREE.Vector4(0, 0, 1, 1) }, cover: { value: 1 }, develop: { value: 1 },
      },
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const output = new THREE.Scene(); output.add(new THREE.Mesh(geometry, material));
    return { target, detailTarget, detailCamera: new THREE.OrthographicCamera(), material, geometry, output, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, [gl]);

  useEffect(() => {
    const pixelSize = window.innerWidth < 768 ? Math.round(devicePixelRatio * 4 / 3) / devicePixelRatio : 2;
    basePixelSize.current = pixelSize;
    print.target.setSize(Math.ceil(size.width / pixelSize), Math.ceil(size.height / pixelSize));
    print.material.uniforms.pixelSize.value = pixelSize;
    invalidate();
  }, [size.width, size.height, print, invalidate]);
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
    else if (sleeping) animation.sleep();
    else if (wasSleeping.current) animation.wake();
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
    wasSleeping.current = sleeping && state.mode === "tour";
    previousCue.current = { chapter: chapter ?? "", step: swipeStep };
    invalidate();
  }, [animation, state.mode, state.trick, state.actionId, chapter, step, swipeStep, cueActive, reducedMotion, sleeping, tour, size.width, size.height, invalidate]);
  const accessoryKey = Array.from(new Set(accessories)).sort().join(",");
  useEffect(() => {
    const names = accessoryKey.split(",");
    const timeline = gsap.timeline();
    Object.entries(rig.accessories).forEach(([name, object]) => {
      const worn = names.includes(name);
      if (worn) object.visible = true;
      timeline.to(object.scale, { x: worn ? 1 : 0, y: worn ? 1 : 0, z: worn ? 1 : 0, duration: reducedMotion ? 0 : worn ? .5 : .2, ease: worn ? "back.out(2.5)" : "power2.in", onUpdate: invalidate, onComplete: () => { object.visible = worn; invalidate(); } }, 0);
    });
    timeline.to(rig.curls.scale, { x: names.includes("hat") ? .82 : 1, y: names.includes("hat") ? .82 : 1, z: names.includes("hat") ? .82 : 1, duration: reducedMotion ? 0 : .4, onUpdate: invalidate }, 0);
    return () => { timeline.kill(); };
  }, [accessoryKey, reducedMotion, rig, invalidate]);
  useEffect(() => () => {
    animation.dispose(); rig.dispose(); print.target.dispose(); print.detailTarget.dispose(); print.material.dispose(); print.geometry.dispose();
  }, [animation, rig, print]);

  // Render in linear light first. Print/dither once, after shading and facial color.
  useFrame(({ clock }, delta) => {
    animation.update(clock.elapsedTime, Math.min(delta, .05), look.current, reducedMotion);
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
    print.material.uniforms.clipCircle.value.set(frame.x, size.height - frame.y, frame.clip);
    print.material.uniforms.cover.value = rig.motion.cover;
    print.material.uniforms.develop.value = rig.motion.develop;
    const detail = characterPrintWindow(frame.x, frame.y, frame.clip, size.width, size.height);
    const settings = characterPrintSettings(frame.radius, basePixelSize.current);
    print.material.uniforms.pixelSize.value = settings.pixelSize;
    print.material.uniforms.ditherStrength.value = settings.ditherStrength;
    print.material.uniforms.outputDpr.value = gl.getPixelRatio();
    if (detail && camera instanceof THREE.OrthographicCamera) {
      print.detailCamera.copy(camera);
      print.detailCamera.setViewOffset(size.width, size.height, detail.left, detail.top, detail.diameter, detail.diameter);
      print.material.uniforms.sourceRect.value.set(...detail.sourceRect);
      print.material.uniforms.sceneTexture.value = print.detailTarget.texture;
      gl.setRenderTarget(print.detailTarget); gl.clear(); gl.render(scene, print.detailCamera);
    } else {
      print.material.uniforms.sourceRect.value.set(0, 0, 1, 1);
      print.material.uniforms.sceneTexture.value = print.target.texture;
      gl.setRenderTarget(print.target); gl.clear(); gl.render(scene, camera);
    }
    gl.setRenderTarget(null); gl.clear(); gl.render(print.output, print.camera);
  }, 1);
  return <primitive object={rig.root} dispose={null} />;
}

export default function CharacterScene(props: Props) {
  // R3F defaults its wrapper to pointer-events:auto, overriding the paint layer.
  // All character input belongs to the separate, tightly bounded HTML handle.
  return <Canvas style={{ pointerEvents: "none" }} resize={{ scroll: false, debounce: 0 }} aria-hidden="true" orthographic camera={{ position: [0, 0, 2000], zoom: 1, near: .1, far: 4000 }} dpr={[1, 2]} frameloop={props.active && !props.reducedMotion ? "always" : "demand"} gl={{ alpha: true, antialias: false, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = THREE.NoToneMapping; }} fallback={<span>Character preview unavailable</span>}>
    <FitCamera />
    <ContextHealth onFailure={props.onFailure} />
    <hemisphereLight args={["#ffffff", "#5a5a5a", 1.1]} />
    <directionalLight position={[-3, 4, 5]} intensity={2.4} />
    <directionalLight position={[5, 1.5, -4]} intensity={2.2} />
    <PrintedCharacter {...props} />
  </Canvas>;
}

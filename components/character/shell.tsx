"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { usePortfolio } from "@/components/portfolio/runtime";
import { characterManifest } from "@/content/character";
import { portfolio, scenes } from "@/content/portfolio";
import { useCharacterTour } from "./tour";
import { dragOffset, gestureIntent, type Point } from "@/lib/character-interaction";
import { chapterStep, type Trick } from "@/lib/character-state";

const CharacterScene = dynamic(() => import("./scene"), { ssr: false, loading: () => <div className="character-loading"><Poster /></div> });
function Poster() { return <Image className="character-poster" src={characterManifest.poster} width={460} height={460} alt="" priority />; }
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="character-loading"><Poster /></div> : this.props.children; }
}
const trickDialogue: Record<Trick, string> = {
  Dance: "A little celebration never hurts.", "Punching bag": "Okay, okay. I felt that!", Panic: "Wait… did I push to production?", Fly: "See you up there!", Vanish: "Now you see me…", Hiccup: "Hic! Excuse me.", Peekaboo: "Found you!", Selfie: "Hold that thought. Say cheese!", Dizzy: "The world is spinning.", Sneeze: "Ah… ah… achoo!", Sulk: "I’ll be over here for a minute.",
};

type Pickup = { pointerId: number; touch: boolean; start: Point; offset: Point; active: boolean; target: HTMLDivElement; hold?: ReturnType<typeof setTimeout> };

export function CharacterShell() {
  const { character, dispatch, reducedMotion, returning, sleeping, accessories, equip, perform, openTricks } = usePortfolio();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const drag = useRef<Pickup | null>(null);
  const offsetRef = useRef(offset);
  const look = useRef({ x: 0, y: 0 });
  const releaseTween = useRef<gsap.core.Tween | null>(null);
  const stage = useRef<HTMLElement>(null);
  const tour = useCharacterTour(stage, character, offset, reducedMotion, look);
  const visualChapter = useRef(character.chapter);
  if (character.mode === "tour") visualChapter.current = character.chapter;
  const chapter = visualChapter.current;
  const scene = scenes.find((scene) => scene.id === chapter);
  const compact = chapter === "work";
  const hidden = chapter === "hidden";
  const dialogue = sleeping ? "Zzz… I’m still here." : character.mode === "drag" ? "Whoa! Where are we going?"
    : character.trick ? trickDialogue[character.trick]
    : scene ? scene.dialogue[chapterStep(character.progress)]
    : chapter === "contact" ? portfolio.dialogue.contact
    : chapter === "error" ? ["hat", "glasses"].every((name) => accessories.includes(name)) ? "Looking sharp. Thanks for the help!" : portfolio.dialogue.error
    : chapter === "detail" ? "Here’s a closer look."
    : returning ? portfolio.dialogue.returning : portfolio.dialogue.welcome;

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    setWebgl(Boolean(gl));
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    const visibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  function moveOffset(position: Point) { offsetRef.current = position; setOffset(position); }
  useEffect(() => {
    clearTimeout(drag.current?.hold); drag.current = null;
    releaseTween.current?.kill(); offsetRef.current = { x: 0, y: 0 }; setOffset({ x: 0, y: 0 });
  }, [chapter]);
  useEffect(() => {
    const handle = stage.current?.querySelector<HTMLElement>(".character-grab");
    const move = (event: TouchEvent) => { if (drag.current?.active && event.cancelable) event.preventDefault(); };
    handle?.addEventListener("touchmove", move, { passive: false });
    return () => { handle?.removeEventListener("touchmove", move); clearTimeout(drag.current?.hold); releaseTween.current?.kill(); };
  }, []);
  function drop() {
    releaseTween.current?.kill();
    if (reducedMotion) { moveOffset({ x: 0, y: 0 }); return; }
    const position = { ...offsetRef.current };
    releaseTween.current = gsap.to(position, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.4)", onUpdate: () => moveOffset({ x: position.x, y: position.y }) });
  }

  function pickUp(pickup: Pickup) {
    if (drag.current !== pickup) return;
    clearTimeout(pickup.hold); pickup.active = true;
    try { pickup.target.setPointerCapture(pickup.pointerId); } catch { /* A cancelled touch cannot be captured. */ }
    dispatch({ type: "drag" });
  }
  function putDown(cancelled = false) {
    const pickup = drag.current; if (!pickup) return;
    clearTimeout(pickup.hold); drag.current = null;
    if (pickup.target.hasPointerCapture(pickup.pointerId)) pickup.target.releasePointerCapture(pickup.pointerId);
    if (pickup.active) dispatch({ type: "release" });
    drop();
    if (!pickup.active && !cancelled) { if (compact) openTricks(); else perform("Hiccup"); }
  }

  return <aside className={`character-stage ${chapter === "hero" ? "is-hero" : ""} ${compact ? "is-compact" : ""} ${hidden ? "is-hidden" : ""} ${chapter === "detail" ? "is-detail" : ""} ${scene ? `is-project is-${scene.side}` : ""} ${character.mode === "drag" ? "is-dragging" : ""}`} ref={stage} aria-label="Interactive portfolio guide">
    <span className="character-grid-measure" aria-hidden="true" />
    <div className="character-badge" aria-hidden="true" />
    <div className="character-render"><SceneBoundary>{webgl ? <CharacterScene state={{ ...character, chapter }} tour={tour} look={look} accessories={[...accessories, ...(character.chapter === "project-one" ? ["watch"] : character.chapter === "project-two" ? ["glasses"] : character.chapter === "project-three" ? ["hat"] : [])]} active={active && !hidden} reducedMotion={reducedMotion} sleeping={sleeping} onFailure={() => setWebgl(false)} /> : null}</SceneBoundary></div>
    <div className="character-fallback" aria-hidden="true" style={{ display: webgl ? "none" : undefined }}>{!webgl && <Poster />}</div>
    <div className="speech-bubble" role="status" aria-live="polite" aria-hidden={character.mode === "tour" && !["hero", "contact", "error", "detail"].includes(chapter)}>{dialogue}</div>
    <div className="character-grab" role="button" tabIndex={hidden ? -1 : 0} aria-label={compact ? "Open character tricks" : "Move the character. Use arrow keys to move, Enter for tricks, Escape to reset."}
      onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const item = event.dataTransfer.getData("text/character-accessory"); if (["hat", "glasses"].includes(item)) equip(item); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTricks(); }
        if (event.key === "Escape") { putDown(true); releaseTween.current?.kill(); moveOffset({ x: 0, y: 0 }); dispatch({ type: "release" }); }
        if (event.key.startsWith("Arrow")) {
          event.preventDefault(); dispatch({ type: "drag" });
          moveOffset({ x: Math.max(-120, Math.min(120, offsetRef.current.x + (event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0))), y: Math.max(-180, Math.min(180, offsetRef.current.y + (event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0))) });
        }
      }}
      onKeyUp={(event) => { if (event.key.startsWith("Arrow")) { dispatch({ type: "release" }); drop(); } }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (character.trick === "Punching bag") { perform("Punching bag"); return; }
        releaseTween.current?.kill();
        const pickup: Pickup = { pointerId: event.pointerId, touch: event.pointerType !== "mouse", start: { x: event.clientX, y: event.clientY }, offset: { ...offsetRef.current }, active: false, target: event.currentTarget };
        drag.current = pickup;
        if (pickup.touch) pickup.hold = setTimeout(() => pickUp(pickup), 250);
        else event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        look.current = { x: (event.clientX - bounds.left) / bounds.width * 2 - 1, y: (event.clientY - bounds.top) / bounds.height * 2 - 1 };
        const pickup = drag.current; if (!pickup || pickup.pointerId !== event.pointerId) return;
        const delta = { x: event.clientX - pickup.start.x, y: event.clientY - pickup.start.y };
        if (!pickup.active) {
          const intent = gestureIntent(delta, pickup.touch);
          if (intent === "pending") return;
          if (intent === "scroll") { clearTimeout(pickup.hold); drag.current = null; return; }
          pickUp(pickup);
        }
        const position = dragOffset(delta, tour.current.radius);
        moveOffset({ x: pickup.offset.x + position.x, y: pickup.offset.y + position.y });
      }}
      onPointerUp={() => putDown()}
      onLostPointerCapture={() => putDown(true)}
      onPointerLeave={() => { look.current = { x: 0, y: 0 }; }}
      onContextMenu={(event) => { event.preventDefault(); if (!drag.current?.active) openTricks(); }}
      onPointerCancel={() => putDown(true)}>

    </div>
    {!compact && <span className="grab-hint">{character.mode === "drag" ? "Let go to put me down" : "Psst. You can grab me."}</span>}
  </aside>;
}

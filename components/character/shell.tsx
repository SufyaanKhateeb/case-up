"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePortfolio } from "@/components/portfolio/runtime";
import { characterManifest } from "@/content/character";
import { portfolio, scenes } from "@/content/portfolio";
import { useCharacterTour } from "./tour";
import { isCharacterAccessory } from "@/lib/character-accessories";
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

export function CharacterShell() {
  const { character, dispatch, reducedMotion, returning, accessories, equip, perform, openTricks } = usePortfolio();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(true);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [assetReady, setAssetReady] = useState(false);
  const assetLoaded = useCallback(() => setAssetReady(true), []);
  const assetFailed = useCallback(() => { setAssetReady(false); setWebgl(false); }, []);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
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
  const dialogue = character.mode === "drag" ? "Whoa! Where are we going?"
    : character.trick ? trickDialogue[character.trick]
    : scene ? scene.dialogue[chapterStep(character.progress)]
    : chapter === "contact" ? portfolio.dialogue.contact
    : chapter === "error" ? accessories.some(isCharacterAccessory) ? "Looking sharp. Thanks for the help!" : portfolio.dialogue.error
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
  useEffect(() => { releaseTween.current?.kill(); setOffset({ x: 0, y: 0 }); }, [chapter]);
  useEffect(() => () => { releaseTween.current?.kill(); }, []);
  function drop() {
    releaseTween.current?.kill();
    if (reducedMotion) { setOffset({ x: 0, y: 0 }); return; }
    const position = { ...offset };
    releaseTween.current = gsap.to(position, { x: 0, y: 0, duration: .9, ease: "elastic.out(1,.4)", onUpdate: () => setOffset({ ...position }) });
  }

  return <aside className={`character-stage ${chapter === "hero" ? "is-hero" : ""} ${compact ? "is-compact" : ""} ${hidden ? "is-hidden" : ""} ${chapter === "detail" ? "is-detail" : ""} ${scene ? `is-project is-${scene.side}` : ""} ${character.mode === "drag" ? "is-dragging" : ""}`} ref={stage} aria-label="Interactive portfolio guide">
    <span className="character-grid-measure" aria-hidden="true" />
    <div className="character-badge" aria-hidden="true" />
    <div className="character-render"><SceneBoundary>{webgl ? <CharacterScene state={{ ...character, chapter }} tour={tour} look={look} accessories={[...accessories, ...(character.chapter === "project-one" ? ["watch"] : character.chapter === "project-two" ? ["glasses"] : character.chapter === "project-three" ? ["headphones"] : [])]} active={active && !hidden} reducedMotion={reducedMotion} onFailure={assetFailed} onReady={assetLoaded} /> : null}</SceneBoundary></div>
    <div className="character-fallback" aria-hidden="true" style={{ display: webgl && assetReady ? "none" : undefined }}>{(!webgl || !assetReady) && <Poster />}</div>
    <div className="speech-bubble" role="status" aria-live="polite" aria-hidden={character.mode === "tour" && !["hero", "contact", "error", "detail"].includes(chapter)}>{dialogue}</div>
    <div className="character-grab" role="button" tabIndex={hidden ? -1 : 0} aria-label={compact ? "Open character tricks" : "Move the character. Use arrow keys to move, Enter for tricks, Escape to reset."}
      onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const item = event.dataTransfer.getData("text/character-accessory"); if (isCharacterAccessory(item)) equip(item); }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTricks(); }
        if (event.key === "Escape") { setOffset({ x: 0, y: 0 }); dispatch({ type: "release" }); }
        if (event.key.startsWith("Arrow")) {
          event.preventDefault(); dispatch({ type: "drag" });
          setOffset((current) => ({ x: Math.max(-120, Math.min(120, current.x + (event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0))), y: Math.max(-180, Math.min(0, current.y + (event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0))) }));
        }
      }}
      onKeyUp={(event) => { if (event.key.startsWith("Arrow")) { dispatch({ type: "release" }); drop(); } }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (character.trick === "Punching bag") { perform("Punching bag"); return; }
        releaseTween.current?.kill();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX - offset.x, y: event.clientY - offset.y, moved: false };
        dispatch({ type: "drag" });
      }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        look.current = { x: (event.clientX - bounds.left) / bounds.width * 2 - 1, y: (event.clientY - bounds.top) / bounds.height * 2 - 1 };
        if (!drag.current) return;
        const x = event.clientX - drag.current.x;
        const y = event.clientY - drag.current.y;
        if (Math.abs(x - offset.x) + Math.abs(y - offset.y) > 3) drag.current.moved = true;
        setOffset({ x: Math.max(-window.innerWidth * 0.3, Math.min(window.innerWidth * 0.3, x)), y: Math.max(-window.innerHeight * 0.6, Math.min(0, y)) });
      }}
      onPointerUp={() => {
        if (!drag.current) return;
        const moved = drag.current?.moved;
        drag.current = null; dispatch({ type: "release" });
        drop();
        if (!moved) { if (compact) openTricks(); else perform("Hiccup"); }
      }}
      onPointerLeave={() => { look.current = { x: 0, y: 0 }; }}
      onContextMenu={(event) => { event.preventDefault(); openTricks(); }}
      onPointerCancel={() => { drag.current = null; setOffset({ x: 0, y: 0 }); dispatch({ type: "release" }); }}>

    </div>
    {!compact && <span className="grab-hint">{character.mode === "drag" ? "Let go to put me down" : "Psst. You can grab me."}</span>}
  </aside>;
}

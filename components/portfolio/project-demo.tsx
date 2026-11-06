"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePortfolio } from "./runtime";
import { DeviceFrame, ProjectArt } from "./project-art";
import { chapterStep, scratchComplete } from "@/lib/character-state";
import { gestureIntent } from "@/lib/character-interaction";
import type { Project } from "@/content/portfolio";

export function ProjectDemo({ project, sceneId, kind }: { project: Project; sceneId: string; kind: "compare" | "scratch" | "variants" }) {
  const { character, reducedMotion, playSound } = usePortfolio();
  const progress = character.chapter === sceneId ? character.progress : 0;
  const step = reducedMotion ? 2 : chapterStep(progress);
  const [comparison, setComparison] = useState(50);
  const [variant, setVariant] = useState(0);
  const [hint, setHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const scratchStart = useRef<{ x: number; y: number } | null>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (kind !== "scratch" || !canvas.current || revealed) return;
    const surface = canvas.current;
    const context = surface.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.fillStyle = "#f3f2ed"; context.fillRect(0, 0, surface.width, surface.height);
    context.fillStyle = "#141414";
    for (let y = 0; y < surface.height; y += 5) for (let x = 0; x < surface.width; x += 5) {
      if ((x * 13 + y * 7) % 11 > 3) context.fillRect(x, y, 1.5, 1.5);
    }
    context.globalCompositeOperation = "destination-out";
  }, [kind, revealed]);

  function reveal() { setRevealed(true); playSound("shatter"); }
  const progressLabel = kind === "compare" ? ["The big picture", "Built for every screen", "A closer look"][step] : kind === "scratch" ? ["Under the surface", "A little curiosity", "Your turn to explore"][step] : ["One idea", "Another angle", "Every perspective"][step];

  return <div className={`chapter-showcase showcase-${kind} step-${step}`} style={{ "--chapter-progress": progress } as CSSProperties}>
    <p className="chapter-caption">{progressLabel}</p>
    {kind === "compare" && <>
      <div className="desktop-demo"><DeviceFrame project={project} /></div>
      <div className="phone-demo"><DeviceFrame project={project} mobile /></div>
      <div className="comparison-demo" aria-hidden={step !== 2}>
        <div className="comparison-images"><ProjectArt project={project} /><div className="comparison-overlay" style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}><ProjectArt project={project} variant={1} mediaOverride={project.comparison} /></div><span className="comparison-line" style={{ left: `${comparison}%` }}>↔</span></div>
        <label className="comparison-control">Explore the comparison<input type="range" min="0" max="100" value={comparison} disabled={step !== 2} onChange={(event) => setComparison(Number(event.target.value))} aria-label="Compare project views" /><span>{comparison}%</span></label>
      </div>
    </>}
    {kind === "scratch" && <div className="scratch-demo">
      <div className="device-browser"><div className="browser-bar" aria-hidden="true"><span className="browser-dots"><i /><i /><i /></span><span className="browser-address">A little discovery</span><span>↗</span></div>
        <div className="scratch-surface"><ProjectArt project={project} variant={1} />
          {!revealed && <><canvas ref={canvas} width={900} height={520} aria-hidden="true" className="scratch-canvas" onPointerDown={(event) => {
            if (event.button !== 0) return;
            drawing.current = event.pointerType === "mouse"; previous.current = null;
            scratchStart.current = { x: event.clientX, y: event.clientY };
            if (drawing.current) event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerMove={(event) => {
            if (!drawing.current && scratchStart.current) {
              const intent = gestureIntent({ x: event.clientX - scratchStart.current.x, y: event.clientY - scratchStart.current.y }, true);
              if (intent === "pending") return;
              if (intent === "scroll") { scratchStart.current = null; return; }
              drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId);
            }
            if (!drawing.current || !canvas.current) return;
            const surface = canvas.current;
            const context = surface.getContext("2d"); if (!context) return;
            const bounds = surface.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width * surface.width;
            const y = (event.clientY - bounds.top) / bounds.height * surface.height;
            context.lineWidth = 80; context.lineCap = "round"; context.beginPath(); context.moveTo(previous.current?.x ?? x, previous.current?.y ?? y); context.lineTo(x, y); context.stroke();
            previous.current = { x, y }; playSound("scratch");
          }} onPointerUp={() => {
            scratchStart.current = null;
            if (!drawing.current) return;
            drawing.current = false; previous.current = null;
            const context = canvas.current?.getContext("2d"); if (!context || !canvas.current) return;
            const data = context.getImageData(0, 0, canvas.current.width, canvas.current.height).data;
            let total = 0, cleared = 0;
            for (let i = 3; i < data.length; i += 64) { total++; if (data[i] < 64) cleared++; }
            if (scratchComplete(cleared, total)) reveal();
          }} onPointerCancel={() => { drawing.current = false; scratchStart.current = null; previous.current = null; }} /><div className="scratch-label" aria-hidden="true"><span>There’s more than<br />meets the eye.</span><small>Scratch to discover ↗</small></div></>}
        </div>
      </div>
      <div className="demo-controls"><button className="pill pill-small" onClick={() => { setHint(!hint); playSound("blip"); }} aria-expanded={hint}>{hint ? "Hide hint" : "A little hint"}<span>✳</span></button><button className="pill pill-small" onClick={() => revealed ? setRevealed(false) : reveal()}>{revealed ? "Try again" : "Reveal preview"}<span>↗</span></button></div>
      <p className="demo-status" role="status">{revealed ? "There it is. A fresh perspective." : hint ? "Drag across the dotted surface, or use Reveal preview." : "Drag sideways to scratch. Or reveal it with a click."}</p>
    </div>}
    {kind === "variants" && <div className={`variants-demo view-${variant}`}>
      <div className="variant-device"><DeviceFrame project={project} mobile={variant === 2} variant={variant} /></div>
      <div className="view-switcher" role="group" aria-label="Project viewport"><button aria-pressed={variant === 0} onClick={() => { setVariant(0); playSound("blip"); }}>Desktop</button><button aria-pressed={variant === 1} onClick={() => { setVariant(1); playSound("blip"); }}>Tablet</button><button aria-pressed={variant === 2} onClick={() => { setVariant(2); playSound("blip"); }}>Mobile</button></div>
    </div>}
  </div>;
}

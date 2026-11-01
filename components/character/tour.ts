"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { sampleTour, tourPlacement, type TourAnchor, type TourFrame, type TourKind, type TourViewport } from "@/lib/character-tour";
import type { CharacterState } from "@/lib/character-state";

const initialViewport = { width: 1440, height: 900, margin: 40, gap: 20 };
export function useCharacterTour(stage: RefObject<HTMLElement>, state: CharacterState, offset: { x: number; y: number }, reduced: boolean, look: MutableRefObject<{ x: number; y: number }>) {
  const pathname = usePathname();
  const frame = useRef<TourFrame>(tourPlacement("hero", initialViewport));
  const current = useRef({ state, offset }); current.current = { state, offset };
  useEffect(() => {
    const element = stage.current!; if (!element) return;
    const bubble = element.querySelector<HTMLElement>(".speech-bubble")!;
    const handle = element.querySelector<HTMLElement>(".character-grab")!;
    const poster = element.querySelector<HTMLElement>(".character-fallback");
    let viewport: TourViewport = initialViewport, anchors: TourAnchor[] = [];
    let scroll = window.scrollY, lastScroll = scroll, direction = 1, targetDirection = 1;
    let alive = true;
    let hero: HTMLElement | null = null;
    function measure() {
      const margin = element!.querySelector<HTMLElement>(".character-grid-measure")!.getBoundingClientRect().width;
      viewport = { width: innerWidth, height: innerHeight, margin, gap: margin / 2 };
      hero = document.querySelector<HTMLElement>('.hero[data-character="hero"]');
      anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-character]")).map((section) => {
        const kind = (section.dataset.tour as TourKind | undefined) ?? (section.dataset.character === "detail" ? "badge" : "error");
        const last = section.lastElementChild as HTMLElement | null;
        // Fit the mobile outro below the text at the document's maximum scroll.
        // Otherwise the guide's HTML handle covers footer links and buttons.
        const textBottom = kind === "outro" && last ? viewport.height - section.offsetHeight + last.offsetTop + last.offsetHeight : undefined;
        return { top: section.getBoundingClientRect().top + window.scrollY, frame: tourPlacement(kind, viewport, textBottom) };
      });
      scroll = window.scrollY; update(0, 1000);
    }
    function update(_time: number, delta: number) {
      if (document.hidden) return;
      const actual = window.scrollY;
      if (actual !== lastScroll) targetDirection = Math.sign(actual - lastScroll);
      const dt = Math.min(delta, 64);
      direction += (targetDirection - direction) * (1 - Math.exp(-dt / 180));
      lastScroll = actual;
      scroll = reduced ? actual : scroll + (actual - scroll) * (1 - Math.exp(-dt / 50));
      const base = sampleTour(scroll, anchors, viewport, reduced ? 0 : direction);
      const { state: latest, offset: drag } = current.current;
      frame.current = { ...base, x: base.x + drag.x, y: base.y + drag.y };
      const { x, y, radius, clip, badge } = frame.current;
      element.style.setProperty("--head-x", `${x}px`); element.style.setProperty("--head-y", `${y}px`); element.style.setProperty("--head-radius", `${radius}px`);
      element.style.setProperty("--character-clip", `${clip}px`);
      element.style.setProperty("--badge-opacity", `${Math.max(0, (badge - .6) / .4)}`);
      handle.style.transform = `translate(${x - radius * 1.3}px,${y - radius * 1.2}px)`;
      handle.style.width = `${radius * 2.6}px`; handle.style.height = `${radius * 4.7}px`;
      const show = latest.mode !== "tour" || ["hero", "contact", "error"].includes(latest.chapter);
      // Hide the opening narration before the biography reaches its settled anchor.
      const heroVisible = !hero || actual < hero.offsetHeight - viewport.height * .6;
      bubble.style.visibility = show && (latest.chapter !== "hero" || heroVisible || latest.mode !== "tour") ? "visible" : "hidden";
      bubble.style.maxWidth = `${Math.min(base.bubble, viewport.width - viewport.margin * 2)}px`;
      let bx = Math.max(viewport.margin, Math.min(viewport.width - viewport.margin - bubble.offsetWidth, x - bubble.offsetWidth / 2));
      let by = y - radius * 1.75 - bubble.offsetHeight - 18;
      if (base.beside > .5) {
        const left = x < viewport.width / 2;
        bubble.style.maxWidth = `${Math.max(140, Math.min(base.bubble, (left ? viewport.width - x : x) - radius * 1.45 - viewport.margin))}px`;
        bx = left ? x + radius * 1.45 : x - radius * 1.45 - bubble.offsetWidth;
        by = Math.min(y - radius * .4 - bubble.offsetHeight / 2, viewport.height - 80 - bubble.offsetHeight);
        bubble.dataset.tail = left ? "left" : "right";
      } else delete bubble.dataset.tail;
      bubble.style.transform = `translate(${Math.round(bx)}px,${Math.round(Math.max(viewport.margin, by))}px)`;
      bubble.style.setProperty("--tail-x", `${Math.max(24, Math.min(bubble.offsetWidth - 24, x - bx))}px`);
      if (poster) { poster.style.width = `${radius * 3.5}px`; poster.style.height = `${radius * 3.5}px`; poster.style.transform = `translate(${x - radius * 1.75}px,${y - radius * 1.4}px)`; }
    }
    function pointer(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      look.current = { x: Math.max(-1, Math.min(1, (event.clientX - frame.current.x) / viewport.width * 1.4)), y: Math.max(-1, Math.min(1, (event.clientY - frame.current.y) / viewport.height * .8)) };
    }
    const observer = new ResizeObserver(measure); observer.observe(document.documentElement);
    measure(); gsap.ticker.add(update);
    window.addEventListener("resize", measure); window.addEventListener("pointermove", pointer);
    void document.fonts.ready.then(() => { if (alive) measure(); });
    return () => { alive = false; observer.disconnect(); gsap.ticker.remove(update); window.removeEventListener("resize", measure); window.removeEventListener("pointermove", pointer); };
  }, [pathname, reduced, stage, look]);
  return frame;
}

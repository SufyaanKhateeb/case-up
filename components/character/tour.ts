"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { sampleTour, tourPlacement, type TourAnchor, type TourFrame, type TourKind, type TourViewport } from "@/lib/character-tour";
import { bubbleTail, tailPolygon } from "@/lib/character-interaction";
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
    let speechRadius = 27;
    let chapterBubbles: { element: HTMLElement; cornerRadius: number }[] = [];
    function measure() {
      const margin = element!.querySelector<HTMLElement>(".character-grid-measure")!.getBoundingClientRect().width;
      // Coordinates belong to the render surface. On mobile its stable large
      // viewport height is pinned to the bottom, rather than resized by toolbars.
      viewport = { width: element!.clientWidth, height: element!.clientHeight, margin, gap: margin / 2 };
      hero = document.querySelector<HTMLElement>('.hero[data-character="hero"]');
      speechRadius = parseFloat(getComputedStyle(bubble).borderTopLeftRadius) || 0;
      chapterBubbles = Array.from(document.querySelectorAll<HTMLElement>(".chapter-bubble"), element => ({ element, cornerRadius: parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0 }));
      anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-character]")).map((section) => {
        const kind = (section.dataset.tour as TourKind | undefined) ?? (section.dataset.character === "detail" ? "badge" : "error");
        const last = section.lastElementChild as HTMLElement | null;
        // Fit the mobile outro below the text at the document's maximum scroll.
        // Otherwise the guide's HTML handle covers footer links and buttons.
        const textBottom = kind === "outro" && last ? viewport.height - section.offsetHeight + last.offsetTop + last.offsetHeight : undefined;
        return { top: section.getBoundingClientRect().top + window.scrollY, frame: tourPlacement(kind, viewport, textBottom) };
      });
      scroll = window.scrollY; update(0, 1000); element!.dataset.positioned = "true";
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
      const openingBubble = latest.chapter === "hero";
      // Keep the welcome attached above the head while it gently fades on scroll.
      const fadeProgress = hero && openingBubble && latest.mode === "tour"
        ? Math.max(0, Math.min(1, ((actual - (anchors[0]?.top ?? 0)) / viewport.height - .12) / .3)) : 0;
      const opacity = reduced ? (fadeProgress >= 1 ? 0 : 1) : 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
      bubble.style.opacity = String(opacity);
      bubble.style.visibility = show && opacity > 0 ? "visible" : "hidden";
      bubble.style.maxWidth = `${Math.min(base.bubble, viewport.width - viewport.margin * 2)}px`;
      const origin = element.getBoundingClientRect();
      let bx = Math.max(viewport.margin, Math.min(viewport.width - viewport.margin - bubble.offsetWidth, x - bubble.offsetWidth / 2));
      let by = y - radius * 1.75 - bubble.offsetHeight - 18;
      const footerBubble = viewport.width < 768 && latest.chapter === "contact";
      if (!openingBubble && (base.beside > .5 || footerBubble)) {
        const left = x < viewport.width / 2;
        const separation = footerBubble ? 1.1 : 1.45;
        bubble.style.maxWidth = `${Math.max(100, Math.min(base.bubble, (left ? viewport.width - x : x) - radius * separation - viewport.margin))}px`;
        bx = left ? x + radius * separation : x - radius * separation - bubble.offsetWidth;
        by = Math.min(y - radius * .4 - bubble.offsetHeight / 2, viewport.height - 80 - bubble.offsetHeight);
        if (footerBubble) {
          const footerText = document.querySelector(".footer-small")?.getBoundingClientRect();
          if (footerText) by = Math.max(by, footerText.bottom - origin.top + 16);
        }
        bubble.dataset.tail = left ? "left" : "right";
      } else delete bubble.dataset.tail;
      bx = Math.max(viewport.margin, Math.min(viewport.width - viewport.margin - bubble.offsetWidth, bx));
      const bubbleY = Math.max(viewport.margin - origin.top, by);
      bubble.style.transform = `translate(${Math.round(bx)}px,${Math.round(bubbleY)}px)`;
      bubble.style.setProperty("--bubble-tail", tailPolygon(bubbleTail(bubble.offsetWidth, bubble.offsetHeight, { x: x - bx, y: y - bubbleY }, speechRadius)));
      const screenX = x + origin.left, screenY = y + origin.top;
      for (const { element: narration, cornerRadius } of chapterBubbles) {
        const rect = narration.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > origin.bottom) continue;
        narration.style.setProperty("--bubble-tail", tailPolygon(bubbleTail(rect.width, rect.height, { x: screenX - rect.left, y: screenY - rect.top }, cornerRadius)));
      }
      if (poster) { poster.style.width = `${radius * 3.5}px`; poster.style.height = `${radius * 3.5}px`; poster.style.transform = `translate(${x - radius * 1.75}px,${y - radius * 1.4}px)`; }
    }
    function pointer(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const origin = element.getBoundingClientRect();
      look.current = { x: Math.max(-1, Math.min(1, (event.clientX - origin.left - frame.current.x) / viewport.width * 1.4)), y: Math.max(-1, Math.min(1, (event.clientY - origin.top - frame.current.y) / viewport.height * .8)) };
    }
    const observer = new ResizeObserver(measure); observer.observe(document.documentElement); observer.observe(element);
    measure(); gsap.ticker.add(update);
    window.addEventListener("resize", measure); window.addEventListener("pointermove", pointer);
    void document.fonts.ready.then(() => { if (alive) measure(); });
    return () => { alive = false; delete element.dataset.positioned; observer.disconnect(); gsap.ticker.remove(update); window.removeEventListener("resize", measure); window.removeEventListener("pointermove", pointer); };
  }, [pathname, reduced, stage, look]);
  return frame;
}

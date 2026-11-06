"use client";

import { useCallback, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useSmoothScroll(pathname: string, reducedMotion: boolean, paused: boolean) {
  const instance = useRef<Lenis | null>(null);
  useEffect(() => {
    if (reducedMotion) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      lerp: .1, smoothWheel: true, syncTouch: false, stopInertiaOnNavigate: true, anchors: { offset: -20 },
      prevent: node => Boolean(node.closest("dialog, .resume-preview")),
    });
    instance.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Match the reference's real-time Lenis clock instead of GSAP compressing
    // long frames, which makes the scroll catch-up timing drift after a stall.
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); instance.current = null; };
  }, [pathname, reducedMotion]);
  useEffect(() => { if (paused) instance.current?.stop(); else instance.current?.start(); }, [paused, pathname, reducedMotion]);
  return useCallback((target: number) => {
    if (instance.current) { instance.current.resize(); instance.current.scrollTo(target); }
    else window.scrollTo({ top: target, behavior: reducedMotion ? "instant" : "smooth" });
  }, [reducedMotion]);
}

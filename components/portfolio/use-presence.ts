"use client";

import { useEffect, useState } from "react";
import { awayTitle, createAwayTitle, createIdleMonitor } from "@/lib/portfolio-presence";
import type { SoundEffect } from "@/lib/portfolio-audio";

export function useIdleCharacter(blocked: boolean, playSound: (effect: SoundEffect) => void) {
  const [sleeping, setSleeping] = useState(false);
  useEffect(() => {
    setSleeping(false);
    if (blocked) return;
    const monitor = createIdleMonitor(
      () => { setSleeping(true); playSound("sleep"); },
      () => { setSleeping(false); if (!document.hidden) playSound("wake"); },
    );
    const activity = () => monitor.activity();
    const visibility = () => { if (document.hidden) monitor.pause(); else monitor.resume(); };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach(event => window.addEventListener(event, activity, { passive: true }));
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      monitor.dispose(); events.forEach(event => window.removeEventListener(event, activity));
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [blocked, playSound]);
  return !blocked && sleeping;
}

export function useAwayTitle(pathname: string) {
  useEffect(() => {
    const { update, restore } = createAwayTitle(document);
    const observer = new MutationObserver(() => { if (document.title !== awayTitle) update(); });
    const title = document.querySelector("title");
    if (title) observer.observe(title, { childList: true, subtree: true, characterData: true });
    window.addEventListener("blur", update); window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect(); window.removeEventListener("blur", update); window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      restore();
    };
  }, [pathname]);
}

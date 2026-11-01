"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { characterReducer, initialCharacter, readPreference, tricks, type CharacterAction, type CharacterState, type Trick } from "@/lib/character-state";
import { storyProgress, storyOpacity } from "@/lib/character-tour";
import { CharacterShell } from "@/components/character/shell";

type Runtime = {
  character: CharacterState;
  dispatch: React.Dispatch<CharacterAction>;
  reducedMotion: boolean;
  returning: boolean;
  accessories: string[];
  equip: (name: string) => void;
  perform: (trick: Trick) => void;
  openTricks: () => void;
  playSound: (index?: number) => void;
};
const RuntimeContext = createContext<Runtime | null>(null);
export function usePortfolio() {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error("Portfolio components require PortfolioRuntime");
  return value;
}

export function PortfolioRuntime({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [character, dispatch] = useReducer(characterReducer, initialCharacter);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [returning, setReturning] = useState(false);
  const [sound, setSound] = useState(false);
  const [accessories, setAccessories] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const audioEnabled = useRef(false);
  const initialVisit = useRef<boolean | null>(null);
  const trickTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    try {
      if (initialVisit.current === null) initialVisit.current = readPreference(localStorage, "portfolio-visited");
      setReturning(initialVisit.current);
      setSound(readPreference(localStorage, "portfolio-sound"));
      localStorage.setItem("portfolio-visited", "true");
    } catch { /* Private browsing must not break the experience. */ }
    return () => {
      media.removeEventListener("change", update);
      clearTimeout(trickTimer.current);
      void audio.current?.close();
      audio.current = null;
    };
  }, []);
  useEffect(() => { audioEnabled.current = sound; }, [sound]);

  const playSound = useCallback((index = 0) => {
    if (!audioEnabled.current) return;
    try {
      const context = audio.current ?? new AudioContext();
      audio.current = context;
      void context.resume().catch(() => {});
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(260 + index * 35, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(550 + index * 25, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.24);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Audio is optional. */ }
  }, []);

  const perform = useCallback((trick: Trick) => {
    clearTimeout(trickTimer.current);
    dispatch({ type: "trick", trick });
    playSound(tricks.indexOf(trick));
    setMenuOpen(false);
    trickTimer.current = setTimeout(() => dispatch({ type: "finish" }), reducedMotion ? 1200 : 4200);
  }, [playSound, reducedMotion]);

  const equip = useCallback((name: string) => {
    setAccessories((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
    playSound(4);
  }, [playSound]);

  useEffect(() => {
    clearTimeout(trickTimer.current);
    dispatch({ type: "release" });
    setMenuOpen(false);
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-character]");
      sections.forEach((section) => {
        const chapter = section.dataset.character!;
        const update = (self: ScrollTrigger) => {
          if (self.isActive) {
            const line = section.querySelector<HTMLElement>("[data-story-step]");
            const progress = line ? storyProgress(window.scrollY, line.getBoundingClientRect().top + window.scrollY, line.offsetHeight, innerHeight) : self.progress;
            dispatch({ type: "chapter", chapter, progress: Math.round(progress * 1000) / 1000 });
          }
        };
        ScrollTrigger.create({
          trigger: section, start: "top center", end: "bottom center",
          onUpdate: update, onToggle: update, onRefresh: update,
        });
      });
      const landscape = () => window.matchMedia("(min-width: 768px) and (orientation: landscape)").matches;
      gsap.utils.toArray<HTMLElement>(".chapter-line").forEach((line) => {
        const bubble = line.querySelector(".chapter-bubble");
        if (!reducedMotion) gsap.fromTo(line.querySelectorAll(".story-word"), { opacity: .12 }, { opacity: 1, stagger: 1, duration: 1, ease: "none", scrollTrigger: { trigger: line, start: () => landscape() ? "top 50%" : "top 92%", end: () => landscape() ? "top 24%" : "top 76%", scrub: true, invalidateOnRefresh: true } });
        const opacity = gsap.quickSetter(bubble, "opacity");
        const update = () => opacity(reducedMotion ? 1 : storyOpacity(line.getBoundingClientRect().top / innerHeight, landscape()));
        ScrollTrigger.create({ trigger: line, start: "top bottom", end: "bottom top", onUpdate: update, onRefresh: update, onToggle: update });
        update();
      });
      if (!reducedMotion) {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.fromTo(element, { y: 36, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.85, ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 94%", toggleActions: "play none none reverse" },
          });
        });
        const words = gsap.utils.toArray<HTMLElement>(".bio-word");
        if (words.length) gsap.fromTo(words, { opacity: 0.16 }, {
          opacity: 1, stagger: 0.15, ease: "none",
          scrollTrigger: { trigger: ".introduction", start: () => innerWidth >= 768 ? "top top" : "top 50%", end: () => innerWidth >= 768 ? "bottom bottom" : "bottom 50%", scrub: true, invalidateOnRefresh: true },
        });
      }
    });
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-character]"));
    const initial = sections.slice().reverse().find((section) => section.getBoundingClientRect().top <= innerHeight * .5) ?? sections[0];
    const initialLine = initial?.querySelector<HTMLElement>("[data-story-step]");
    const initialProgress = initialLine ? storyProgress(window.scrollY, initialLine.getBoundingClientRect().top + window.scrollY, initialLine.offsetHeight, innerHeight) : 0;
    dispatch({ type: "chapter", chapter: initial?.dataset.character ?? "hidden", progress: initialProgress });
    let alive = true;
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts.ready.then(() => {
      if (!alive) return;
      refresh();
      // Honor direct chapter links after Next's initial scroll restoration.
      try {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
      } catch { /* A malformed URL fragment should not interrupt the page. */ }
    });
    window.addEventListener("load", refresh);
    return () => { alive = false; window.removeEventListener("load", refresh); context.revert(); };
  }, [pathname, reducedMotion]);

  useEffect(() => {
    if (menuOpen) dialog.current?.showModal(); else dialog.current?.close();
  }, [menuOpen]);

  const value = useMemo(() => ({ character, dispatch, reducedMotion, returning, accessories, equip, perform, openTricks: () => setMenuOpen(true), playSound }), [character, reducedMotion, returning, accessories, equip, perform, playSound]);

  return <RuntimeContext.Provider value={value}>
    {children}
    {pathname !== "/character/hunyuan" && <>
    <CharacterShell />
    <button className="sound-toggle" aria-label={sound ? "Mute sound" : "Enable sound"} aria-pressed={sound} onClick={() => {
      const next = !sound;
      audioEnabled.current = next; setSound(next);
      try { localStorage.setItem("portfolio-sound", String(next)); } catch {}
      if (next) playSound(3);
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 5 9H2v6h3l6 4V5Z" />{sound ? <><path d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" /></> : <path d="m16 9 6 6m0-6-6 6" />}</svg>
    </button>
    <dialog ref={dialog} className="trick-dialog" onClose={() => setMenuOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
      <div className="trick-panel">
        <div className="trick-panel-header"><h2>What should I do?</h2><button className="icon-button" aria-label="Close tricks" onClick={() => setMenuOpen(false)}>×</button></div>
        <div className="trick-options">{tricks.map((trick) => <button className="pill" key={trick} onClick={() => perform(trick)}>{trick}<span aria-hidden="true">↗</span></button>)}</div>
        <p>Or grab me and move me around.</p>
      </div>
    </dialog>
    </>}
  </RuntimeContext.Provider>;
}

export function TrickButton() {
  const { openTricks } = usePortfolio();
  return <button className="text-button" onClick={openTricks}>Do a trick <span aria-hidden="true">↗</span></button>;
}

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return <div className="email-row"><a className="contact-email" href={`mailto:${email}`}>{email}</a><button className="copy-email" aria-label="Copy email address" onClick={async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  }}>{copied ? "Copied!" : "Copy ↗"}</button><span className="sr-only" role="status">{copied ? "Email address copied" : ""}</span></div>;
}

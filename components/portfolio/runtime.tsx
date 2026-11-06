"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { characterReducer, chapterStep, initialCharacter, readPreference, tricks, type CharacterAction, type CharacterState, type Trick } from "@/lib/character-state";
import { storyProgress, storyOpacity } from "@/lib/character-tour";
import { createPortfolioAudio, trickSound, type AudioStatus, type SoundEffect } from "@/lib/portfolio-audio";
import { createWordCue } from "@/lib/portfolio-presence";
import { useAwayTitle, useIdleCharacter } from "./use-presence";
import { useSmoothScroll } from "./use-smooth-scroll";
import { CharacterShell } from "@/components/character/shell";

type Runtime = {
  character: CharacterState;
  dispatch: React.Dispatch<CharacterAction>;
  reducedMotion: boolean;
  returning: boolean;
  sleeping: boolean;
  scrollTo: (target: number) => void;
  accessories: string[];
  equip: (name: string) => void;
  perform: (trick: Trick) => void;
  openTricks: () => void;
  playSound: (effect?: SoundEffect) => void;
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
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("muted");
  const [accessories, setAccessories] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollTo = useSmoothScroll(pathname, reducedMotion, menuOpen);
  useAwayTitle(pathname);
  const dialog = useRef<HTMLDialogElement>(null);
  const audio = useMemo(() => createPortfolioAudio(undefined, setAudioStatus), []);
  const previousMode = useRef(character.mode);
  const previousCue = useRef("");
  const initialVisit = useRef<boolean | null>(null);
  const trickTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSound(false);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    try {
      if (initialVisit.current === null) initialVisit.current = readPreference(localStorage, "portfolio-visited");
      setReturning(initialVisit.current);
      localStorage.setItem("portfolio-visited", "true");
    } catch { /* Private browsing must not break the experience. */ }
    return () => {
      media.removeEventListener("change", update);
      clearTimeout(trickTimer.current);
      audio.dispose();
    };
  }, [audio]);
  useEffect(() => {
    audio.setEnabled(sound);
  }, [audio, sound]);

  const playSound = useCallback((effect: SoundEffect = "blip") => { void audio.play(effect); }, [audio]);
  const sleeping = useIdleCharacter(menuOpen || reducedMotion || character.mode !== "tour" || character.chapter === "hidden", playSound);
  useEffect(() => {
    const activationEvents = ["pointerdown", "pointerup", "mousedown", "touchstart", "touchend", "click", "keydown"] as const;
    const unlock = (event: Event) => {
      // The button owns its whole gesture. Global pointerdown activation could
      // otherwise turn its pending Activate action into Mute before click.
      if (event.target instanceof Element && event.target.closest(".sound-toggle")) return;
      const gesture = event.isTrusted && (navigator.userActivation?.hasBeenActive ?? ["mousedown", "touchend", "click", "keydown"].includes(event.type));
      void audio.unlock(gesture);
    };
    const visibility = () => { if (document.hidden) audio.stop(); };
    activationEvents.forEach(event => window.addEventListener(event, unlock, { capture: true, passive: true }));
    document.addEventListener("visibilitychange", visibility);
    return () => {
      activationEvents.forEach(event => window.removeEventListener(event, unlock, true));
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [audio]);
  useEffect(() => {
    const before = previousMode.current; previousMode.current = character.mode;
    if (character.mode === "drag" && before !== "drag") { audio.stop(); playSound("grab"); }
    else if (before === "drag" && character.mode === "tour") { audio.stop(); playSound("drop"); }
    const cue = `${character.chapter}:${chapterStep(character.progress)}`;
    if (character.mode === "tour" && cue !== previousCue.current) {
      previousCue.current = cue;
      if (["hero", "contact", "error"].includes(character.chapter) || character.chapter.startsWith("project")) playSound("blip");
    }
  }, [audio, character.mode, character.chapter, character.progress, playSound]);

  const perform = useCallback((trick: Trick) => {
    clearTimeout(trickTimer.current);
    dispatch({ type: "trick", trick });
    audio.stop(); playSound(trickSound[trick]);
    setMenuOpen(false);
    trickTimer.current = setTimeout(() => dispatch({ type: "finish" }), reducedMotion ? 1200 : 4200);
  }, [audio, playSound, reducedMotion]);

  const equip = useCallback((name: string) => {
    setAccessories((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
    playSound("pat");
  }, [playSound]);

  useEffect(() => {
    clearTimeout(trickTimer.current);
    audio.stop();
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
        if (!reducedMotion) {
          const words = line.querySelectorAll(".story-word");
          const cue = createWordCue(words.length, () => playSound("blip"));
          gsap.set(words, { opacity: .12 });
          gsap.to(words, { opacity: 1, stagger: 1, duration: 1, ease: "none", onUpdate: function () { cue(this.progress()); }, scrollTrigger: { trigger: line, start: () => landscape() ? "top 50%" : "top 92%", end: () => landscape() ? "top 24%" : "top 76%", scrub: true, invalidateOnRefresh: true } });
        }
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
        if (words.length) {
          const cue = createWordCue(words.length, () => playSound("blip"));
          gsap.set(words, { opacity: .16 });
          gsap.to(words, {
            opacity: 1, stagger: 0.15, ease: "none", onUpdate: function () { cue(this.progress()); },
            scrollTrigger: { trigger: ".introduction", start: () => landscape() ? "top top" : "top 50%", end: () => landscape() ? "bottom bottom" : "bottom 50%", scrub: true, invalidateOnRefresh: true },
          });
        }
      }
    });
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-character]"));
    const initial = sections.slice().reverse().find((section) => section.getBoundingClientRect().top <= innerHeight * .5) ?? sections[0];
    const initialLine = initial?.querySelector<HTMLElement>("[data-story-step]");
    const initialProgress = initialLine ? storyProgress(window.scrollY, initialLine.getBoundingClientRect().top + window.scrollY, initialLine.offsetHeight, innerHeight) : 0;
    dispatch({ type: "chapter", chapter: initial?.dataset.character ?? "hidden", progress: initialProgress });
    let alive = true;
    const initialHash = window.location.hash;
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts.ready.then(() => {
      if (!alive) return;
      refresh();
      // Honor direct chapter links after Next's initial scroll restoration.
      try {
        const id = decodeURIComponent(initialHash.slice(1));
        if (id && window.location.hash === initialHash) {
          if (id === "contact") window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
          else document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
        }
      } catch { /* A malformed URL fragment should not interrupt the page. */ }
    });
    window.addEventListener("load", refresh);
    return () => { alive = false; window.removeEventListener("load", refresh); context.revert(); };
  }, [pathname, reducedMotion, audio, playSound]);

  useEffect(() => {
    if (menuOpen) dialog.current?.showModal(); else dialog.current?.close();
  }, [menuOpen]);

  const value = useMemo(() => ({ character, dispatch, reducedMotion, returning, sleeping, scrollTo, accessories, equip, perform, openTricks: () => { setMenuOpen(true); playSound("bell"); }, playSound }), [character, reducedMotion, returning, sleeping, scrollTo, accessories, equip, perform, playSound]);

  return <RuntimeContext.Provider value={value}>
    {children}
    <CharacterShell />
    <button className="sound-toggle" data-audio-state={audioStatus} aria-label={sound ? audioStatus === "running" ? "Mute sound" : "Activate sound" : "Enable sound"} aria-pressed={sound && audioStatus === "running"} title={sound && audioStatus !== "running" ? "Tap to activate sound" : undefined}
      onClick={() => {
      if (sound && audioStatus !== "running") {
        void audio.unlock(true).then(ready => { if (ready) playSound("pat"); });
        return;
      }
      const next = !sound;
      audio.setEnabled(next); setSound(next);
      if (next) void audio.unlock(true).then(ready => { if (ready) playSound("pat"); });
    }}>
      {sound && audioStatus === "pending" && <span className="sound-activation-hint" aria-hidden="true">Tap for sound</span>}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 5 9H2v6h3l6 4V5Z" />{sound ? <><path d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" /></> : <path d="m16 9 6 6m0-6-6 6" />}</svg>
    </button>
    <dialog ref={dialog} className="trick-dialog" onClose={() => setMenuOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
      <div className="trick-panel">
        <div className="trick-panel-header"><h2>What should I do?</h2><button className="icon-button" aria-label="Close tricks" onClick={() => setMenuOpen(false)}>×</button></div>
        <div className="trick-options">{tricks.map((trick) => <button className="pill" key={trick} onClick={() => perform(trick)}>{trick}<span aria-hidden="true">↗</span></button>)}</div>
        <p>Or grab me and move me around.</p>
      </div>
    </dialog>
  </RuntimeContext.Provider>;
}

export function TrickButton() {
  const { openTricks } = usePortfolio();
  return <button className="text-button" onClick={openTricks}>Do a trick <span aria-hidden="true">↗</span></button>;
}

export function ContactLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const { scrollTo } = usePortfolio();
  return <a className={className} href="#contact" onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.location.hash !== "#contact") window.history.pushState(null, "", "#contact");
    document.getElementById("contact")?.focus({ preventScroll: true });
    scrollTo(document.documentElement.scrollHeight);
  }}>{children}</a>;
}

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return <div className="email-row"><a className="contact-email" href={`mailto:${email}`}>{email}</a><button className="copy-email" aria-label="Copy email address" onClick={async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  }}>{copied ? "Copied!" : "Copy ↗"}</button><span className="sr-only" role="status">{copied ? "Email address copied" : ""}</span></div>;
}

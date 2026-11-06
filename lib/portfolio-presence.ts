/** A single cancellable idle deadline; interactions always take priority. */
export function createIdleMonitor(onSleep: () => void, onWake: () => void, delay = 20_000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = true, asleep = false;
  function activity() {
    clearTimeout(timer);
    if (asleep) { asleep = false; onWake(); }
    if (!paused) timer = setTimeout(() => { asleep = true; onSleep(); }, delay);
  }
  function pause() { paused = true; activity(); }
  function resume() { paused = false; activity(); }
  function dispose() { paused = true; clearTimeout(timer); }
  return { activity, pause, resume, dispose };
}

/** One cue per newly crossed word; large scroll jumps never queue a burst. */
export function createWordCue(count: number, play: () => void) {
  let previous = 0;
  return (progress: number) => {
    const current = Math.floor(Math.max(0, Math.min(1, progress)) * count);
    if (current !== previous) { previous = current; play(); }
  };
}

export const awayTitle = "I’ll wait here — Sufyaan";
export function createAwayTitle(document: Pick<Document, "title" | "hidden" | "hasFocus">) {
  let original = document.title;
  function update() {
    if (document.title !== awayTitle) original = document.title;
    const next = document.hidden || !document.hasFocus() ? awayTitle : original;
    if (document.title !== next) document.title = next;
  }
  function restore() { if (document.title === awayTitle) document.title = original; }
  return { update, restore };
}

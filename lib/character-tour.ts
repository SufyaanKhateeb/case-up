// Scroll geometry reconstructed from the reference's grid anchors and travel curve.
// Coordinates describe the head centre/radius in viewport pixels, not canvas boxes.
export type TourKind = "hero" | "left" | "right" | "badge" | "outro" | "detail" | "error";
export type TourFrame = { x: number; y: number; radius: number; turn: number; clip: number; badge: number; beside: number; bubble: number };
export type TourViewport = { width: number; height: number; margin: number; gap: number };
export type TourAnchor = { top: number; frame: TourFrame };
export type TourGesture = "wave" | "point" | "think" | "watch" | "thumbs" | "cheer";
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function tourPlacement(kind: TourKind, viewport: TourViewport, textBottom?: number): TourFrame {
  const { width: w, height: h, margin: m, gap } = viewport;
  const compact = w < 768 || h >= w;
  const count = compact ? 4 : 12;
  const col = (w - 2 * m - (count - 1) * gap) / count;
  const columns = (n: number) => n * col + (n - 1) * gap;
  const span = (first: number, last: number) => m + (first - 1) * (col + gap) + columns(last - first + 1) / 2;
  const frame = { x: w / 2, y: h * .6, radius: h * .17, turn: -.15, clip: 10000, badge: 0, beside: 0, bubble: columns(4) };
  if (kind === "badge") return { ...frame, x: m + 42, y: h - m - 42, radius: 84 * .28, turn: 0, clip: 42, badge: 1 };
  if (kind === "left" || kind === "right") {
    const right = kind === "right";
    if (w < 768 || h >= w) return { ...frame, x: span(right ? 4 : 1, right ? 4 : 1), y: h * .92 - 64, radius: h * .075, turn: right ? -.2 : .2, beside: 1 };
    return { ...frame, x: span(right ? 10 : 1, right ? 12 : 3), y: h - Math.min(h * .36, w * .216), radius: Math.min(h * .15, w * .09), turn: right ? -.2 : .2, bubble: columns(3) };
  }
  if (kind === "detail") return { ...frame, x: w < 768 ? span(3, 4) : span(10, 12), y: h * (w < 768 ? .9 : .62), radius: h * (w < 768 ? .06 : .14) };
  if (kind === "outro" && w < 768 && textBottom !== undefined) {
    const ceiling = textBottom + m;
    const radius = Math.max(12, Math.min(h * .12, w * .28, (h - ceiling) / 3.75));
    return { ...frame, x: span(1, 3), y: Math.max(h * .76, ceiling + radius * 1.75), radius };
  }
  if (kind === "hero" || kind === "outro" || kind === "error") {
    return { ...frame, x: compact ? span(1, kind === "outro" ? 3 : 4) : span(9, 12), y: h * (compact ? .74 : kind === "outro" ? .62 : .6), radius: compact ? Math.min(h * .13, w * .3) : h * .17 };
  }
  return frame;
}

export function blendTour(from: TourFrame, to: TourFrame, progress: number, direction: number, width: number): TourFrame {
  const p = clamp(progress);
  const eased = p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
  const distance = to.x - from.x;
  const turn = direction * Math.sign(distance) * Math.PI / 4 * Math.min(1, Math.abs(distance) / (width * .25)) * Math.min(1, 1.6 * Math.sin(Math.PI * p));
  return {
    x: lerp(from.x, to.x, eased), y: lerp(from.y, to.y, eased),
    radius: Math.exp(lerp(Math.log(from.radius), Math.log(to.radius), eased)),
    turn: lerp(from.turn, to.turn, eased) + turn,
    clip: Math.exp(lerp(Math.log(from.clip), Math.log(to.clip), eased)),
    badge: lerp(from.badge, to.badge, eased), beside: lerp(from.beside, to.beside, eased), bubble: lerp(from.bubble, to.bubble, eased),
  };
}

export function sampleTour(scroll: number, anchors: TourAnchor[], viewport: TourViewport, direction = 1): TourFrame {
  let frame = anchors[0]?.frame ?? tourPlacement("hero", viewport);
  for (const anchor of anchors.slice(1)) {
    const start = anchor.top - viewport.height;
    if (scroll <= start) break;
    frame = blendTour(frame, anchor.frame, (scroll - start) / viewport.height, direction, viewport.width);
  }
  return frame;
}

// The next narration enters at the viewport centre, just like data-line in the source.
export function storyProgress(scroll: number, firstLineTop: number, lineHeight: number, viewportHeight: number) {
  return clamp((scroll + viewportHeight * .5 - firstLineTop) / Math.max(1, lineHeight * 3));
}

export function chapterGesture(chapter: string, step: number): TourGesture | null {
  if (chapter === "hero" || chapter === "contact") return "wave";
  if (chapter === "work") return "cheer";
  if (chapter.startsWith("project")) return step === 0 ? "point" : step === 1 ? "think" : chapter === "project-one" ? "watch" : "thumbs";
  return null;
}

export function storyOpacity(top: number, landscape: boolean) {
  const [enter, entered, leave, left] = landscape ? [.6, .46, .18, .06] : [1, .9, .64, .56];
  return Math.min(clamp((enter - top) / (enter - entered)), clamp((top - left) / (leave - left)));
}

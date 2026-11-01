/** Fade the large character’s coarse print into finer shading for small faces. */
export function characterPrintSettings(radius: number, basePixelSize: number) {
  const progress = Math.max(0, Math.min(1, (radius - 24) / 66));
  const blend = progress * progress * (3 - 2 * progress);
  return { pixelSize: 1 + (basePixelSize - 1) * blend, ditherStrength: .12 + .88 * blend };
}

/** A cropped camera keeps the badge sharp without supersampling the whole scene. */
export function characterPrintWindow(x: number, y: number, clip: number, width: number, height: number) {
  if (clip > 128) return null;
  const diameter = clip * 2;
  return {
    left: x - clip, top: y - clip, diameter,
    sourceRect: [(x - clip) / width, (height - y - clip) / height, diameter / width, diameter / height] as const,
  };
}

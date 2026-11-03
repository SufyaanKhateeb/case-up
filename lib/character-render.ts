/** A cropped camera keeps the badge sharp without supersampling the whole scene. */
export function characterRenderWindow(x: number, y: number, clip: number, width: number, height: number) {
  if (clip > 128) return null;
  const diameter = clip * 2;
  return {
    left: x - clip, top: y - clip, diameter,
    sourceRect: [(x - clip) / width, (height - y - clip) / height, diameter / width, diameter / height] as const,
  };
}

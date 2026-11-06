export type Point = { x: number; y: number };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/** Rounded-edge attachment and a continuously aimed tip, in bubble-local pixels. */
export function bubbleTail(width: number, height: number, target: Point, cornerRadius = 26): [Point, Point, Point] | null {
  if (width <= 0 || height <= 0 || (target.x >= 0 && target.x <= width && target.y >= 0 && target.y <= height)) return null;
  const radius = clamp(cornerRadius, 0, Math.min(width, height) / 2);
  const halfWidth = Math.min(16, width / 3, height / 3);
  const attachmentRadius = Math.min(Math.min(width, height) / 2, Math.max(radius, halfWidth + 1.5));
  const origin = { x: clamp(target.x, attachmentRadius, width - attachmentRadius), y: clamp(target.y, attachmentRadius, height - attachmentRadius) };
  const dx = target.x - origin.x, dy = target.y - origin.y;
  const targetDistance = Math.hypot(dx, dy), ux = dx / targetDistance, uy = dy / targetDistance;
  const pointAt = (distance: number): Point => ({ x: origin.x + ux * distance, y: origin.y + uy * distance });
  const inside = (point: Point) => {
    const x = point.x - clamp(point.x, radius, width - radius);
    const y = point.y - clamp(point.y, radius, height - radius);
    return point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height && x * x + y * y <= radius * radius;
  };
  // Project onto the nearest rounded edge, rather than aiming from the box
  // centre: on wide bubbles that would create a nearly flat, clipped sliver.
  const edgeDistance = attachmentRadius;
  // Both ends of the broad base must overlap the body. A fixed 3px inset
  // allowed the widened tail to protrude beside curved corners.
  const baseEnds = (distance: number): [Point, Point] => {
    const center = pointAt(distance);
    return [{ x: center.x - uy * halfWidth, y: center.y + ux * halfWidth }, { x: center.x + uy * halfWidth, y: center.y - ux * halfWidth }];
  };
  let low = 0, high = edgeDistance;
  for (let i = 0; i < 18; i++) {
    const middle = (low + high) / 2;
    if (baseEnds(middle).every(inside)) low = middle; else high = middle;
  }
  const ends = baseEnds(Math.max(0, low - 1.5));
  return [
    ...ends,
    pointAt(Math.min(targetDistance, edgeDistance + 22)),
  ];
}

export function tailPolygon(points: ReturnType<typeof bubbleTail>) {
  return points ? `polygon(${points.map(point => `${(point.x + 24).toFixed(2)}px ${(point.y + 24).toFixed(2)}px`).join(",")})` : "polygon(0 0,0 0,0 0)";
}

/** Reference-style elastic pickup: both directions move, with soft resistance. */
export function dragOffset(delta: Point, radius: number): Point {
  const resist = (value: number, limit: number) => value * limit / (Math.abs(value) + limit);
  return { x: resist(delta.x, radius * 1.2), y: resist(delta.y, radius * (delta.y < 0 ? .4 : 1.2)) };
}

export function gestureIntent(delta: Point, touch: boolean): "pending" | "scroll" | "drag" {
  if (Math.hypot(delta.x, delta.y) < 6) return "pending";
  return touch && Math.abs(delta.y) > Math.abs(delta.x) ? "scroll" : "drag";
}

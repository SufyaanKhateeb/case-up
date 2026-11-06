import { test } from "node:test";
import assert from "node:assert/strict";
import { bubbleTail, dragOffset, gestureIntent, tailPolygon } from "../lib/character-interaction";

test("bubble tips aim at the character on every side and corner", () => {
  for (const target of [{ x: -100, y: 25 }, { x: 300, y: 25 }, { x: 100, y: -150 }, { x: 100, y: 200 }, { x: -40, y: -100 }, { x: 280, y: 150 }]) {
    const points = bubbleTail(200, 70, target)!;
    const base = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    const tip = points[2];
    const cross = (tip.x - base.x) * (target.y - base.y) - (tip.y - base.y) * (target.x - base.x);
    assert.ok(Math.abs(cross) < .00001);
    assert.ok((tip.x - base.x) * (target.x - base.x) + (tip.y - base.y) * (target.y - base.y) > 0);
    assert.ok(points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
    assert.match(tailPolygon(points), /^polygon\(/);
  }
  assert.equal(bubbleTail(200, 70, { x: 100, y: 30 }), null);
  assert.equal(bubbleTail(0, 70, { x: 100, y: 30 }), null);
});

test("tail attachment remains continuous across a corner", () => {
  const before = bubbleTail(200, 70, { x: 300, y: 104.99 })!;
  const after = bubbleTail(200, 70, { x: 300, y: 105.01 })!;
  before.forEach((point, index) => assert.ok(Math.hypot(point.x - after[index].x, point.y - after[index].y) < .1));
});

test("wide tail bases stay inside rounded bubbles at every angle and responsive radius", () => {
  for (const [width, height, radius] of [[640, 56, 26], [200, 70, 27], [240, 88, 20], [100, 48, 22], [32, 24, 12]]) {
    const signedDistance = (point: { x: number; y: number }) => {
      const x = Math.abs(point.x - width / 2) - (width / 2 - radius);
      const y = Math.abs(point.y - height / 2) - (height / 2 - radius);
      return Math.hypot(Math.max(x, 0), Math.max(y, 0)) + Math.min(Math.max(x, y), 0) - radius;
    };
    for (let angle = 0; angle < 360; angle++) {
      const radians = angle * Math.PI / 180;
      const target = { x: width / 2 + Math.cos(radians) * width * 3, y: height / 2 + Math.sin(radians) * width * 3 };
      const points = bubbleTail(width, height, target, radius)!;
      assert.ok(signedDistance(points[0]) < 0 && signedDistance(points[1]) < 0, `${width}×${height}, ${angle}°: base must overlap the bubble`);
      assert.ok(signedDistance(points[2]) > 0, `${width}×${height}, ${angle}°: tip must extend from the body`);
    }
  }
});

test("a shallow corner tail stays broad and projects outside a wide, short bubble", () => {
  const [a, b, tip] = bubbleTail(512, 48, { x: 581.25, y: 59 }, 20)!;
  const base = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  assert.ok(base.x > 480);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 31.9);
  assert.ok(tip.x > 530, "tip must protrude from the nearby right corner, not skim the bottom edge");
});

test("pickup uses soft resistance and allows downward as well as sideways movement", () => {
  assert.deepEqual(dragOffset({ x: 0, y: 0 }, 100), { x: 0, y: 0 });
  const down = dragOffset({ x: 10000, y: 10000 }, 100);
  const up = dragOffset({ x: -10000, y: -10000 }, 100);
  assert.ok(down.x > 0 && down.x < 120 && down.y > 0 && down.y < 120);
  assert.ok(up.x < 0 && up.x > -120 && up.y < 0 && up.y > -40);
});

test("touch scrolling wins before pickup while horizontal movement grabs", () => {
  assert.equal(gestureIntent({ x: 2, y: 2 }, true), "pending");
  assert.equal(gestureIntent({ x: 2, y: 20 }, true), "scroll");
  assert.equal(gestureIntent({ x: 20, y: 2 }, true), "drag");
  assert.equal(gestureIntent({ x: 2, y: 20 }, false), "drag");
});

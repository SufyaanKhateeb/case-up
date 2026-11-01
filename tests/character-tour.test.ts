import { test } from "node:test";
import assert from "node:assert/strict";
import { blendTour, chapterGesture, sampleTour, storyOpacity, storyProgress, tourPlacement } from "../lib/character-tour";
import { chapterStep } from "../lib/character-state";

const viewport = { width: 1440, height: 900, margin: 40.32, gap: 20.16 };
const hero = tourPlacement("hero", viewport);
const left = tourPlacement("left", viewport);
const right = tourPlacement("right", viewport);
const badge = tourPlacement("badge", viewport);
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < .01, `${actual} ≠ ${expected}`);

test("landscape anchors match the source grid, head radius, and height", () => {
  near(hero.x, 1179.84); near(hero.y, 540); near(hero.radius, 153);
  near(left.x, 202.68); near(right.x, 1237.32); near(left.radius, 129.6); near(left.y, 588.96);
  const short = tourPlacement("left", { width: 844, height: 390, margin: 23.632, gap: 11.816 });
  near(short.radius, 58.5); near(short.y, 249.6);
});

test("travel spans the entering viewport, reverses its turn, and never jumps at section edges", () => {
  const anchors = [{ top: 0, frame: hero }, { top: 900, frame: left }, { top: 2250, frame: right }];
  const a = sampleTour(1350, anchors, viewport);
  const middle = sampleTour(1800, anchors, viewport);
  const reverse = sampleTour(1800, anchors, viewport, -1);
  near(a.x, left.x); near(middle.x, (left.x + right.x) / 2);
  near(middle.x, reverse.x); near(middle.radius, reverse.radius);
  assert.ok(middle.turn > .7 && reverse.turn < -.7);
  const end = sampleTour(2250, anchors, viewport);
  near(end.x, right.x); near(end.turn, right.turn);
  assert.ok(Math.abs(sampleTour(2249.99, anchors, viewport).x - end.x) < .01);
  near(sampleTour(0, anchors, viewport).x, hero.x);
});

test("badge collapse interpolates scale logarithmically and a direct seek reaches the latest anchor", () => {
  const middle = blendTour(left, badge, .5, 1, viewport.width);
  near(middle.radius, Math.sqrt(left.radius * badge.radius));
  assert.ok(middle.clip > badge.clip && middle.clip < left.clip);
  const anchors = [{ top: 0, frame: hero }, { top: 2250, frame: left }, { top: 6000, frame: badge }];
  const end = sampleTour(20000, anchors, viewport);
  near(end.x, badge.x); near(end.radius, badge.radius); near(end.clip, 42);
});

test("narration cues and fades use row positions in both scroll directions", () => {
  const first = 2790, height = 378;
  assert.equal(chapterStep(storyProgress(2250, first, height, 900)), 0);
  assert.equal(chapterStep(storyProgress(2718.01, first, height, 900)), 1);
  assert.equal(chapterStep(storyProgress(3096.01, first, height, 900)), 2);
  assert.equal(chapterStep(storyProgress(2500, first, height, 900)), 0);
  assert.equal(storyOpacity(.7, true), 0);
  near(storyOpacity(.53, true), .5);
  assert.equal(storyOpacity(.3, true), 1);
  near(storyOpacity(.12, true), .5);
  assert.equal(storyOpacity(0, true), 0);
  near(storyOpacity(.95, false), .5);
  assert.equal(chapterGesture("intro", 0), null);
  assert.equal(chapterGesture("project-one", 2), "watch");
  assert.equal(chapterGesture("project-two", 2), "thumbs");
});


test("mobile outro fits below footer controls instead of covering their click targets", () => {
  const viewport = { width: 390, height: 844, margin: 18, gap: 9 };
  const footerBottom = 580;
  const frame = tourPlacement("outro", viewport, footerBottom);
  const handleTop = frame.y - frame.radius * 1.2;
  assert.ok(handleTop > footerBottom);
  assert.ok(frame.radius < viewport.height * .12);
  assert.ok(frame.y + frame.radius < viewport.height);
  const tallerText = tourPlacement("outro", viewport, footerBottom + 60);
  assert.ok(tallerText.radius < frame.radius);
  assert.ok(tallerText.y - tallerText.radius * 1.2 > footerBottom + 60);
});

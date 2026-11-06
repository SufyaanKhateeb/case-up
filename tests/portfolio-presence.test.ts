import { test } from "node:test";
import assert from "node:assert/strict";
import { awayTitle, createAwayTitle, createIdleMonitor, createWordCue } from "../lib/portfolio-presence";

test("idle waits 20 seconds, resets on activity, and wakes once", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let sleeps = 0, wakes = 0;
  const monitor = createIdleMonitor(() => sleeps++, () => wakes++);
  monitor.resume(); context.mock.timers.tick(19_999);
  assert.equal(sleeps, 0);
  monitor.activity(); context.mock.timers.tick(19_999);
  assert.equal(sleeps, 0);
  context.mock.timers.tick(1); assert.equal(sleeps, 1);
  monitor.activity(); monitor.activity(); assert.equal(wakes, 1);
  monitor.dispose(); context.mock.timers.tick(30_000); assert.equal(sleeps, 1);
});

test("hidden pages, dialogs and direct manipulation can suspend the idle deadline", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let sleeps = 0;
  const monitor = createIdleMonitor(() => sleeps++, () => {});
  monitor.resume(); context.mock.timers.tick(19_000); monitor.pause();
  context.mock.timers.tick(30_000); assert.equal(sleeps, 0);
  monitor.resume(); context.mock.timers.tick(20_000); assert.equal(sleeps, 1);
  monitor.dispose();
});

test("word cues follow forward and reverse reveals without bursts on large jumps", () => {
  let sounds = 0;
  const update = createWordCue(10, () => sounds++);
  [0, .1, .11, .5, .5, 1, 1, .4].forEach(update);
  assert.equal(sounds, 4);
  createWordCue(0, () => sounds++)(1);
  assert.equal(sounds, 4);
});

test("away titles restore route metadata and do not rewrite unchanged active titles", () => {
  let value = "Portfolio", writes = 0, focused = true;
  const document = {
    get title() { return value; }, set title(next: string) { value = next; writes++; },
    hidden: false, hasFocus: () => focused,
  };
  const presence = createAwayTitle(document);
  presence.update(); presence.update(); assert.equal(writes, 0);
  focused = false; presence.update(); assert.equal(value, awayTitle);
  document.title = "Résumé — Sufyaan"; presence.update(); assert.equal(value, awayTitle);
  focused = true; presence.update(); assert.equal(value, "Résumé — Sufyaan");
  document.hidden = true; presence.update(); assert.equal(value, awayTitle);
  presence.restore(); assert.equal(value, "Résumé — Sufyaan");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { characterReducer, initialCharacter, chapterStep, readPreference, scratchComplete, tricks } from "../lib/character-state";
import { getNextProject, getProject, portfolio, projects, scenes } from "../content/portfolio";

test("dragging interrupts a trick and cannot be interrupted by its stale timeout", () => {
  const dancing = characterReducer(initialCharacter, { type: "trick", trick: "Dance" });
  const dragging = characterReducer(dancing, { type: "drag" });
  assert.equal(dragging.trick, null);
  assert.equal(dragging.mode, "drag");
  assert.deepEqual(characterReducer(dragging, { type: "trick", trick: "Fly" }), dragging);
  assert.deepEqual(characterReducer(dragging, { type: "finish" }), dragging);
});

test("the tour keeps its current chapter during interaction and resumes there", () => {
  let state = characterReducer(initialCharacter, { type: "trick", trick: "Selfie" });
  state = characterReducer(state, { type: "chapter", chapter: "project-two", progress: 0.7 });
  assert.equal(state.mode, "trick");
  state = characterReducer(state, { type: "finish" });
  assert.equal(state.mode, "tour");
  assert.equal(state.chapter, "project-two");
  assert.equal(chapterStep(state.progress), 2);
});

test("all tricks can finish and chapter selection is reversible at boundaries", () => {
  for (const trick of tricks) {
    const state = characterReducer(initialCharacter, { type: "trick", trick });
    assert.equal(state.trick, trick);
    assert.equal(characterReducer(state, { type: "finish" }).trick, null);
  }
  assert.equal(chapterStep(-1), 0);
  assert.equal(chapterStep(0.34), 1);
  assert.equal(chapterStep(0.8), 2);
  assert.equal(chapterStep(0.1), 0);
  assert.equal(chapterStep(1), 2);
  assert.equal(chapterStep(2), 2);
});

test("scratch completion uses cleared surface area rather than pointer distance", () => {
  assert.equal(scratchComplete(41, 100), false);
  assert.equal(scratchComplete(42, 100), true);
  assert.equal(scratchComplete(100, 100), true);
  assert.equal(scratchComplete(0, 0), false);
});

test("preferences default safely when storage is denied or unavailable", () => {
  assert.equal(readPreference(null, "sound"), false);
  assert.equal(readPreference({ getItem: () => { throw new Error("Denied"); } }, "sound"), false);
  assert.equal(readPreference({ getItem: () => "false" }, "sound"), false);
  assert.equal(readPreference({ getItem: () => "true" }, "sound"), true);
});

test("each scene resolves to a unique static project route and the next-project chain closes", () => {
  assert.equal(scenes.length, 3);
  assert.equal(new Set(projects.map((project) => project.slug)).size, projects.length);
  for (const scene of scenes) assert.ok(getProject(scene.projectSlug));
  let project = projects[0];
  const visited = new Set<string>();
  for (let index = 0; index < projects.length; index++) {
    visited.add(project.slug);
    project = getNextProject(project.slug)!;
  }
  assert.equal(project.slug, projects[0].slug);
  assert.equal(visited.size, projects.length);
  assert.equal(getProject("missing-project"), undefined);
  assert.equal(getNextProject("missing-project"), undefined);
});

test("migrated content has real destinations and preserves the animation scene IDs", () => {
  assert.ok(portfolio.email.includes("@"));
  assert.deepEqual(scenes.map((scene) => scene.id), ["project-one", "project-two", "project-three"]);
  assert.deepEqual(projects.map((project) => project.slug), ["placement-app", "real-time-chat", "portfolio"]);
  assert.ok(portfolio.socials.some((link) => new URL(link.url).hostname === "github.com"));
  assert.ok(existsSync(`public${portfolio.resume.url}`));
  for (const project of projects) {
    assert.notEqual(project.status, "placeholder");
    assert.ok(project.repositoryUrl || project.repositories?.length);
    assert.ok(project.contributions.length > 0);
    if (project.status === "ready") assert.ok(project.desktop && project.mobile);
    assert.ok(!JSON.stringify(project).includes("Your role goes here"));
  }
});

test("both résumé versions have distinct downloads and locally rendered preview pages", () => {
  const { fullstack, data } = portfolio.resume.variants;
  assert.notEqual(fullstack.url, data.url);
  assert.notEqual(fullstack.route, data.route);
  assert.equal(portfolio.resume.url, fullstack.url);
  for (const version of Object.values(portfolio.resume.variants)) {
    assert.ok(existsSync(`public${version.url}`));
    for (const page of version.pages) assert.ok(existsSync(`public${page.src}`));
  }
  assert.equal(portfolio.experience[0].company, "Wells Fargo");
  assert.equal(portfolio.experience[1].period, "September 2023 – June 2025");
});


test("repeating a trick advances its action identity so repeated punches restart", () => {
  const first = characterReducer(initialCharacter, { type: "trick", trick: "Punching bag" });
  const second = characterReducer(first, { type: "trick", trick: "Punching bag" });
  assert.equal(second.trick, first.trick);
  assert.equal(second.actionId, first.actionId + 1);
  assert.equal(characterReducer(second, { type: "chapter", chapter: "contact", progress: 0 }).actionId, second.actionId);
});

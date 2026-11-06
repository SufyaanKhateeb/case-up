import { test } from "node:test";
import assert from "node:assert/strict";
import { Box3, Vector3 } from "three";
import { createCharacter, HEAD_HEIGHT, HEAD_RADIUS } from "../components/character/model";
import { tourPlacement } from "../lib/character-tour";
import { createCharacterMotion } from "../components/character/motion";
import { characterManifest } from "../content/character";
import { tricks } from "../lib/character-state";

test("idle yawn settles into closed eyes and wakes or interrupts cleanly", () => {
  const rig = createCharacter(characterManifest.look);
  const motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    const idle = motion.sleep(); idle.seek(1.2, false);
    assert.ok(rig.mouth.open > .3);
    assert.ok(rig.face.eyeOpen < .2);
    idle.seek(2.4, false); assert.ok(rig.face.eyeOpen < .15);
    motion.wake().seek(1.4, false);
    assert.equal(idle.parent, null); assert.equal(rig.face.eyeOpen, 1);
    const again = motion.sleep(); again.seek(1, false);
    motion.grab(); assert.equal(again.parent, null);
    motion.rest(true); assert.equal(rig.face.eyeOpen, 1);
  } finally { motion.dispose(); rig.dispose(); }
});

test("phone tour stays bottom-cropped through repeated toolbar expansion and collapse", () => {
  const rig = createCharacter(characterManifest.look);
  try {
    const torso = new Box3().setFromObject(rig.root.getObjectByName("SweatshirtTorso")!);
    for (const [width, height] of [[320, 568], [393, 852], [430, 932]]) {
      const viewport = { width, height, margin: 18, gap: 9 };
      for (const kind of ["hero", "left", "right", "outro"] as const) {
        const frame = tourPlacement(kind, viewport, height - 300);
        const scale = frame.radius / HEAD_RADIUS;
        const hem = frame.y + (HEAD_HEIGHT - torso.min.y) * scale;
        // The large render surface stays constant while browser chrome changes
        // the visible window; CSS bottom anchoring moves its origin immediately.
        for (const visibleHeight of [height - 112, height - 80, height - 32, height, height - 48, height - 96, height]) {
          const origin = visibleHeight - height;
          assert.ok(origin + hem >= visibleHeight, `${kind} torso must continue through the moving bottom edge`);
          assert.ok(origin + frame.y - frame.radius * 1.6 >= 0, `${kind} head remains visible`);
        }
      }
    }
  } finally { rig.dispose(); }
});

test("all articulated tricks render finite transforms and reduced motion restores neutral", () => {
  const rig = createCharacter(characterManifest.look);
  const motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    for (const trick of tricks) {
      const action = motion.perform(trick);
      for (const time of [.25, 1.2, 2.5, 4.1]) {
        action.seek(time, false);
        motion.update(time, .016, { x: .3, y: -.2 }, false);
        rig.root.traverse((object) => {
          for (const value of [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]) assert.ok(Number.isFinite(value), `${trick}: ${object.name}`);
        });
      }
      motion.rest(true);
      motion.update(0, .016, { x: 1, y: 1 }, true);
      assert.equal(rig.motion.cover, 1);
      assert.equal(rig.motion.develop, 1);
      assert.equal(rig.motion.turn, 0);
      assert.equal(rig.motion.hop, 0);
      assert.equal(rig.face.eyeOpen, 1);
      assert.equal(rig.headTilt.rotation.x, 0);
    }
  } finally { motion.dispose(); rig.dispose(); }
});

test("drag interruption cancels vanish and restores a visible grabbed character", () => {
  const rig = createCharacter(characterManifest.look);
  const motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    const vanish = motion.perform("Vanish");
    vanish.seek(1.4, false);
    assert.equal(rig.motion.cover, 0);
    motion.grab();
    assert.equal(vanish.parent, null);
    motion.rest(true);
    assert.equal(rig.motion.cover, 1);
    assert.equal(rig.motion.develop, 1);
    assert.equal(rig.motion.lean, 0);
  } finally { motion.dispose(); rig.dispose(); }
});


test("smiling eyes stay above the face through a blink", () => {
  const rig = createCharacter(characterManifest.look);
  try {
    const vertex = new Vector3();
    for (const openness of [1, .5, .1]) {
      rig.eyes.forEach(({ group }) => { group.scale.y = openness; });
      rig.root.updateMatrixWorld(true);
      for (const { happy } of rig.eyes) {
        const positions = happy.geometry.attributes.position;
        for (let index = 0; index < positions.count; index++) {
          vertex.fromBufferAttribute(positions, index);
          happy.localToWorld(vertex); rig.head.worldToLocal(vertex);
          assert.ok(vertex.length() > HEAD_RADIUS, "smile arc must not intersect the face");
        }
      }
    }
  } finally { rig.dispose(); }
});

test("eye expressions swap only at the closed point and reopen together", () => {
  const rig = createCharacter(characterManifest.look);
  const motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    motion.update(0, .016, { x: 0, y: 0 }, false);
    rig.face.happy = 1;
    motion.update(1, .016, { x: 0, y: 0 }, false);
    assert.ok(rig.eyes.every((eye) => eye.pupil.visible && !eye.happy.visible));
    motion.update(1.071, .016, { x: 0, y: 0 }, false);
    assert.ok(rig.eyes.every((eye) => !eye.pupil.visible && !eye.highlight.visible && eye.happy.visible && eye.group.scale.y < .12));
    motion.update(1.2, .016, { x: 0, y: 0 }, false);
    assert.ok(rig.eyes.every((eye) => eye.group.scale.y === 1));
    rig.face.happy = 0;
    motion.update(2, .016, { x: 0, y: 0 }, false);
    assert.ok(rig.eyes.every((eye) => eye.happy.visible));
    motion.update(2.071, .016, { x: 0, y: 0 }, false);
    assert.ok(rig.eyes.every((eye) => eye.pupil.visible && eye.highlight.visible && !eye.happy.visible));
    rig.face.happy = 1;
    motion.update(3, .016, { x: 0, y: 0 }, true);
    assert.ok(rig.eyes.every((eye) => eye.happy.visible && eye.group.scale.y === 1));
  } finally { motion.dispose(); rig.dispose(); }
});


test("tour poses mirror their active arm and include the source wrist-view pose", () => {
  const rig = createCharacter(characterManifest.look);
  const motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    motion.gesture("think", 1).seek(1.1, false);
    assert.ok(rig.arms[0].elbow.rotation.x > 1.8);
    assert.equal(rig.arms[1].elbow.rotation.x, 0);
    motion.gesture("think", -1).seek(1.1, false);
    assert.ok(rig.arms[1].elbow.rotation.x > 1.8);
    assert.equal(rig.arms[0].elbow.rotation.x, 0);
    motion.gesture("watch", 1).seek(1.1, false);
    assert.ok(rig.arms[0].elbow.rotation.x < -1.5);
    assert.ok(rig.neck.rotation.x > .5);
    motion.grab();
    motion.rest(true);
    assert.equal(rig.arms[0].elbow.rotation.x, 0);
  } finally { motion.dispose(); rig.dispose(); }
});

test("a narration pose waits for the swipe beat and grabbing cancels queued motion", () => {
  const rig = createCharacter(characterManifest.look);
  const motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    const swipe = motion.swipe(-1, { x: -5, y: .5 });
    swipe.seek(.6, false);
    const queued = motion.gesture("think", -1);
    assert.equal(queued, swipe);
    assert.ok(swipe.parent);
    swipe.seek(.71, false);
    assert.equal(swipe.parent, null);
    const interrupted = motion.swipe(1);
    motion.gesture("thumbs", 1);
    motion.grab();
    assert.equal(interrupted.parent, null);
    motion.rest(true);
    assert.equal(rig.arms[0].elbow.rotation.x, 0);
    assert.equal(rig.arms[1].elbow.rotation.x, 0);
  } finally { motion.dispose(); rig.dispose(); }
});

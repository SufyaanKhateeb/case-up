import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createImportedCharacter, importedHeadWeight, importedRegistration } from "../components/character/imported-model";
import { createCharacterMotion } from "../components/character/motion";
import { characterManifest } from "../content/character";
import { tricks } from "../lib/character-state";
import { loadConnectedAsset } from "./helpers/connected-character";

async function fixture() {
  const { root } = await loadConnectedAsset();
  return createImportedCharacter(root, characterManifest.look);
}

test("live character preserves the tested arm skin and original registered rest surface", async () => {
  assert.equal(characterManifest.model, "/character/arms-continuous.glb");
  const rig = await fixture(), expected = new THREE.Vector3(), actual = new THREE.Vector3();
  try {
    assert.equal(rig.skeleton.bones.length, 9);
    assert.equal(rig.mesh.geometry.index!.count / 3, 200000);
    const positions = rig.mesh.geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      expected.fromBufferAttribute(positions, index); rig.mesh.getVertexPosition(index, actual);
      assert.ok(actual.distanceTo(expected) < 2e-6, "binding must preserve the approved rest mesh");
    }
    const centre = rig.headBone.getWorldPosition(new THREE.Vector3());
    assert.ok(Math.abs(centre.y - 4.55) < 1e-6);
    assert.equal(importedRegistration.scale, 7);
    assert.equal(importedHeadWeight(.445, 0), 0);
    assert.equal(importedHeadWeight(.55, 0), 1);
    assert.equal(rig.mesh.name, "ApprovedConnectedMesh");
  } finally { rig.dispose(); }
});

test("tour gestures visibly animate the selected continuous hand and keep the waist stable", async () => {
  const rig = await fixture(), motion = createCharacterMotion(rig);
  motion.setActive(false);
  const positions = rig.mesh.geometry.getAttribute("position"), rest = new THREE.Vector3(), actual = new THREE.Vector3();
  try {
    for (const direction of [1, -1]) {
      motion.rest(true); rig.sync();
      const side = direction > 0 ? "left" : "right", other = direction > 0 ? "right" : "left";
      const handRest = rig.armRig.arms[side].hand.getWorldPosition(new THREE.Vector3());
      motion.gesture("wave", direction).seek(1.1, false); rig.sync();
      assert.ok(rig.armRig.arms[side].hand.getWorldPosition(new THREE.Vector3()).y > handRest.y + .7);
      assert.equal(rig.armPoses[other].shoulder, 0);
      for (let index = 0; index < positions.count; index++) {
        rest.fromBufferAttribute(positions, index);
        if (rest.y < .44 && Math.abs(rest.x) < .109 || rest.y < .18 && Math.abs(rest.x) < .20) {
          rig.mesh.getVertexPosition(index, actual);
          assert.ok(actual.distanceTo(rest) < 2e-6, "waist and central chest stay fixed inside the connected mesh");
        }
      }
    }
    motion.rest(true); rig.sync();
    assert.deepEqual([rig.armPoses.left.shoulder, rig.armPoses.left.elbow, rig.armPoses.left.wrist], [0, 0, 0]);
    assert.deepEqual([rig.armPoses.right.shoulder, rig.armPoses.right.elbow, rig.armPoses.right.wrist], [0, 0, 0]);
  } finally { motion.dispose(); rig.dispose(); }
});

test("actual chin and jaw vertices follow the head rigidly through turns and tilts", async () => {
  const rig = await fixture();
  const positions = rig.mesh.geometry.getAttribute("position");
  const point = new THREE.Vector3(), actual = new THREE.Vector3(), expected = new THREE.Vector3();
  const jaw: number[] = [], collar: number[] = [];
  for (let index = 0; index < positions.count; index++) {
    point.fromBufferAttribute(positions, index);
    // Anatomical regions measured on the original model, independent of the
    // weighting formula. The lowest chin is around y=.471, z=.122, not y=.55.
    if (Math.abs(point.x) < .08 && point.y > .46 && point.y < .58 && point.z > .105) jaw.push(index);
    if (Math.abs(point.x) > .09 && Math.abs(point.x) < .14 && point.y > .43 && point.y < .49 && point.z < .04) collar.push(index);
  }
  assert.ok(jaw.length > 5000 && collar.length > 1000, "exercise the actual dense jaw and collar geometry");
  try {
    const headIndex = rig.skeleton.bones.indexOf(rig.headBone);
    for (const [yaw, pitch, tilt] of [[.55, 0, 0], [-.55, .3, 0], [0, .55, .15], [.3, -.25, -.12]]) {
      rig.neck.rotation.set(pitch, yaw, 0); rig.headTilt.rotation.z = tilt; rig.sync();
      const headMatrix = new THREE.Matrix4().multiplyMatrices(rig.headBone.matrixWorld, rig.skeleton.boneInverses[headIndex]);
      for (const index of jaw) {
        expected.fromBufferAttribute(positions, index).applyMatrix4(rig.mesh.bindMatrix).applyMatrix4(headMatrix).applyMatrix4(rig.mesh.bindMatrixInverse);
        rig.mesh.getVertexPosition(index, actual);
        assert.ok(actual.distanceTo(expected) < 2e-6, "the complete chin follows the head, with no body/neck pinning");
      }
      for (const index of collar) {
        point.fromBufferAttribute(positions, index); rig.mesh.getVertexPosition(index, actual);
        assert.ok(actual.distanceTo(point) < 2e-6, "head movement must not pull the sweatshirt collar");
      }
    }
  } finally { rig.dispose(); }
});

test("tricks, swipe interruption and reduced motion retain bounded hand animation", async () => {
  const rig = await fixture(), motion = createCharacterMotion(rig);
  motion.setActive(false);
  try {
    for (const trick of tricks) {
      const action = motion.perform(trick);
      for (const time of [.25, 1.2, 2.5, 4.1]) {
        action.seek(time, false); motion.update(time, .016, { x: .2, y: -.1 }, false); rig.sync();
        for (const pose of Object.values(rig.armPoses)) {
          assert.ok(pose.shoulder >= 0 && pose.shoulder <= 35, trick);
          assert.ok(pose.elbow >= 0 && pose.elbow <= 70, trick);
          assert.ok(Math.abs(pose.wrist) <= 25, trick);
        }
        for (let index = 0; index < rig.mesh.geometry.getAttribute("position").count; index += 137) {
          assert.ok(rig.mesh.getVertexPosition(index, new THREE.Vector3()).toArray().every(Number.isFinite), trick);
        }
      }
    }
    const swipe = motion.swipe(1); swipe.seek(.6, false); rig.sync();
    assert.ok(rig.armPoses.left.shoulder > 20);
    motion.grab(); assert.equal(swipe.parent, null);
    motion.update(1, .05, { x: -1, y: 0 }, false); rig.sync();
    assert.ok(rig.armPoses.right.shoulder > 0, "drag retains a hand reaction");
    motion.rest(true); motion.update(0, .016, { x: 1, y: 1 }, true); rig.sync();
    for (const pose of Object.values(rig.armPoses)) assert.deepEqual([pose.shoulder, pose.elbow, pose.wrist], [0, 0, 0]);
  } finally { motion.dispose(); rig.dispose(); }
});

test("watch follows the connected wrist and imported resources dispose once", async () => {
  const rig = await fixture(); let skeletonDisposals = 0, materialDisposals = 0;
  const originalDispose = rig.skeleton.dispose.bind(rig.skeleton);
  rig.skeleton.dispose = () => { skeletonDisposals++; originalDispose(); };
  const material = rig.mesh.material as THREE.Material;
  material.addEventListener("dispose", () => materialDisposals++);
  const before = rig.watchMount.getWorldPosition(new THREE.Vector3());
  rig.armPoses.left = { shoulder: 35, elbow: 70, wrist: 25 }; rig.sync();
  assert.ok(rig.watchMount.getWorldPosition(new THREE.Vector3()).distanceTo(before) > 1);
  rig.dispose(); rig.dispose();
  assert.equal(skeletonDisposals, 1); assert.equal(materialDisposals, 1);
});

test("live facial blendshapes move eyes, brows and mouth without changing the chin or clothing", async () => {
  const rig = await fixture(), points = rig.mesh.geometry.getAttribute("position");
  const original = Array.from(points.array), indices = Array.from(rig.mesh.geometry.index!.array);
  const rest = new THREE.Vector3(), actual = new THREE.Vector3();
  try {
    assert.equal(rig.mesh.geometry.morphTargetsRelative, true);
    assert.equal(rig.mesh.geometry.morphAttributes.position.length, 6);
    const samples = [[0, .048, .673, .13], [2, -.06, .709, .14], [4, .035, .547, .14], [5, .025, .553, .14]];
    for (const [target, x, y, z] of samples) {
      let nearest = 0, distance = Infinity;
      for (let index = 0; index < points.count; index++) {
        rest.fromBufferAttribute(points, index); const value = rest.distanceToSquared(new THREE.Vector3(x, y, z));
        if (value < distance) { distance = value; nearest = index; }
      }
      rig.mesh.morphTargetInfluences!.fill(0); rig.mesh.morphTargetInfluences![target] = 1;
      rest.fromBufferAttribute(points, nearest); rig.mesh.getVertexPosition(nearest, actual);
      assert.ok(actual.distanceTo(rest) > .001, `expression ${target} changes the actual visible feature`);
    }
    rig.mesh.morphTargetInfluences!.fill(1);
    for (let index = 0; index < points.count; index++) {
      rest.fromBufferAttribute(points, index); rig.mesh.getVertexPosition(index, actual);
      assert.ok(actual.toArray().every(Number.isFinite));
      if (rest.y < .525 || rest.y > .755 || rest.z < .085) assert.ok(actual.distanceTo(rest) < 2e-6, "chin, neck, hair and clothes stay authored");
    }
    assert.deepEqual(Array.from(points.array), original); assert.deepEqual(Array.from(rig.mesh.geometry.index!.array), indices);
  } finally { rig.dispose(); }
});

test("live head refuses downward pitch while expressions follow the gesture controller", async () => {
  const rig = await fixture(), motion = createCharacterMotion(rig); motion.setActive(false);
  try {
    rig.neck.rotation.x = .6; rig.headTilt.rotation.x = .4; rig.head.rotation.x = .1; rig.sync();
    assert.ok(rig.headBone.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion()) < 1e-6, "downward source rotations are removed");
    motion.gesture("watch", 1).seek(1.1, false); motion.update(1.1, .016, { x: 0, y: 1 }, false); rig.sync();
    assert.equal(rig.neck.rotation.x, 0, "wrist presentation keeps the face upright");
    motion.perform("Panic").seek(1.1, false); motion.update(1.1, .016, { x: 0, y: 1 }, false); rig.sync();
    assert.ok(rig.mesh.morphTargetInfluences![1] > 0 || rig.mesh.morphTargetInfluences![0] > 0);
    assert.ok(rig.mesh.morphTargetInfluences![2] > 0);
    assert.ok(rig.mesh.morphTargetInfluences![5] > 0, "surprise reaches the visible mouth");
    motion.rest(true); motion.update(0, .016, { x: 0, y: 1 }, true); rig.sync();
    assert.ok(rig.mesh.morphTargetInfluences!.every((value) => value === 0));
    assert.deepEqual(Object.keys(rig.accessories).sort(), ["glasses", "headphones", "watch"]);
  } finally { motion.dispose(); rig.dispose(); }
});

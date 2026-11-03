import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import manifest from "../content/character-articulation.json";
import { bodyParts, createArticulationController, studyPoses, type StudyPose } from "../lib/character-articulation";

// Use the actual exported node hierarchy, including Blender/glTF transforms.
const bytes = readFileSync(new URL("../public/character/articulation-study.glb", import.meta.url));
const document = JSON.parse(bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)));
function fixture() {
  const nodes: THREE.Object3D[] = document.nodes.map((node: { name?: string; extras?: object; translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[] }) => {
    const object = new THREE.Group(); object.name = node.name ?? ""; object.userData = node.extras ?? {};
    if (node.matrix) new THREE.Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale);
    if (node.translation) object.position.fromArray(node.translation);
    if (node.rotation) object.quaternion.fromArray(node.rotation);
    if (node.scale) object.scale.fromArray(node.scale);
    return object;
  });
  document.nodes.forEach((node: { children?: number[] }, index: number) => node.children?.forEach((child) => nodes[index].add(nodes[child])));
  const root = new THREE.Group(); document.scenes[document.scene ?? 0].nodes.forEach((index: number) => root.add(nodes[index]));
  root.updateMatrixWorld(true);
  return { root, rig: createArticulationController(root) };
}
function position(object: THREE.Object3D) { return object.getWorldPosition(new THREE.Vector3()); }

test("prepared GLB has real named parts and parent pivots, with no automatic skin or facial morph claims", () => {
  assert.equal(document.skins, undefined);
  assert.equal(document.animations, undefined);
  assert.ok(document.meshes.every((mesh: { primitives: { targets?: object[] }[] }) => mesh.primitives.every((primitive) => !primitive.targets)));
  const { rig } = fixture();
  bodyParts.forEach((id) => assert.ok(rig.joints.has(id), id));
  for (const part of manifest.parts) {
    const joint = rig.joints.get(part.id)!;
    assert.ok(joint, part.id);
    assert.equal(joint.parent?.userData.joint_id ?? null, part.parent);
    const parentPivot = manifest.parts.find((candidate) => candidate.id === part.parent)?.pivot ?? [0, 0, 0];
    const expected = new THREE.Vector3().fromArray(part.pivot).sub(new THREE.Vector3().fromArray(parentPivot));
    assert.ok(joint.position.distanceTo(expected) < 1e-6, `${part.id}: exported axes must be Y-up`);
    assert.ok(joint.quaternion.angleTo(new THREE.Quaternion()) < 1e-6);
    if (part.id.startsWith("face.")) assert.equal(part.kind, "surface-patch");
  }
  assert.ok(manifest.exterior_area_relative_error < 1e-6);
  assert.equal(manifest.body_parts_capped, true);
});

test("head turns preserve chin shape, and every facial patch follows the same head", () => {
  const { root, rig } = fixture();
  const head = rig.joints.get("head")!;
  const chin = new THREE.Object3D(), jaw = new THREE.Object3D();
  chin.position.set(0, -.02, .12); jaw.position.set(.06, .01, .1); head.add(chin, jaw);
  root.updateMatrixWorld(true);
  const distance = position(chin).distanceTo(position(jaw)), before = position(chin);
  const torsoBefore = position(rig.joints.get("torso")!);
  rig.rotate("head", [25, 32, -12]); rig.rotate("neck", [-8, 5, 3]);
  assert.ok(position(chin).distanceTo(before) > .01, "the chin actually follows the posed head");
  assert.ok(Math.abs(position(chin).distanceTo(position(jaw)) - distance) < 1e-7, "jaw does not stretch");
  assert.ok(position(rig.joints.get("torso")!).distanceTo(torsoBefore) < 1e-7);
  for (const part of manifest.parts.filter((part) => part.id.startsWith("face."))) assert.equal(rig.joints.get(part.id)!.parent, head);
});

test("arm controls move the hand through its hierarchy without pulling the torso or opposite arm", () => {
  const { rig } = fixture();
  const hand = rig.joints.get("hand.L")!, forearm = rig.joints.get("forearm.L")!;
  const handBefore = position(hand), forearmBefore = position(forearm);
  const stable = ["torso", "neck", "head", "upper_arm.R", "forearm.R", "hand.R"].map((id) => [id, position(rig.joints.get(id)!)] as const);
  rig.pose("wave");
  assert.ok(position(hand).distanceTo(handBefore) > .1, "hand animation has a visible articulated path");
  assert.ok(position(hand).y > handBefore.y + .2, "raising an arm must move the hand upwards, not backwards");
  assert.ok(position(forearm).distanceTo(forearmBefore) > .01);
  stable.forEach(([id, before]) => assert.ok(position(rig.joints.get(id)!).distanceTo(before) < 1e-7, id));
});

test("poses and explosion reset exactly without accumulated transforms", () => {
  const { rig } = fixture();
  const rest = new Map(Array.from(rig.joints).map(([id, joint]) => [id, joint.matrixWorld.clone()]));
  for (const pose of Object.keys(studyPoses) as StudyPose[]) {
    rig.pose(pose); rig.explode(1, true);
    rig.joints.forEach((joint) => assert.ok(joint.matrixWorld.elements.every(Number.isFinite)));
  }
  rig.explode(0, false); rig.pose("neutral");
  rig.joints.forEach((joint, id) => joint.matrixWorld.elements.forEach((n, index) => assert.ok(Math.abs(n - rest.get(id)!.elements[index]) < 1e-7, id)));
  assert.throws(() => rig.rotate("face.eye.L" as "head", [0, 30, 0]), /inspection regions/);
});

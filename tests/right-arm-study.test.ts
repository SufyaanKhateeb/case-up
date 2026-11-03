import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as THREE from "three";
import { armPresets, createRightArmStudy } from "../lib/right-arm-study";

const require = createRequire(import.meta.url);
const bytes = readFileSync(new URL("../public/character/right-arm-continuous.glb", import.meta.url));
const jsonSize = bytes.readUInt32LE(12), document = JSON.parse(bytes.toString("utf8", 20, 20 + jsonSize));
const binary = bytes.subarray(28 + jsonSize);

// Inspect actual decoded runtime skin weights, not a simplified synthetic rig.
const decoded = (async () => {
  const factory = require("../public/character/draco/draco_wasm_wrapper.js");
  const module = await factory({ wasmBinary: readFileSync(new URL("../public/character/draco/draco_decoder.wasm", import.meta.url)) });
  const primitive = document.meshes[0].primitives[0], extension = primitive.extensions.KHR_draco_mesh_compression;
  const view = document.bufferViews[extension.bufferView], data = new Int8Array(binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength));
  const decoder = new module.Decoder(), buffer = new module.DecoderBuffer(), mesh = new module.Mesh();
  buffer.Init(data, data.length); const status = decoder.DecodeBufferToMesh(buffer, mesh);
  assert.ok(status.ok());
  const geometry = new THREE.BufferGeometry();
  for (const [semantic, name] of [["POSITION", "position"], ["JOINTS_0", "skinIndex"], ["WEIGHTS_0", "skinWeight"]]) {
    const attribute = decoder.GetAttributeByUniqueId(mesh, extension.attributes[semantic]), raw = new module.DracoFloat32Array();
    decoder.GetAttributeFloatForAllPoints(mesh, attribute, raw);
    const size = attribute.num_components(), array = name === "skinIndex" ? new Uint16Array(mesh.num_points() * size) : new Float32Array(mesh.num_points() * size);
    const accessor = document.accessors[primitive.attributes[semantic]];
    const divisor = semantic === "WEIGHTS_0" && accessor.normalized ? 65535 : 1;
    for (let i = 0; i < array.length; i++) array[i] = raw.GetValue(i) / divisor;
    geometry.setAttribute(name, new THREE.BufferAttribute(array, size)); module.destroy(raw);
  }
  const indices = new Uint32Array(mesh.num_faces() * 3), face = new module.DracoInt32Array();
  for (let i = 0; i < mesh.num_faces(); i++) { decoder.GetFaceFromMesh(mesh, i, face); for (let j = 0; j < 3; j++) indices[i * 3 + j] = face.GetValue(j); }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  for (const value of [face, status, mesh, buffer, decoder]) module.destroy(value);
  return geometry;
})();

async function fixture() {
  const geometry = (await decoded).clone(), material = new THREE.MeshBasicMaterial();
  const skin = document.skins[0], jointIds = new Set<number>(skin.joints);
  const nodes: THREE.Object3D[] = document.nodes.map((node: { mesh?: number; name?: string; translation?: number[]; rotation?: number[]; scale?: number[] }, index: number) => {
    const object = node.mesh !== undefined ? new THREE.SkinnedMesh(geometry, material) : jointIds.has(index) ? new THREE.Bone() : new THREE.Group();
    object.name = node.name ?? "";
    if (node.translation) object.position.fromArray(node.translation);
    if (node.rotation) object.quaternion.fromArray(node.rotation);
    if (node.scale) object.scale.fromArray(node.scale);
    return object;
  });
  document.nodes.forEach((node: { children?: number[] }, index: number) => node.children?.forEach((child) => nodes[index].add(nodes[child])));
  const root = new THREE.Group(); document.scenes[document.scene ?? 0].nodes.forEach((index: number) => root.add(nodes[index]));
  root.updateMatrixWorld(true);
  const accessor = document.accessors[skin.inverseBindMatrices], view = document.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const inverses = skin.joints.map((_: number, index: number) => new THREE.Matrix4().fromArray(Array.from({ length: 16 }, (_, n) => binary.readFloatLE(offset + index * 64 + n * 4))));
  const skeleton = new THREE.Skeleton(skin.joints.map((index: number) => nodes[index] as THREE.Bone), inverses);
  const mesh = nodes.find((node) => node instanceof THREE.SkinnedMesh) as THREE.SkinnedMesh;
  mesh.bind(skeleton, new THREE.Matrix4()); mesh.normalizeSkinWeights();
  const rig = createRightArmStudy(root); rig.pose(armPresets.rest);
  return { rig, geometry, dispose() { rig.dispose(); skeleton.dispose(); geometry.dispose(); material.dispose(); } };
}

test("right arm uses one original continuous surface with a real four-bone skin", async () => {
  assert.equal(document.meshes.length, 1); assert.equal(document.skins.length, 1);
  assert.equal(document.skins[0].joints.length, 4); assert.equal(document.animations, undefined);
  const { rig, geometry, dispose } = await fixture();
  try {
    assert.equal(geometry.index!.count / 3, 200000);
    const positions = geometry.getAttribute("position"), actual = new THREE.Vector3(), expected = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      expected.fromBufferAttribute(positions, i); rig.mesh.getVertexPosition(i, actual);
      assert.ok(actual.distanceTo(expected) < 2e-6, "the rest pose must preserve the approved mesh");
    }
  } finally { dispose(); }
});

test("all right-arm poses keep the head, chest and opposite arm fixed", async () => {
  const { rig, geometry, dispose } = await fixture();
  const positions = geometry.getAttribute("position"), actual = new THREE.Vector3(), rest = new THREE.Vector3();
  try {
    const handRest = rig.hand.getWorldPosition(new THREE.Vector3());
    for (const pose of Object.values(armPresets)) {
      rig.pose(pose);
      for (let i = 0; i < positions.count; i++) {
        rest.fromBufferAttribute(positions, i); rig.mesh.getVertexPosition(i, actual);
        assert.ok(actual.toArray().every(Number.isFinite));
        if (rest.x > -.109 || rest.y > .446 || (rest.y < .18 && rest.x > -.215)) assert.ok(actual.distanceTo(rest) < 2e-6, "head, chest and waist must not follow the arm");
      }
    }
    assert.ok(rig.hand.getWorldPosition(new THREE.Vector3()).y > handRest.y + .15, "the right hand actually rises");
  } finally { dispose(); }
});

test("UV seams remain joined during bending; no vertex or triangle is cut or removed", async () => {
  const { rig, geometry, dispose } = await fixture();
  const positions = geometry.getAttribute("position"), seen = new Map<string, number>(), pairs: [number, number][] = [];
  const original = Array.from(positions.array), indices = Array.from(geometry.index!.array);
  const point = new THREE.Vector3(), first = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i); const key = point.toArray().join(",");
    const index = seen.get(key); if (index === undefined) seen.set(key, i); else pairs.push([index, i]);
  }
  assert.ok(pairs.length > 1000, "test real split UV vertices");
  try {
    for (const pose of [...Object.values(armPresets), { shoulder: 35, elbow: 70, wrist: 25 }]) {
      rig.pose(pose);
      for (const [a, b] of pairs) assert.ok(rig.mesh.getVertexPosition(a, first).distanceTo(rig.mesh.getVertexPosition(b, point)) < 2e-5, "continuous surface must not open at UV seams");
    }
    assert.deepEqual(Array.from(positions.array), original);
    assert.deepEqual(Array.from(geometry.index!.array), indices);
  } finally { dispose(); }
});

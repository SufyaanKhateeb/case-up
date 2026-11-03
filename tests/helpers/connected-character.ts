import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as THREE from "three";

const require = createRequire(import.meta.url);
const bytes = readFileSync(new URL("../../public/character/arms-continuous.glb", import.meta.url));
const jsonSize = bytes.readUInt32LE(12), document = JSON.parse(bytes.toString("utf8", 20, 20 + jsonSize));
const binary = bytes.subarray(28 + jsonSize);

// Inspect actual decoded runtime skin weights, not a simplified synthetic rig.
const decoded = (async () => {
  const factory = require("../../public/character/draco/draco_wasm_wrapper.js");
  const module = await factory({ wasmBinary: readFileSync(new URL("../../public/character/draco/draco_decoder.wasm", import.meta.url)) });
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

export async function loadConnectedAsset() {
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
  return { root, mesh, geometry, material };
}

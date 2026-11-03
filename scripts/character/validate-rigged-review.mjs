// Run after decode-runtime.cjs has prepared the exact local validation export.
import fs from "node:fs";
import assert from "node:assert/strict";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const bytes = fs.readFileSync("artifacts/character/rigged-fbx/exact-decoded.glb");
const asset = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
const meshes = [];
asset.scene.traverse(object => { if (object instanceof THREE.SkinnedMesh) meshes.push(object); });
const bones = new Set(meshes.flatMap(mesh => mesh.skeleton.bones));
assert.equal(bones.size, 65); assert.equal(asset.animations.length, 1);
asset.scene.updateMatrixWorld(true);
const bindWorld = new Map();
for (const mesh of meshes) mesh.skeleton.bones.forEach((bone, index) => bindWorld.set(bone, mesh.skeleton.boneInverses[index].clone().invert()));
const bindPose = Array.from(bindWorld, ([bone, world]) => {
  const parent = bone.parent instanceof THREE.Bone ? bindWorld.get(bone.parent) : bone.parent?.matrixWorld ?? new THREE.Matrix4();
  return { bone, local: parent.clone().invert().multiply(world) };
});
function inspect() {
  const box = new THREE.Box3(), point = new THREE.Vector3(); let count = 0, maxError = 0;
  asset.scene.updateMatrixWorld(true);
  for (const mesh of meshes) {
    const weights = mesh.geometry.getAttribute("skinWeight");
    for (let i = 0; i < weights.count; i++) maxError = Math.max(maxError, Math.abs(1 - weights.getX(i) - weights.getY(i) - weights.getZ(i) - weights.getW(i)));
    for (let i = 0; i < mesh.geometry.getAttribute("position").count; i += 17) {
      mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
      assert.ok(point.toArray().every(Number.isFinite)); box.expandByPoint(point); count++;
    }
  }
  assert.ok(maxError < 1e-5);
  return { vertices: count, bounds: { min: box.min.toArray(), max: box.max.toArray() }, height: box.getSize(new THREE.Vector3()).y, maxWeightSumError: maxError };
}
const mixer = new THREE.AnimationMixer(asset.scene), action = mixer.clipAction(asset.animations[0]); action.play();
const samples = [];
for (const time of [0, .2, .7, 1.2, asset.animations[0].duration]) {
  action.time = time; mixer.update(0); const result = inspect();
  assert.ok(result.height > .8 && result.height < 1.5); samples.push({ time, ...result });
}
mixer.stopAllAction();
asset.scene.scale.setScalar(1.6); asset.scene.position.y = -.9;
for (const { bone, local } of bindPose) local.decompose(bone.position, bone.quaternion, bone.scale);
const rest = inspect(); assert.ok(rest.height > 1.7 && rest.height < 1.9, "rotated armature rest pose must retain preview registration");
const result = { skinnedPrimitives: meshes.length, bones: bones.size, clips: asset.animations.map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length })), samples, normalizedPreviewRest: rest };
fs.writeFileSync("docs/design/rigged-fbx/animation-validation.json", JSON.stringify(result, null, 2));
console.log("65 bones, five walk samples, normalized weights and registered rest pose passed.");

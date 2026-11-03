// Audit an official OmniFaceRig output; this does not run its unreleased fitter.
// Downloads remain in ignored artifacts/character, outside the portfolio build.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const directory = path.resolve("artifacts/character/omnifacerig/release");
const reportPath = path.resolve("docs/design/omnifacerig/sample-inspection.json");
const required = ["jawDrop", "lipCornerPuller_L", "lipCornerPuller_R", "cheekRaiser_L", "cheekRaiser_R", "eyesClosed_L", "eyesClosed_R"];

async function inspect(filename) {
  const bytes = fs.readFileSync(path.join(directory, filename));
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  const jsonSize = bytes.readUInt32LE(12);
  const original = JSON.parse(bytes.toString("utf8", 20, 20 + jsonSize));
  // Textures are irrelevant to this geometry audit; no fake image decoder.
  const json = structuredClone(original);
  delete json.images; delete json.textures; delete json.samplers;
  json.materials = (json.materials ?? []).map(material => ({ name: material.name }));
  const encoded = Buffer.from(JSON.stringify(json));
  const jsonBytes = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
  const remainder = bytes.subarray(20 + jsonSize);
  const rebuilt = Buffer.alloc(20 + jsonBytes.length + remainder.length);
  bytes.copy(rebuilt, 0, 0, 20);
  rebuilt.writeUInt32LE(rebuilt.length, 8); rebuilt.writeUInt32LE(jsonBytes.length, 12);
  jsonBytes.copy(rebuilt, 20); remainder.copy(rebuilt, 20 + jsonBytes.length);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.parseAsync(rebuilt.buffer.slice(rebuilt.byteOffset, rebuilt.byteOffset + rebuilt.byteLength), "");
  gltf.scene.updateMatrixWorld(true);
  const meshes = [];
  gltf.scene.traverse(mesh => {
    if (!(mesh instanceof THREE.Mesh)) return;
    const geometry = mesh.geometry, position = geometry.getAttribute("position");
    geometry.computeBoundingBox();
    const morphs = Object.entries(mesh.morphTargetDictionary ?? {}).map(([name, index]) => {
      const delta = geometry.morphAttributes.position[index];
      let maxDisplacement = 0, movingVertices = 0;
      for (let i = 0; i < delta.count; i++) {
        const values = [delta.getX(i), delta.getY(i), delta.getZ(i)];
        assert.ok(values.every(Number.isFinite), `${name}: nonfinite morph delta`);
        const length = Math.hypot(...values);
        maxDisplacement = Math.max(maxDisplacement, length);
        if (length > 1e-6) movingVertices++;
      }
      return { name, maxDisplacement, movingVertices };
    });
    meshes.push({ name: mesh.name, vertices: position.count, triangles: (geometry.index?.count ?? position.count) / 3, bounds: { min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() }, morphs });
  });
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const animationSamples = [];
  if (gltf.animations.length) {
    const action = mixer.clipAction(gltf.animations[0]); action.play();
    for (const time of [0, gltf.animations[0].duration / 4, gltf.animations[0].duration / 2, gltf.animations[0].duration * .75]) {
      action.time = time; mixer.update(0);
      const box = new THREE.Box3(), point = new THREE.Vector3();
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse(mesh => {
        if (!(mesh instanceof THREE.Mesh)) return;
        for (let i = 0; i < mesh.geometry.attributes.position.count; i += 7) {
          mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
          assert.ok(point.toArray().every(Number.isFinite)); box.expandByPoint(point);
        }
      });
      animationSamples.push({ time, bounds: { min: box.min.toArray(), max: box.max.toArray() } });
    }
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  }
  return { filename, sha256: crypto.createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, embeddedImages: original.images?.length ?? 0, extensions: original.extensionsUsed ?? [], meshes, animations: gltf.animations.map(clip => ({ name: clip.name, seconds: clip.duration, tracks: clip.tracks.length })), animationSamples };
}

const source = await inspect("007_orig.glb"), rig = await inspect("007_rig.glb");
const morphs = rig.meshes.flatMap(mesh => mesh.morphs);
assert.equal(morphs.length, 155);
for (const name of required) assert.ok(morphs.some(morph => morph.name === name && morph.movingVertices > 0), `Missing working control: ${name}`);
const report = {
  inspectedAt: new Date().toISOString(),
  scope: "Official donor example only. No OmniFaceRig inference, registration or transfer has been run on Sufyaan's model.",
  sampleSource: "https://omnifacerig.github.io/dataset_viewer/007_rig.glb",
  license: "FAIR Noncommercial Research License v1; local research only, not a portfolio deployment asset.",
  requiredLaughControls: required,
  source, rig,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(`Official example: ${morphs.length} finite, named morphs; ${rig.animationSamples.length} native animation samples; required laugh controls present.\nReport: ${reportPath}`);

// Run against the local production server: npm run test:routes
import assert from "node:assert/strict";
const base = process.env.PORTFOLIO_TEST_URL ?? "http://127.0.0.1:3000";
for (const [route, status, expected] of [
  ["/", 200, "Sufyaan Khateeb"],
  ["/projects/placement-app", 200, "Placement App"],
  ["/projects/real-time-chat", 200, "Real-Time Chat App"],
  ["/projects/portfolio", 200, "Personal Portfolio"],
  ["/resume", 200, "September 2026"],
  ["/resume/data", 200, "Data engineering"],
  ["/character/hunyuan", 200, "Model comparison"],
  ["/character/articulation", 200, "Both arms, connected."],
  ["/character/parted", 200, "A new foundation."],
  ["/character/rigged", 200, "Ready to move."],
  ["/404", 404, "Back home"],
  ["/this-route-does-not-exist", 404, "Back home"],
  ["/projects/does-not-exist", 404, "Back home"],
]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, status, route);
  assert.ok((await response.text()).includes(expected), `${route} should render its content without JavaScript`);
  console.log(`${response.status} ${route}`);
}
const study = await (await fetch(new URL("/character/hunyuan", base))).text();
assert.match(study, /name="robots" content="noindex, nofollow"/, "The asset study should stay out of search results");
assert.ok(!study.includes('aria-label="Interactive portfolio guide"'), "The guide should not overlay the inspection canvas");
const articulation = await (await fetch(new URL("/character/articulation", base))).text();
assert.match(articulation, /name="robots" content="noindex, nofollow"/);
assert.ok(!articulation.includes('aria-label="Interactive portfolio guide"'), "The guide must stay out of the articulation workshop");
for (const route of ["/character/parted", "/character/rigged"]) {
  const html = await (await fetch(new URL(route, base))).text();
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.ok(!html.includes('aria-label="Interactive portfolio guide"'), "The guide must stay out of model reviews");
}
for (const route of ["/character/parted-review.glb", "/character/rigged-walk-review.glb"]) {
  const response = await fetch(new URL(route, base)); assert.equal(response.status, 200, route);
  const bytes = Buffer.from(await response.arrayBuffer()); assert.equal(bytes.subarray(0, 4).toString(), "glTF");
  const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  if (route.includes("rigged-walk")) {
    assert.equal(model.skins[0].joints.length, 65); assert.equal(model.animations.length, 1);
  } else assert.ok(!model.skins?.length && !model.animations?.length);
}
const separated = await fetch(new URL("/character/arms-continuous.glb", base));
assert.equal(separated.status, 200);
const preparedBytes = Buffer.from(await separated.arrayBuffer());
assert.equal(preparedBytes.subarray(0, 4).toString(), "glTF");
assert.ok(preparedBytes.length < 6_000_000, "The workshop asset should retain a bounded runtime size");
const prepared = JSON.parse(preparedBytes.subarray(20, 20 + preparedBytes.readUInt32LE(12)).toString());
assert.equal(prepared.meshes.length, 1, "The arm must remain one continuous mesh");
assert.equal(prepared.skins.length, 1);
assert.equal(prepared.skins[0].joints.length, 7);
assert.ok(!prepared.animations?.length, "The arm study uses manual poses");
for (const route of ["/character/hunyuan-shape-study.glb", "/character/hunyuan-multiview-study.glb", "/character/sufyaan-textured.glb", "/character/sufyaan-full.glb", "/character/sufyaan-full-hq.glb", "/character/sufyaan-full-hq-smooth.glb"]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  const data = Buffer.from(await response.arrayBuffer());
  assert.equal(data.subarray(0, 4).toString(), "glTF", `${route} should be a real binary model`);
  const highQuality = route.includes("sufyaan-full-hq");
  assert.ok(data.length < (highQuality ? 6_000_000 : 4_000_000), `${route} should serve the optimized inspection export`);
  if (route.endsWith("sufyaan-textured.glb") || route.endsWith("sufyaan-full.glb") || highQuality) {
    const jsonLength = data.readUInt32LE(12);
    const model = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
    assert.ok(model.extensionsRequired.includes("KHR_draco_mesh_compression"), "The supplied model should use compressed geometry");
    assert.ok(model.images.length >= 3 && model.images.every((image) => image.bufferView !== undefined), "PBR maps should be embedded in the GLB");
    assert.ok(model.materials[0].pbrMetallicRoughness.baseColorTexture && model.materials[0].normalTexture && model.materials[0].pbrMetallicRoughness.metallicRoughnessTexture, "The supplied PBR material should retain its texture connections");
    if (route.endsWith("sufyaan-full.glb") || highQuality) {
      const triangles = model.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((count, primitive) => count + model.accessors[primitive.indices].count / 3, 0), 0);
      assert.equal(triangles, highQuality ? 200_000 : 50_000, "The served character should match its triangle budget");
      assert.ok(model.meshes.every((mesh) => mesh.primitives.every((primitive) => primitive.attributes.TANGENT !== undefined)), "Explicit tangents should keep normal-map rendering portable");
      assert.ok(!model.skins?.length && !model.animations?.length, "The full model should not claim an animation rig");
      assert.ok(model.images.every((image) => image.mimeType === "image/webp"), "Runtime maps should use WebP");
    }
  }
  console.log(`${response.status} ${route}`);
}
const decoder = await fetch(new URL("/character/draco/draco_decoder.wasm", base));
assert.equal(decoder.status, 200, "The Draco decoder should be served locally");
assert.equal(Buffer.from(await decoder.arrayBuffer()).subarray(0, 4).toString(), "\0asm", "The local decoder should be valid WebAssembly");
const poster = await fetch(new URL("/character/smoothed-poster.png", base));
assert.equal(poster.status, 200, "The approved character needs a local loading/WebGL fallback");
assert.equal(Buffer.from(await poster.arrayBuffer()).subarray(1, 4).toString(), "PNG");
for (const [route, type] of [
  ["/resume-fs-1.pdf", "application/pdf"],
  ["/resume/Sufyaan_resume_fullstack.pdf", "application/pdf"],
  ["/resume/Sufyaan_resume_data.pdf", "application/pdf"],
  ["/resume/fullstack-1.jpg", "image/jpeg"],
  ["/resume/fullstack-2.jpg", "image/jpeg"],
  ["/resume/data-1.jpg", "image/jpeg"],
  ["/projects/portfolio/desktop.jpg", "image/jpeg"],
  ["/projects/portfolio/mobile.jpg", "image/jpeg"],
]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  assert.ok(response.headers.get("content-type")?.includes(type), `${route} should serve ${type}`);
  console.log(`${response.status} ${route}`);
}

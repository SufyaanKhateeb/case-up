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
for (const route of ["/character/hunyuan-shape-study.glb", "/character/hunyuan-multiview-study.glb", "/character/sufyaan-textured.glb"]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  const data = Buffer.from(await response.arrayBuffer());
  assert.equal(data.subarray(0, 4).toString(), "glTF", `${route} should be a real binary model`);
  assert.ok(data.length < 4_000_000, `${route} should serve the optimized inspection export`);
  if (route.endsWith("sufyaan-textured.glb")) {
    const jsonLength = data.readUInt32LE(12);
    const model = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
    assert.ok(model.extensionsRequired.includes("KHR_draco_mesh_compression"), "The supplied model should use compressed geometry");
    assert.ok(model.images.length >= 3 && model.images.every((image) => image.bufferView !== undefined), "PBR maps should be embedded in the GLB");
    assert.ok(model.materials[0].pbrMetallicRoughness.baseColorTexture && model.materials[0].normalTexture && model.materials[0].pbrMetallicRoughness.metallicRoughnessTexture, "The supplied PBR material should retain its texture connections");
  }
  console.log(`${response.status} ${route}`);
}
const decoder = await fetch(new URL("/character/draco/draco_decoder.wasm", base));
assert.equal(decoder.status, 200, "The Draco decoder should be served locally");
assert.equal(Buffer.from(await decoder.arrayBuffer()).subarray(0, 4).toString(), "\0asm", "The local decoder should be valid WebAssembly");
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

/* Blender's tangent calculation can collapse on tiny new UV triangles.
 * Validate actual Draco-decoded vectors; replace only affected tangent streams
 * with unit float vectors. Positions, UVs, normals, indices and textures stay
 * byte-for-byte in their compressed streams. Mixed Draco/accessor attributes
 * are supported by glTF and GLTFLoader. No external packages or CDN needed. */
const fs = require("node:fs");
const path = require("node:path");
const input = process.argv[2];
const root = path.resolve(__dirname, "../..");
const factory = require(path.join(root, "public/character/draco/draco_wasm_wrapper.js"));
(async () => {
  const module = await factory({ wasmBinary: fs.readFileSync(path.join(root, "public/character/draco/draco_decoder.wasm")) });
  const data = fs.readFileSync(input), size = data.readUInt32LE(12);
  const gltf = JSON.parse(data.subarray(20, 20 + size)), binary = data.subarray(28 + size);
  const chunks = [binary]; let length = binary.length, repaired = 0;
  for (const meshDef of gltf.meshes) for (const primitive of meshDef.primitives) {
    const extension = primitive.extensions?.KHR_draco_mesh_compression;
    if (extension?.attributes.TANGENT === undefined) continue;
    const view = gltf.bufferViews[extension.bufferView];
    const bytes = new Int8Array(binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength));
    const decoder = new module.Decoder(), buffer = new module.DecoderBuffer(), mesh = new module.Mesh();
    buffer.Init(bytes, bytes.length);
    const status = decoder.DecodeBufferToMesh(buffer, mesh);
    if (!status.ok()) throw Error(status.error_msg());
    const attribute = decoder.GetAttributeByUniqueId(mesh, extension.attributes.TANGENT);
    const raw = new module.DracoFloat32Array(); decoder.GetAttributeFloatForAllPoints(mesh, attribute, raw);
    const array = new Float32Array(mesh.num_points() * 4);
    let bad = 0;
    for (let i = 0; i < mesh.num_points(); i++) {
      const offset = i * 4;
      const x = raw.GetValue(offset), y = raw.GetValue(offset + 1), z = raw.GetValue(offset + 2), w = raw.GetValue(offset + 3);
      const magnitude = Math.hypot(x, y, z);
      if (!Number.isFinite(magnitude) || magnitude < 1e-10) throw Error("Unrecoverable zero tangent");
      const invalid = Math.abs(magnitude - 1) > 1e-3;
      if (invalid) { bad++; repaired++; }
      array.set([invalid ? x / magnitude : x, invalid ? y / magnitude : y, invalid ? z / magnitude : z, w < 0 ? -1 : 1], offset);
    }
    if (bad) {
      const pad = (4 - length % 4) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); length += pad; }
      const bytes = Buffer.from(array.buffer), viewIndex = gltf.bufferViews.length;
      gltf.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length, target: 34962 });
      chunks.push(bytes); length += bytes.length;
      Object.assign(gltf.accessors[primitive.attributes.TANGENT], { bufferView: viewIndex, byteOffset: 0, componentType: 5126, count: mesh.num_points() });
      delete extension.attributes.TANGENT;
    }
    for (const resource of [raw, status, mesh, buffer, decoder]) module.destroy(resource);
  }
  if (repaired) {
    gltf.buffers[0].byteLength = length;
    const json = Buffer.from(JSON.stringify(gltf)), jsonPad = Buffer.alloc((4 - json.length % 4) % 4, 32);
    const jsonBytes = Buffer.concat([json, jsonPad]), bin = Buffer.concat(chunks);
    const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
    header.write("glTF"); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonBytes.length + bin.length, 8);
    jsonHeader.writeUInt32LE(jsonBytes.length); jsonHeader.write("JSON", 4);
    binHeader.writeUInt32LE(bin.length); binHeader.write("BIN\0", 4);
    fs.writeFileSync(input, Buffer.concat([header, jsonHeader, jsonBytes, binHeader, bin]));
  }
  console.log(`Validated decoded tangents; normalized ${repaired} collapsed vectors.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });

/* Normalize the ACTUAL decoded skin, then encode weights as exact-sum uint16.
 * This prevents generic float quantization from breaking weight normalization.
 * Uses only the local Draco decoder and encoder already shipped with Three.js.
 */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const root = path.resolve(__dirname, "../.."), filename = process.argv[2];
const decoderFactory = require(path.join(root, "public/character/draco/draco_wasm_wrapper.js"));
(async () => {
  const dec = await decoderFactory({ wasmBinary: fs.readFileSync(path.join(root, "public/character/draco/draco_decoder.wasm")) });
  const encoderFile = path.join(root, "node_modules/three/examples/jsm/libs/draco/gltf/draco_encoder.js");
  const encoderModule = { exports: {} };
  vm.runInNewContext(fs.readFileSync(encoderFile, "utf8"), { module: encoderModule, exports: encoderModule.exports, require, console, process, Buffer, __dirname: path.dirname(encoderFile), __filename: encoderFile, setTimeout, clearTimeout });
  // This bundled asm.js factory is synchronous (and has a legacy thenable).
  const enc = encoderModule.exports();
  const bytes = fs.readFileSync(filename), jsonSize = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize)), binary = bytes.subarray(28 + jsonSize);
  const replacementViews = new Map();
  for (const meshDef of gltf.meshes) for (const primitive of meshDef.primitives) {
    const extension = primitive.extensions.KHR_draco_mesh_compression, sourceView = gltf.bufferViews[extension.bufferView];
    const encoded = new Int8Array(binary.subarray(sourceView.byteOffset || 0, (sourceView.byteOffset || 0) + sourceView.byteLength));
    const decoder = new dec.Decoder(), buffer = new dec.DecoderBuffer(), source = new dec.Mesh();
    buffer.Init(encoded, encoded.length); const status = decoder.DecodeBufferToMesh(buffer, source);
    if (!status.ok()) throw Error(status.error_msg());
    const builder = new enc.MeshBuilder(), target = new enc.Mesh(), encoder = new enc.Encoder();
    const count = source.num_points(), newAttributes = {};
    for (const [name, id] of Object.entries(extension.attributes)) {
      const attribute = decoder.GetAttributeByUniqueId(source, id), size = attribute.num_components(), raw = new dec.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints(source, attribute, raw);
      const integer = name.startsWith("JOINTS_") || name.startsWith("WEIGHTS_");
      const array = integer ? new Uint16Array(count * size) : new Float32Array(count * size);
      if (name.startsWith("WEIGHTS_")) {
        for (let i = 0; i < count; i++) {
          const values = Array.from({ length: size }, (_, n) => Math.max(0, raw.GetValue(i * size + n)));
          const total = values.reduce((a, b) => a + b, 0);
          if (!Number.isFinite(total) || total <= 0) throw Error("Invalid skin weights");
          const scaled = values.map(v => v / total * 65535), quantized = scaled.map(Math.floor);
          const order = scaled.map((v, n) => ({ n, fraction: v - quantized[n] })).sort((a, b) => b.fraction - a.fraction);
          const remaining = 65535 - quantized.reduce((a, b) => a + b, 0);
          for (let n = 0; n < remaining; n++) quantized[order[n].n]++;
          array.set(quantized, i * size);
        }
        Object.assign(gltf.accessors[primitive.attributes[name]], { componentType: 5123, normalized: true });
      } else {
        for (let i = 0; i < array.length; i++) array[i] = raw.GetValue(i);
        if (name === "TANGENT") for (let i = 0; i < count; i++) {
          const offset = i * 4, length = Math.hypot(array[offset], array[offset + 1], array[offset + 2]);
          if (!Number.isFinite(length) || length < 1e-10) throw Error("Invalid tangent");
          for (let n = 0; n < 3; n++) array[offset + n] /= length;
          array[offset + 3] = array[offset + 3] < 0 ? -1 : 1;
        }
      }
      const type = name === "POSITION" ? enc.POSITION : name === "NORMAL" ? enc.NORMAL : name.startsWith("TEXCOORD_") ? enc.TEX_COORD : enc.GENERIC;
      newAttributes[name] = integer ? builder.AddUInt16Attribute(target, type, count, size, array) : builder.AddFloatAttributeToMesh(target, type, count, size, array);
      dec.destroy(raw);
    }
    const indices = new Uint32Array(source.num_faces() * 3), face = new dec.DracoInt32Array();
    for (let i = 0; i < source.num_faces(); i++) { decoder.GetFaceFromMesh(source, i, face); for (let n = 0; n < 3; n++) indices[i * 3 + n] = face.GetValue(n); }
    builder.AddFacesToMesh(target, source.num_faces(), indices);
    encoder.SetSpeedOptions(5, 5); encoder.SetEncodingMethod(enc.MESH_EDGEBREAKER_ENCODING);
    encoder.SetAttributeQuantization(enc.POSITION, 16); encoder.SetAttributeQuantization(enc.NORMAL, 12);
    encoder.SetAttributeQuantization(enc.TEX_COORD, 16); encoder.SetAttributeQuantization(enc.GENERIC, 20);
    const output = new enc.DracoInt8Array(), length = encoder.EncodeMeshToDracoBuffer(target, output);
    if (length <= 0) throw Error("Skin encoding failed");
    const result = Buffer.alloc(length); for (let i = 0; i < length; i++) result[i] = output.GetValue(i) & 255;
    replacementViews.set(extension.bufferView, result); extension.attributes = newAttributes;
    for (const resource of [face, status, source, buffer, decoder]) dec.destroy(resource);
    for (const resource of [output, encoder, target, builder]) enc.destroy(resource);
  }
  const chunks = []; let length = 0;
  gltf.bufferViews.forEach((view, index) => {
    const data = replacementViews.get(index) ?? binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const padding = (4 - length % 4) % 4; if (padding) { chunks.push(Buffer.alloc(padding)); length += padding; }
    view.byteOffset = length; view.byteLength = data.length; chunks.push(data); length += data.length;
  });
  const padding = (4 - length % 4) % 4; if (padding) { chunks.push(Buffer.alloc(padding)); length += padding; }
  gltf.buffers[0].byteLength = length;
  const json = Buffer.from(JSON.stringify(gltf)), jsonBytes = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]), bin = Buffer.concat(chunks);
  const header = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  header.write("glTF"); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonBytes.length + bin.length, 8);
  jh.writeUInt32LE(jsonBytes.length); jh.write("JSON", 4); bh.writeUInt32LE(bin.length); bh.write("BIN\0", 4);
  fs.writeFileSync(filename, Buffer.concat([header, jh, jsonBytes, bh, bin]));
  console.log("Re-encoded normalized skin weights and unit tangents with local Draco.");
})().catch(error => { console.error(error); process.exitCode = 1; });

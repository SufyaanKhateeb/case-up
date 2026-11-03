// Decode local Draco streams for geometry validation; preserve embedded textures and node transforms.
const fs=require('fs'),path=require('path');
const [input,output]=process.argv.slice(2);const root=path.resolve(__dirname,'../..');
if(!input||!output||path.resolve(input)===path.resolve(output))throw Error('Provide different input.glb and output.glb paths');
const factory=require(path.join(root,'public/character/draco/draco_wasm_wrapper.js'));
(async()=>{
 const module=await factory({wasmBinary:fs.readFileSync(path.join(root,'public/character/draco/draco_decoder.wasm'))});
 const data=fs.readFileSync(input),size=data.readUInt32LE(12),g=JSON.parse(data.subarray(20,20+size)),binary=data.subarray(28+size);
 const chunks=[binary];let length=binary.length;let totalFaces=0,totalVertices=0;
 for(const meshDef of g.meshes) for(const primitive of meshDef.primitives){
 const draco=primitive.extensions?.KHR_draco_mesh_compression;if(!draco)continue;const v=g.bufferViews[draco.bufferView];
 const bytes=new Int8Array(binary.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength));
 const decoder=new module.Decoder(),buffer=new module.DecoderBuffer(),mesh=new module.Mesh();buffer.Init(bytes,bytes.length);
 const status=decoder.DecodeBufferToMesh(buffer,mesh);if(!status.ok())throw Error(status.error_msg());
 function append(array,target){
  const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
  const b=Buffer.from(array.buffer,array.byteOffset,array.byteLength),idx=g.bufferViews.length;
  g.bufferViews.push({buffer:0,byteOffset:length,byteLength:b.length,target});chunks.push(b);length+=b.length;return idx;
 }
 for(const [name,id] of Object.entries(draco.attributes)){
  const attr=decoder.GetAttributeByUniqueId(mesh,id),c=attr.num_components(),raw=new module.DracoFloat32Array();decoder.GetAttributeFloatForAllPoints(mesh,attr,raw);
  const joints=name.startsWith('JOINTS_');
  const array=joints?new Uint16Array(mesh.num_points()*c):new Float32Array(mesh.num_points()*c);let min=Array(c).fill(Infinity),max=Array(c).fill(-Infinity);
  const original=g.accessors[primitive.attributes[name]];
  const divisor=!joints&&original.normalized?(original.componentType===5123?65535:255):1;
  for(let i=0;i<array.length;i++){array[i]=raw.GetValue(i)/divisor;if(!Number.isFinite(array[i]))throw Error('Nonfinite '+name);min[i%c]=Math.min(min[i%c],array[i]);max[i%c]=Math.max(max[i%c],array[i]);}
  const accessor=g.accessors[primitive.attributes[name]];Object.assign(accessor,{bufferView:append(array,34962),byteOffset:0,componentType:joints?5123:5126,count:mesh.num_points()});
  delete accessor.normalized;
  if(name==='POSITION'){accessor.min=min;accessor.max=max;}else{delete accessor.min;delete accessor.max;}
  module.destroy(raw);
 }
 const indices=new Uint32Array(mesh.num_faces()*3),face=new module.DracoInt32Array();
 for(let i=0;i<mesh.num_faces();i++){decoder.GetFaceFromMesh(mesh,i,face);for(let j=0;j<3;j++)indices[i*3+j]=face.GetValue(j);}
 const accessor=g.accessors[primitive.indices];Object.assign(accessor,{bufferView:append(indices,34963),byteOffset:0,componentType:5125,count:indices.length});delete accessor.min;delete accessor.max;
 delete primitive.extensions.KHR_draco_mesh_compression;if(!Object.keys(primitive.extensions).length)delete primitive.extensions;
 for(const key of ['extensionsUsed','extensionsRequired'])g[key]=g[key]?.filter(x=>x!=='KHR_draco_mesh_compression');
 totalFaces+=mesh.num_faces();totalVertices+=mesh.num_points();
 for(const x of [face,status,mesh,buffer,decoder])module.destroy(x);
 }
 for(const key of ['extensionsUsed','extensionsRequired'])if(g[key]?.length===0)delete g[key];
 const padding=(4-length%4)%4;if(padding){chunks.push(Buffer.alloc(padding));length+=padding;}
 g.buffers[0].byteLength=length;
 const json=Buffer.from(JSON.stringify(g)),jp=Buffer.alloc((4-json.length%4)%4,32),jb=Buffer.concat([json,jp]),bin=Buffer.concat(chunks);
 const header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
 header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+jb.length+bin.length,8);
 jh.writeUInt32LE(jb.length);jh.write('JSON',4);bh.writeUInt32LE(bin.length);bh.write('BIN\0',4);
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
 fs.writeFileSync(output,Buffer.concat([header,jh,jb,bh,bin]));
 console.log(input,totalFaces+' triangles',totalVertices+' vertices','decoded exactly to',output);
})().catch(e=>{console.error(e);process.exitCode=1});

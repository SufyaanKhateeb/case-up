"""Prepare the supplied Mixamo FBX, retaining skinning and the walk clip.
Reapply simple colors by nearest surface correspondence to the supplied parted FBX.
No texture images or UVs are fabricated.
"""
import bpy,json,hashlib,math,statistics
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/character/rigged-fbx';OUT.mkdir(parents=True,exist_ok=True)
DOC=ROOT/'docs/design/rigged-fbx';DOC.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(ROOT/'Strut Walking.fbx'),use_anim=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source-import.blend'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
rig.data.pose_position='REST';bpy.context.view_layer.update()
def bounds(coords):return [[min(p[k] for p in coords) for k in range(3)],[max(p[k] for p in coords) for k in range(3)]]
raw_bounds=bounds([mesh.matrix_world@v.co for v in mesh.data.vertices])
with bpy.data.libraries.load(str(ROOT/'artifacts/character/parted-fbx/source-import.blend'),link=False) as (data_from,data_to):
 data_to.objects=[n for n in data_from.objects if n.startswith('part_')]
sources=[o for o in data_to.objects if o is not None]
vertices=[];polygons=[];labels=[]
for source in sources:
 offset=len(vertices);vertices.extend(source.matrix_world@v.co for v in source.data.vertices)
 for polygon in source.data.polygons:
  polygons.append(tuple(offset+i for i in polygon.vertices));labels.append(source.name.split('.')[0])
tree=BVHTree.FromPolygons(vertices,polygons,all_triangles=False)
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
colors={'skin':'#eda36b','hair':'#39251b','cream':'#f4e7d3','pants':'#283039','eye':'#141416','white':'#fff8ed'}
palette=[]
for name,color in colors.items():
 m=bpy.data.materials.new('Review_'+name);m.use_nodes=True;rgb=[linear(int(color[i:i+2],16)/255) for i in [1,3,5]]
 m.diffuse_color=(*rgb,1);node=m.node_tree.nodes.get('Principled BSDF');node.inputs['Base Color'].default_value=(*rgb,1);node.inputs['Roughness'].default_value=.72;palette.append(m)
indices={name:i for i,name in enumerate(colors)}
color_for={'part_0':'skin','part_1':'skin','part_2':'hair','part_3':'pants','part_4':'skin','part_5':'cream','part_6':'cream','part_7':'cream','part_8':'cream','part_9':'cream','part_10':'eye','part_11':'eye','part_12':'hair','part_13':'hair','part_14':'hair','part_15':'hair','part_16':'white','part_17':'white'}
mesh.data.materials.clear()
for m in palette:mesh.data.materials.append(m)
distances=[];counts={name:0 for name in colors}
for face in mesh.data.polygons:
 point=mesh.matrix_world@face.center
 _,_,index,distance=tree.find_nearest(point)
 color=color_for[labels[index]]
 # The supplied segmentation puts the neck in the same connected shell as hair.
 if color=='hair' and labels[index]=='part_2' and point.z<.70:color='skin'
 face.material_index=indices[color];face.use_smooth=True;counts[color]+=1;distances.append(distance)
source_triangles=sum(len(p.vertices)-2 for p in mesh.data.polygons)
weight_counts=[len([g for g in v.groups if g.weight>1e-6]) for v in mesh.data.vertices]
for obj in sources:bpy.data.objects.remove(obj,do_unlink=True)
for action in bpy.data.actions:action.name='StrutWalking'
rig.data.pose_position='POSE'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'palette-authoring.blend'))
rig.data.pose_position='REST';bpy.context.view_layer.update()
bpy.context.view_layer.objects.active=mesh
mod=mesh.modifiers.new('Runtime budget','DECIMATE');mod.ratio=180000/source_triangles;mod.delimit={'MATERIAL'}
while mesh.modifiers.find(mod.name)>0:bpy.ops.object.modifier_move_up(modifier=mod.name)
bpy.ops.object.modifier_apply(modifier=mod.name)
runtime_triangles=sum(len(p.vertices)-2 for p in mesh.data.polygons)
rig.data.pose_position='POSE';bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/character/rigged-walk-review.glb'),export_format='GLB',export_animations=True,export_force_sampling=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=16,export_draco_normal_quantization=12)
report={'source':'Strut Walking.fbx','source_sha256':hashlib.sha256((ROOT/'Strut Walking.fbx').read_bytes()).hexdigest(),'model':'/character/rigged-walk-review.glb','bones':len(rig.data.bones),'source_triangles':source_triangles,'runtime_triangles':runtime_triangles,'rest_bounds_blender':raw_bounds,'palette_faces':counts,'correspondence':{'median_distance':statistics.median(distances),'max_distance':max(distances),'over_1cm':sum(d>.01 for d in distances)},'max_vertex_influences':max(weight_counts),'fps':bpy.context.scene.render.fps,'actions':[{'name':a.name,'frames':list(a.frame_range)} for a in bpy.data.actions],'facial_blendshapes':0,'uv_layers':len(mesh.data.uv_layers),'materials':'Nearest-part solid palette, not restored texture images'}
(DOC/'preparation.json').write_text(json.dumps(report,indent=2));(ROOT/'content/character-rigged.json').write_text(json.dumps(report,indent=2))
print('RIGGED_REVIEW',json.dumps(report),flush=True)

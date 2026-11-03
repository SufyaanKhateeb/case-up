"""Preserve and prepare the supplied untextured FBX for isolated review."""
import bpy,json,math
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/character/parted-fbx'; OUT.mkdir(parents=True,exist_ok=True)
DOC=ROOT/'docs/design/parted-fbx'; DOC.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(ROOT/'full_body_model_parted.fbx'),use_anim=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source-import.blend'))
# Palette materials are a review treatment; the supplied FBX is never overwritten.
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def material(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True
 rgb=[linear(int(color[i:i+2],16)/255) for i in [1,3,5]]
 m.diffuse_color=(*rgb,1);node=m.node_tree.nodes.get('Principled BSDF');node.inputs['Base Color'].default_value=(*rgb,1);node.inputs['Roughness'].default_value=.72
 return m
palette={k:material(k,c) for k,c in {'skin':'#eda36b','hair':'#39251b','cream':'#f4e7d3','pants':'#283039','eye':'#141416','white':'#fff8ed'}.items()}
parts={
 'part_0':('Hand_L','skin',7000),'part_1':('Hand_R','skin',7000),
 'part_2':('Hair','hair',26000),'part_3':('Legs_and_shoes','pants',16000),
 'part_4':('Head','skin',32000),'part_5':('Sweatshirt','cream',18000),
 'part_6':('Waistband','cream',6000),'part_7':('Sleeve_L','cream',10000),
 'part_8':('Collar','cream',6000),'part_9':('Sleeve_R','cream',10000),
 'part_10':('Eye_L','eye',2500),'part_11':('Eye_R','eye',2500),
 'part_12':('Brow_L','hair',2500),'part_13':('Brow_R','hair',2500),
 'part_14':('Moustache','hair',3500),'part_15':('Chin_beard','hair',3500),
 'part_16':('Eye_detail_L','white',2000),'part_17':('Eye_detail_R','white',2000),
}
manifest=[]
for obj in list(bpy.context.scene.objects):
 if obj.type!='MESH':continue
 source=obj.name; name,color,budget=parts[source];obj.name=name
 obj.data.materials.clear();obj.data.materials.append(palette[color]);
 if source=='part_2':
  obj.data.materials.append(palette['skin'])
  for face in obj.data.polygons:
   if (obj.matrix_world@face.center).z<.70:face.material_index=1
 for face in obj.data.polygons:face.use_smooth=True
 coords=[obj.matrix_world@Vector(p) for p in obj.bound_box]
 low=[min(p[k] for p in coords) for k in range(3)];high=[max(p[k] for p in coords) for k in range(3)]
 manifest.append({'name':name,'source':source,'palette':color,'bounds_blender':[low,high],'source_triangles':sum(len(p.vertices)-2 for p in obj.data.polygons),'budget':budget})
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'palette-authoring.blend'))
for obj in [o for o in bpy.context.scene.objects if o.type=='MESH']:
 info=next(p for p in manifest if p['name']==obj.name)
 if info['source_triangles']>info['budget']:
  bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Review budget','DECIMATE');mod.ratio=info['budget']/info['source_triangles'];bpy.ops.object.modifier_apply(modifier=mod.name)
 info['runtime_triangles']=sum(len(p.vertices)-2 for p in obj.data.polygons)
 for face in obj.data.polygons:face.use_smooth=True
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/character/parted-review.glb'),export_format='GLB',export_animations=False,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=16,export_draco_normal_quantization=12)
(ROOT/'content/character-parted.json').write_text(json.dumps({'model':'/character/parted-review.glb','source':'full_body_model_parted.fbx','rigged':False,'morphs':False,'textured':False,'parts':manifest},indent=2))
# Local review renders use the exported review density, with the original full density preserved above.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.18,.18,.18);scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'
def area(name,position,energy,size):
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
 ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=position;ob.rotation_euler=(Vector((0,0,.65))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Key',(-2,-3,4),250,3);area('Fill',(3,-1,2),120,3);area('Rim',(0,3,3),200,2)
data=bpy.data.cameras.new('Review');camera=bpy.data.objects.new('Review',data);scene.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO'
for name,position,target,size in [('front',(0,-3,.60),(0,0,.57),1.35),('face',(0,-3,.86),(0,-.02,.86),.64),('three-quarter',(2,-3,.7),(0,0,.57),1.35)]:
 camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=size;scene.render.filepath=str(DOC/f'{name}.png');bpy.ops.render.render(write_still=True)
print('PREPARED',len(manifest),'parts',sum(p['runtime_triangles'] for p in manifest),'triangles',flush=True)

"""Clean a generated shape for inspection, using Blender's background Python.

blender -b --python optimize-hunyuan.py -- --input shape.glb --output study.glb
This preserves the raw model; it does not create an animation rig or textures.
"""
import argparse
import sys
from pathlib import Path

import bpy
import bmesh

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--faces", type=int, default=80000)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
if args.input.resolve() == args.output.resolve():
    parser.error("Use a separate output path to preserve the raw generation.")
if args.faces < 1000:
    parser.error("Use at least 1000 target faces.")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(args.input.resolve()))
objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
# The 2mv export can contain the same triangle in opposite winding directions.
# Remove those before normal calculation and simplification; otherwise their
# normals cancel and produce black patches on the face and hair.
for obj in objects:
    old = obj.data
    if old.uv_layers or old.shape_keys:
        raise ValueError("This cleaner accepts untextured, unrigged shape studies only.")
    seen = set(); faces = []
    for polygon in old.polygons:
        face = tuple(polygon.vertices); key = tuple(sorted(face))
        if len(set(face)) >= 3 and key not in seen:
            seen.add(key); faces.append(face)
    print("Duplicate/degenerate faces removed:", len(old.polygons) - len(faces))
    clean = bpy.data.meshes.new(old.name + "_clean")
    clean.from_pydata([vertex.co for vertex in old.vertices], [], faces)
    for material in old.materials:
        clean.materials.append(material)
    obj.data = clean
    if not old.users:
        bpy.data.meshes.remove(old)
total_faces = sum(len(obj.data.polygons) for obj in objects)
for obj in objects:
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.000001)
    bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=.0000001)
    remaining = set(bm.verts)
    islands = []
    while remaining:
        first = remaining.pop(); component = [first]; queue = [first]
        while queue:
            vertex = queue.pop()
            for edge in vertex.link_edges:
                neighbor = edge.other_vert(vertex)
                if neighbor in remaining:
                    remaining.remove(neighbor); component.append(neighbor); queue.append(neighbor)
        islands.append(component)
    largest = max((len(part) for part in islands), default=0)
    # Tiny disconnected reconstruction fragments, not the separate eyes/brows.
    remove = [vertex for part in islands if len(part) < max(48, largest * .001) for vertex in part]
    bmesh.ops.delete(bm, geom=remove, context="VERTS")
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data); bm.free()
    if total_faces > args.faces:
        modifier = obj.modifiers.new("Web study simplification", "DECIMATE")
        modifier.ratio = args.faces / total_faces
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    if not obj.data.materials:
        clay = bpy.data.materials.new("Warm clay inspection")
        clay.use_nodes = True
        clay.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = (.68, .65, .6, 1)
        obj.data.materials.append(clay)
    for material in obj.data.materials:
        material.use_nodes = True
        material.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = .7
        material.node_tree.nodes.get("Principled BSDF").inputs["Metallic"].default_value = 0
args.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(args.output.resolve()), export_format="GLB", export_animations=False)
print("Optimized faces:", sum(len(obj.data.polygons) for obj in objects))

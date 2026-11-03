"""Conservatively clean an unrigged textured GLB in Blender, preserving UV loops.

No remeshing, hole filling, or island deletion is performed. Optional runtime
decimation happens after saving a packed authoring file at the source density.
Run with Blender --background --disable-autoexec --python this.py -- --help.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

import bpy
import bmesh


def inspect(bm):
    remaining = set(bm.verts)
    components = []
    while remaining:
        first = remaining.pop()
        part = {first}
        queue = [first]
        while queue:
            vertex = queue.pop()
            for edge in vertex.link_edges:
                other = edge.other_vert(vertex)
                if other in remaining:
                    remaining.remove(other)
                    part.add(other)
                    queue.append(other)
        components.append(len({face for vertex in part for face in vertex.link_faces}))
    bm.verts.index_update()
    seen = set()
    duplicates = 0
    for face in bm.faces:
        key = tuple(sorted(vertex.index for vertex in face.verts))
        duplicates += key in seen
        seen.add(key)
    return {
        "vertices": len(bm.verts), "edges": len(bm.edges), "triangles": len(bm.faces),
        "boundary_edges": sum(edge.is_boundary for edge in bm.edges),
        "nonmanifold_edges": sum(not edge.is_manifold for edge in bm.edges),
        "inconsistent_winding_edges": sum(edge.is_manifold and not edge.is_contiguous for edge in bm.edges),
        "loose_vertices": sum(not vertex.link_faces for vertex in bm.verts),
        "degenerate_faces": sum(face.calc_area() < 1e-14 for face in bm.faces),
        "duplicate_faces": duplicates,
        "nonfinite_vertices": sum(not all(math.isfinite(x) for x in vertex.co) for vertex in bm.verts),
        "connected_components": len(components),
        "largest_component_triangles": max(components, default=0),
    }


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--report", type=Path, required=True)
parser.add_argument("--authoring", type=Path, required=True)
parser.add_argument("--texture-size", type=int, default=2048)
parser.add_argument("--smooth-iterations", type=int, default=3)
parser.add_argument("--faces", type=int, default=0, help="Optional runtime triangle budget; zero retains source density")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
paths = [args.input, args.output, args.report, args.authoring]
if len({path.resolve() for path in paths}) != len(paths):
    parser.error("Input, runtime, report and authoring files must be different paths.")
if args.texture_size < 256:
    parser.error("Texture size must be at least 256 pixels.")
if not 0 <= args.smooth_iterations <= 10:
    parser.error("Use between zero and ten gentle smoothing iterations.")
if args.faces and args.faces < 1000:
    parser.error("Use at least 1000 runtime faces, or zero to retain source density.")
source_hash = hashlib.sha256(args.input.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(args.input.resolve()))
objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if not objects:
    raise ValueError("The model contains no meshes.")
mesh_reports = []
for obj in objects:
    mesh = obj.data
    if mesh.shape_keys or any(mod.type == "ARMATURE" for mod in obj.modifiers):
        raise ValueError("This pipeline is for unrigged assets only; do not discard animation data.")
    bm = bmesh.new()
    bm.from_mesh(mesh)
    before = inspect(bm)
    if before["nonfinite_vertices"]:
        raise ValueError("Nonfinite geometry requires manual repair.")
    # Imported UV atlas boundaries split vertex records. Weld only coincident
    # positions, leaving each face-corner UV intact; do not remove small islands.
    extent = max((max(v.co[i] for v in bm.verts) - min(v.co[i] for v in bm.verts)) for i in range(3))
    tolerance = extent * 1e-7
    uv_before = [[tuple(item.uv) for item in layer.data] for layer in mesh.uv_layers]
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=tolerance)
    welded = inspect(bm)
    # Refuse destructive repair of unexpected defects. The supplied full mesh
    # needs only welding; other generators may need an explicitly reviewed pass.
    if any(welded[key] for key in ["degenerate_faces", "duplicate_faces", "loose_vertices"]):
        raise ValueError(f"Unexpected defects after welding; inspect before repairing: {welded}")
    original_positions = {vertex: vertex.co.copy() for vertex in bm.verts} if args.smooth_iterations else {}
    # Alternating small positive/negative Laplacian steps reduce reconstruction
    # ridges while limiting shrinkage. Do not touch topology, UVs, or add detail.
    for _ in range(args.smooth_iterations):
        for factor in (.25, -.26):
            updates = {}
            for vertex in bm.verts:
                neighbors = [edge.other_vert(vertex) for edge in vertex.link_edges]
                if neighbors and all(edge.is_manifold for edge in vertex.link_edges):
                    mean = sum((neighbor.co for neighbor in neighbors), Vector()) / len(neighbors)
                    updates[vertex] = vertex.co + (mean - vertex.co) * factor
            for vertex, position in updates.items():
                vertex.co = position
    displacement = [(vertex.co - position).length for vertex, position in original_positions.items()]
    bm.normal_update()
    old_normals = [face.normal.copy() for face in bm.faces]
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    reversed_faces = sum(old.dot(face.normal) < 0 for old, face in zip(old_normals, bm.faces))
    after = inspect(bm)
    volume = bm.calc_volume(signed=True)
    if after["boundary_edges"] == 0 and volume < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
        volume = -volume
        reversed_faces = len(bm.faces) - reversed_faces
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    uv_after = [[tuple(item.uv) for item in layer.data] for layer in mesh.uv_layers]
    if uv_before != uv_after:
        raise ValueError("Cleanup changed UV face corners; do not publish this export.")
    if after["triangles"] != before["triangles"]:
        raise ValueError("Cleanup unexpectedly changed the triangle count.")
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    # Closed, consistently oriented surfaces need no back-face rendering.
    closed = after["nonmanifold_edges"] == 0 and after["inconsistent_winding_edges"] == 0
    if closed:
        for material in mesh.materials:
            material.use_backface_culling = True
    mesh_reports.append({
        "name": obj.name, "before": before, "after": after,
        "weld_tolerance": tolerance, "welded_vertices": before["vertices"] - after["vertices"],
        "reoriented_faces": reversed_faces, "signed_volume": volume,
        "uv_face_corners_preserved": True, "single_sided": closed,
        "smoothing_iterations": args.smooth_iterations,
        "smoothing_max_displacement": max(displacement, default=0),
        "smoothing_mean_displacement": sum(displacement) / len(displacement) if displacement else 0,
    })

for path in [args.output, args.report, args.authoring]:
    path.parent.mkdir(parents=True, exist_ok=True)
images = []
for image in bpy.data.images:
    if image.type == "IMAGE" and image.size[0]:
        image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(args.authoring.resolve()))
source_triangles = sum(len(obj.data.polygons) for obj in objects)
if args.faces and args.faces < source_triangles:
    for obj in objects:
        modifier = obj.modifiers.new("Runtime triangle budget", "DECIMATE")
        modifier.ratio = args.faces / source_triangles
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
for image in bpy.data.images:
    if image.type != "IMAGE" or not image.size[0]:
        continue
    original = tuple(image.size)
    factor = min(1, args.texture_size / max(original))
    if factor < 1:
        image.scale(max(1, round(original[0] * factor)), max(1, round(original[1] * factor)))
        image.pack()
    images.append({"name": image.name, "original": original, "runtime": tuple(image.size),
                   "color_space": image.colorspace_settings.name})
bpy.ops.export_scene.gltf(
    filepath=str(args.output.resolve()), export_format="GLB", export_animations=False,
    export_image_format="WEBP", export_image_quality=95, export_tangents=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16, export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=16,
)
assert hashlib.sha256(args.input.read_bytes()).hexdigest() == source_hash, "Original model changed"
report = {
    "source": args.input.name, "source_sha256": source_hash,
    "source_bytes": args.input.stat().st_size,
    "runtime": args.output.name, "runtime_bytes": args.output.stat().st_size,
    "runtime_sha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
    "authoring": args.authoring.name, "blender": bpy.app.version_string,
    "meshes": mesh_reports, "images": images,
    "rigged": False, "animation_clips": 0, "facial_morphs": 0,
    "compression": "KHR_draco_mesh_compression", "texture_format": "WEBP", "texture_quality": 95,
    "source_triangles": source_triangles,
    "runtime_triangles": sum(len(obj.data.polygons) for obj in objects),
    "geometry_decimated": bool(args.faces and args.faces < source_triangles), "uvs_repacked": False,
}
args.report.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2), flush=True)

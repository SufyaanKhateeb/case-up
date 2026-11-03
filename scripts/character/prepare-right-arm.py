"""One continuous approved mesh, with right-only or independent arm skinning.

No cuts, caps, remeshing, facial edits or legacy pose transfer. Run Blender 4.5
--background --disable-autoexec --python scripts/character/prepare-right-arm.py.
Append -- --both to preserve the right-only export and prepare both arms.
"""
import argparse
import hashlib
import heapq
import json
import subprocess
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("--both", action="store_true", help="Add the left arm without replacing the right-only study")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
STUDY = "arms" if args.both else "right-arm"
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "artifacts/character/full-model-hq/smoothed-exact-decoded.glb"
OUT = ROOT / f"artifacts/character/{STUDY}"
OUT.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
obj = next(o for o in bpy.context.scene.objects if o.type == "MESH")
mesh = obj.data
bm = bmesh.new()
bm.from_mesh(mesh)
normals = bm.loops.layers.float_vector.new("original_normal")
for face in bm.faces:
    for loop in face.loops:
        loop[normals] = mesh.corner_normals[loop.index].vector
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-7)
bm.verts.ensure_lookup_table()
bm.verts.index_update()
assert len(bm.faces) == 200000 and all(e.is_manifold for e in bm.edges)
points = np.array([tuple(v.co) for v in bm.verts], dtype=np.float64)
edges = np.array([[e.verts[0].index, e.verts[1].index] for e in bm.edges], dtype=np.int32)

def smoothstep(a, b, value):
    t = np.clip((value - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

# Adjacency and atlas data are shared; each side is painted on its own connected
# sleeve core. The left uses reflected joint landmarks, not reflected geometry.
lengths = np.linalg.norm(points[edges[:, 0]] - points[edges[:, 1]], axis=1)
neighbors = [[] for _ in points]
for (a, b), length in zip(edges, lengths):
    neighbors[a].append((int(b), float(length)))
    neighbors[b].append((int(a), float(length)))
material = mesh.materials[0]
shader = next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
image = shader.inputs["Base Color"].links[0].from_node.image
pixels = np.empty(len(image.pixels), dtype=np.float32)
image.pixels.foreach_get(pixels)
pixels = pixels.reshape(image.size[1], image.size[0], 4)
uv_layer = bm.loops.layers.uv.active
degree = np.bincount(edges.ravel(), minlength=len(points)).astype(float)

def paint_arm(sign):
    mirror = np.array([sign, 1, 1])
    shoulder, elbow, wrist, tip = np.array([
        [-.175, .375, -.018], [-.251, .234, -.009],
        [-.335, .113, .010], [-.375, .045, .018]]) * mirror
    local = points * mirror
    down = (wrist - shoulder) / np.linalg.norm(wrist - shoulder)
    y = local[:, 1]
    boundary = np.where(y >= .3, .16 + .25 * (y - .3), np.minimum(.20, .16 + .10 * (.3 - y)))
    field = -local[:, 0] - boundary
    candidate = (field > .015) & (local[:, 0] < -.13) & (y < .445)
    seed = int(np.argmin(np.linalg.norm(local - np.array([-.36, .07, .02]), axis=1)))
    assert candidate[seed]
    core = np.zeros(len(points), dtype=bool)
    core[seed] = True
    queue = [seed]
    while queue:
        vertex = queue.pop()
        for other, _ in neighbors[vertex]:
            if candidate[other] and not core[other]:
                core[other] = True
                queue.append(other)
    distance = np.full(len(points), np.inf)
    distance[core] = 0
    queue = [(0., int(index)) for index in np.flatnonzero(core)]
    heapq.heapify(queue)
    while queue:
        value, vertex = heapq.heappop(queue)
        if value != distance[vertex] or value > .055:
            continue
        for other, length in neighbors[vertex]:
            proposed = value + length
            if proposed < distance[other] and proposed <= .055:
                distance[other] = proposed
                heapq.heappush(queue, (proposed, other))
    arm = 1 - smoothstep(0, .055, distance)
    elbow_blend = smoothstep(-.045, .045, (points - elbow) @ down)
    wrist_blend = smoothstep(-.022, .022, (points - wrist) @ down)
    weights = np.column_stack([1 - arm, arm * (1 - elbow_blend),
                               arm * elbow_blend * (1 - wrist_blend), arm * elbow_blend * wrist_blend])
    fixed_body = (local[:, 0] >= -.11) | (y >= .445) | (distance >= .055)
    weights[fixed_body] = [1, 0, 0, 0]
    # Keep the whole hand rigid; blend through the cloth side of the cuff.
    fixed_hand = np.zeros(len(points), dtype=bool)
    for face in bm.faces:
        p = face.calc_center_median()
        if p.x * sign > -.23 or p.y > .185:
            continue
        uv = sum((loop[uv_layer].uv for loop in face.loops), Vector((0, 0))) / len(face.loops)
        ix = min(image.size[0] - 1, max(0, int(uv.x * image.size[0])))
        iy = min(image.size[1] - 1, max(0, int(uv.y * image.size[1])))
        r, g, b = pixels[iy, ix, :3]
        if r > g * 1.12 and g > b * 1.15:
            for vertex in face.verts:
                fixed_hand[vertex.index] = True
    assert fixed_hand.sum() > 1000
    weights[fixed_hand] = [0, 0, 0, 1]
    for _ in range(24):
        sums = np.zeros_like(weights)
        np.add.at(sums, edges[:, 0], weights[edges[:, 1]])
        np.add.at(sums, edges[:, 1], weights[edges[:, 0]])
        weights = .5 * weights + .5 * sums / degree[:, None]
        weights[fixed_body] = [1, 0, 0, 0]
        weights[fixed_hand] = [0, 0, 0, 1]
        weights /= weights.sum(axis=1, keepdims=True)
    assert np.isfinite(weights).all() and np.max(np.abs(weights.sum(axis=1) - 1)) < 1e-12
    assert np.max(weights[fixed_body, 1:]) == 0
    return weights, fixed_body, fixed_hand, [shoulder, elbow, wrist, tip]

weights, fixed_body, fixed_hand, landmarks = paint_arm(1)
shoulder, elbow, wrist, tip = landmarks
if args.both:
    left_weights, left_fixed, left_hand, left_landmarks = paint_arm(-1)
    assert not np.any((weights[:, 1:].sum(axis=1) > 0) & (left_weights[:, 1:].sum(axis=1) > 0))
    weights = np.column_stack([weights[:, 0] + left_weights[:, 0] - 1, weights[:, 1:], left_weights[:, 1:]])
    fixed_body &= left_fixed
    fixed_hand |= left_hand
    assert np.all(weights >= -1e-12) and np.max(np.abs(weights.sum(axis=1) - 1)) < 1e-12

# Convert the source's local Y-up mesh to Blender world space before creating
# the armature. This avoids the earlier double-axis conversion on export.
conversion = obj.matrix_world.to_3x3()
custom_normals = [tuple((conversion @ loop[normals]).normalized()) for f in bm.faces for loop in f.loops]
for v in bm.verts:
    v.co = conversion @ v.co
bm.to_mesh(mesh)
bm.free()
mesh.normals_split_custom_set(custom_normals)
obj.matrix_world = Matrix.Identity(4)
obj.name = "ContinuousCharacter"
obj["study"] = "continuous-arms" if args.both else "right-arm-only"
for polygon in mesh.polygons:
    polygon.use_smooth = True

bpy.ops.object.select_all(action="DESELECT")
armature = bpy.data.armatures.new("ContinuousArmsSkeleton" if args.both else "RightArmSkeleton")
rig = bpy.data.objects.new("ContinuousArmsRig" if args.both else "RightArmRig", armature)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
definitions = [
    ("Body", [0, .18, 0], [0, .46, 0], None),
    ("RightUpperArm", shoulder, elbow, "Body"),
    ("RightForearm", elbow, wrist, "RightUpperArm"),
    ("RightHand", wrist, tip, "RightForearm"),
]
if args.both:
    left_shoulder, left_elbow, left_wrist, left_tip = left_landmarks
    definitions.extend([
        ("LeftUpperArm", left_shoulder, left_elbow, "Body"),
        ("LeftForearm", left_elbow, left_wrist, "LeftUpperArm"),
        ("LeftHand", left_wrist, left_tip, "LeftForearm"),
    ])
for name, start, end, parent in definitions:
    bone = armature.edit_bones.new(name)
    bone.head = conversion @ Vector(start)
    bone.tail = conversion @ Vector(end)
    if parent:
        bone.parent = armature.edit_bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")
for column, (name, *_rest) in enumerate(definitions):
    group = obj.vertex_groups.new(name=name)
    for index in np.flatnonzero(weights[:, column] > 1e-7):
        group.add([int(index)], float(weights[index, column]), "REPLACE")
modifier = obj.modifiers.new("Continuous arms" if args.both else "Continuous right arm", "ARMATURE")
modifier.object = rig
modifier.use_deform_preserve_volume = False  # Match glTF/Three linear skinning.
for img in bpy.data.images:
    if img.type == "IMAGE" and img.size[0]:
        img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / f"continuous-{STUDY}.blend"))
runtime = ROOT / f"public/character/{STUDY}-continuous.glb"
bpy.ops.export_scene.gltf(filepath=str(runtime), export_format="GLB", export_animations=False,
                         export_skins=True, export_extras=True, export_tangents=True,
                         export_image_format="WEBP", export_image_quality=95,
                         export_draco_mesh_compression_enable=True,
                         export_draco_position_quantization=16, export_draco_normal_quantization=12,
                         export_draco_texcoord_quantization=16)
subprocess.run(["node", str(ROOT / "scripts/character/normalize-skin-export.cjs"), str(runtime)], check=True, cwd=ROOT)
report = {
    "runtime": f"/character/{STUDY}-continuous.glb", "source_sha256": source_hash,
    "runtime_sha256": hashlib.sha256(runtime.read_bytes()).hexdigest(), "runtime_bytes": runtime.stat().st_size,
    "mesh_count": 1, "triangles": len(mesh.polygons), "cuts": 0, "caps": 0,
    "bones": [d[0] for d in definitions], "protected_vertices": int(fixed_body.sum()),
    "rigid_hand_vertices": int(fixed_hand.sum()), "max_protected_arm_weight": 0,
    "smoothing_passes": 24, "welded_vertices": len(points),
    "hand_axis": (tip - wrist).tolist(),
    **({"left_hand_axis": (left_tip - left_wrist).tolist()} if args.both else {}),
    "method": "one welded manifold surface; connected arm core with geodesic shoulder falloff, graph-smoothed skin weights; linear skinning",
}
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
(ROOT / f"content/character-{STUDY}.json").write_text(json.dumps(report, indent=2) + "\n")
(OUT / "preparation.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2), flush=True)

"""Prepare a NON-deforming, separated-part study from the approved runtime mesh.

Blender 4.5: --background --disable-autoexec --python this.py
Cuts interpolate face-corner UVs/normals. Every exterior face belongs to exactly
one part. Cut surfaces get a separate, untextured material. No remeshing,
automatic skin weights, expressions, or legacy-rig rotation transfer is used.
Facial objects are surface patches for inspection, NOT finished facial anatomy.
"""
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "artifacts/character/full-model-hq/smoothed-exact-decoded.glb"
OUT = ROOT / "artifacts/character/articulation"
OUT.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source = next(o for o in bpy.context.scene.objects if o.type == "MESH")
material = source.data.materials[0]
principled = next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
image = principled.inputs["Base Color"].links[0].from_node.image
pixels = np.empty(len(image.pixels), dtype=np.float32)
image.pixels.foreach_get(pixels)
pixels = pixels.reshape(image.size[1], image.size[0], 4)

bm = bmesh.new()
bm.from_mesh(source.data)
bm.faces.layers.int.new("selection")
bm.verts.layers.float_vector.new("unwarped_position")
normal_layer = bm.loops.layers.float_vector.new("preserved_normal")
for face in bm.faces:
    for loop in face.loops:
        loop[normal_layer] = source.data.corner_normals[loop.index].vector
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-7)
source_area = sum(f.calc_area() for f in bm.faces)
source_faces = len(bm.faces)


def components(mesh):
    remaining = set(mesh.faces)
    groups = []
    while remaining:
        first = remaining.pop()
        group, queue = {first}, [first]
        while queue:
            f = queue.pop()
            for edge in f.edges:
                for other in edge.link_faces:
                    if other in remaining:
                        remaining.remove(other)
                        group.add(other)
                        queue.append(other)
        groups.append(group)
    return sorted(groups, key=len, reverse=True)


def bisect(mesh, point, normal, predicate=lambda e: True):
    cut = bmesh.ops.bisect_plane(
        mesh, geom=list(mesh.verts) + list(mesh.edges) + list(mesh.faces),
        dist=1e-7, plane_co=Vector(point), plane_no=Vector(normal),
    )
    edges = [e for e in cut["geom_cut"] if isinstance(e, bmesh.types.BMEdge) and predicate(e)]
    degree = Counter(v for e in edges for v in e.verts)
    if not edges or any(n != 2 for n in degree.values()):
        print("OPEN_CUT", point, [tuple(v.co) for v, n in degree.items() if n != 2], flush=True)
    assert edges and all(n == 2 for n in degree.values()), "Refuse an open anatomical cut"
    bmesh.ops.split_edges(mesh, edges=edges)
    return sum((v.co for v in degree), Vector()) / len(degree)


def shoulder_cut(mesh, side):
    """A curved anatomical seam, not a plane through the broad armpit.

    Bisect the piecewise-linear scalar field in temporary coordinates. Store
    original positions in interpolated vertex data, so every new cut vertex
    returns to its original triangle and the rest silhouette is unchanged.
    """
    positions = mesh.verts.layers.float_vector["unwarped_position"]
    for v in mesh.verts:
        v[positions] = v.co
        base = .16 if side < 0 else .18
        boundary = base + .25 * (v.co.y - .3) if v.co.y >= .3 else min(.20, base + .10 * (.3 - v.co.y))
        v.co.x = side * v.co.x - boundary
    result = bmesh.ops.bisect_plane(mesh, geom=list(mesh.verts) + list(mesh.edges) + list(mesh.faces),
                                    dist=1e-7, plane_co=Vector(), plane_no=Vector((1, 0, 0)))
    edges = [e for e in result["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    degree = Counter(v for e in edges for v in e.verts)
    assert edges and all(n == 2 for n in degree.values()), "Refuse an open shoulder seam"
    for v in mesh.verts:
        v.co = v[positions]
    pivot = sum((v.co for v in degree), Vector()) / len(degree)
    bmesh.ops.split_edges(mesh, edges=edges)
    return pivot


shoulder_r = shoulder_cut(bm, -1)
shoulder_l = shoulder_cut(bm, 1)
print("SHOULDERS", tuple(shoulder_r), tuple(shoulder_l), flush=True)
islands = components(bm)
assert len(islands) == 3, f"Expected torso/head and two complete arms; got {len(islands)}"


def subset(mesh, faces):
    """Keep UVs, custom loop data and shared seam positions without repacking."""
    tag = mesh.faces.layers.int.get("selection") or mesh.faces.layers.int.new("selection")
    for f in mesh.faces:
        f[tag] = int(f in faces)
    result = mesh.copy()
    copied_tag = result.faces.layers.int["selection"]
    bmesh.ops.delete(result, geom=[f for f in result.faces if not f[copied_tag]], context="FACES")
    bmesh.ops.delete(result, geom=[e for e in result.edges if not e.link_faces], context="EDGES")
    bmesh.ops.delete(result, geom=[v for v in result.verts if not v.link_faces], context="VERTS")
    return result


central = subset(bm, islands[0])
arms = {}
for faces in islands[1:]:
    side = "L" if next(iter(faces)).calc_center_median().x > 0 else "R"
    arms[side] = subset(bm, faces)
bm.free()

# An angled seam beneath the entire jaw keeps the chin/beard rigidly on the
# head. Unlike the old adapter it NEVER blends through the jawline.
head_pivot = bisect(central, (0, .485, 0), (0, 1, .28))
central_islands = components(central)
assert len(central_islands) == 2
head_faces = next(g for g in central_islands if max(v.co.y for f in g for v in f.verts) > .8)
head = subset(central, head_faces)
lower = subset(central, set(central.faces) - head_faces)
central.free()


def color(face, mesh):
    uv_layer = mesh.loops.layers.uv.active
    uv = sum((loop[uv_layer].uv for loop in face.loops), Vector((0, 0))) / len(face.loops)
    x = min(image.size[0] - 1, max(0, int(uv.x * image.size[0])))
    y = min(image.size[1] - 1, max(0, int(uv.y * image.size[1])))
    return pixels[y, x, :3]


# The natural skin/collar texture boundary is more accurate here than a plane
# through the ribbed sweatshirt collar. Keep that whole collar with the torso.
neck_faces = set()
for face in lower.faces:
    p = face.calc_center_median()
    r, g, b = color(face, lower)
    if p.y > .435 and r > g * 1.12 and g > b * 1.15:
        neck_faces.add(face)
assert len(neck_faces) > 100
# Remove atlas-edge speckles before separating. Keep the single connected skin
# patch, fill tiny enclosed holes and smooth the face-selection boundary.
for _ in range(5):
    updates = {}
    for face in lower.faces:
        if not .43 < face.calc_center_median().y < .50:
            continue
        neighbors = {f for e in face.edges for f in e.link_faces if f != face}
        if len(neighbors) >= 2:
            selected = sum(f in neck_faces for f in neighbors)
            if selected == len(neighbors):
                updates[face] = True
            elif selected == 0:
                updates[face] = False
    for face, selected in updates.items():
        if selected:
            neck_faces.add(face)
        else:
            neck_faces.discard(face)
# Keep the anatomical neck patch, removing texture speckles and filling islands
# fully enclosed inside it. Otherwise a tiny cloth island gets an overlapping
# cloth cap on the exterior, visible as white chips around the neckline.
def face_regions(faces):
    remaining = set(faces)
    regions = []
    while remaining:
        first = remaining.pop()
        group, queue = {first}, [first]
        while queue:
            face = queue.pop()
            for edge in face.edges:
                for other in edge.link_faces:
                    if other in remaining:
                        remaining.remove(other)
                        group.add(other)
                        queue.append(other)
        regions.append(group)
    return sorted(regions, key=len, reverse=True)


def single_patch(mesh, selected):
    selected = face_regions(selected)[0]
    for group in face_regions(set(mesh.faces) - selected):
        if len(group) < 500 and not any(e.is_boundary for f in group for e in f.edges):
            selected.update(group)
    # Resolve single-vertex pinches instead of producing nonmanifold caps.
    for _ in range(100):
        pinches = []
        for vertex in mesh.verts:
            crossings = sum(len(e.link_faces) == 2 and ((e.link_faces[0] in selected) != (e.link_faces[1] in selected)) for e in vertex.link_edges)
            if crossings > 2:
                pinches.append(vertex)
        if not pinches:
            return selected
        for vertex in pinches:
            faces = set(vertex.link_faces)
            if len(faces & selected) * 2 >= len(faces):
                selected.update(faces)
            else:
                selected.difference_update(faces)
    raise ValueError("Material boundary needs manual cleanup; refusing a pinched cap")


neck_faces = single_patch(lower, neck_faces)
parts = {"torso": subset(lower, set(lower.faces) - neck_faces),
         "neck": subset(lower, neck_faces), "head": head}
lower.free()
pivots = {"torso": Vector((0, .25, 0)), "neck": Vector((0, .452, -.015)), "head": head_pivot}
parents = {"torso": None, "neck": "torso", "head": "neck"}

for side, arm in arms.items():
    s = 1 if side == "L" else -1
    elbow = bisect(arm, (s * .268, .245, -.01), (s * .55, -.84, 0))
    groups = components(arm)
    assert len(groups) == 2, f"Expected upper arm and distal arm on {side}"
    groups.sort(key=lambda g: sum(f.calc_center_median().y for f in g) / len(g), reverse=True)
    ids = [f"upper_arm.{side}", f"forearm.{side}", f"hand.{side}"]
    parts[ids[0]] = subset(arm, groups[0])
    distal = subset(arm, groups[1])
    hand_faces = set()
    for face in distal.faces:
        r, g, b = color(face, distal)
        if face.calc_center_median().y < .185 and r > g * 1.12 and g > b * 1.15:
            hand_faces.add(face)
    assert len(hand_faces) > 1000
    hand_faces = single_patch(distal, hand_faces)
    wrist_vertices = {v for e in distal.edges if len(e.link_faces) == 2 and
                      ((e.link_faces[0] in hand_faces) != (e.link_faces[1] in hand_faces)) for v in e.verts}
    wrist = sum((v.co for v in wrist_vertices), Vector()) / len(wrist_vertices)
    parts[ids[1]] = subset(distal, set(distal.faces) - hand_faces)
    parts[ids[2]] = subset(distal, hand_faces)
    distal.free()
    # Joint landmarks belong inside the shoulder, not at the centroid of an
    # asymmetric sleeve cut. Keep the two shoulder pivots at the same height.
    pivots[ids[0]] = Vector((s * .175, .375, -.018))
    pivots[ids[1]] = elbow
    pivots[ids[2]] = wrist
    parents.update({ids[0]: "torso", ids[1]: ids[0], ids[2]: ids[1]})
    arm.free()

exterior_area = sum(f.calc_area() for mesh in parts.values() for f in mesh.faces)
assert abs(exterior_area - source_area) / source_area < 1e-6, "Exterior surface lost or duplicated"

interior = {}
for name, rgb in {"skin": (.48, .25, .12, 1), "cloth": (.72, .68, .60, 1)}.items():
    m = bpy.data.materials.new("Cut interior / " + name)
    m.diffuse_color = rgb
    m.use_nodes = True
    m.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = rgb
    m.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = .85
    interior[name] = m

cap_counts = {}
for name, mesh in parts.items():
    bulk_center = sum((v.co for v in mesh.verts), Vector()) / len(mesh.verts)
    edges = [e for e in mesh.edges if e.is_boundary]
    cap = []
    # Close each simple loop with a new internal fan vertex. Ngon triangulation
    # can reuse an existing exterior diagonal on this dense, non-planar collar,
    # making a four-face edge. Separate cap vertices avoid that failure.
    remaining = {e for e in mesh.edges if e.is_boundary}
    while remaining:
        first = next(iter(remaining))
        loop_edges, queue = set(), [first]
        while queue:
            edge = queue.pop()
            if edge not in remaining:
                continue
            remaining.remove(edge)
            loop_edges.add(edge)
            for vertex in edge.verts:
                queue.extend(e for e in vertex.link_edges if e in remaining)
        degree = Counter(v for e in loop_edges for v in e.verts)
        assert all(n == 2 for n in degree.values()), "Refuse a branching cap"
        midpoint = sum((v.co for v in degree), Vector()) / len(degree)
        # Put the cap inside its part rather than coplanar with an irregular
        # material boundary. This prevents exterior cap chips/z-fighting.
        inward = bulk_center - midpoint
        center = mesh.verts.new(midpoint + inward.normalized() * min(.006, inward.length * .25))
        for edge in loop_edges:
            loop = edge.link_loops[0]
            cap.append(mesh.faces.new([loop.link_loop_next.vert, loop.vert, center]))
    mesh.normal_update()
    for face in cap:
        face.material_index = 1
        face.smooth = False
        for loop in face.loops:
            loop[mesh.loops.layers.float_vector["preserved_normal"]] = face.normal
    bmesh.ops.triangulate(mesh, faces=list(mesh.faces))
    cap_counts[name] = sum(f.material_index == 1 for f in mesh.faces)
    if any(e.is_boundary for e in mesh.edges):
        edge_set = [e for e in mesh.edges if e.is_boundary]
        degree = Counter(v for e in edge_set for v in e.verts)
        print("CAP_DIAGNOSTIC", name, len(edge_set), dict(Counter(degree.values())),
              [tuple(v.co) for v, n in degree.items() if n != 2][:10], flush=True)
    bad = Counter(len(e.link_faces) for e in mesh.edges if not e.is_manifold)
    assert not bad, f"Nonmanifold or uncapped part: {name}: {bad}"

# Named surface patches retain the original likeness and atlas. They do not
# create eyeballs, eyelids, teeth, a mouth cavity or facial morph targets.
features = {}
for face in head.faces:
    if face.material_index == 1:
        continue
    p = face.calc_center_median()
    dark = max(color(face, head)) < .34
    side = "L" if p.x > 0 else "R"
    feature = None
    if dark and .606 < p.y < .679 and .024 < abs(p.x) < .093 and p.z > .075:
        feature = "eye." + side
    elif dark and .684 < p.y < .73 and .025 < abs(p.x) < .115 and p.z > .075:
        feature = "brow." + side
    elif dark and .549 < p.y < .581 and abs(p.x) < .078 and p.z > .10:
        feature = "moustache"
    elif .524 < p.y < .552 and abs(p.x) < .062 and p.z > .115:
        feature = "mouth"
    elif dark and p.y < .524 and abs(p.x) < .09 and p.z > .025:
        feature = "beard"
    elif abs(p.x) < .027 and .575 < p.y < .65 and p.z > .149:
        feature = "nose"
    elif dark and (p.y > .735 or (abs(p.x) > .115 and p.y > .62) or (p.z < -.03 and p.y > .56)):
        feature = "hair"
    if feature:
        features[face] = feature

# Fill little unselected islands completely enclosed by one feature (e.g. the
# white highlights in the oval eyes); do not extract them as separate scraps.
unassigned = set(head.faces) - features.keys()
while unassigned:
    first = unassigned.pop()
    group, queue, borders = {first}, [first], set()
    while queue:
        f = queue.pop()
        for e in f.edges:
            for other in e.link_faces:
                if other in features:
                    borders.add(features[other])
                elif other in unassigned:
                    unassigned.remove(other)
                    group.add(other)
                    queue.append(other)
    if len(group) < 600 and len(borders) == 1:
        for face in group:
            features[face] = next(iter(borders))

feature_names = sorted(set(features.values()))
for name in feature_names:
    key = "face." + name
    faces = {f for f, label in features.items() if label == name}
    parts[key] = subset(head, faces)
    pivots[key] = sum((f.calc_center_median() for f in faces), Vector()) / len(faces)
    parents[key] = "head"
parts["head"] = subset(head, set(head.faces) - features.keys())
head.free()

root = bpy.data.objects.new("ArticulationStudy", None)
bpy.context.collection.objects.link(root)
conversion = source.matrix_world.to_3x3()
joints = {}
report_parts = []
for name in parts:
    joint = bpy.data.objects.new("joint." + name, None)
    joint.empty_display_type = "PLAIN_AXES"
    joint["joint_id"] = name
    joint.empty_display_size = .035
    bpy.context.collection.objects.link(joint)
    parent = parents[name]
    joint.parent = joints[parent] if parent else root
    joint.location = conversion @ (pivots[name] - (pivots[parent] if parent else Vector()))
    joints[name] = joint
    mesh = parts[name]
    mesh.normal_update()
    for v in mesh.verts:
        v.co = conversion @ (v.co - pivots[name])
    data = bpy.data.meshes.new(name)
    mesh.to_mesh(data)
    normals = [tuple((conversion @ loop[mesh.loops.layers.float_vector["preserved_normal"]]).normalized())
               for face in mesh.faces for loop in face.loops]
    data.normals_split_custom_set(normals)
    data.materials.append(material)
    data.materials.append(interior["skin" if name in ["head", "neck"] or name.startswith(("hand.", "face.")) else "cloth"])
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.parent = joint
    obj["part_id"] = name
    obj["kind"] = "surface-patch" if name.startswith("face.") else "rigid-part"
    # Surface normals stay continuous across rest seams; new cut interiors flat.
    for polygon in data.polygons:
        polygon.use_smooth = polygon.material_index == 0
    report_parts.append({"id": name, "parent": parent, "pivot": list(pivots[name]),
                         "triangles": len(data.polygons), "kind": obj["kind"],
                         "cut_triangles": cap_counts.get(name, 0)})
    mesh.free()

bpy.data.objects.remove(source, do_unlink=True)
for img in bpy.data.images:
    if img.type == "IMAGE" and img.size[0]:
        img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "separated-study.blend"))
runtime = ROOT / "public/character/articulation-study.glb"
bpy.ops.export_scene.gltf(
    filepath=str(runtime), export_format="GLB", export_animations=False,
    export_extras=True, export_image_format="WEBP", export_image_quality=95,
    export_tangents=True, export_draco_mesh_compression_enable=True,
    export_draco_position_quantization=16, export_draco_normal_quantization=12,
    export_draco_texcoord_quantization=16,
)
subprocess.run(["node", str(ROOT / "scripts/character/repair-cut-tangents.cjs"), str(runtime)], check=True, cwd=ROOT)
report = {"version": 1, "source": str(SOURCE.relative_to(ROOT)), "source_sha256": source_hash,
          "runtime": "/character/articulation-study.glb", "runtime_bytes": runtime.stat().st_size,
          "runtime_sha256": hashlib.sha256(runtime.read_bytes()).hexdigest(),
          "method": "closed anatomical cuts, UV-preserving mesh separation, rigid parent pivots",
          "source_triangles": source_faces, "source_exterior_area": source_area,
          "separated_exterior_area": exterior_area,
          "exterior_area_relative_error": abs(exterior_area - source_area) / source_area,
          "body_parts_capped": True, "facial_features_are_surface_patches": True,
          "skinning": False, "morph_targets": False, "parts": report_parts,
          "limitations": ["Rigid joint seams open/intersect in poses; weighting is the next stage.",
                          "Face patches are not eyeballs, eyelids, mouth internals or expressions.",
                          "No individual finger articulation. Homepage rig is unchanged."]}
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
(ROOT / "content/character-articulation.json").write_text(json.dumps(report, indent=2) + "\n")
(ROOT / "docs/design/articulation/preparation.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2), flush=True)

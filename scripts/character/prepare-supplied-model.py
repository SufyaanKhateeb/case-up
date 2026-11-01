"""Prepare a supplied textured GLB without altering the original.

blender -b --disable-autoexec --python this.py -- --input generated_model.glb
UVs and PBR material connections are retained. The output is an unrigged asset.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import bpy

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input", type=Path, default=root / "generated_model.glb")
parser.add_argument("--output", type=Path, default=root / "public/character/sufyaan-textured.glb")
parser.add_argument("--faces", type=int, default=100000)
parser.add_argument("--texture-size", type=int, default=2048)
parser.add_argument("--texture-format", choices=("AUTO", "WEBP"), default="WEBP")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
if args.input.resolve() == args.output.resolve():
    parser.error("Choose a different output to preserve the original model.")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(args.input.resolve()))
objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
source_faces = sum(len(obj.data.polygons) for obj in objects)
for obj in objects:
    if obj.data.shape_keys or any(modifier.type == "ARMATURE" for modifier in obj.modifiers):
        raise ValueError("This pipeline expects an unrigged model; preserve rigged assets separately.")
    if source_faces > args.faces:
        modifier = obj.modifiers.new("Web polygon budget", "DECIMATE")
        modifier.ratio = args.faces / source_faces
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
images = []
for image in bpy.data.images:
    # Imported packed images load lazily: has_data is false until size/pixels
    # are accessed. Skipping those would silently keep every original 4K map.
    if image.type != "IMAGE" or not image.size[0]:
        continue
    original = tuple(image.size)
    factor = min(1, args.texture_size / max(original))
    if factor < 1:
        image.scale(max(1, round(original[0] * factor)), max(1, round(original[1] * factor)))
        image.pack()
    images.append({"name": image.name, "original": original, "optimized": tuple(image.size)})
args.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(args.output.resolve()), export_format="GLB",
    export_animations=False, export_image_format=args.texture_format,
    export_image_quality=95,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=14,
)
report = {
    "source": args.input.name,
    "source_sha256": hashlib.sha256(args.input.read_bytes()).hexdigest(),
    "source_bytes": args.input.stat().st_size,
    "source_triangles": source_faces,
    "output": str(args.output.relative_to(root)),
    "output_bytes": args.output.stat().st_size,
    "output_triangles": sum(len(obj.data.polygons) for obj in objects),
    "images": images,
    "rigged": False,
    "compression": "KHR_draco_mesh_compression",
    "texture_format": args.texture_format,
    "texture_quality": 95,
}
report_path = root / "docs/design/hunyuan/supplied-model.json"
report_path.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2), flush=True)

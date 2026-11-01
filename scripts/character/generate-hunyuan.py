"""Generate a character study using Tencent's hosted Hunyuan3D demos.

Install gradio_client in a separate Python environment. This is an offline asset
authoring command; the portfolio never calls a generation service at runtime.
The input image is uploaded to the named Hugging Face Space when this runs.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, default=root / "docs/design/hunyuan/character-reference.png")
    parser.add_argument("--output", type=Path, default=root / "artifacts/character/hunyuan")
    parser.add_argument("--seed", type=int, default=1234)
    parser.add_argument("--shape-only", action="store_true")
    parser.add_argument("--multiview", type=Path, help="Directory containing front.png, left.png, back.png and right.png; uses Hunyuan3D-2mv for geometry.")
    args = parser.parse_args()
    references = {view: args.multiview / f"{view}.png" for view in ("front", "back", "left", "right")} if args.multiview else {"image": args.image}
    for reference in references.values():
        if not reference.is_file():
            parser.error(f"Reference image does not exist: {reference}")
    args.output.mkdir(parents=True, exist_ok=True)
    manifest_path = args.output / "generation.json"
    if manifest_path.exists():
        parser.error("Output already contains a generation. Choose another --output directory.")

    from gradio_client import Client, handle_file

    space = "tencent/Hunyuan3D-2mv" if args.multiview else "tencent/Hunyuan3D-2.1"
    shape_only = args.shape_only or bool(args.multiview)
    endpoint = "/shape_generation" if shape_only else "/generation_all"
    steps = 5 if args.multiview else 30
    metadata = {
        "model": space,
        "endpoint": endpoint,
        "references_sha256": {view: hashlib.sha256(path.read_bytes()).hexdigest() for view, path in references.items()},
        "seed": args.seed,
        "steps": steps,
        "guidance_scale": 5,
        "octree_resolution": 256,
        "num_chunks": 8000,
        "status": "submitted",
    }
    manifest_path.write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Submitting {len(references)} reference(s) to {space}{endpoint}", flush=True)
    try:
        client = Client(space, download_files=str(args.output / "downloads"), verbose=False)
        inputs = {"image": None, **{f"mv_image_{view}": None for view in ("front", "back", "left", "right")}}
        for view, path in references.items():
            inputs[f"mv_image_{view}" if args.multiview else "image"] = handle_file(str(path.resolve()))
        if args.multiview:
            inputs["caption"] = None
        result = client.predict(**inputs, steps=steps, guidance_scale=5, seed=args.seed,
            octree_resolution=256, check_box_rembg=False, num_chunks=8000,
            randomize_seed=False, api_name=endpoint)
        metadata["status"] = "downloaded"
        count = 1 if shape_only else 2
        files = []
        for i, source in enumerate(result[:count]):
            if not source:
                continue
            # Gradio can wrap FileData in a component-update response.
            while isinstance(source, dict):
                if "value" in source:
                    source = source["value"]
                elif "path" in source:
                    source = source["path"]
                else:
                    raise RuntimeError("Unexpected downloadable-file response from the demo.")
            source = Path(source)
            label = "shape" if i == 0 else "textured"
            destination = args.output / (label + source.suffix)
            shutil.copy2(source, destination)
            files.append(destination.name)
        if not files:
            raise RuntimeError("The demo returned no downloadable model files.")
        metadata.update(status="generated", files=files, stats=result[-2], seed=result[-1])
        print("Generated: " + ", ".join(files), flush=True)
    except Exception as error:
        metadata.update(status="file_processing_failed" if metadata["status"] == "downloaded" else "failed", error=str(error))
        raise
    finally:
        manifest_path.write_text(json.dumps(metadata, indent=2) + "\n")


if __name__ == "__main__":
    main()

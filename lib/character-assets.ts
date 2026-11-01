import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

/** The decoder ships locally with the app; model loading needs no external CDN. */
export function createCharacterAssetLoader() {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/character/draco/");
  draco.setDecoderConfig({ type: "wasm" });
  draco.setWorkerLimit(1);
  return { loader: new GLTFLoader().setDRACOLoader(draco), dispose: () => draco.dispose() };
}

/** GLTFLoader's ImageBitmaps need explicit closing as well as GPU disposal. */
export function disposeCharacterAsset(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>(), bitmaps = new Set<ImageBitmap>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => {
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) bitmaps.add(texture.source.data);
    texture.dispose();
  });
  bitmaps.forEach((bitmap) => bitmap.close());
}

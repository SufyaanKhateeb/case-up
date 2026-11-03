import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { disposeCharacterAsset } from "../lib/character-assets";

test("a loaded asset releases shared geometry, textures and decoded bitmaps once", () => {
  class Bitmap { closes = 0; close() { this.closes++; } }
  const original = Object.getOwnPropertyDescriptor(globalThis, "ImageBitmap");
  Object.defineProperty(globalThis, "ImageBitmap", { configurable: true, value: Bitmap });
  try {
    const bitmap = new Bitmap(), first = new THREE.Texture(), second = new THREE.Texture();
    first.source.data = second.source.data = bitmap;
    const material = new THREE.MeshStandardMaterial({ map: first, roughnessMap: second, metalnessMap: second });
    const geometry = new THREE.BoxGeometry(), root = new THREE.Group();
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    const counts = new Map<object, number>();
    for (const resource of [geometry, material, first, second]) resource.addEventListener("dispose", () => counts.set(resource, (counts.get(resource) ?? 0) + 1));
    disposeCharacterAsset(root);
    for (const resource of [geometry, material, first, second]) assert.equal(counts.get(resource), 1);
    assert.equal(bitmap.closes, 1);
  } finally {
    if (original) Object.defineProperty(globalThis, "ImageBitmap", original);
    else Reflect.deleteProperty(globalThis, "ImageBitmap");
  }
});

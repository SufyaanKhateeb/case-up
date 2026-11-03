import * as THREE from "three";

/** Small deterministic surface maps; no remote textures or image loading. */
export function detailMap(kind: "hair" | "skin" | "fabric") {
  const size = 128, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const noise = ((Math.imul(x + 13, 374761393) ^ Math.imul(y + 7, 668265263)) >>> 0) % 256 / 255;
    const value = kind === "hair" ? .5 + .28 * Math.sin(x * Math.PI * .72 + .65 * Math.sin(y * .09)) + noise * .15
      : kind === "fabric" ? .45 + .16 * Math.sin((x + y) * 2.1) + .13 * Math.cos((x - y) * 2.1) + noise * .1 : .4 + noise * .2;
    const i = (y * size + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = THREE.MathUtils.clamp(value * 255, 0, 255); pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true;
  texture.repeat.set(...(kind === "skin" ? [8, 8] : kind === "fabric" ? [12, 12] : [1, 2]) as [number, number]);
  texture.needsUpdate = true; return texture;
}

export const characterLighting = { sky: "#fff0de", ground: "#b29b87", hemisphere: 1, key: 3.2, fill: .55, rim: 1.1 };

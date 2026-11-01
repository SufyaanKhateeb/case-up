import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { characterRenderWindow } from "../lib/character-render";

test("badge camera crop and color UVs agree, including a badge dragged across the viewport edge", () => {
  const width = 1440, height = 900;
  for (const [x, y] of [[80, 800], [12, 24], [1450, 910]]) {
    const crop = characterRenderWindow(x, y, 42, width, height)!;
    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 4000);
    camera.position.set(width / 2, -height / 2, 2000);
    camera.lookAt(width / 2, -height / 2, 0);
    camera.setViewOffset(width, height, crop.left, crop.top, crop.diameter, crop.diameter);
    camera.updateMatrixWorld();
    for (const [dx, dy] of [[0, 0], [21, -21], [-21, 21]]) {
      const position = new THREE.Vector3(x + dx, -y - dy, 0).project(camera);
      const u = ((x + dx) / width - crop.sourceRect[0]) / crop.sourceRect[2];
      const v = ((height - y - dy) / height - crop.sourceRect[1]) / crop.sourceRect[3];
      assert.ok(Math.abs(u - (position.x + 1) / 2) < 1e-10);
      assert.ok(Math.abs(v - (position.y + 1) / 2) < 1e-10);
    }
  }
  assert.equal(characterRenderWindow(100, 100, 10000, width, height), null);
});

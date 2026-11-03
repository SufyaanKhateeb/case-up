import * as THREE from "three";
import type { CharacterRig } from "./model";

// Landmarks measured on the approved model, in its original glTF coordinates.
// Compact, smooth masks preserve the nose, jaw, neck, hair and clothing.
export const facialLandmarks = {
  eyes: [[-.060, .647], [.048, .647]] as const,
  brows: [[-.063, .709], [.050, .709]] as const,
  mouth: [-.006, .547] as const,
};
export const expressionTargets = ["Blink", "WideEyes", "BrowLeft", "BrowRight", "Smile", "Surprise"] as const;
const smooth = THREE.MathUtils.smoothstep;
const clamp = (value: number, low = 0, high = 1) => Number.isFinite(value) ? THREE.MathUtils.clamp(value, low, high) : 0;
function mask(x: number, y: number, z: number, cx: number, cy: number, rx: number, ry: number) {
  const radius = Math.hypot((x - cx) / rx, (y - cy) / ry);
  return (1 - smooth(radius, 1, 1.45)) * smooth(z, .085, .11);
}

/** Small relative blendshapes on the original surface; no floating face overlays. */
export function createFacialExpressions(mesh: THREE.SkinnedMesh) {
  const geometry = mesh.geometry, points = geometry.getAttribute("position");
  const targets = expressionTargets.map(() => new Float32Array(points.count * 3));
  for (let index = 0; index < points.count; index++) {
    const x = points.getX(index), y = points.getY(index), z = points.getZ(index), offset = index * 3;
    if (y < .525 || y > .755 || z < .085) continue;
    for (const [cx, cy] of facialLandmarks.eyes) {
      const influence = mask(x, y, z, cx, cy, .021, .034);
      targets[0][offset + 1] -= (y - cy) * .94 * influence;
      targets[1][offset + 1] += (y - cy) * .12 * influence;
    }
    facialLandmarks.brows.forEach(([cx, cy], side) => {
      const influence = mask(x, y, z, cx, cy, .037, .013);
      targets[2 + side][offset + 1] = (.007 + (x - cx) * (side ? -.06 : .06)) * influence;
    });
    const [mx, my] = facialLandmarks.mouth;
    const influence = mask(x, y, z, mx, my, .052, .011);
    const corner = smooth(Math.abs(x - mx), .012, .045);
    targets[4][offset] = (x - mx) * .07 * influence;
    targets[4][offset + 1] = .004 * corner * influence;
    targets[5][offset] = -(x - mx) * .20 * influence;
    targets[5][offset + 1] = (y - my) * .65 * influence;
  }
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = targets.map((values, index) => {
    const attribute = new THREE.Float32BufferAttribute(values, 3); attribute.name = expressionTargets[index]; return attribute;
  });
  mesh.updateMorphTargets();
  return {
    sync(face: CharacterRig["face"], mouth: CharacterRig["mouth"], renderedEyeOpen: number) {
      const weights = mesh.morphTargetInfluences!;
      const blink = clamp(1 - renderedEyeOpen + face.happy * .12);
      weights[0] = blink;
      weights[1] = clamp((face.eyeWide - 1) / .18) * (1 - blink);
      weights[2] = clamp(face.browLeft / .15, -.45, 1);
      weights[3] = clamp(face.browRight / .15, -.45, 1);
      weights[4] = clamp(face.happy * .85);
      weights[5] = clamp((mouth.open - .045) / .215 + mouth.chatter * .18) * (1 - clamp(face.happy));
    },
  };
}

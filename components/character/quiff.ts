import * as THREE from "three";
import { facePoint, sweptGeometry } from "./sculpt";

/** A fitted, scalloped hairline with overlapping sculpted waves and fine ridges. */
export function createQuiff(material: THREE.Material) {
  const group = new THREE.Group(); group.name = "SweptQuiff";
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const around = 128, rows = 48;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let j = 0; j <= around; j++) {
      const yaw = j / around * Math.PI * 2;
      const angle = Math.abs(Math.atan2(Math.sin(yaw), Math.cos(yaw)));
      const temple = THREE.MathUtils.smoothstep(angle, .88, 1.28);
      const hairline = THREE.MathUtils.lerp(.95 + .025 * Math.cos(yaw * 9), -.29, temple) - .15 * THREE.MathUtils.smoothstep(angle, 1.7, 2.8);
      const y = THREE.MathUtils.lerp(hairline, 1.4, t);
      const p = facePoint(yaw, Math.asin(THREE.MathUtils.clamp(y / 1.4, -1, 1)), .035);
      p.y += .12 * t * t;
      positions.push(...p.toArray()); uvs.push(j / around, t);
      if (row < rows && j < around) { const a = row * (around + 1) + j, b = a + around + 1; indices.push(a, a + 1, b, b, a + 1, b + 1); }
    }
  }
  const capGeometry = new THREE.BufferGeometry(); capGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  capGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); capGeometry.setIndex(indices); capGeometry.computeVertexNormals();
  group.add(new THREE.Mesh(capGeometry, material));
  const lock = (points: number[][], width: number, depth: number) => {
    const geometry = sweptGeometry(points, width, depth, .018);
    geometry.scale(1, .7, 1); geometry.translate(0, .59, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "SculptedHairWave"; group.add(mesh);
  };
  // Back layers sit under the broad frontal sweep instead of repeating its silhouette.
  lock([[-.8, 1.15, -.3], [-.5, 1.65, -.1], [0, 1.81, -.2], [.16, 2.08, -.5]], .26, .22);
  lock([[-.2, 1.38, -.4], [.2, 1.7, -.3], [.65, 1.78, -.48], [.95, 2, -.65]], .25, .2);
  lock([[-1.06, .5, .12], [-1.05, 1.13, .2], [-.69, 1.65, .05], [-.3, 1.72, -.48]], .32, .29);
  lock([[-.7, 1.1, .08], [-.3, 1.58, .29], [.18, 1.75, .03], [.45, 1.79, -.47]], .36, .3);
  lock([[-1.05, .41, .77], [-1.12, 1.02, .93], [-.7, 1.48, .74], [-.25, 1.78, .06]], .29, .22);
  lock([[-.98, .78, 1.05], [-.5, 1.16, 1.25], [.26, 1.42, 1.01], [.6, 1.86, .43]], .4, .29);
  lock([[-.45, .85, 1.18], [.26, 1.05, 1.32], [.92, 1.2, 1.01], [1.14, 1.63, .48]], .34, .27);
  lock([[.44, .62, 1.03], [1.02, .75, .99], [1.34, 1.04, .53], [1.42, 1.34, .12]], .26, .23);
  return group;
}

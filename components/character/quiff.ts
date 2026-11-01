import * as THREE from "three";

/** Broad swept locks, tapering into lifted tips rather than a ball of curls. */
export function createQuiff(material: THREE.Material) {
  const group = new THREE.Group();
  group.name = "SweptQuiff";
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.425, 48, 32, 0, Math.PI * 2, 0, 1.65), material);
  cap.rotation.x = -.57;
  group.add(cap);

  const lock = (points: number[][], width: number, depth: number) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const steps = 36, sides = 16;
    const frames = curve.computeFrenetFrames(steps, false);
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, center = curve.getPointAt(t);
      const taper = Math.max(.003, Math.sin(Math.PI * Math.pow(t, .68)) ** .65);
      for (let j = 0; j <= sides; j++) {
        const angle = j / sides * Math.PI * 2;
        const point = center.clone()
          .addScaledVector(frames.normals[i], Math.cos(angle) * width * taper)
          .addScaledVector(frames.binormals[i], Math.sin(angle) * depth * taper);
        vertices.push(...point.toArray());
        if (i < steps && j < sides) {
          const a = i * (sides + 1) + j, b = a + sides + 1;
          indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "SweptHairLock";
    group.add(mesh);
  };
  // Overlapping sections form a continuous side part and an asymmetric crest.
  lock([[-1.18, .65, .65], [-1.05, 1.2, .78], [-.55, 1.6, .52], [.05, 1.7, .05]], .3, .28);
  lock([[-1.08, .9, .98], [-.7, 1.38, 1.03], [-.12, 1.7, .77], [.42, 1.91, .32]], .36, .29);
  lock([[-.65, .99, 1.12], [-.05, 1.35, 1.22], [.52, 1.55, 1.03], [.78, 1.92, .61]], .38, .32);
  lock([[-.12, 1, 1.16], [.45, 1.22, 1.2], [1.02, 1.32, .96], [1.22, 1.66, .51]], .32, .3);
  lock([[.48, .85, 1.08], [.97, .98, 1.01], [1.35, 1.07, .63], [1.48, 1.4, .14]], .27, .26);
  return group;
}

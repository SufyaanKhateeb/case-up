import * as THREE from "three";

/** Relaxed crew neck with a straight body, rounded shoulders, and printed star. */
export function createSweatshirt(color: string) {
  const group = new THREE.Group();
  group.name = "ShootingStarSweatshirt";
  const fabric = new THREE.MeshStandardMaterial({ color, roughness: .92 });
  const ribbing = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(.9), roughness: .95 });
  const profile = new THREE.SplineCurve([
    [0, -1.85], [1.08, -1.85], [1.22, -1.73], [1.26, -1.48],
    [1.27, .5], [1.28, 1.45], [1.32, 1.95], [1.3, 2.18],
    [1.16, 2.4], [.94, 2.53], [.66, 2.66], [.5, 2.7],
  ].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(80);
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), fabric);
  torso.name = "SweatshirtTorso";
  torso.scale.z = .62;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.49, .09, 12, 40).rotateX(Math.PI / 2).scale(1, 1, .82), ribbing);
  collar.position.y = 2.73;
  const collarSeam = new THREE.Mesh(new THREE.TorusGeometry(.55, .018, 6, 40).rotateX(Math.PI / 2).scale(1, 1, .82), ribbing);
  collarSeam.position.y = 2.69;
  const ribPath = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => {
    const angle = i / 8 * Math.PI;
    return new THREE.Vector3(.49 + .092 * Math.cos(angle), 2.73 + .092 * Math.sin(angle), 0);
  }));
  const collarRibs = new THREE.InstancedMesh(new THREE.TubeGeometry(ribPath, 12, .004, 4, false), ribbing, 64);
  collarRibs.scale.z = .82;
  for (let i = 0; i < 64; i++) collarRibs.setMatrixAt(i, new THREE.Matrix4().makeRotationY(i / 64 * Math.PI * 2));

  // The favicon silhouette, with rounded corners simplified at embroidery size.
  const star = new THREE.Shape([
    [4.49, 21.48], [8.57, 17.15], [7.91, 10.95], [12.93, 15.46],
    [28.66, 9.75], [15.45, 19.25], [16.1, 25.4], [11.23, 21.02],
  ].map(([x, y]) => new THREE.Vector2((x - 16) * .022, (17 - y) * .022)));
  const emblemGeometry = new THREE.ShapeGeometry(star);
  const positions = emblemGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) + .53, y = positions.getY(i) + 1.95;
    const above = profile.findIndex((point) => point.y >= y);
    const a = profile[Math.max(0, above - 1)], b = profile[Math.max(0, above)];
    const radius = THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
    positions.setXYZ(i, x, y, Math.sqrt(Math.max(0, radius * radius - x * x)) * .62 + .016);
  }
  emblemGeometry.computeVertexNormals();
  const emblem = new THREE.Mesh(emblemGeometry, new THREE.MeshBasicMaterial({ color: "#111210", side: THREE.DoubleSide }));
  emblem.name = "ShootingStarChestEmblem";
  group.add(torso, collar, collarSeam, collarRibs, emblem);
  return { group, fabric, ribbing };
}

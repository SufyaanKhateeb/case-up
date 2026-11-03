import * as THREE from "three";

/** Compact over-ear headphones resting around the collar, leaving the quiff free. */
export function createHeadphones() {
  const headphones = new THREE.Group(); headphones.name = "CollarHeadphones";
  const charcoal = new THREE.MeshStandardMaterial({ color: "#23292c", roughness: .72 });
  const cushion = new THREE.MeshStandardMaterial({ color: "#111618", roughness: .94 });
  const cream = new THREE.MeshStandardMaterial({ color: "#e9e5d9", roughness: .55 });
  const blue = new THREE.MeshStandardMaterial({ color: "#365de6", roughness: .45 });
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.65, -.05, .75), new THREE.Vector3(-.91, .12, .2),
    new THREE.Vector3(-.7, .35, -.48), new THREE.Vector3(0, .4, -.65),
    new THREE.Vector3(.7, .35, -.48), new THREE.Vector3(.91, .12, .2), new THREE.Vector3(.65, -.05, .75),
  ]);
  headphones.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .075, 10, false), charcoal));
  const shellShape = new THREE.Shape();
  shellShape.absellipse(0, 0, .225, .305, 0, Math.PI * 2, false, 0);
  const shellGeometry = new THREE.ExtrudeGeometry(shellShape, { depth: .15, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3, curveSegments: 10 });
  const padGeometry = new THREE.SphereGeometry(1, 16, 12);
  for (const side of [-1, 1]) {
    const cup = new THREE.Group(); cup.position.set(side * .66, -.12, .76); cup.rotation.set(.05, side * .2, -side * .16);
    const pad = new THREE.Mesh(padGeometry, cushion); pad.scale.set(.25, .34, .12); pad.position.z = -.055;
    const shell = new THREE.Mesh(shellGeometry, charcoal);
    const trim = new THREE.Mesh(shellGeometry, cream); trim.scale.set(1.06, 1.04, .7); trim.position.z = -.06;
    const accent = new THREE.Mesh(new THREE.BoxGeometry(.12, .025, .012), blue); accent.position.set(0, -.13, .195);
    cup.add(pad, trim, shell, accent); headphones.add(cup);
  }
  return headphones;
}

import * as THREE from "three";

/** Thick Wayfarer-style frames, opaque smoked lenses, and smart-glasses temples. */
export function createSunglasses() {
  const glasses = new THREE.Group();
  glasses.name = "WayfarerSunglasses";
  const frameMaterial = new THREE.MeshStandardMaterial({ color: "#08090b", roughness: .38 });
  const lensMaterial = new THREE.MeshBasicMaterial({ color: "#10191a", side: THREE.DoubleSide });
  const reflectionMaterial = new THREE.MeshBasicMaterial({ color: "#647672", side: THREE.DoubleSide });
  const cameraMaterial = new THREE.MeshBasicMaterial({ color: "#020304" });
  const metalMaterial = new THREE.MeshStandardMaterial({ color: "#7b8586", roughness: .3, metalness: .6 });

  function outline(inset = false) {
    const shape = new THREE.Shape();
    shape.moveTo(-.4, .32);
    shape.quadraticCurveTo(-.5, .32, -.48, .2);
    shape.lineTo(-.4, -.23);
    shape.quadraticCurveTo(-.37, -.34, -.26, -.34);
    shape.lineTo(.26, -.34);
    shape.quadraticCurveTo(.37, -.34, .4, -.23);
    shape.lineTo(.48, .2);
    shape.quadraticCurveTo(.5, .32, .4, .32);
    shape.closePath();
    if (!inset) return shape;
    return new THREE.Shape(shape.getPoints(14).map((point) => new THREE.Vector2(point.x * .77, point.y * .76)));
  }
  const rim = outline();
  rim.holes.push(new THREE.Path(outline(true).getPoints(14)));
  const rimGeometry = new THREE.ExtrudeGeometry(rim, { depth: .105, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 2, curveSegments: 14 });
  const lensGeometry = new THREE.ShapeGeometry(outline(true), 14);
  const reflection = new THREE.Shape();
  reflection.moveTo(-.27, .17); reflection.lineTo(-.19, .19);
  reflection.lineTo(-.3, -.08); reflection.lineTo(-.34, -.03); reflection.closePath();
  const reflectionGeometry = new THREE.ShapeGeometry(reflection);

  for (const side of [-1, 1]) {
    const mount = new THREE.Group();
    mount.rotation.set(.05, side * .34, 0, "YXZ");
    const lens = new THREE.Group(); lens.position.z = 1.55;
    const frame = new THREE.Mesh(rimGeometry, frameMaterial);
    const tint = new THREE.Mesh(lensGeometry, lensMaterial); tint.position.z = .095;
    const glint = new THREE.Mesh(reflectionGeometry, reflectionMaterial); glint.position.z = .098;
    const cameraRim = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .026, 16).rotateX(Math.PI / 2), metalMaterial);
    cameraRim.position.set(side * .435, .22, .135);
    const camera = new THREE.Mesh(new THREE.CircleGeometry(.035, 16), cameraMaterial);
    camera.position.copy(cameraRim.position); camera.position.z += .015;
    lens.add(frame, tint, glint, cameraRim, camera); mount.add(lens); glasses.add(mount);

    const temple = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * .96, .14, 1.35),
      new THREE.Vector3(side * 1.23, .12, 1.05),
      new THREE.Vector3(side * 1.4, .04, .45),
      new THREE.Vector3(side * 1.36, -.13, -.02),
    ]);
    glasses.add(new THREE.Mesh(new THREE.TubeGeometry(temple, 20, .065, 8, false), frameMaterial));
  }
  const bridge = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.15, -.035, 1.59), new THREE.Vector3(0, .015, 1.63), new THREE.Vector3(.15, -.035, 1.59),
  ]);
  glasses.add(new THREE.Mesh(new THREE.TubeGeometry(bridge, 12, .06, 8, false), frameMaterial));
  return glasses;
}

import * as THREE from "three";
import { createSunglasses } from "./sunglasses";
import { createSweatshirt } from "./sweatshirt";
import { createQuiff } from "./quiff";

/** Sufyaan likeness on the articulated rig reconstructed from the sebg.ch mascot.
 * Source/provenance: docs/CHARACTER-REFERENCE.md. No remote scripts run in the app.
 */
export const HEAD_RADIUS = 1.4;
export const NECK_HEIGHT = 2.8;
export const HEAD_HEIGHT = 4.55;

export type HandPose = "relaxed" | "open" | "point" | "thumb" | "peace";
export type MouthPose = "smile" | "laugh" | "open" | "flat" | "oh" | "yawn";
export const mouths = {
  smile: { width: .36, open: .065, smile: .13 },
  laugh: { width: .42, open: .34, smile: .1 },
  open: { width: .27, open: .32, smile: .03 },
  flat: { width: .16, open: .04, smile: -.02 },
  oh: { width: .17, open: .26, smile: -.05 },
  yawn: { width: .24, open: .36, smile: -.02 },
};
export const hands = {
  relaxed: { fingers: [.25, .3, .35, .4], thumb: [.4, .2] },
  open: { fingers: [0, 0, .03, .06], thumb: [1, 0] },
  point: { fingers: [0, 1, 1, 1], thumb: [.35, .9] },
  thumb: { fingers: [1, 1, 1, 1], thumb: [1.5, 0] },
  peace: { fingers: [0, 0, 1, 1], thumb: [.35, .9] },
};
export type CharacterLook = {
  hair: "curly" | "straight" | "quiff";
  beard: boolean;
  colors: { skin: string; hair: string; beard: string; sweater: string; ink: string; paper: string };
};
export type Arm = {
  mount: THREE.Group;
  shoulder: THREE.Group;
  elbow: THREE.Group;
  wrist: THREE.Group;
  fingers: { knuckle: THREE.Group; joint: THREE.Group }[];
  thumb: THREE.Group;
  thumbJoint: THREE.Group;
};

function surface(yaw: number, pitch: number, radius = HEAD_RADIUS) {
  return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(radius);
}
function anchor(yaw: number, pitch: number) {
  const group = new THREE.Group();
  group.rotation.set(-pitch, yaw, 0, "YXZ");
  return group;
}

export function createCharacter(look: CharacterLook) {
  const { MathUtils: math } = THREE;
  const root = new THREE.Group();
  const body = new THREE.Group();
  const neck = new THREE.Group();
  const headTilt = new THREE.Group();
  const head = new THREE.Group();
  root.name = "SufyaanCharacter";
  root.rotation.order = "ZYX";
  root.add(body); body.add(neck); neck.add(headTilt); headTilt.add(head);
  neck.position.y = NECK_HEIGHT;
  head.position.y = HEAD_HEIGHT - NECK_HEIGHT;
  head.scale.set(.89, 1.09, .95);

  const skin = new THREE.MeshStandardMaterial({ color: look.colors.skin, roughness: .55 });
  const skinTint = new THREE.MeshStandardMaterial({ color: look.colors.skin, roughness: .55, vertexColors: true });
  const neckMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.colors.skin).multiplyScalar(.82), roughness: .6 });
  const hair = new THREE.MeshStandardMaterial({ color: look.colors.hair, roughness: .88 });
  const sweatshirt = createSweatshirt(look.colors.sweater);
  const sweater = sweatshirt.fabric;
  const cuffs = skin;
  const dialMaterial = new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: .5 });
  const dark = new THREE.MeshStandardMaterial({ color: "#1c1c1c", roughness: .4 });
  const black = new THREE.MeshBasicMaterial({ color: "#000000" });
  const white = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const fingerGeometry = new THREE.CapsuleGeometry(.085, .12, 4, 10);
  const blob = (material: THREE.Material, scale: [number, number, number]) => {
    const mesh = new THREE.Mesh(sphere, material); mesh.scale.set(...scale); return mesh;
  };

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(.42, .46, 1.1, 24), neckMaterial);
  neckMesh.position.y = .5;
  neck.add(neckMesh);
  body.add(sweatshirt.group);

  const faceGeometry = new THREE.SphereGeometry(HEAD_RADIUS, 64, 48);
  const cheekDirections = [surface(.62, -.32, 1), surface(-.62, -.32, 1)];
  const vector = new THREE.Vector3();
  const faceColors: number[] = [];
  for (let index = 0; index < faceGeometry.attributes.position.count; index++) {
    vector.fromBufferAttribute(faceGeometry.attributes.position, index).normalize();
    const blush = Math.max(...cheekDirections.map((direction) => math.clamp(1 - vector.distanceTo(direction) / .34, 0, 1))) ** 2;
    faceColors.push(1 - blush * .06, 1 - blush * .22, 1 - blush * .2);
  }
  faceGeometry.setAttribute("color", new THREE.Float32BufferAttribute(faceColors, 3));
  head.add(new THREE.Mesh(faceGeometry, skinTint));
  const bridge = blob(skin, [.12, .29, .16]);
  bridge.position.set(0, -.12, HEAD_RADIUS + .015);
  const nose = blob(skin, [.22, .17, .24]);
  nose.position.copy(surface(0, -.25, HEAD_RADIUS + .09));
  head.add(bridge, nose);
  for (const side of [-1, 1]) {
    const ear = blob(skin, [.17, .3, .22]);
    ear.position.set(side * (HEAD_RADIUS - .04), -.24, -.02);
    ear.rotation.y = side * .4;
    head.add(ear);
  }

  const gaze = new THREE.Group();
  const glance = new THREE.Group();
  gaze.rotation.order = glance.rotation.order = "YXZ";
  gaze.add(glance); head.add(gaze);
  const eyes = [1, -1].map((side) => {
    const group = new THREE.Group();
    // Keep the complete eye silhouette above the face, even when flattened
    // for a blink. The old inset clipped the smile arcs into scattered dots.
    group.position.z = HEAD_RADIUS + .025;
    const pupil = blob(black, [.18, .26, .08]);
    const highlight = blob(white, [.04, .045, .016]);
    highlight.position.set(-.055, .095, .075);
    const happy = new THREE.Mesh(new THREE.TorusGeometry(.14, .042, 8, 20, Math.PI * .8).scale(1, 1, .5), black);
    happy.rotation.z = Math.PI * .1; happy.position.y = -.06; happy.visible = false;
    group.add(pupil, highlight, happy); glance.add(anchor(side * .34, -.05).add(group));
    return { group, pupil, highlight, happy };
  });
  const brows = [1, -1].map((side) => {
    const lift = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CapsuleGeometry(.085, .32, 4, 12).rotateZ(Math.PI / 2).scale(1, 1, .55), black);
    bar.position.z = HEAD_RADIUS; bar.rotation.z = side * -.06;
    lift.add(bar); head.add(anchor(side * .36, .31).add(lift));
    return { lift, bar, side };
  });

  const mouthGeometry = new THREE.BufferGeometry();
  mouthGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(17 * 6), 3));
  mouthGeometry.setIndex(Array.from({ length: 16 }, (_, index) => [index * 2, index * 2 + 1, index * 2 + 2, index * 2 + 2, index * 2 + 1, index * 2 + 3]).flat());
  const mouth = { ...mouths.smile, chatter: 0 };
  const updateMouth = () => {
    const positions = mouthGeometry.attributes.position;
    for (let index = 0; index <= 16; index++) {
      const x = index / 16 * 2 - 1;
      const upper = -.65 + mouth.smile * x * x;
      const lower = upper - mouth.open * (1 - mouth.chatter) * Math.sqrt(1 - x * x);
      const top = surface(x * mouth.width / HEAD_RADIUS, upper / HEAD_RADIUS, HEAD_RADIUS + .012);
      const bottom = surface(x * mouth.width / HEAD_RADIUS, lower / HEAD_RADIUS, HEAD_RADIUS + .012);
      positions.setXYZ(index * 2, top.x, top.y, top.z);
      positions.setXYZ(index * 2 + 1, bottom.x, bottom.y, bottom.z);
    }
    positions.needsUpdate = true;
    mouthGeometry.computeBoundingSphere();
  };
  head.add(new THREE.Mesh(mouthGeometry, black));
  updateMouth();

  const curls = new THREE.Group();
  curls.name = "HairVolume";
  head.add(curls);
  if (look.hair === "quiff") curls.add(createQuiff(hair));
  else {
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS * 1.02, 32, 16, 0, Math.PI * 2, 0, look.hair === "curly" ? 1.53 : 1.35), hair);
    hairCap.rotation.x = look.hair === "curly" ? -.83 : -.42;
    curls.add(hairCap);
    if (look.hair === "curly") {
      const axis = new THREE.Vector3(0, 1, 0).applyEuler(hairCap.rotation);
      const threshold = Math.cos(1.53);
      const matrices: THREE.Matrix4[] = [];
      let seed = 7;
      const random = () => { seed = seed * 16807 % 2147483647; return .85 + seed / 2147483647 * .3; };
      for (let index = 0; index < 400; index++) {
        const y = 1 - (index + .5) / 400 * 2;
        const radius = Math.sqrt(1 - y * y);
        const direction = new THREE.Vector3(Math.cos(index * 2.4) * radius, y, Math.sin(index * 2.4) * radius);
        const size = (direction.dot(axis) > threshold ? .1 + .24 * math.smoothstep(direction.y + .25 * direction.z, .1, .6) : 0) * random();
        if (direction.x < 0 || !size) continue;
        direction.multiplyScalar(HEAD_RADIUS - .03 + size * .3);
        matrices.push(new THREE.Matrix4().makeScale(size, size, size).setPosition(direction), new THREE.Matrix4().makeScale(size, size, size).setPosition(-direction.x, direction.y, direction.z));
      }
      const clusters = new THREE.InstancedMesh(sphere, hair, matrices.length);
      matrices.forEach((matrix, index) => clusters.setMatrixAt(index, matrix));
      curls.add(clusters);
    }
  }
  if (look.beard) {
    // Only the chin and lower jaw carry hair; keep the cheeks and lips clear.
    const geometry = new THREE.SphereGeometry(HEAD_RADIUS, 96, 72);
    const skinColor = new THREE.Color(look.colors.skin), beardColor = new THREE.Color(look.colors.beard), color = new THREE.Color();
    const colors: number[] = [];
    for (let index = 0; index < geometry.attributes.position.count; index++) {
      vector.fromBufferAttribute(geometry.attributes.position, index).normalize();
      const yaw = Math.abs(Math.atan2(vector.x, vector.z));
      const pitch = Math.asin(vector.y);
      const chinEdge = -.83 + .12 * math.smoothstep(yaw, .3, .95);
      const weight = (1 - math.smoothstep(pitch, chinEdge - .025, chinEdge + .025)) * (1 - math.smoothstep(yaw, 1.1, 1.4));
      colors.push(...color.lerpColors(skinColor, beardColor, weight).toArray());
      vector.multiplyScalar(HEAD_RADIUS - .012 + weight * .035);
      geometry.attributes.position.setXYZ(index, vector.x, vector.y, vector.z);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    head.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9 })));
    const moustacheMaterial = new THREE.MeshStandardMaterial({ color: look.colors.beard, roughness: .85 });
    for (const side of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * .045, -.505, 1.335),
        new THREE.Vector3(side * .16, -.49, 1.35),
        new THREE.Vector3(side * .3, -.48, 1.315),
        new THREE.Vector3(side * .4, -.545, 1.265),
      ]);
      const moustache = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .055, 8, false), moustacheMaterial);
      moustache.name = "SeparatedMoustache";
      head.add(moustache);
    }
  }

  const arms: Arm[] = [1, -1].map((side) => {
    const mount = new THREE.Group(); mount.scale.x = side;
    const shoulder = new THREE.Group(); shoulder.position.set(1.1, 2.05, 0); shoulder.rotation.order = "ZXY";
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(.34, 1, 6, 16), sweater); upper.position.y = -.5;
    const elbow = new THREE.Group(); elbow.position.y = -1;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .65, 6, 16), sweater); forearm.position.y = -.325;
    const wrist = new THREE.Group(); wrist.position.y = -.9; wrist.rotation.order = "YXZ";
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.31, .29, .19, 24), sweatshirt.ribbing); cuff.position.y = -.06;
    const palm = blob(cuffs, [.3, .33, .19]); palm.position.y = -.36;
    const fingers = [[.2, -.58, 1], [.07, -.63, 1.08], [-.07, -.62, 1], [-.2, -.56, .85]].map(([x, y, length]) => {
      const knuckle = new THREE.Group(); knuckle.position.set(x, y, 0); knuckle.rotation.z = x * .4;
      const upper = new THREE.Mesh(fingerGeometry, cuffs); upper.position.y = -.12 * length; upper.scale.y = length;
      const joint = new THREE.Group(); joint.position.y = -.25 * length;
      const tip = new THREE.Mesh(fingerGeometry, cuffs); tip.position.y = -.1 * length; tip.scale.set(.95, .85 * length, .95);
      joint.add(tip); knuckle.add(upper, joint); return { knuckle, joint };
    });
    const thumb = new THREE.Group(); thumb.position.set(.24, -.22, .06); thumb.rotation.order = "ZXY";
    const thumbUpper = new THREE.Mesh(fingerGeometry, cuffs); thumbUpper.position.y = -.13; thumbUpper.scale.setScalar(1.15);
    const thumbJoint = new THREE.Group(); thumbJoint.position.y = -.27;
    const thumbTip = new THREE.Mesh(fingerGeometry, cuffs); thumbTip.position.y = -.1; thumbTip.scale.set(1.1, .85, 1.1);
    thumbJoint.add(thumbTip); thumb.add(thumbUpper, thumbJoint);
    wrist.add(cuff, palm, thumb, ...fingers.map((finger) => finger.knuckle));
    elbow.add(forearm, wrist); shoulder.add(upper, elbow); mount.add(shoulder); body.add(mount);
    return { mount, shoulder, elbow, wrist, fingers, thumb, thumbJoint };
  });

  const glasses = createSunglasses();
  const hat = new THREE.Group();
  const hatMaterial = new THREE.MeshStandardMaterial({ color: "#8a8a55", emissive: "#2e2e1c", roughness: .9, side: THREE.DoubleSide });
  const hatProfile = [[2.2, .08], [1.62, .45], [1.6, .52], [1.5, 1], [1.25, 1.33], [.75, 1.46], [0, 1.5]].map(([x, y]) => new THREE.Vector2(x, y));
  const crown = new THREE.Mesh(new THREE.LatheGeometry(hatProfile, 48), hatMaterial);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.59, 1.61, .18, 48, 1, true), dark); band.position.y = .62;
  hat.add(crown, band); hat.rotation.x = -.2; hat.position.y = .12;
  head.add(hat, glasses);
  const watch = new THREE.Group();
  const strap = new THREE.Mesh(new THREE.TorusGeometry(.26, .06, 8, 24).rotateX(Math.PI / 2), dark);
  const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .1, 24).rotateX(Math.PI / 2), dark); caseMesh.position.z = -.3;
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .02, 24).rotateX(Math.PI / 2), dialMaterial); dial.position.z = -.36;
  watch.add(strap, caseMesh, dial); watch.position.y = .2; arms[0].wrist.add(watch);
  const accessories = { hat, glasses, watch };
  Object.values(accessories).forEach((item) => { item.visible = false; item.scale.setScalar(0); });
  const face = { happy: 0, eyeOpen: 1, eyeWide: 1, browLeft: 0, browRight: 0, gazeX: 0, gazeY: 0 };
  const motion = { hop: 0, turn: 0, lean: 0, cover: 1, develop: 1, gazeAngle: 0 };

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
  };
  return { root, body, neck, headTilt, head, eyes, brows, gaze, glance, curls, arms, accessories, mouth, face, motion, updateMouth, dispose };
}
export type CharacterRig = ReturnType<typeof createCharacter>;

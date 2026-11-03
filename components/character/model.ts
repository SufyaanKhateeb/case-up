import * as THREE from "three";
import { createHeadphones } from "./headphones";
import { createSunglasses } from "./sunglasses";
import { createSweatshirt } from "./sweatshirt";
import { createQuiff } from "./quiff";
import { detailMap } from "./materials";
import { createEar, createFaceGeometry, facePoint, faceFrontZ, sweptGeometry } from "./sculpt";

/** Sufyaan likeness on the articulated rig reconstructed from the sebg.ch mascot.
 * Source/provenance: docs/CHARACTER-REFERENCE.md. No remote scripts run in the app.
 */
export const HEAD_RADIUS = 1.4;
export const NECK_HEIGHT = 2.8;
export const HEAD_HEIGHT = 4.55;

export type HandPose = "relaxed" | "open" | "point" | "thumb" | "peace";
export type MouthPose = "smile" | "laugh" | "open" | "flat" | "oh" | "yawn";
export const mouths = {
  smile: { width: .36, open: .045, smile: .13 },
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

function anchor(yaw: number, pitch: number) {
  const group = new THREE.Group();
  group.rotation.set(-pitch, yaw, 0, "YXZ");
  group.position.copy(facePoint(yaw, pitch));
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
  head.scale.set(1, 1.05, 1);

  const skin = new THREE.MeshPhysicalMaterial({ color: look.colors.skin, roughness: .64, clearcoat: .08, clearcoatRoughness: .65 });
  const skinTint = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: .64, clearcoat: .08, clearcoatRoughness: .65, vertexColors: true });
  const neckMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.colors.skin).multiplyScalar(.82), roughness: .6 });
  const hair = new THREE.MeshPhysicalMaterial({ color: look.colors.hair, roughness: .65, anisotropy: .6, anisotropyRotation: Math.PI / 2 });
  const skinDetail = detailMap("skin");
  skin.bumpMap = skinTint.bumpMap = skinDetail; skin.bumpScale = skinTint.bumpScale = .007;
  hair.bumpMap = detailMap("hair"); hair.bumpScale = .035;
  const sweatshirt = createSweatshirt(look.colors.sweater);
  const sweater = sweatshirt.fabric;
  const handMaterial = skin;
  const dialMaterial = new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: .5 });
  const dark = new THREE.MeshStandardMaterial({ color: "#1c1c1c", roughness: .4 });
  const black = new THREE.MeshBasicMaterial({ color: "#000000" });
  const white = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const fingerGeometry = new THREE.CapsuleGeometry(.085, .12, 4, 10);
  const blob = (material: THREE.Material, scale: [number, number, number]) => {
    const mesh = new THREE.Mesh(sphere, material); mesh.scale.set(...scale); return mesh;
  };

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(.46, .5, 1.1, 24), neckMaterial);
  neckMesh.position.y = .5;
  neck.add(neckMesh);
  body.add(sweatshirt.group);

  const faceMesh = new THREE.Mesh(createFaceGeometry(look.colors.skin, look.colors.beard, look.beard), skinTint);
  faceMesh.name = "SculptedFace";
  head.add(faceMesh);
  for (const side of [-1, 1]) head.add(createEar(skin, look.colors.skin, side));

  const gaze = new THREE.Group();
  const glance = new THREE.Group();
  gaze.rotation.order = glance.rotation.order = "YXZ";
  gaze.add(glance); head.add(gaze);
  const eyes = [1, -1].map((side) => {
    const group = new THREE.Group();
    // Keep the complete eye silhouette above the face, even when flattened
    // for a blink. The old inset clipped the smile arcs into scattered dots.
    group.position.z = .045;
    const pupil = blob(black, [.135, .255, .075]);
    const highlight = blob(white, [.032, .043, .014]);
    highlight.position.set(-.04, .09, .072);
    const happy = new THREE.Mesh(new THREE.TorusGeometry(.14, .042, 8, 20, Math.PI * .8).scale(1, 1, .5), black);
    happy.rotation.z = Math.PI * .1; happy.position.y = -.06; happy.visible = false;
    group.add(pupil, highlight, happy); glance.add(anchor(side * .34, -.05).add(group));
    return { group, pupil, highlight, happy };
  });
  const browShape = new THREE.Shape().moveTo(-.28, -.02)
    .quadraticCurveTo(-.31, .08, -.24, .12).quadraticCurveTo(0, .15, .22, .11)
    .quadraticCurveTo(.3, .095, .28, -.015).quadraticCurveTo(.04, .025, -.21, -.055)
    .quadraticCurveTo(-.29, -.075, -.28, -.02);
  const browGeometry = new THREE.ExtrudeGeometry(browShape, { depth: .035, bevelEnabled: true, bevelThickness: .025, bevelSize: .018, bevelSegments: 3, steps: 1 });
  const browMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.colors.hair).multiplyScalar(.55), roughness: .8 });
  const brows = [1, -1].map((side) => {
    const lift = new THREE.Group();
    const bar = new THREE.Mesh(browGeometry, browMaterial);
    bar.position.z = .03; bar.rotation.z = side * -.06;
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
      const upper = -.81 + mouth.smile * x * x;
      const lower = upper - mouth.open * (1 - mouth.chatter) * Math.sqrt(1 - x * x);
      const top = new THREE.Vector3(x * mouth.width, upper, faceFrontZ(x * mouth.width, upper) + .014);
      const bottom = new THREE.Vector3(x * mouth.width, lower, faceFrontZ(x * mouth.width, lower) + .014);
      positions.setXYZ(index * 2, top.x, top.y, top.z);
      positions.setXYZ(index * 2 + 1, bottom.x, bottom.y, bottom.z);
    }
    positions.needsUpdate = true;
    mouthGeometry.computeBoundingSphere();
  };
  const mouthMesh = new THREE.Mesh(mouthGeometry, black); mouthMesh.name = "AnimatedMouth";
  head.add(mouthMesh);
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
    const moustacheMaterial = new THREE.MeshStandardMaterial({ color: look.colors.beard, roughness: .8 });
    for (const side of [-1, 1]) {
      const points = [[.035, -.655], [.16, -.65], [.32, -.63], [.43, -.7]].map(([x, y]) => [x * side, y, faceFrontZ(x * side, y) + .035]);
      const moustache = new THREE.Mesh(sweptGeometry(points, .075, .06, .015), moustacheMaterial);
      moustache.name = "SeparatedMoustache"; head.add(moustache);
    }
  }

  const arms: Arm[] = [1, -1].map((side) => {
    const mount = new THREE.Group(); mount.scale.x = side;
    const shoulder = new THREE.Group(); shoulder.position.set(1.18, 1.92, .08); shoulder.rotation.order = "ZXY";
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(.4, 1, 8, 24), sweater); upper.position.y = -.5;
    const elbow = new THREE.Group(); elbow.position.y = -1;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .65, 8, 24), sweater); forearm.position.y = -.325;
    const wrist = new THREE.Group(); wrist.position.y = -.9; wrist.rotation.order = "YXZ";
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.31, .29, .19, 24), sweatshirt.ribbing); cuff.position.y = -.06;
    const palm = blob(handMaterial, [.3, .33, .19]); palm.position.y = -.36;
    const fingers = [[.2, -.58, 1], [.07, -.63, 1.08], [-.07, -.62, 1], [-.2, -.56, .85]].map(([x, y, length]) => {
      const knuckle = new THREE.Group(); knuckle.position.set(x, y, 0); knuckle.rotation.z = x * .4;
      const upper = new THREE.Mesh(fingerGeometry, handMaterial); upper.position.y = -.12 * length; upper.scale.y = length;
      const joint = new THREE.Group(); joint.position.y = -.25 * length;
      const tip = new THREE.Mesh(fingerGeometry, handMaterial); tip.position.y = -.1 * length; tip.scale.set(.95, .85 * length, .95);
      joint.add(tip); knuckle.add(upper, joint); return { knuckle, joint };
    });
    const thumb = new THREE.Group(); thumb.position.set(.24, -.22, .06); thumb.rotation.order = "ZXY";
    const thumbUpper = new THREE.Mesh(fingerGeometry, handMaterial); thumbUpper.position.y = -.13; thumbUpper.scale.setScalar(1.15);
    const thumbJoint = new THREE.Group(); thumbJoint.position.y = -.27;
    const thumbTip = new THREE.Mesh(fingerGeometry, handMaterial); thumbTip.position.y = -.1; thumbTip.scale.set(1.1, .85, 1.1);
    thumbJoint.add(thumbTip); thumb.add(thumbUpper, thumbJoint);
    wrist.add(cuff, palm, thumb, ...fingers.map((finger) => finger.knuckle));
    elbow.add(forearm, wrist); shoulder.add(upper, elbow); mount.add(shoulder); body.add(mount);
    return { mount, shoulder, elbow, wrist, fingers, thumb, thumbJoint };
  });

  const glasses = createSunglasses();
  const headphones = createHeadphones(); headphones.position.set(0, 3.05, 0); body.add(headphones);
  head.add(glasses);
  const watch = new THREE.Group();
  const strap = new THREE.Mesh(new THREE.TorusGeometry(.26, .06, 8, 24).rotateX(Math.PI / 2), dark);
  const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .1, 24).rotateX(Math.PI / 2), dark); caseMesh.position.z = -.3;
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .02, 24).rotateX(Math.PI / 2), dialMaterial); dial.position.z = -.36;
  watch.add(strap, caseMesh, dial); watch.position.y = .2; arms[0].wrist.add(watch);
  const accessories = { headphones, glasses, watch };
  Object.values(accessories).forEach((item) => { item.visible = false; item.scale.setScalar(0); });
  const face = { happy: 0, eyeOpen: 1, eyeWide: 1, browLeft: 0, browRight: 0, gazeX: 0, gazeY: 0 };
  const motion = { hop: 0, turn: 0, lean: 0, cover: 1, develop: 1, gazeAngle: 0 };

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => {
      Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
      material.dispose();
    });
    textures.forEach((texture) => texture.dispose());
  };
  return { root, body, neck, headTilt, head, eyes, brows, gaze, glance, curls, arms, accessories, mouth, face, motion, updateMouth, dispose };
}
export type CharacterRig = ReturnType<typeof createCharacter>;

import * as THREE from "three";

export const bodyParts = ["torso", "neck", "head", "upper_arm.L", "forearm.L", "hand.L", "upper_arm.R", "forearm.R", "hand.R"] as const;
export type BodyPart = typeof bodyParts[number];
export type Angles = [number, number, number];
export const partLabels: Record<string, string> = {
  torso: "Torso", neck: "Neck", head: "Head + jaw",
  "upper_arm.L": "Left upper arm", "forearm.L": "Left forearm", "hand.L": "Left hand",
  "upper_arm.R": "Right upper arm", "forearm.R": "Right forearm", "hand.R": "Right hand",
  "face.eye.L": "Left eye surface", "face.eye.R": "Right eye surface",
  "face.brow.L": "Left brow", "face.brow.R": "Right brow", "face.nose": "Nose surface",
  "face.mouth": "Mouth surface", "face.moustache": "Moustache", "face.beard": "Chin beard", "face.hair": "Hair",
};
export const studyPoses = {
  neutral: { label: "Neutral", rotations: {} },
  look: { label: "Look left", rotations: { head: [0, 32, 0] } },
  nod: { label: "Look down", rotations: { head: [18, 0, 0], neck: [5, 0, 0] } },
  wave: { label: "Hand raised", rotations: { "upper_arm.L": [0, 0, 48], "forearm.L": [0, 0, 62], "hand.L": [0, 0, -15] } },
  open: { label: "Open arms", rotations: { "upper_arm.L": [-12, 0, 28], "upper_arm.R": [-12, 0, -28], "forearm.L": [0, 0, 20], "forearm.R": [0, 0, -20] } },
  wrists: { label: "Turn wrists", rotations: { "hand.L": [0, 55, 10], "hand.R": [0, -55, -10] } },
  lean: { label: "Torso + neck", rotations: { torso: [0, 0, -10], neck: [0, -12, 8], head: [0, 24, 4] } },
} satisfies Record<string, { label: string; rotations: Partial<Record<BodyPart, number[]>> }>;
export type StudyPose = keyof typeof studyPoses;

/** Rigid parenting only. No mesh positions, skin attributes or morphs change. */
export function createArticulationController(asset: THREE.Object3D) {
  const joints = new Map<string, THREE.Object3D>();
  const rest = new Map<string, THREE.Vector3>();
  const angles = new Map<string, Angles>();
  asset.traverse((object) => {
    const id = object.userData.joint_id as string | undefined;
    if (!id) return;
    joints.set(id, object); rest.set(id, object.position.clone()); angles.set(id, [0, 0, 0]);
  });
  bodyParts.forEach((id) => { if (!joints.has(id)) throw new Error(`Missing prepared joint: ${id}`); });
  let explosion = 0, faceSpread = false;
  const update = () => {
    joints.forEach((joint, id) => {
      joint.position.copy(rest.get(id)!);
      joint.rotation.set(...angles.get(id)!.map(THREE.MathUtils.degToRad) as Angles);
      const offset = new THREE.Vector3();
      if (id === "neck") offset.y = .05;
      if (id === "head") offset.y = .10;
      if (id.includes("arm.") || id.startsWith("hand.")) {
        offset.x = (id.endsWith(".L") ? 1 : -1) * (id.startsWith("upper") ? .11 : .06);
        offset.y = id.startsWith("upper") ? 0 : -.035;
      }
      joint.position.addScaledVector(offset, explosion);
      if (faceSpread && id.startsWith("face.")) {
        const facialOffset = new THREE.Vector3(0, 0, .12);
        if (id.includes("eye.") || id.includes("brow.")) facialOffset.x = id.endsWith(".L") ? .045 : -.045;
        if (id.includes("brow")) facialOffset.y = .035;
        if (id === "face.hair") facialOffset.set(0, .12, 0);
        if (id === "face.beard") facialOffset.y = -.045;
        joint.position.addScaledVector(facialOffset, explosion);
      }
    });
    asset.updateMatrixWorld(true);
  };
  return {
    joints,
    angles,
    pose(name: StudyPose) {
      const pose = studyPoses[name].rotations as Partial<Record<BodyPart, number[]>>;
      angles.forEach((_, id) => angles.set(id, [...(pose[id as BodyPart] ?? [0, 0, 0])] as Angles));
      update();
    },
    rotate(id: BodyPart, values: Angles) {
      if (!bodyParts.includes(id)) throw new Error("Facial patches are inspection regions, not expression controls");
      const limit = id === "torso" || id === "neck" ? 20 : id === "head" ? 45 : 120;
      angles.set(id, values.map((value) => Number.isFinite(value) ? THREE.MathUtils.clamp(value, -limit, limit) : 0) as Angles);
      update();
    },
    explode(value: number, includeFace: boolean) {
      explosion = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
      faceSpread = includeFace; update();
    },
  };
}

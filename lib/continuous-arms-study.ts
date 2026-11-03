import * as THREE from "three";
import { type ArmPose } from "./right-arm-study";

export { armPresets, type ArmPose } from "./right-arm-study";
export type ArmSide = "right" | "left";
export type ArmsPose = Record<ArmSide, ArmPose>;

/** Pose the exported skeleton in its own bind frames; never alter topology. */
export function createArmsStudy(asset: THREE.Object3D) {
  const meshes: THREE.SkinnedMesh[] = [];
  asset.traverse((object) => { if (object instanceof THREE.SkinnedMesh) meshes.push(object); });
  if (meshes.length !== 1) throw new Error("The arm study requires one continuous skinned mesh");
  const mesh = meshes[0];
  const bones = mesh.skeleton.bones;
  const find = (name: string) => { const bone = bones.find((item) => item.name === name); if (!bone) throw new Error(`Missing joint ${name}`); return bone; };
  asset.updateMatrixWorld(true);
  const rest = new Map(bones.map((bone) => [bone, { position: bone.position.clone(), rotation: bone.quaternion.clone() }]));
  const parentAxis = (bone: THREE.Bone, axis: THREE.Vector3) => axis.clone().applyQuaternion(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  const makeArm = (side: ArmSide) => {
    const prefix = side === "right" ? "Right" : "Left", sign = side === "right" ? -1 : 1;
    const upper = find(`${prefix}UpperArm`), forearm = find(`${prefix}Forearm`), hand = find(`${prefix}Hand`);
    const upperAxis = parentAxis(upper, new THREE.Vector3(0, 0, 1));
    const elbowAxis = parentAxis(forearm, new THREE.Vector3(0, 0, 1));
    const twistAxis = parentAxis(hand, new THREE.Vector3(sign * .04, -.068, .008));
    const end = new THREE.Object3D();
    end.position.copy(hand.worldToLocal(new THREE.Vector3(sign * .375, .045, .018)));
    hand.add(end);
    return { upper, forearm, hand, upperAxis, elbowAxis, twistAxis, end, sign };
  };
  const arms = { right: makeArm("right"), left: makeArm("left") };
  mesh.geometry.computeBoundingBox();
  const originalBounds = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
  mesh.frustumCulled = false;
  const rotate = (bone: THREE.Bone, axis: THREE.Vector3, degrees: number) => {
    bone.quaternion.copy(rest.get(bone)!.rotation).premultiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees)));
  };
  const finite = (value: number, low: number, high: number) => Number.isFinite(value) ? THREE.MathUtils.clamp(value, low, high) : 0;
  return {
    mesh, arms,
    pose(pose: ArmsPose) {
      bones.forEach((bone) => { bone.position.copy(rest.get(bone)!.position); bone.quaternion.copy(rest.get(bone)!.rotation); });
      for (const side of ["right", "left"] as const) {
        const arm = arms[side], value = pose[side];
        rotate(arm.upper, arm.upperAxis, arm.sign * finite(value.shoulder, 0, 35));
        rotate(arm.forearm, arm.elbowAxis, arm.sign * finite(value.elbow, 0, 70));
        rotate(arm.hand, arm.twistAxis, finite(value.wrist, -25, 25));
      }
      asset.updateMatrixWorld(true); mesh.skeleton.update();
    },
    bounds(detail: boolean, side: ArmSide) {
      const box = new THREE.Box3();
      for (const arm of detail ? [arms[side]] : Object.values(arms)) {
        [arm.upper, arm.forearm, arm.hand, arm.end].forEach((joint) => box.expandByPoint(joint.getWorldPosition(new THREE.Vector3())));
      }
      box.expandByScalar(.085);
      return detail ? box : box.union(originalBounds);
    },
    dispose() { Object.values(arms).forEach((arm) => arm.end.removeFromParent()); },
  };
}

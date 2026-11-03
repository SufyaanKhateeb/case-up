import * as THREE from "three";

export type ArmPose = { shoulder: number; elbow: number; wrist: number };
export const armPresets = {
  rest: { label: "Rest", shoulder: 0, elbow: 0, wrist: 0 },
  lift: { label: "Lift arm", shoulder: 30, elbow: 0, wrist: 0 },
  bend: { label: "Bend elbow", shoulder: 15, elbow: 60, wrist: 0 },
  wave: { label: "Raised hand", shoulder: 35, elbow: 70, wrist: 0 },
} satisfies Record<string, ArmPose & { label: string }>;

/** Pose the exported skeleton in its own bind frames; never alter topology. */
export function createRightArmStudy(asset: THREE.Object3D) {
  const meshes: THREE.SkinnedMesh[] = [];
  asset.traverse((object) => { if (object instanceof THREE.SkinnedMesh) meshes.push(object); });
  if (meshes.length !== 1) throw new Error("The arm study requires one continuous skinned mesh");
  const mesh = meshes[0];
  const bones = mesh.skeleton.bones;
  const find = (name: string) => { const bone = bones.find((item) => item.name === name); if (!bone) throw new Error(`Missing joint ${name}`); return bone; };
  const upper = find("RightUpperArm"), forearm = find("RightForearm"), hand = find("RightHand");
  asset.updateMatrixWorld(true);
  const rest = new Map(bones.map((bone) => [bone, { position: bone.position.clone(), rotation: bone.quaternion.clone() }]));
  const parentAxis = (bone: THREE.Bone, axis: THREE.Vector3) => axis.clone().applyQuaternion(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
  const upperAxis = parentAxis(upper, new THREE.Vector3(0, 0, 1));
  const elbowAxis = parentAxis(forearm, new THREE.Vector3(0, 0, 1));
  const twistAxis = parentAxis(hand, new THREE.Vector3(-.04, -.068, .008));
  const end = new THREE.Object3D();
  end.position.copy(hand.worldToLocal(new THREE.Vector3(-.375, .045, .018)));
  hand.add(end);
  mesh.geometry.computeBoundingBox();
  const originalBounds = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
  mesh.frustumCulled = false;
  const rotate = (bone: THREE.Bone, axis: THREE.Vector3, degrees: number) => {
    bone.quaternion.copy(rest.get(bone)!.rotation).premultiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees)));
  };
  const finite = (value: number, low: number, high: number) => Number.isFinite(value) ? THREE.MathUtils.clamp(value, low, high) : 0;
  return {
    mesh, upper, forearm, hand,
    pose(pose: ArmPose) {
      bones.forEach((bone) => { bone.position.copy(rest.get(bone)!.position); bone.quaternion.copy(rest.get(bone)!.rotation); });
      rotate(upper, upperAxis, -finite(pose.shoulder, 0, 35));
      rotate(forearm, elbowAxis, -finite(pose.elbow, 0, 70));
      rotate(hand, twistAxis, finite(pose.wrist, -25, 25));
      asset.updateMatrixWorld(true); mesh.skeleton.update();
    },
    bounds(detail: boolean) {
      const box = new THREE.Box3();
      [upper, forearm, hand, end].forEach((joint) => box.expandByPoint(joint.getWorldPosition(new THREE.Vector3())));
      box.expandByScalar(.085);
      return detail ? box : box.union(originalBounds);
    },
    dispose() { end.removeFromParent(); },
  };
}

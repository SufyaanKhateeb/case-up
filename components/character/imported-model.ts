import * as THREE from "three";
import { disposeCharacterAsset } from "@/lib/character-assets";
import { createArmsStudy, type ArmsPose } from "@/lib/continuous-arms-study";
import { createFacialExpressions } from "./facial-expressions";
import { createCharacter, HEAD_HEIGHT, NECK_HEIGHT, type CharacterLook } from "./model";

// Keep the tour's established head centre and scale; retain the exported arm skin.
export const importedRegistration = { scale: 7, headY: .66 };
const offsetY = HEAD_HEIGHT - importedRegistration.headY * importedRegistration.scale;

/** Positive X pitch looks down into this model's short neck. */
export function safeHeadPitch(value: number) {
  return Number.isFinite(value) ? THREE.MathUtils.clamp(value, -.12, 0) : 0;
}

/** Blend below the angled jaw, never through a horizontal slice of the chin. */
export function importedHeadWeight(sourceY: number, sourceZ: number) {
  return THREE.MathUtils.smoothstep(sourceY + .28 * sourceZ, .480, .495);
}

/** Own the approved continuous arm asset, adding only the existing head motion. */
export function createImportedCharacter(asset: THREE.Object3D, look: CharacterLook) {
  const armRig = createArmsStudy(asset);
  const mesh = armRig.mesh;
  const rig = createCharacter(look);
  rig.root.name = "SufyaanConnectedCharacter";
  const accessoryMeshes = new Set<THREE.Object3D>();
  Object.values(rig.accessories).forEach((accessory) => accessory.traverse((object) => accessoryMeshes.add(object)));
  rig.root.traverse((object) => { if (object instanceof THREE.Mesh && !accessoryMeshes.has(object)) object.layers.set(1); });

  const body = mesh.skeleton.bones.find((bone) => bone.name === "Body")!;
  const addBone = (name: string, parent: THREE.Bone, y: number) => {
    const bone = new THREE.Bone(); bone.name = name;
    bone.position.copy(parent.worldToLocal(new THREE.Vector3(0, y, 0)));
    bone.quaternion.copy(parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    parent.add(bone); asset.updateMatrixWorld(true); return bone;
  };
  const neck = addBone("Neck", body, (NECK_HEIGHT - offsetY) / importedRegistration.scale);
  const head = addBone("Head", neck, importedRegistration.headY);
  const restNeck = neck.quaternion.clone(), restHead = head.quaternion.clone();
  const previousSkeleton = mesh.skeleton;
  const headIndex = previousSkeleton.bones.length + 1;
  const skeleton = new THREE.Skeleton([...previousSkeleton.bones, neck, head], [
    ...previousSkeleton.boneInverses.map((matrix) => matrix.clone()),
    neck.matrixWorld.clone().invert(), head.matrixWorld.clone().invert(),
  ]);
  const geometry = mesh.geometry, positions = geometry.getAttribute("position");
  const originalIndices = geometry.getAttribute("skinIndex"), originalWeights = geometry.getAttribute("skinWeight");
  const indices = new Uint16Array(positions.count * 4), weights = new Float32Array(positions.count * 4);
  const bodyIndex = previousSkeleton.bones.indexOf(body);
  for (let index = 0; index < positions.count; index++) {
    const headWeight = importedHeadWeight(positions.getY(index), positions.getZ(index));
    if (headWeight > 0) {
      indices.set([bodyIndex, headIndex, 0, 0], index * 4);
      weights.set([1 - headWeight, headWeight, 0, 0], index * 4);
    } else {
      for (let component = 0; component < 4; component++) {
        indices[index * 4 + component] = originalIndices.getComponent(index, component);
        weights[index * 4 + component] = originalWeights.getComponent(index, component);
      }
    }
  }
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  mesh.bind(skeleton, mesh.bindMatrix.clone()); mesh.normalizeSkinWeights(); previousSkeleton.dispose();
  mesh.name = "ApprovedConnectedMesh";

  // Mounts are authored in the controller's units. The model stays in source
  // units so its bind matrices and tested sleeve weights require no conversion.
  function accessoryMount(object: THREE.Object3D, parent: THREE.Bone, point: THREE.Vector3, scale: [number, number, number]) {
    const mount = new THREE.Group();
    mount.position.copy(parent.worldToLocal(point));
    mount.quaternion.copy(parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    mount.scale.set(...scale).multiplyScalar(1 / importedRegistration.scale);
    parent.add(mount); mount.add(object); return mount;
  }
  accessoryMount(rig.accessories.glasses, head, new THREE.Vector3(0, importedRegistration.headY + .03 / 7, -.16 / 7), [.84, 1.12, .84]);
  rig.accessories.headphones.position.set(0, 0, 0);
  accessoryMount(rig.accessories.headphones, body, new THREE.Vector3(0, (3.05 - offsetY) / 7, 0), [1, 1, 1]);
  rig.accessories.watch.position.set(0, 0, 0);
  const watchMount = accessoryMount(rig.accessories.watch, armRig.arms.left.hand, new THREE.Vector3(.35, .125, .01), [.75, .75, .75]);
  const registration = new THREE.Group(); registration.scale.setScalar(importedRegistration.scale); registration.position.y = offsetY;
  registration.add(asset); rig.body.add(registration);
  const armPoses: ArmsPose = { right: { shoulder: 0, elbow: 0, wrist: 0 }, left: { shoulder: 0, elbow: 0, wrist: 0 } };
  const headTurn = new THREE.Quaternion(), idleTurn = new THREE.Quaternion();
  const neckEuler = new THREE.Euler(), tiltEuler = new THREE.Euler(), idleEuler = new THREE.Euler();
  const expressions = createFacialExpressions(mesh);
  function sync() {
    armRig.pose(armPoses);
    // Keep the face above the collar: no downward pitch, even for an old cue.
    neckEuler.copy(rig.neck.rotation); neckEuler.x = safeHeadPitch(neckEuler.x);
    tiltEuler.copy(rig.headTilt.rotation); tiltEuler.x = safeHeadPitch(tiltEuler.x);
    idleEuler.copy(rig.head.rotation); idleEuler.x = safeHeadPitch(idleEuler.x);
    neck.quaternion.copy(restNeck).multiply(headTurn.setFromEuler(neckEuler));
    headTurn.setFromEuler(tiltEuler).multiply(idleTurn.setFromEuler(idleEuler));
    head.quaternion.copy(restHead).multiply(headTurn);
    expressions.sync(rig.face, rig.mouth, rig.eyes[0].group.scale.y / Math.max(.01, rig.face.eyeWide));
    rig.root.updateMatrixWorld(true); skeleton.update();
  }
  const disposeControls = rig.dispose;
  let disposed = false;
  rig.dispose = () => {
    if (disposed) return;
    disposed = true;
    armRig.dispose();
    // The controller owns accessories, while the imported asset owns its skin.
    Object.values(rig.accessories).forEach((accessory) => rig.body.attach(accessory));
    registration.removeFromParent(); disposeControls(); disposeCharacterAsset(asset);
  };
  sync();
  return Object.assign(rig, { sync, mesh, skeleton, armPoses, armRig, headBone: head, watchMount });
}

export type ImportedCharacterRig = ReturnType<typeof createImportedCharacter>;

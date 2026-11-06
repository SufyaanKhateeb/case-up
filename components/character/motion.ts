import gsap from "gsap";
import { MathUtils } from "three";
import { hands, mouths, type Arm, type CharacterRig, type HandPose, type MouthPose } from "./model";
import type { TourGesture } from "@/lib/character-tour";
import type { Trick } from "@/lib/character-state";

type Pose = { shoulder: [number, number, number]; elbow: number; wrist: [number, number, number]; hand: HandPose };
type Face = { mouth?: MouthPose; happy?: boolean; brow?: number; gazeY?: number; wide?: number };
const wave: Pose = { shoulder: [2.3, -.2, -Math.PI / 2], elbow: .45, wrist: [Math.PI / 2, 0, 0], hand: "open" };
const think: Pose = { shoulder: [.85, -.45, -Math.PI / 2], elbow: 2, wrist: [Math.PI / 2, 0, 0], hand: "point" };
const thumbs: Pose = { shoulder: [1.4, -.3, -Math.PI / 2], elbow: 1, wrist: [Math.PI / 2, 0, -.4], hand: "thumb" };
const selfie: Pose = { shoulder: [1.3, -.2, -Math.PI / 2], elbow: 1.3, wrist: [Math.PI / 2, 0, 0], hand: "peace" };
const dance: Pose = { shoulder: [1.3, -.3, -Math.PI / 2], elbow: 1.3, wrist: [Math.PI / 2, 0, -.3], hand: "point" };

/** One owned timeline per performance; interrupting it cancels its child motions. */
export function createCharacterMotion(rig: CharacterRig) {
  let active: gsap.core.Timeline | null = null;
  let enabled = true;
  let grabbing = false;
  let sleeping = false;
  let swiping = false;
  let queuedGesture: [TourGesture, number, { x: number; y: number } | undefined] | null = null;
  let nextBlink = 2.2;
  let blinkStart = -Infinity;
  let happyEyes = false;
  let pendingEyes: boolean | null = null;
  let lastMouth = "";

  function hand(arm: Arm, pose: HandPose, duration = .4) {
    const values = hands[pose];
    return gsap.timeline().to(arm.fingers.map((finger) => finger.knuckle.rotation), { x: (index) => -values.fingers[index] * 1.5, duration, stagger: .025, ease: "power3.out" }, 0)
      .to(arm.fingers.map((finger) => finger.joint.rotation), { x: (index) => -values.fingers[index] * 1.7, duration, stagger: .025, ease: "power3.out" }, .04)
      .to(arm.thumb.rotation, { z: values.thumb[0], x: -values.thumb[1], duration, ease: "power3.out" }, 0)
      .to(arm.thumbJoint.rotation, { x: -values.thumb[1] * .8, duration, ease: "power3.out" }, .04);
  }
  function armPose(arm: Arm, pose: Pose, duration = .6) {
    const [z, x, y] = pose.shoulder;
    const [wy, wx, wz] = pose.wrist;
    return gsap.timeline().to(arm.shoulder.rotation, { z, x, y, duration, ease: "back.out(1.5)" }, 0)
      .to(arm.elbow.rotation, { x: pose.elbow, duration, ease: "back.out(1.5)" }, duration * .12)
      .to(arm.wrist.rotation, { y: wy, x: wx, z: wz, duration, ease: "back.out(1.5)" }, duration * .24)
      .add(hand(arm, pose.hand, duration * .7), duration * .2);
  }
  function armRest(arm: Arm, duration = .35) {
    return armPose(arm, { shoulder: [0, 0, 0], elbow: 0, wrist: [0, 0, 0], hand: "relaxed" }, duration);
  }
  function face({ mouth = "smile", happy = false, brow = 0, gazeY = 0, wide = 1 }: Face = {}, duration = .3) {
    return gsap.timeline().to(rig.mouth, { ...mouths[mouth], chatter: 0, duration, ease: "power3.out" }, 0)
      .to(rig.face, { happy: happy ? 1 : 0, browLeft: brow, browRight: brow, gazeY, eyeOpen: 1, eyeWide: wide, duration, ease: "power2.out" }, 0);
  }
  function neutral(duration = .5) {
    return gsap.timeline().to(rig.neck.rotation, { x: 0, y: 0, z: 0, duration, ease: "power3.inOut" }, 0)
      .to(rig.headTilt.rotation, { x: 0, y: 0, z: 0, duration, ease: "power3.inOut" }, 0)
      .to(rig.body.rotation, { x: 0, y: 0, z: 0, duration, ease: "power3.inOut" }, 0)
      .to(rig.motion, { hop: 0, turn: 0, lean: 0, cover: 1, develop: 1, gazeAngle: 0, duration, ease: "power3.out" }, 0)
      .to(rig.face, { gazeX: 0, gazeY: 0, duration }, 0)
      .add(armRest(rig.arms[0], duration), 0).add(armRest(rig.arms[1], duration), 0)
      .add(face({}, duration), 0);
  }
  function start() {
    active?.kill();
    grabbing = false; sleeping = false; swiping = false; queuedGesture = null;
    active = gsap.timeline({ paused: !enabled });
    active.add(neutral(.22), 0);
    return active;
  }
  function rest(immediate = false) { const timeline = start(); if (immediate) timeline.progress(1).pause(); }
  function gesture(name: TourGesture, direction = 1, aim?: { x: number; y: number }) {
    if (swiping && active) { queuedGesture = [name, direction, aim]; return active; }
    const timeline = start();
    const arm = rig.arms[direction > 0 ? 0 : 1];
    const happy = name === "wave" || name === "thumbs" || name === "cheer";
    timeline.add(face({ mouth: name === "think" ? "flat" : name === "watch" ? "oh" : name === "wave" || name === "cheer" ? "laugh" : "smile", happy, brow: name === "watch" ? .12 : .06, gazeY: name === "watch" ? -.1 : name === "think" ? .05 : 0 }), .05);
    const pose: Pose | null = name === "wave" ? wave : name === "think" ? think : name === "thumbs" ? thumbs : name === "watch" ? { shoulder: [1.51, -.68, .29], elbow: -1.73, wrist: [-.19, -.54, 0], hand: "relaxed" } : name === "cheer" ? null : { shoulder: [1.3, -.3, 0], elbow: -.25, wrist: [0, 0, .2], hand: "point" };
    if (pose && name === "point") {
      // Aim in character space, as the source does, rather than pointing below
      // the viewport with one fixed shoulder angle at every screen size.
      const angle = aim ? Math.atan2(Math.abs(aim.x * direction - 1.1), -(aim.y + 4.55 - 2.05)) : 2;
      const shoulder = MathUtils.clamp(angle, .6, 2);
      pose.shoulder[0] = shoulder; pose.wrist[2] = MathUtils.clamp(angle - shoulder, -.7, .7);
    }
    if (pose) timeline.add(armPose(arm, pose, .7), .05);
    const neck = name === "watch" ? [.3, .05, .55] : name === "think" ? [.15, .08, 0] : name === "thumbs" ? [.12, -.06, 0] : [.1, -.1, 0];
    timeline.to(rig.neck.rotation, { y: neck[0] * direction, z: neck[1] * direction, x: neck[2], duration: .9, ease: "power3.out" }, .05)
      .to(rig.body.rotation, { z: -direction * .04, duration: .9, ease: "power3.out" }, 0);
    if (name === "wave") timeline.to(arm.wrist.rotation, { z: .45, duration: .2, repeat: 5, yoyo: true, ease: "sine.inOut" }, .62)
      .to(arm.elbow.rotation, { x: .35, duration: .2, repeat: 5, yoyo: true, ease: "sine.inOut" }, .55);
    if (name === "think") timeline.to(arm.wrist.rotation, { x: .4, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut" }, .6);
    if (name === "thumbs") timeline.to(arm.elbow.rotation, { x: 1.35, duration: .2, repeat: 1, yoyo: true, ease: "sine.inOut" }, .65);
    timeline.to(rig.mouth, { chatter: .55, duration: .07, repeat: 9, yoyo: true, ease: "power2.inOut" }, .25);
    timeline.add(neutral(.8), "+=1.6");
    return timeline;
  }
  function swipe(direction: number, aim?: { x: number; y: number }) {
    const timeline = start(); swiping = true;
    const arm = rig.arms[direction > 0 ? 0 : 1];
    const angle = aim ? Math.atan2(Math.abs(aim.x * direction - 1.1), -(aim.y + 4.55 - 2.05)) : 2;
    const shoulder = MathUtils.clamp(angle, .6, 2), wrist = MathUtils.clamp(angle - shoulder, -.7, .7);
    timeline.add(face({ mouth: "smile", brow: .05 }), 0)
      .add(armPose(arm, { shoulder: [shoulder, -.3, 0], elbow: -.25, wrist: [0, 0, wrist], hand: "open" }, .45), 0)
      .to(arm.shoulder.rotation, { z: shoulder + .2, duration: .15, ease: "power3.out" }, .55)
      .to(arm.wrist.rotation, { z: wrist + .6, duration: .15, ease: "power3.out" }, .55)
      .call(() => {
        swiping = false;
        const queued = queuedGesture; queuedGesture = null;
        if (queued) gesture(...queued);
      }, [], .7)
      .to(arm.shoulder.rotation, { z: shoulder, duration: .4, ease: "power2.inOut" }, .7)
      .to(arm.wrist.rotation, { z: wrist, duration: .4, ease: "power2.inOut" }, .7)
      .add(neutral(.6), 1.5);
    return timeline;
  }
  function grab() {
    const timeline = start(); grabbing = true;
    timeline.add(face({ mouth: "oh", brow: .13, wide: 1.1 }), 0);
  }
  function release() { grabbing = false; start().add(face({ happy: true, brow: .05 }), .15).add(neutral(.7), .7); }

  function sleep() {
    const timeline = start(); sleeping = true;
    timeline.add(face({ mouth: "yawn", brow: .06 }, .9), .2)
      .to(rig.face, { eyeOpen: .15, duration: .6 }, .4)
      .to(rig.headTilt.rotation, { x: -.12, z: .03, duration: .9, ease: "sine.inOut" }, .2)
      .to(rig.motion, { hop: .05, duration: .9, ease: "sine.inOut" }, .2)
      .add(face({ mouth: "flat", brow: -.03 }, .6), 1.7)
      .to(rig.face, { eyeOpen: .08, duration: .6 }, 1.7)
      .to(rig.headTilt.rotation, { x: 0, z: .06, duration: .6 }, 1.7)
      .to(rig.motion, { hop: 0, duration: .6 }, 1.7)
      .to(rig.body.rotation, { z: -.02, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" }, 2.3);
    return timeline;
  }
  function wake() {
    return start().add(face({ mouth: "oh", brow: .13, wide: 1.12 }, .15), 0)
      .to(rig.motion, { hop: .12, duration: .12, repeat: 1, yoyo: true }, 0)
      .to(rig.headTilt.rotation, { x: -.05, y: .2, z: 0, duration: .25 }, .1)
      .to(rig.headTilt.rotation, { y: -.2, duration: .35 }, .4)
      .add(neutral(.5), .8);
  }

  function perform(trick: Trick) {
    const timeline = start();
    const [right, left] = rig.arms;
    switch (trick) {
      case "Dance":
        timeline.add(face({ mouth: "laugh", happy: true, brow: .06 }), .1)
          .to(rig.motion, { hop: .14, duration: .2, repeat: 11, yoyo: true, ease: "sine.inOut" }, .1)
          .to(rig.body.rotation, { keyframes: { z: [0, .08, -.08, .08, -.08, .08, -.08, 0] }, duration: 2.6, ease: "sine.inOut" }, .1)
          .to(rig.headTilt.rotation, { keyframes: { z: [0, -.07, .07, -.07, .07, -.07, .07, 0] }, duration: 2.6, ease: "sine.inOut" }, .1)
          .add(armPose(right, dance, .3), .1).to(right.elbow.rotation, { x: .7, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut" }, .45)
          .add(armRest(right), 1.3).add(armPose(left, dance, .3), 1.55)
          .to(left.elbow.rotation, { x: .7, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut" }, 1.85).add(armRest(left), 2.75)
          .to(rig.motion, { turn: Math.PI * 2, duration: .8, ease: "power2.inOut" }, 2.75)
          .to(rig.motion, { hop: .2, duration: .4, repeat: 1, yoyo: true, ease: "sine.out" }, 2.75)
          .set(rig.motion, { turn: 0 }, 3.55).add(neutral(.5), 3.6);
        break;
      case "Punching bag":
        timeline.add(face({ mouth: "oh", happy: true, brow: .12 }), 0)
          .to(rig.headTilt.rotation, { x: -.22, y: -.3, z: .18, duration: .08, ease: "power3.out" }, .05)
          .to(rig.motion, { hop: -.15, lean: .08, duration: .08 }, .05)
          .to(rig.headTilt.rotation, { x: 0, y: 0, z: 0, duration: 1.4, ease: "elastic.out(1,.3)" }, .15)
          .to(rig.motion, { hop: 0, lean: 0, duration: 1.2, ease: "elastic.out(1,.4)" }, .15)
          .add(face({ mouth: "flat", brow: .08 }), .65).add(neutral(.6), 2.4);
        break;
      case "Panic":
        timeline.add(face({ mouth: "oh", brow: .15, gazeY: .04, wide: 1.18 }), .1)
          .to(rig.headTilt.rotation, { keyframes: { y: [0, .35, -.35, .35, -.35, .35, -.35, 0] }, duration: 1.5, ease: "sine.inOut" }, .15)
          .to(rig.motion, { hop: .05, duration: .05, repeat: 29, yoyo: true, ease: "sine.inOut" }, .15)
          .to(rig.mouth, { chatter: .8, duration: .08, repeat: 17, yoyo: true, ease: "sine.inOut" }, .15)
          .add(armPose(right, { shoulder: [1.5, -.4, -1.57], elbow: 1.4, wrist: [1.57, 0, 0], hand: "open" }, .25), .1)
          .to(right.wrist.rotation, { z: .6, duration: .07, repeat: 17, yoyo: true, ease: "sine.inOut" }, .55)
          .add(neutral(.7), 2.2);
        break;
      case "Fly":
        timeline.add(face({ mouth: "flat", brow: -.04, gazeY: .06 }), .1)
          .to(rig.motion, { hop: .4, duration: 1, ease: "power2.out" }, .2)
          .to(rig.motion, { hop: .32, duration: .25, repeat: 3, yoyo: true, ease: "sine.inOut" }, 1.2);
        for (let index = 0; index < 8; index++) timeline.to(rig.arms[index % 2].shoulder.rotation, { z: 1.5, duration: .12, repeat: 1, yoyo: true, ease: "power2.out" }, .2 + index * .25);
        timeline.add(face({ mouth: "oh", brow: .14, wide: 1.15 }), 2.1)
          .to(rig.motion, { hop: 0, duration: .25, ease: "power2.in" }, 2.35)
          .to(rig.motion, { hop: .12, duration: .12, repeat: 1, yoyo: true, ease: "power2.out" }, 2.6).add(neutral(.6), 3.1);
        break;
      case "Vanish":
        timeline.to(rig.motion, { develop: 0, duration: .4, ease: "power1.in" }, .2)
          .to(rig.motion, { cover: 0, duration: .6, ease: "power1.in" }, .6)
          .to(rig.motion, { cover: 1, duration: .6, ease: "power1.in" }, 2.2)
          .to(rig.motion, { develop: 1, duration: .7, ease: "power1.out" }, 2.55);
        break;
      case "Hiccup":
        timeline.add(face({ mouth: "flat", brow: .04 }), .1);
        for (const at of [.3, 1.2, 1.8]) timeline.add(face({ mouth: "oh", brow: .14, wide: 1.15 }, .06), at)
          .to(rig.motion, { hop: .16, duration: .06, repeat: 1, yoyo: true, ease: "power2.out" }, at)
          .to(rig.headTilt.rotation, { x: -.08, duration: .06, repeat: 1, yoyo: true }, at)
          .add(face({ mouth: "flat", brow: .04 }), at + .25);
        timeline.add(neutral(.5), 2.7);
        break;
      case "Peekaboo":
        timeline.add(face({ happy: true, brow: .05 }), .1)
          .to(rig.motion, { hop: -8, duration: .6, ease: "power2.in" }, .1)
          .add(face({ mouth: "laugh", brow: .14, wide: 1.15 }), 1.6)
          .to(rig.motion, { hop: .25, duration: .35, ease: "back.out(2)" }, 1.6)
          .add(neutral(.6), 2.4);
        break;
      case "Selfie":
        timeline.add(armPose(right, selfie), .1).add(face({ brow: .05 }), .1)
          .to(rig.headTilt.rotation, { x: -.05, z: .12, duration: .5, ease: "back.out(2)" }, .2)
          .add(face({ mouth: "laugh", happy: true, brow: .06 }), .9)
          .to(rig.motion, { hop: .06, duration: .08, repeat: 1, yoyo: true }, 1.1).add(neutral(.6), 2.5);
        break;
      case "Dizzy":
        timeline.add(face({ mouth: "oh", brow: .1 }), .1)
          .to(rig.motion, { gazeAngle: Math.PI * 6, duration: 1.2, ease: "power1.inOut" }, .1)
          .to(rig.headTilt.rotation, { x: .05, z: .07, duration: .3, repeat: 3, yoyo: true, ease: "sine.inOut" }, .1)
          .to(rig.headTilt.rotation, { y: .12, duration: .07, repeat: 5, yoyo: true }, 1.35).add(neutral(.6), 2.1);
        break;
      case "Sneeze":
        timeline.add(face({ mouth: "open", brow: .12, gazeY: .04 }), .1)
          .to(rig.face, { eyeOpen: .5, duration: .5 }, .1)
          .to(rig.headTilt.rotation, { x: -.1, duration: .4, ease: "power2.inOut" }, .1)
          .to(rig.headTilt.rotation, { x: -.2, duration: .4, ease: "power2.inOut" }, .6)
          .to(rig.motion, { hop: .06, duration: 1, ease: "power1.in" }, .1)
          .add(face({ mouth: "oh", happy: true, brow: -.04 }, .08), 1.15)
          .to(rig.headTilt.rotation, { x: .24, duration: .09, ease: "power3.out" }, 1.15)
          .to(rig.motion, { hop: 0, duration: .12, ease: "power3.out" }, 1.15)
          .to(Object.values(rig.accessories).map((accessory) => accessory.position), { y: "+=.5", duration: .14, repeat: 1, yoyo: true, ease: "power2.out" }, 1.15)
          .add(neutral(.6), 1.9);
        break;
      case "Sulk":
        timeline.add(face({ mouth: "flat", brow: .06 }), .1)
          .to(rig.face, { eyeOpen: .1, duration: .15 }, .1)
          .to(rig.headTilt.rotation, { x: -.14, duration: .3 }, .1)
          .to(rig.motion, { turn: 2.5, duration: .8, ease: "power2.inOut" }, .35)
          .to(rig.headTilt.rotation, { y: -1, duration: .45, ease: "power2.inOut" }, 2.1)
          .to(rig.face, { eyeOpen: .6, duration: .2 }, 2.2)
          .add(neutral(.8), 3.2);
        break;
    }
    return timeline;
  }

  function update(time: number, delta: number, look: { x: number; y: number }, reduced: boolean) {
    const t = reduced ? 0 : time;
    rig.root.scale.setScalar(.6);
    rig.root.position.y = -2.23 + rig.motion.hop * .6;
    rig.root.rotation.set(0, -.15 + rig.motion.turn, rig.motion.lean);
    rig.body.position.y = Math.sin(t * (sleeping ? 1 : 1.8)) * (sleeping ? .05 : .03);
    rig.head.rotation.z = Math.sin(t * .8) * .035;
    rig.head.rotation.x = Math.sin(t * .6) * .03;
    if (!reduced && grabbing) {
      rig.motion.lean = MathUtils.damp(rig.motion.lean, -look.x * .15, 5, delta);
      rig.arms.forEach((arm, index) => { arm.shoulder.rotation.z = MathUtils.damp(arm.shoulder.rotation.z, Math.max(0, look.x * (index ? -1 : 1)) * .8, 7, delta); });
    } else if (!sleeping && !active?.isActive() && !reduced) {
      rig.neck.rotation.y = MathUtils.damp(rig.neck.rotation.y, look.x * .25, 5, delta);
      rig.neck.rotation.x = MathUtils.damp(rig.neck.rotation.x, look.y * .12, 5, delta);
    }
    const wantsHappyEyes = rig.face.happy >= .5;
    if (reduced) {
      happyEyes = wantsHappyEyes; pendingEyes = null; blinkStart = -Infinity;
    } else {
      // Change eye geometry at the closed point, never with the eyes wide open.
      if (wantsHappyEyes !== (pendingEyes ?? happyEyes)) {
        blinkStart = time; pendingEyes = wantsHappyEyes; nextBlink = time + 2.8;
      } else if (pendingEyes === null && time >= nextBlink) {
        blinkStart = time; nextBlink = time + 2.4 + Math.sin(time * 2.3) * .9;
      }
      if (pendingEyes !== null && time - blinkStart >= .07) {
        happyEyes = pendingEyes; pendingEyes = null;
      }
    }
    const blinkAge = Math.max(0, time - blinkStart);
    const blink = reduced || blinkAge >= .19 ? 1 : blinkAge < .07 ? 1 - blinkAge / .07 * .9 : .1 + (blinkAge - .07) / .12 * .9;
    rig.eyes.forEach((eye) => {
      eye.group.scale.set(rig.face.eyeWide, rig.face.eyeOpen * rig.face.eyeWide * blink, 1);
      eye.pupil.visible = eye.highlight.visible = !happyEyes;
      eye.happy.visible = happyEyes;
    });
    rig.brows.forEach(({ lift, bar, side }, index) => { const brow = index ? rig.face.browRight : rig.face.browLeft; lift.rotation.x = -brow; bar.rotation.z = side * (brow * 1.5 - .12); });
    const dizzy = Math.sin(rig.motion.gazeAngle / 6);
    rig.gaze.rotation.set(-rig.face.gazeY + Math.sin(rig.motion.gazeAngle) * .06 * dizzy, rig.face.gazeX + Math.cos(rig.motion.gazeAngle) * .08 * dizzy, 0);
    rig.glance.rotation.set(reduced ? 0 : Math.sin(t * .7) * .012, reduced ? 0 : Math.sin(t * .5) * .02, 0);
    const signature = [rig.mouth.width, rig.mouth.open, rig.mouth.smile, rig.mouth.chatter].map((value) => value.toFixed(4)).join();
    if (signature !== lastMouth) { lastMouth = signature; rig.updateMouth(); }
  }
  function setActive(value: boolean) { enabled = value; active?.paused(!value); }
  function dispose() { active?.kill(); active = null; }
  // Initial hand curvature is authored rather than a row of disconnected spheres.
  rig.arms.forEach((arm) => arm.fingers.forEach((finger, index) => { finger.knuckle.rotation.x = -hands.relaxed.fingers[index] * 1.5; finger.joint.rotation.x = -hands.relaxed.fingers[index] * 1.7; }));
  return { gesture, swipe, perform, grab, release, rest, sleep, wake, update, setActive, dispose };
}

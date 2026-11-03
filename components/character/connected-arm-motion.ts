import gsap from "gsap";
import { MathUtils } from "three";
import type { ArmsPose, ArmPose } from "@/lib/continuous-arms-study";
import type { TourGesture } from "@/lib/character-tour";
import type { Trick } from "@/lib/character-state";

/** Explicit poses in the workshop's tested degrees, never legacy Euler angles. */
export function connectedArmMotion(poses: ArmsPose) {
  // The old controller's positive-side arm is anatomical left on this model.
  const arm = (direction: number) => direction > 0 ? poses.left : poses.right;
  const tween = (timeline: gsap.core.Timeline, target: ArmPose, value: Partial<ArmPose>, at: number, duration = .55) =>
    timeline.to(target, { ...value, duration, ease: "power2.inOut" }, at);
  const restPose = { shoulder: 0, elbow: 0, wrist: 0 };
  return {
    rest(timeline: gsap.core.Timeline, duration: number) {
      tween(timeline, poses.right, restPose, 0, duration);
      tween(timeline, poses.left, restPose, 0, duration);
    },
    gesture(timeline: gsap.core.Timeline, name: TourGesture, direction: number, aim?: { x: number; y: number }) {
      const target = arm(direction);
      const pointShoulder = aim ? MathUtils.clamp(25 + aim.y * 3, 15, 35) : 25;
      const values: Record<TourGesture, ArmPose> = {
        wave: { shoulder: 35, elbow: 65, wrist: -18 },
        point: { shoulder: pointShoulder, elbow: 25, wrist: 10 },
        think: { shoulder: 15, elbow: 70, wrist: 15 },
        watch: { shoulder: 25, elbow: 65, wrist: 25 },
        thumbs: { shoulder: 25, elbow: 50, wrist: 0 },
        cheer: { shoulder: 35, elbow: 55, wrist: 0 },
      };
      tween(timeline, target, values[name], .22);
      if (name === "wave") timeline.to(target, { wrist: 20, duration: .2, repeat: 5, yoyo: true, ease: "sine.inOut" }, .8);
      if (name === "think") timeline.to(target, { wrist: -10, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut" }, .8);
      if (name === "thumbs") timeline.to(target, { elbow: 65, duration: .2, repeat: 1, yoyo: true, ease: "sine.inOut" }, .8);
      if (name === "cheer") tween(timeline, arm(-direction), values.cheer, .22);
    },
    swipe(timeline: gsap.core.Timeline, direction: number) {
      const target = arm(direction);
      tween(timeline, target, { shoulder: 25, elbow: 20, wrist: -20 }, .22, .28);
      tween(timeline, target, { shoulder: 35, wrist: 20 }, .52, .15);
      tween(timeline, target, { shoulder: 25, wrist: 0 }, .72, .35);
    },
    perform(timeline: gsap.core.Timeline, trick: Trick) {
      switch (trick) {
        case "Dance":
          tween(timeline, poses.left, { shoulder: 30, elbow: 65, wrist: -15 }, .22, .25);
          timeline.to(poses.left, { elbow: 35, wrist: 15, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut" }, .5);
          tween(timeline, poses.left, restPose, 1.3, .3);
          tween(timeline, poses.right, { shoulder: 30, elbow: 65, wrist: 15 }, 1.55, .25);
          timeline.to(poses.right, { elbow: 35, wrist: -15, duration: .2, repeat: 3, yoyo: true, ease: "sine.inOut" }, 1.85);
          tween(timeline, poses.right, restPose, 2.75, .35);
          break;
        case "Panic":
          tween(timeline, poses.left, { shoulder: 35, elbow: 70, wrist: -20 }, .22, .25);
          timeline.to(poses.left, { wrist: 20, duration: .08, repeat: 17, yoyo: true, ease: "sine.inOut" }, .55);
          break;
        case "Fly":
          for (let index = 0; index < 8; index++) {
            timeline.to(index % 2 ? poses.right : poses.left, { shoulder: 35, duration: .12, repeat: 1, yoyo: true, ease: "power2.out" }, .25 + index * .25);
          }
          break;
        case "Selfie":
          tween(timeline, poses.left, { shoulder: 35, elbow: 60, wrist: 15 }, .22);
          break;
      }
    },
    grab(lookX: number, delta: number) {
      for (const [target, sign] of [[poses.left, 1], [poses.right, -1]] as const) {
        target.shoulder = MathUtils.damp(target.shoulder, Math.max(0, lookX * sign) * 35, 7, delta);
      }
    },
  };
}

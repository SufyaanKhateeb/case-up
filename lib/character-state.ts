export const tricks = ["Dance", "Punching bag", "Panic", "Fly", "Vanish", "Hiccup", "Peekaboo", "Selfie", "Dizzy", "Sneeze", "Sulk"] as const;
export type Trick = (typeof tricks)[number];
export type CharacterState = {
  mode: "tour" | "trick" | "drag";
  chapter: string;
  progress: number;
  trick: Trick | null;
  actionId: number;
};
export type CharacterAction =
  | { type: "chapter"; chapter: string; progress: number }
  | { type: "trick"; trick: Trick }
  | { type: "drag" }
  | { type: "release" }
  | { type: "finish" };

export const initialCharacter: CharacterState = { mode: "tour", chapter: "hero", progress: 0, trick: null, actionId: 0 };

export function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
  switch (action.type) {
    case "chapter": return { ...state, chapter: action.chapter, progress: Math.min(1, Math.max(0, action.progress)) };
    case "drag": return { ...state, mode: "drag", trick: null };
    case "trick": return state.mode === "drag" ? state : { ...state, mode: "trick", trick: action.trick, actionId: state.actionId + 1 };
    case "release": return { ...state, mode: "tour", trick: null };
    case "finish": return state.mode === "drag" ? state : { ...state, mode: "tour", trick: null };
  }
}

export function chapterStep(progress: number, count = 3) {
  return Math.min(count - 1, Math.floor(Math.max(0, progress) * count));
}

export function scratchComplete(cleared: number, total: number) {
  return total > 0 && cleared / total >= 0.42;
}

export function readPreference(storage: Pick<Storage, "getItem"> | null, key: string) {
  try { return storage?.getItem(key) === "true"; } catch { return false; }
}

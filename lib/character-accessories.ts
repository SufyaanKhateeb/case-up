export const characterAccessories = [
  { id: "headphones", label: "Headphones", icon: "♫" },
  { id: "glasses", label: "Sunglasses", icon: "▰–▰" },
  { id: "watch", label: "Watch", icon: "◴" },
] as const;
export type CharacterAccessory = typeof characterAccessories[number]["id"];
export function isCharacterAccessory(value: string): value is CharacterAccessory {
  return characterAccessories.some((item) => item.id === value);
}

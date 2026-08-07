import type { PlaceMarkSpec, TalkAddress } from "@/features/talk/types";

/** Dusk-family gradient pairs — evergreen, moss, pine, amber-firefly. No neon. */
const GRADIENTS: Array<[string, string]> = [
  ["#4e664a", "#8a9e7c"],
  ["#3e4836", "#607c5a"],
  ["#2f4a3f", "#6a8064"],
  ["#546a3e", "#9db07e"],
  ["#4a5a52", "#84a37c"],
  ["#6b5836", "#c68a4a"],
  ["#3a4a52", "#6a8480"],
];

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function initialsFor(name: string, address: TalkAddress): string {
  const source = (name || address || "?").trim();
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function markFor(name: string, address: TalkAddress): PlaceMarkSpec {
  const gradient = GRADIENTS[hash(address) % GRADIENTS.length];
  return { initials: initialsFor(name, address), gradient };
}

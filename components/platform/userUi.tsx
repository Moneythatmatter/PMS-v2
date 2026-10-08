import { cn } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

const avatarTone = (seed: string) =>
  AVATAR_TONES[[...seed].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];

export function Avatar({ name, seed, size = "md" }: { name: string; seed: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs",
        avatarTone(seed),
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

const TINT_CLASS: Record<string, string> = {
  accent: "bg-accent-tint",
  good: "bg-good-tint",
  warn: "bg-warn-tint",
  bad: "bg-bad-tint",
};

export default function EmojiBadge({
  emoji,
  tint = "accent",
  size = 38,
}: {
  emoji: string;
  tint?: "accent" | "good" | "warn" | "bad";
  size?: number;
}) {
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full ${TINT_CLASS[tint]}`}
      style={{ width: size, height: size, fontSize: size * 0.5, lineHeight: 1 }}
    >
      {emoji}
    </span>
  );
}

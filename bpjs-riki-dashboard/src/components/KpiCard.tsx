export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-good-text"
      : tone === "warn"
        ? "text-warn-text"
        : tone === "bad"
          ? "text-bad-text"
          : "text-ink";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">{label}</div>
      <div className={`mt-2 break-words font-mn text-2xl font-extrabold sm:text-3xl ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-secondary">{sub}</div>}
    </div>
  );
}

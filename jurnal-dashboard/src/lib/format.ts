export function formatTanggal(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTanggalPendek(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function formatJam(jam: number | null) {
  if (jam === null || jam === undefined) return "—";
  return `${jam.toFixed(1)} jam`;
}

export function formatPct(pct: number | null) {
  if (pct === null || pct === undefined) return "—";
  return `${Math.round(pct * 100)}%`;
}

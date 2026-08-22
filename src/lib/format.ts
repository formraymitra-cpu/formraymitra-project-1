export function formatRupiah(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return "Rp " + Math.round(v).toLocaleString("id-ID");
}

export function formatRupiahCompact(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (abs >= 1_000_000) return `Rp ${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return formatRupiah(v);
}

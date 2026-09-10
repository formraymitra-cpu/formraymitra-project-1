import type { LokasiStatus } from "../types";

export const STATUS_STYLE: Record<LokasiStatus, { bg: string; text: string; dot: string; label: string }> = {
  selesai: { bg: "bg-good-tint", text: "text-good-text", dot: "bg-good", label: "Selesai" },
  proses: { bg: "bg-warn-tint", text: "text-warn-text", dot: "bg-warn", label: "Proses" },
  belum: { bg: "bg-bad-tint", text: "text-bad-text", dot: "bg-bad", label: "Belum Mulai" },
  "no-data": { bg: "bg-surface-alt", text: "text-ink-tertiary", dot: "bg-border-strong", label: "N/A" },
};

export const KES_COLOR = "#2f6fed";
export const TK_COLOR = "#0f9d8c";

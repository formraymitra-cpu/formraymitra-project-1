import type { Status } from "../types";
import { Check, Clock } from "./icons";

const CONFIG: Record<Status, { label: string; cls: string; icon: "check" | "clock" | null }> = {
  selesai: { label: "Selesai", cls: "bg-good-tint text-good-text", icon: "check" },
  proses: { label: "Proses", cls: "bg-warn-tint text-warn-text", icon: "clock" },
  overdue: { label: "Overdue", cls: "bg-bad-tint text-bad-text", icon: "clock" },
  "no-data": { label: "Tidak ada data", cls: "bg-surface-alt text-ink-tertiary", icon: null },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${c.cls}`}>
      {c.icon === "check" && <Check />}
      {c.icon === "clock" && <Clock />}
      {c.label}
    </span>
  );
}

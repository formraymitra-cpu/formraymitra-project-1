import type { LokasiStatus } from "../types";
import { STATUS_STYLE } from "../lib/colors";

export function StatusPill({ status }: { status: LokasiStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function CheckDot({ value }: { value: boolean | null | undefined }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-good-tint text-good-text" title="Selesai">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-bad-tint text-bad-text" title="Belum">
        ✕
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-alt text-ink-tertiary" title="Tidak berlaku">
      –
    </span>
  );
}

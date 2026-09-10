import { Fragment, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useDataset } from "../useDataset";
import type { ShellContext } from "../AppShell";
import { CheckDot, StatusPill } from "../components/StatusPill";
import { STAGE_DEFS, type LokasiStatus } from "../types";

const STATUS_OPTIONS: { value: LokasiStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "selesai", label: "Selesai" },
  { value: "proses", label: "Proses" },
  { value: "belum", label: "Belum Mulai" },
  { value: "no-data", label: "Tidak Ada Data" },
];

export default function LocationDetail() {
  const { monthCode } = useOutletContext<ShellContext>();
  const dataset = useDataset();
  const month = dataset.months.find((m) => m.code === monthCode)!;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LokasiStatus | "all">("all");

  const locations = useMemo(() => dataset.locations.filter((l) => l.month === monthCode), [dataset.locations, monthCode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (q && !l.lokasi.toLowerCase().includes(q) && !(l.note ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [locations, query, status]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-mn text-2xl font-extrabold text-ink">Detail per Lokasi — {month.label}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Checklist lengkap tiap tahap per lokasi/klien. Menampilkan {filtered.length} dari {locations.length} lokasi.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Cari nama lokasi atau catatan..."
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as LokasiStatus | "all")}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-alt text-left text-xs text-ink-tertiary">
              <th className="sticky left-0 z-10 min-w-[220px] bg-surface-alt px-3 py-2 font-semibold">Lokasi</th>
              {STAGE_DEFS.map((def) => (
                <th key={def.key} className="px-2 py-2 text-center font-semibold" colSpan={def.hasKes ? 2 : 1}>
                  {def.label}
                </th>
              ))}
              <th className="px-3 py-2 font-semibold">Catatan</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
            <tr className="border-b border-border text-[10px] text-ink-tertiary">
              <th className="sticky left-0 z-10 bg-surface" />
              {STAGE_DEFS.flatMap((def) => (def.hasKes ? [`${def.key}-kes`, `${def.key}-tk`] : [`${def.key}-tk`])).map(
                (k) => (
                  <th key={k} className="px-1 py-1 text-center font-medium">
                    {k.endsWith("kes") ? "KES" : "TK"}
                  </th>
                ),
              )}
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={`${l.month}-${l.no}-${l.lokasi}`} className="border-b border-border last:border-0 hover:bg-surface-alt/60">
                <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium text-ink">{l.lokasi}</td>
                {STAGE_DEFS.map((def) => {
                  const pair = l.stages[def.key];
                  return def.hasKes ? (
                    <Fragment key={def.key}>
                      <td className="px-1 py-2 text-center">
                        <CheckDot value={pair.kes} />
                      </td>
                      <td className="px-1 py-2 text-center">
                        <CheckDot value={pair.tk} />
                      </td>
                    </Fragment>
                  ) : (
                    <td key={`${def.key}-tk`} className="px-1 py-2 text-center">
                      <CheckDot value={pair.tk} />
                    </td>
                  );
                })}
                <td className="max-w-[220px] px-3 py-2 text-xs text-ink-secondary">{l.note ?? "-"}</td>
                <td className="px-3 py-2">
                  <StatusPill status={l.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-8 text-center text-sm text-ink-tertiary">
                  Tidak ada lokasi yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

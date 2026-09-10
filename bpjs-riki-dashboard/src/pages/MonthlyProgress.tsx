import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useDataset } from "../useDataset";
import type { ShellContext } from "../AppShell";
import { FunnelChart } from "../components/charts";
import { KpiCard } from "../components/KpiCard";
import { formatPct } from "../lib/format";
import { STAGE_DEFS, type LocationRow } from "../types";

function stageDone(loc: LocationRow, key: (typeof STAGE_DEFS)[number]["key"], hasKes: boolean): boolean {
  const pair = loc.stages[key];
  const cells = hasKes ? [pair.kes, pair.tk] : [pair.tk];
  const applicable = cells.filter((c) => c !== null && c !== undefined);
  if (applicable.length === 0) return false;
  return applicable.every((c) => c === true);
}

export default function MonthlyProgress() {
  const { monthCode } = useOutletContext<ShellContext>();
  const dataset = useDataset();
  const month = dataset.months.find((m) => m.code === monthCode)!;
  const locations = useMemo(() => dataset.locations.filter((l) => l.month === monthCode), [dataset.locations, monthCode]);

  const funnelSteps = STAGE_DEFS.map((def) => ({
    label: def.label,
    count: locations.filter((l) => stageDone(l, def.key, def.hasKes)).length,
    total: locations.length,
  }));

  const lokasiTuntas = locations.filter((l) => l.status === "selesai").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mn text-2xl font-extrabold text-ink">Progress Bulanan — {month.label}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Alur 6 tahap pengurusan BPJS: makin sempit funnel, makin banyak lokasi yang tertahan di tahap itu.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total Lokasi Bulan Ini" value={String(month.totalLokasi)} />
        <KpiCard label="% Selesai Keseluruhan" value={formatPct(month.overallPct)} />
        <KpiCard label="Lokasi Tuntas Semua Tahap" value={`${lokasiTuntas} / ${locations.length}`} tone="good" />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-mn text-sm font-bold text-ink">Funnel Tahapan Pengurusan</h2>
        <p className="mb-4 text-xs text-ink-secondary">
          Jumlah lokasi yang sudah tuntas di tiap tahap (KES &amp; TK dianggap tuntas bila keduanya selesai)
        </p>
        <FunnelChart steps={funnelSteps} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-mn text-sm font-bold text-ink">Interpretasi</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-secondary">
          {funnelSteps.map((s, i) => {
            const prev = i > 0 ? funnelSteps[i - 1] : null;
            const drop = prev ? prev.count - s.count : 0;
            return (
              <li key={s.label}>
                <span className="font-semibold text-ink">{s.label}</span>: {s.count} lokasi tuntas
                {prev && drop > 0 && <span className="text-bad-text"> (turun {drop} dari tahap sebelumnya)</span>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

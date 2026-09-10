import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useDataset } from "../useDataset";
import type { ShellContext } from "../AppShell";
import { KpiCard } from "../components/KpiCard";
import { DonutChart, KesTkLegend, StageBarChart, TrendLineChart } from "../components/charts";
import { formatPct, formatRupiah } from "../lib/format";
import { STAGE_DEFS } from "../types";

export default function Overview() {
  const { monthCode } = useOutletContext<ShellContext>();
  const dataset = useDataset();
  const month = dataset.months.find((m) => m.code === monthCode)!;

  const totalTagihan = useMemo(() => dataset.payments.reduce((a, p) => a + p.total, 0), [dataset.payments]);

  const stageBarData = STAGE_DEFS.map((def) => {
    const counts = month.stages[def.key] as { kes?: { selesai: number; belum: number }; tk?: { selesai: number; belum: number } };
    const pct = (c?: { selesai: number; belum: number }) => {
      if (!c) return null;
      const applicable = c.selesai + c.belum;
      return applicable > 0 ? (c.selesai / applicable) * 100 : null;
    };
    return {
      label: def.label,
      kesPct: def.hasKes ? pct(counts.kes) : null,
      tkPct: pct(counts.tk),
    };
  });

  const trendPoints = dataset.months.map((m) => ({
    label: m.label.split(" ")[0].slice(0, 3),
    value: m.overallPct ?? 0,
  }));

  const belumDisentuh = month.lokasiBelum + month.lokasiNoData;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mn text-2xl font-extrabold text-ink">Ringkasan — {month.label}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Progress penanganan BPJS Kesehatan &amp; Ketenagakerjaan untuk seluruh lokasi/klien.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total Lokasi" value={String(month.totalLokasi)} />
        <KpiCard
          label="% Penyelesaian"
          value={formatPct(month.overallPct)}
          tone={month.overallPct !== null && month.overallPct >= 80 ? "good" : month.overallPct !== null && month.overallPct >= 30 ? "warn" : "bad"}
        />
        <KpiCard label="Lokasi Selesai Tuntas" value={String(month.lokasiSelesai)} tone="good" />
        <KpiCard label="Belum Disentuh" value={String(belumDisentuh)} tone={belumDisentuh > 0 ? "bad" : "default"} />
        <KpiCard label="Total Tagihan (Rumah Baru)" value={formatRupiah(totalTagihan)} sub={`${dataset.payments.length} lokasi baru`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-mn text-sm font-bold text-ink">Progress per Tahapan</h2>
          <p className="mb-4 text-xs text-ink-secondary">% lokasi yang sudah menyelesaikan tiap tahap, {month.label}</p>
          <div className="mb-4">
            <KesTkLegend />
          </div>
          <StageBarChart data={stageBarData} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-mn text-sm font-bold text-ink">Status Keseluruhan Lokasi</h2>
          <p className="mb-4 text-xs text-ink-secondary">Distribusi status semua lokasi, {month.label}</p>
          <DonutChart
            segments={[
              { label: "Selesai", value: month.lokasiSelesai, color: "#3fae5a" },
              { label: "Proses", value: month.lokasiProses, color: "#e2a53a" },
              { label: "Belum Mulai", value: month.lokasiBelum, color: "#d9534f" },
              { label: "Tidak Ada Data", value: month.lokasiNoData, color: "#c7cbd4" },
            ]}
            centerLabel={`${month.totalLokasi} lokasi`}
          />
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-mn text-sm font-bold text-ink">Tren Penyelesaian Antar Bulan</h2>
        <p className="mb-4 text-xs text-ink-secondary">April – Agustus 2026</p>
        <TrendLineChart points={trendPoints} />
      </section>
    </div>
  );
}

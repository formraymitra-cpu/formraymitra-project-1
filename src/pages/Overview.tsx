import { Fragment, useMemo } from "react";
import { useDataset } from "../useDataset";
import { Warning, ArrowRight } from "../components/icons";
import { linePoints, areaPoints, xFor, yFor } from "../lib/chart";
import { COLORS } from "../lib/colors";
import type { Status } from "../types";

const STATUS_COLOR: Record<Status, string> = {
  selesai: COLORS.good,
  proses: COLORS.warn,
  overdue: COLORS.bad,
  "no-data": "oklch(93% 0.004 260)",
};

const MONTH_SHORT: Record<string, string> = {
  "2026-02": "Feb",
  "2026-03": "Mar",
  "2026-04": "Apr",
  "2026-05": "Mei",
  "2026-06": "Jun",
  "2026-07": "Jul",
  "2026-08": "Agu",
};

export default function Overview() {
  const d = useDataset();
  const current = d.months.find((m) => m.code === d.currentMonth)!;
  const closedMonths = d.months.filter((m) => m.isClosed);

  const avgLaporan = useMemo(
    () => Math.round((closedMonths.reduce((s, m) => s + (m.laporanPct ?? 0), 0) / closedMonths.length) * 100),
    [closedMonths]
  );
  const avgAbsensi = useMemo(
    () => Math.round((closedMonths.reduce((s, m) => s + (m.absensiPct ?? 0), 0) / closedMonths.length) * 100),
    [closedMonths]
  );

  const belumLengkap = current.totalLokasi - current.keduanyaSelesai;
  const curLaporanPct = Math.round((current.laporanPct ?? 0) * 100);
  const curAbsensiPct = Math.round((current.absensiPct ?? 0) * 100);

  const laporanSeries = d.months.map((m) => Math.round((m.laporanPct ?? 0) * 100));
  const absensiSeries = d.months.map((m) => Math.round((m.absensiPct ?? 0) * 100));

  const topRisky = d.heatmap.slice(0, 12);

  const tipeTotal = d.tipeCounts.LAMA + d.tipeCounts.BARU + d.tipeCounts.TIDAK_DIKETAHUI;

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Ringkasan Eksekutif</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Status kepatuhan Laporan Bulanan &amp; Absensi seluruh lokasi &middot; {current.label} (berjalan, s.d.{" "}
          {new Date(d.asOfDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Compliance Laporan Bulanan
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight">{curLaporanPct}%</span>
            <span className="text-xs font-bold text-good-text">rata-rata {avgLaporan}%</span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">
            {current.laporanSelesai} dari {current.totalLokasi} lokasi selesai s.d. hari ini
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Compliance Absensi</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight text-bad-text">{curAbsensiPct}%</span>
            <span className="text-xs font-bold text-ink-tertiary">rata-rata {avgAbsensi}%</span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">
            {current.absensiSelesai} dari {current.totalLokasi} lokasi selesai s.d. hari ini
          </span>
        </div>

        <div className="rounded-2xl border border-[oklch(85%_0.06_25)] bg-bad-tint p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-bad-text">
            Lokasi Belum Lengkap (Berpotensi Menahan Invoice)
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight text-bad-text">{belumLengkap}</span>
            <Warning className="text-bad" />
          </div>
          <span className="mt-2 block text-xs text-bad-text">
            Laporan dan/atau Absensi belum lengkap, deadline akhir {current.label}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Lokasi Aktif Wajib Lapor
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight">{d.totalLokasiAktif}</span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">
            {d.totalLokasiDikecualikan} lokasi lain dikecualikan dari kewajiban
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3.5 rounded-xl border border-[oklch(80%_0.08_75)] border-l-4 border-l-warn bg-warn-tint px-5 py-4">
        <Warning className="mt-0.5 flex-shrink-0 text-warn-text" />
        <div>
          <div className="font-mn text-sm font-bold">Insight utama: kesenjangan Laporan vs Absensi</div>
          <div className="mt-1 text-[13.5px] leading-relaxed text-ink-secondary">
            Dari {closedMonths.length} bulan terakhir yang sudah closed ({MONTH_SHORT[closedMonths[0]?.code]}&ndash;
            {MONTH_SHORT[closedMonths[closedMonths.length - 1]?.code]}), kepatuhan Laporan Bulanan rata-rata{" "}
            <strong>{avgLaporan}%</strong>, tapi kepatuhan Absensi rata-rata hanya <strong>{avgAbsensi}%</strong>.
            Karena kedua syarat wajib selesai untuk penagihan invoice, gap ini berisiko menahan pencairan meski
            laporan sudah lengkap.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">Tren Kepatuhan Bulanan</span>
            <div className="flex items-center gap-4 text-xs font-semibold text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.good }} />
                Laporan Bulanan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.bad }} />
                Absensi
              </span>
            </div>
          </div>
          <svg viewBox="0 0 800 300" width="100%" height="290">
            {[10, 70, 130, 190].map((y) => (
              <line key={y} x1={40} y1={y} x2={760} y2={y} stroke={COLORS.border} strokeDasharray="3 4" />
            ))}
            <line x1={40} y1={250} x2={760} y2={250} stroke={COLORS.borderStrong} />
            {[100, 75, 50, 25, 0].map((v, i) => (
              <text key={v} x={32} y={[14, 74, 134, 194, 254][i]} textAnchor="end" fontSize={11} fill={COLORS.inkTertiary}>
                {v}%
              </text>
            ))}
            <polygon points={areaPoints(laporanSeries, absensiSeries)} fill={COLORS.warn} fillOpacity={0.1} />
            <polyline points={linePoints(laporanSeries)} fill="none" stroke={COLORS.good} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={linePoints(absensiSeries)} fill="none" stroke={COLORS.bad} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {laporanSeries.map((v, i) => (
              <circle key={i} cx={xFor(i, laporanSeries.length)} cy={yFor(v)} r={4} fill={COLORS.good} />
            ))}
            {absensiSeries.map((v, i) => (
              <circle key={i} cx={xFor(i, absensiSeries.length)} cy={yFor(v)} r={4} fill={COLORS.bad} />
            ))}
            {d.months.map((m, i) => (
              <text
                key={m.code}
                x={xFor(i, d.months.length)}
                y={268}
                textAnchor="middle"
                fontSize={12}
                fontWeight={m.isClosed ? 600 : 700}
                fill={m.isClosed ? COLORS.inkTertiary : COLORS.inkSecondary}
              >
                {MONTH_SHORT[m.code]}
                {!m.isClosed ? "*" : ""}
              </text>
            ))}
            <text x={xFor(d.months.length - 1, d.months.length)} y={284} textAnchor="middle" fontSize={10} fill={COLORS.inkTertiary}>
              *berjalan
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <div>
            <div className="font-mn text-[15px] font-bold">Distribusi Tipe Client</div>
            <div className="mt-0.5 text-xs text-ink-tertiary">Dari {d.totalLokasiAktif} lokasi aktif bulan ini</div>
          </div>
          {(
            [
              ["Client Lama", d.tipeCounts.LAMA, COLORS.good],
              ["Client Baru", d.tipeCounts.BARU, COLORS.warn],
              ["Tidak diketahui", d.tipeCounts.TIDAK_DIKETAHUI, COLORS.inkTertiary],
            ] as const
          ).map(([label, count, color]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{label}</span>
                <span className="text-ink-tertiary">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full" style={{ width: `${(count / tipeTotal) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
          <div className="mt-auto text-[11.5px] leading-relaxed text-ink-tertiary">
            Tipe client hanya berhasil dicocokkan dari master client 2026 untuk sebagian lokasi &mdash; sisanya belum
            tercatat, bukan berarti tidak tergolong.
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mn text-[15px] font-bold">Riwayat Kepatuhan per Lokasi</span>
            <span className="ml-2.5 text-xs text-ink-tertiary">
              Menampilkan {topRisky.length} dari {d.heatmap.length} lokasi, diurutkan berdasarkan risiko
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 text-[11.5px] font-semibold text-ink-secondary">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: COLORS.good }} />
              Selesai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: COLORS.warn }} />
              Proses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: COLORS.bad }} />
              Overdue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px] border border-border-strong" style={{ background: "oklch(93% 0.004 260)" }} />
              Tidak ada data
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[760px] items-center gap-1.5"
            style={{ gridTemplateColumns: `200px repeat(${d.months.length}, 1fr)` }}
          >
            <span />
            {d.months.map((m) => (
              <span key={m.code} className="text-center text-[11px] font-bold uppercase text-ink-tertiary">
                {MONTH_SHORT[m.code]}
                {!m.isClosed ? "*" : ""}
              </span>
            ))}
            {topRisky.map((site) => (
              <Fragment key={site.baseKey}>
                <span className="truncate text-[13px] font-semibold">{site.baseKey}</span>
                {site.cells.map((c, i) => (
                  <div
                    key={i}
                    className="h-8 rounded-md"
                    style={{
                      background: STATUS_COLOR[c.status],
                      border: c.status === "no-data" ? `1px solid ${COLORS.borderStrong}` : undefined,
                      outline: !d.months[i].isClosed ? `1.5px dashed ${COLORS.borderStrong}` : undefined,
                      outlineOffset: !d.months[i].isClosed ? "-1.5px" : undefined,
                    }}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="mt-2.5 text-[11px] text-ink-tertiary">
          *kolom bulan berjalan bergaris putus-putus &mdash; status sementara. Sel abu-abu berarti lokasi tidak
          ditemukan pada roster bulan tersebut (mis. penamaan berubah / belum tercatat).
        </div>
      </div>

      <a href="#/monitoring" className="flex items-center gap-1 self-start text-[13px] font-bold text-accent no-underline">
        Lihat detail semua lokasi di Monitoring Harian
        <ArrowRight />
      </a>
    </div>
  );
}

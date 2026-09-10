import { useDataset } from "../useDataset";
import { COLORS } from "../lib/colors";
import { linePoints, xFor, yFor } from "../lib/chart";
import { formatTanggal, formatJam, formatPct } from "../lib/format";
import EmojiBadge from "../components/EmojiBadge";
import DinoGreeting from "../components/DinoGreeting";

function pctColor(pct: number | null) {
  if (pct === null) return COLORS.inkTertiary;
  if (pct >= 0.9) return COLORS.good;
  if (pct >= 0.7) return COLORS.warn;
  return COLORS.bad;
}

function daysInMonth(code: string) {
  const [y, m] = code.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export default function Overview() {
  const d = useDataset();

  const jamSeries = d.months.map((m) => m.rataJamKerja ?? 0);
  const maxJam = Math.max(8, ...jamSeries);

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Ringkasan Eksekutif</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Rekap jurnal harian &middot; {d.rentangTanggal.mulai ? formatTanggal(d.rentangTanggal.mulai) : "—"} s.d.{" "}
          {d.rentangTanggal.akhir ? formatTanggal(d.rentangTanggal.akhir) : "—"}
        </p>
      </div>

      <DinoGreeting
        size={72}
        message={
          <>
            aku sudah menemani {d.totalHariTercatat} hari kerja, mencatat {d.totalTugas} tugas (
            <strong className="text-good-text">{formatPct(d.pctSelesaiKeseluruhan)}</strong> selesai), dan menyimpan{" "}
            {d.totalFoto} foto bukti kerja.
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Hari Tercatat</span>
            <EmojiBadge emoji="🗓️" tint="accent" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight">{d.totalHariTercatat}</span>
            <span className="text-xs font-bold text-ink-tertiary">hari</span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">di {d.months.length} bulan berjalan</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Total Tugas</span>
            <EmojiBadge emoji="✅" tint="good" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight">{d.totalTugas}</span>
            <span className="text-xs font-bold text-good-text">{formatPct(d.pctSelesaiKeseluruhan)} selesai</span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">
            {d.totalSelesai} selesai dari {d.totalTugas} tugas tercatat
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Rata-rata Jam Kerja</span>
            <EmojiBadge emoji="⏰" tint="warn" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight">
              {formatJam(d.rataJamKerjaKeseluruhan)}
            </span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">per hari, dari jam masuk s.d. jam pulang</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Dokumentasi Foto
            </span>
            <EmojiBadge emoji="📸" tint="accent" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[34px] font-extrabold tracking-tight">{d.totalFoto}</span>
          </div>
          <span className="mt-2 block text-xs text-ink-tertiary">screenshot bukti progres/hasil kerja</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">🎯 % Tugas Selesai per Bulan</span>
          </div>
          <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
            {d.months.map((m) => {
              const pct = m.pctSelesai ?? 0;
              const h = Math.max(4, pct * 160);
              return (
                <div key={m.code} className="flex min-w-[52px] flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-ink-secondary">{formatPct(m.pctSelesai)}</span>
                  <div className="flex h-[160px] w-8 items-end rounded-md bg-surface-alt">
                    <div
                      className="w-full rounded-md"
                      style={{ height: h, background: pctColor(m.pctSelesai) }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-tertiary">{m.label.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">⏱️ Rata-rata Jam Kerja per Bulan</span>
          </div>
          <svg viewBox="0 0 800 300" width="100%" height="230">
            {[10, 70, 130, 190, 250].map((y) => (
              <line key={y} x1={40} y1={y} x2={760} y2={y} stroke={COLORS.border} strokeDasharray="3 4" />
            ))}
            <line x1={40} y1={250} x2={760} y2={250} stroke={COLORS.borderStrong} />
            {jamSeries.map((v, i) => (
              <circle key={i} cx={xFor(i, jamSeries.length)} cy={yFor(v, maxJam)} r={4} fill={COLORS.accent} />
            ))}
            <polyline
              points={linePoints(jamSeries, maxJam)}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {d.months.map((m, i) => (
              <text key={m.code} x={xFor(i, d.months.length)} y={268} textAnchor="middle" fontSize={12} fontWeight={600} fill={COLORS.inkSecondary}>
                {m.label.split(" ")[0]}
              </text>
            ))}
          </svg>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mn text-[15px] font-bold">🗓️ Cakupan Hari Terisi per Bulan</span>
          <span className="text-xs text-ink-tertiary">hari tercatat vs total hari kalender bulan tsb.</span>
        </div>
        <div className="flex flex-col gap-3">
          {d.months.map((m) => {
            const total = daysInMonth(m.code);
            const pct = total ? m.hariTercatat / total : 0;
            return (
              <div key={m.code} className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 text-[13px] font-semibold">{m.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct * 100}%`, background: COLORS.accent }}
                  />
                </div>
                <span className="w-20 flex-shrink-0 text-right text-xs font-semibold text-ink-tertiary">
                  {m.hariTercatat}/{total} hari
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

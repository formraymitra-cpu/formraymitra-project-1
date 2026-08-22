import { usePayrollDataset } from "../../usePayrollDataset";
import { formatRupiah, formatRupiahCompact } from "../../lib/format";
import { COLORS } from "../../lib/colors";
import { Warning, ArrowRight } from "../../components/icons";

const KPI_CARDS: { key: keyof ReturnType<typeof usePayrollDataset>["kpi"]; label: string }[] = [
  { key: "totalRab", label: "Total RAB" },
  { key: "totalGaji", label: "Total Gaji" },
  { key: "totalDiterimaKaryawan", label: "Total Diterima Karyawan" },
  { key: "totalBpjsKes", label: "Total BPJS Kes" },
  { key: "totalBpjsTk", label: "Total BPJS TK" },
  { key: "totalPayroll", label: "Total Payroll" },
  { key: "totalGajiTertransfer", label: "Total Gaji Tertransfer" },
];

export default function PayrollOverview() {
  const d = usePayrollDataset();
  const { kpi } = d;

  const cakupanPct = d.totalLokasi ? Math.round(((d.totalLokasi - d.lokasiBelumAdaRekonsiliasi) / d.totalLokasi) * 100) : 0;
  const notiTinggi = d.notices.filter((n) => n.severity === "tinggi");
  const topNotices = notiTinggi.slice(0, 5);

  const maxMonthly = Math.max(1, ...d.monthlyTotals.map((m) => Math.max(m.totalGaji, m.totalRab)));

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Ringkasan Payroll</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          {d.periodeLabel || d.periode} &middot; s.d.{" "}
          {new Date(d.asOfDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          {d.periodeSelesai && (
            <>
              {" "}
              &middot; periode berakhir{" "}
              {new Date(d.periodeSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((c) => (
          <div key={c.key} className="rounded-2xl border border-border bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">{c.label}</span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mn text-[22px] font-extrabold tracking-tight sm:text-[24px]">
                {formatRupiahCompact(kpi[c.key] as number)}
              </span>
            </div>
            <span className="mt-1.5 block text-[11px] text-ink-tertiary">{formatRupiah(kpi[c.key] as number)}</span>
          </div>
        ))}

        <div className="rounded-2xl border border-border bg-surface p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Cakupan Rekonsiliasi</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mn text-[22px] font-extrabold tracking-tight sm:text-[24px]">{cakupanPct}%</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-ink-tertiary">
            {d.totalLokasi - d.lokasiBelumAdaRekonsiliasi} dari {d.totalLokasi} lokasi sudah masuk proses rekonsiliasi
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3.5 rounded-xl border border-[oklch(80%_0.08_75)] border-l-4 border-l-warn bg-warn-tint px-5 py-4">
        <Warning className="mt-0.5 flex-shrink-0 text-warn-text" />
        <div>
          <div className="font-mn text-sm font-bold">
            Selisih Rp {formatRupiah(kpi.selisihRole1).replace("Rp ", "")} untuk lokasi yang sudah masuk rekonsiliasi
          </div>
          <div className="mt-1 text-[13.5px] leading-relaxed text-ink-secondary">
            Dari total kewajiban (Diterima + BPJS Kes + BPJS TK + Payroll) sebesar{" "}
            <strong>{formatRupiah(kpi.kewajibanTerekonsiliasi)}</strong> pada lokasi yang sudah dicek terhadap mutasi
            bank, baru <strong>{formatRupiah(kpi.totalGajiTertransfer)}</strong> yang cocok/terverifikasi
            tertransfer. Sisa <strong>{formatRupiah(kpi.kewajibanBelumRekonsiliasi)}</strong> ada di{" "}
            {d.lokasiBelumAdaRekonsiliasi} lokasi yang belum masuk proses rekonsiliasi sama sekali (wajar bila
            periode masih berjalan) &mdash; lihat halaman Progres Payroll untuk rinciannya.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">Rekap vs Gaji Tertransfer per Bulan</span>
            <div className="flex items-center gap-4 text-xs font-semibold text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.good }} />
                Total Gaji
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "oklch(83% 0.008 260)" }} />
                Total RAB
              </span>
            </div>
          </div>
          <div className="flex items-end gap-6 overflow-x-auto pb-2 pt-4">
            {d.monthlyTotals.map((m) => (
              <div key={m.code} className="flex flex-shrink-0 flex-col items-center gap-1.5" style={{ width: 88 }}>
                <div className="flex h-[180px] items-end gap-1.5">
                  <div
                    className="w-6 rounded-t-md"
                    style={{ height: `${(m.totalGaji / maxMonthly) * 180}px`, background: COLORS.good }}
                    title={formatRupiah(m.totalGaji)}
                  />
                  <div
                    className="w-6 rounded-t-md"
                    style={{ height: `${(m.totalRab / maxMonthly) * 180}px`, background: "oklch(83% 0.008 260)" }}
                    title={formatRupiah(m.totalRab)}
                  />
                </div>
                <span className="text-[11px] font-bold text-ink-secondary">{m.label}</span>
                <span className="text-[10px] text-ink-tertiary">{m.lokasiTerisi}/{m.totalLokasi} lokasi</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-ink-tertiary">
            RAB baru terisi untuk sebagian kecil lokasi ({kpi.lokasiRabTerisi} dari {d.totalLokasi} bulan ini) &mdash;
            data historis "Gaji Tertransfer" per lokasi hanya tersedia untuk periode berjalan karena file
            rekonsiliasi dibuat baru tiap bulan.
          </div>
        </div>

        <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5">
          <div>
            <div className="font-mn text-[15px] font-bold">Notice Prioritas Tinggi</div>
            <div className="mt-0.5 text-xs text-ink-tertiary">{notiTinggi.length} notice perlu tindak lanjut segera</div>
          </div>
          {topNotices.length === 0 && (
            <div className="rounded-lg bg-good-tint px-3.5 py-3 text-[13px] font-semibold text-good-text">
              Tidak ada notice prioritas tinggi saat ini.
            </div>
          )}
          {topNotices.map((n) => (
            <div key={n.id} className="rounded-lg border border-[oklch(85%_0.06_25)] bg-bad-tint px-3.5 py-2.5">
              <div className="text-[12.5px] font-bold text-bad-text">{n.lokasi}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-ink-secondary">{n.keterangan}</div>
            </div>
          ))}
          <a
            href="#/payroll/notice"
            className="mt-auto flex items-center gap-1 self-start text-[13px] font-bold text-accent no-underline"
          >
            Lihat semua notice
            <ArrowRight />
          </a>
        </div>
      </div>

      <a href="#/payroll/detail" className="flex items-center gap-1 self-start text-[13px] font-bold text-accent no-underline">
        Lihat detail rekap gaji per lokasi
        <ArrowRight />
      </a>
    </div>
  );
}

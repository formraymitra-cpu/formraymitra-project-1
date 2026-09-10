import { useDataset } from "../useDataset";
import { formatJam, formatPct } from "../lib/format";
import { Download } from "../components/icons";

function toCsv(rows: ReturnType<typeof useDataset>["months"]) {
  const header = ["Bulan", "Hari Tercatat", "Total Tugas", "Selesai", "Belum", "% Selesai", "Rata-rata Jam Kerja", "Total Foto"];
  const lines = rows.map((m) =>
    [
      m.label,
      m.hariTercatat,
      m.totalTugas,
      m.selesai,
      m.totalTugas - m.selesai,
      m.pctSelesai !== null ? Math.round(m.pctSelesai * 100) + "%" : "",
      m.rataJamKerja ?? "",
      m.totalFoto,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RekapBulanan() {
  const d = useDataset();

  const totalTugas = d.months.reduce((s, m) => s + m.totalTugas, 0);
  const totalSelesai = d.months.reduce((s, m) => s + m.selesai, 0);
  const totalFoto = d.months.reduce((s, m) => s + m.totalFoto, 0);
  const totalHari = d.months.reduce((s, m) => s + m.hariTercatat, 0);

  return (
    <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">📆 Rekap Bulanan</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">Ringkasan tugas &amp; jam kerja per bulan</p>
        </div>
        <button
          onClick={() => downloadCsv(toCsv(d.months), "rekap-bulanan-jurnal.csv")}
          className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-secondary"
        >
          <Download />
          Unduh CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[1.2fr_110px_100px_100px_100px_100px_140px_100px] items-center gap-3 border-b border-border-strong px-5 py-3">
              {["🗓️ Bulan", "Hari Tercatat", "📋 Total Tugas", "✅ Selesai", "⏳ Belum", "% Selesai", "⏰ Rata-rata Jam Kerja", "📸 Foto"].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {d.months.map((m) => (
              <div
                key={m.code}
                className="grid grid-cols-[1.2fr_110px_100px_100px_100px_100px_140px_100px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
              >
                <span className="text-[13.5px] font-semibold">{m.label}</span>
                <span className="text-[13px] text-ink-secondary">{m.hariTercatat}</span>
                <span className="text-[13px] text-ink-secondary">{m.totalTugas}</span>
                <span className="text-[13px] font-semibold text-good-text">{m.selesai}</span>
                <span className="text-[13px] font-semibold text-warn-text">{m.totalTugas - m.selesai}</span>
                <span className="text-[13px] font-bold">{formatPct(m.pctSelesai)}</span>
                <span className="text-[13px] text-ink-secondary">{formatJam(m.rataJamKerja)}</span>
                <span className="text-[13px] text-ink-secondary">{m.totalFoto}</span>
              </div>
            ))}
            <div className="grid grid-cols-[1.2fr_110px_100px_100px_100px_100px_140px_100px] items-center gap-3 border-t-2 border-border-strong bg-surface-alt px-5 py-3">
              <span className="text-[13.5px] font-extrabold">Total</span>
              <span className="text-[13px] font-bold">{totalHari}</span>
              <span className="text-[13px] font-bold">{totalTugas}</span>
              <span className="text-[13px] font-bold text-good-text">{totalSelesai}</span>
              <span className="text-[13px] font-bold text-warn-text">{totalTugas - totalSelesai}</span>
              <span className="text-[13px] font-bold">
                {totalTugas ? Math.round((totalSelesai / totalTugas) * 100) + "%" : "—"}
              </span>
              <span className="text-[13px] font-bold">{formatJam(d.rataJamKerjaKeseluruhan)}</span>
              <span className="text-[13px] font-bold">{totalFoto}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

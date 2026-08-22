import { useMemo } from "react";
import { usePayrollDataset } from "../../usePayrollDataset";
import { COLORS } from "../../lib/colors";
import { InfoCircle } from "../../components/icons";
import type { PayrollLocation } from "../../payrollTypes";

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-10 text-right text-[12px] font-bold text-ink-secondary">{pct}%</span>
    </div>
  );
}

const ROLE1_LABEL: Record<PayrollLocation["statusRole1"], { label: string; color: string }> = {
  sesuai: { label: "Sesuai", color: COLORS.good },
  proses: { label: "Proses", color: COLORS.warn },
  selisih: { label: "Selisih", color: COLORS.bad },
  "tanpa-data": { label: "Belum ada data", color: "oklch(83% 0.008 260)" },
};

export default function PayrollProgress() {
  const d = usePayrollDataset();

  const byPic = useMemo(() => {
    const map = new Map<string, PayrollLocation[]>();
    d.locations.forEach((l) => {
      const key = l.pic ?? "Belum diisi";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return Array.from(map.entries())
      .map(([pic, locs]) => ({
        pic,
        total: locs.length,
        sesuai: locs.filter((l) => l.statusRole1 === "sesuai").length,
        proses: locs.filter((l) => l.statusRole1 === "proses").length,
        selisih: locs.filter((l) => l.statusRole1 === "selisih").length,
        tanpaData: locs.filter((l) => l.statusRole1 === "tanpa-data").length,
      }))
      .sort((a, b) => b.total - a.total);
  }, [d.locations]);

  const statusCounts = useMemo(() => {
    const c = { sesuai: 0, proses: 0, selisih: 0, "tanpa-data": 0 } as Record<PayrollLocation["statusRole1"], number>;
    d.locations.forEach((l) => (c[l.statusRole1] += 1));
    return c;
  }, [d.locations]);

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Progres Penggajian</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          {d.periodeLabel || d.periode} &middot; status rekonsiliasi {d.totalLokasi} lokasi
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["sesuai", "Sesuai"],
            ["proses", "Masih Proses"],
            ["selisih", "Ada Selisih"],
            ["tanpa-data", "Belum Direkonsiliasi"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-2xl border border-border bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">{label}</span>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mn text-[30px] font-extrabold tracking-tight" style={{ color: ROLE1_LABEL[key].color }}>
                {statusCounts[key]}
              </span>
              <span className="text-xs text-ink-tertiary">lokasi</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[oklch(80%_0.08_75)] border-l-4 border-l-warn bg-warn-tint px-5 py-3.5">
        <InfoCircle className="mt-0.5 flex-shrink-0 text-warn-text" size={18} />
        <div className="text-[13px] leading-relaxed text-ink-secondary">
          <span className="font-bold text-ink">"Belum Direkonsiliasi"</span> berarti lokasi tersebut belum ditemukan
          di data HASIL_PENGECEKAN &mdash; bisa karena PIC belum meng-import rekap gaji lokasi itu, atau nama lokasi
          berbeda antara REKAP GAJI dan REKONSILIASI (lihat sheet MAPPING_LOKASI untuk menambahkan pemetaan manual).
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4">
          <span className="font-mn text-[15px] font-bold">Progres Rekonsiliasi per PIC Gaji</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[1.4fr_70px_2fr] items-center gap-3.5 border-b border-border-strong px-2 py-2.5">
              {["PIC", "Lokasi", "Status (Sesuai / Proses / Selisih / Belum)"].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {byPic.map((p) => (
              <div key={p.pic} className="grid grid-cols-[1.4fr_70px_2fr] items-center gap-3.5 border-b border-border px-2 py-3 last:border-b-0">
                <span className={`text-[13px] font-semibold ${p.pic === "Belum diisi" ? "italic text-ink-tertiary" : ""}`}>{p.pic}</span>
                <span className="text-[13px] text-ink-tertiary">{p.total}</span>
                <div className="flex h-4 overflow-hidden rounded-full bg-surface-alt">
                  {p.sesuai > 0 && <div style={{ width: `${(p.sesuai / p.total) * 100}%`, background: COLORS.good }} title={`${p.sesuai} sesuai`} />}
                  {p.proses > 0 && <div style={{ width: `${(p.proses / p.total) * 100}%`, background: COLORS.warn }} title={`${p.proses} proses`} />}
                  {p.selisih > 0 && <div style={{ width: `${(p.selisih / p.total) * 100}%`, background: COLORS.bad }} title={`${p.selisih} selisih`} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4">
          <span className="font-mn text-[15px] font-bold">Log Import Mutasi Bank</span>
          <span className="ml-2.5 text-xs text-ink-tertiary">Dari sheet SUMBER_MUTASI &mdash; {d.picImports.length} file diimpor</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1fr_2fr_1fr_100px] items-center gap-3.5 border-b border-border-strong px-2 py-2.5">
              {["PIC", "Nama File", "Tanggal Import", "Status"].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {d.picImports.length === 0 && (
              <div className="px-2 py-8 text-center text-sm text-ink-tertiary">Belum ada file mutasi yang diimpor untuk periode ini.</div>
            )}
            {d.picImports.map((imp, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_1fr_100px] items-center gap-3.5 border-b border-border px-2 py-2.5 last:border-b-0">
                <span className="text-[13px] font-semibold">{imp.pic}</span>
                <span className="truncate text-[12.5px] text-ink-secondary">{imp.namaFile}</span>
                <span className="text-[12px] text-ink-tertiary">
                  {imp.tanggalImport ? new Date(imp.tanggalImport).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "—"}
                </span>
                <span className="w-fit rounded-full bg-good-tint px-2.5 py-1 text-[11px] font-bold text-good-text">{imp.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

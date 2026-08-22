import { useMemo, useState } from "react";
import { usePayrollDataset } from "../../usePayrollDataset";
import { formatRupiah } from "../../lib/format";
import { Warning } from "../../components/icons";
import type { NoticeKategori } from "../../payrollTypes";

const KATEGORI_LABEL: Record<NoticeKategori, string> = {
  "double-transfer": "Kemungkinan Transfer Ganda",
  "belum-transfer": "Belum Tertransfer",
  "transfer-lebih": "Transfer Kelebihan",
  "transfer-kurang": "Transfer Kekurangan",
  "gaji-vs-rab": "Gaji ≠ RAB",
  "nama-lokasi-perlu-cek": "Nama/Lokasi Perlu Dicek",
  "lokasi-tidak-ketemu": "Lokasi Belum Direkonsiliasi",
};

const KATEGORI_ORDER: NoticeKategori[] = [
  "double-transfer", "transfer-kurang", "transfer-lebih", "belum-transfer",
  "gaji-vs-rab", "nama-lokasi-perlu-cek", "lokasi-tidak-ketemu",
];

export default function PayrollNotices() {
  const d = usePayrollDataset();
  const [kategori, setKategori] = useState<"Semua" | NoticeKategori>("Semua");
  const [severity, setSeverity] = useState<"Semua" | "tinggi" | "sedang">("Semua");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    d.notices.forEach((n) => (c[n.kategori] = (c[n.kategori] ?? 0) + 1));
    return c;
  }, [d.notices]);

  const filtered = useMemo(
    () =>
      d.notices.filter((n) => {
        if (kategori !== "Semua" && n.kategori !== kategori) return false;
        if (severity !== "Semua" && n.severity !== severity) return false;
        return true;
      }),
    [d.notices, kategori, severity]
  );

  return (
    <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Notice Merah</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          {d.notices.length} notice ditemukan &middot; {d.periodeLabel || d.periode}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setKategori("Semua")}
          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
            kategori === "Semua" ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-secondary"
          }`}
        >
          Semua ({d.notices.length})
        </button>
        {KATEGORI_ORDER.filter((k) => counts[k]).map((k) => (
          <button
            key={k}
            onClick={() => setKategori(k)}
            className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
              kategori === k ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-secondary"
            }`}
          >
            {KATEGORI_LABEL[k]} ({counts[k]})
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          {(["Semua", "tinggi", "sedang"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold capitalize ${
                severity === s ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-ink-tertiary">
            Tidak ada notice yang cocok dengan filter.
          </div>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3.5 rounded-xl border px-5 py-4 ${
              n.severity === "tinggi" ? "border-[oklch(85%_0.06_25)] bg-bad-tint" : "border-[oklch(85%_0.05_75)] bg-warn-tint"
            }`}
          >
            <Warning className={`mt-0.5 flex-shrink-0 ${n.severity === "tinggi" ? "text-bad-text" : "text-warn-text"}`} size={18} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase ${
                    n.severity === "tinggi" ? "bg-bad text-white" : "bg-warn text-white"
                  }`}
                >
                  {KATEGORI_LABEL[n.kategori]}
                </span>
                <span className="text-[13px] font-bold">{n.lokasi}</span>
                {n.namaKaryawan && <span className="text-[12.5px] text-ink-secondary">&middot; {n.namaKaryawan}</span>}
                {n.nominalDampak != null && (
                  <span className="ml-auto font-mn text-[13px] font-bold text-bad-text">{formatRupiah(n.nominalDampak)}</span>
                )}
              </div>
              <div className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">{n.keterangan}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

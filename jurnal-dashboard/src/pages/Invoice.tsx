import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import EmojiBadge from "../components/EmojiBadge";
import FilterChip from "../components/FilterChip";
import { Search } from "../components/icons";
import { COLORS } from "../lib/colors";
import { formatPct, formatTanggal } from "../lib/format";

function pctColor(pct: number | null) {
  if (pct === null) return COLORS.inkTertiary;
  if (pct >= 0.9) return COLORS.good;
  if (pct >= 0.6) return COLORS.warn;
  return COLORS.bad;
}

export default function Invoice() {
  const d = useDataset();
  const inv = d.invoice;

  const bulanOptions = useMemo(() => inv.dokumenBulanan.map((m) => m.label), [inv.dokumenBulanan]);
  const [bulan, setBulan] = useState(bulanOptions[bulanOptions.length - 1] ?? "");
  const selected = inv.dokumenBulanan.find((m) => m.label === bulan) ?? inv.dokumenBulanan[inv.dokumenBulanan.length - 1];

  const [q, setQ] = useState("");

  const lokasiTersaring = useMemo(() => {
    if (!selected) return [];
    if (!q.trim()) return selected.lokasi;
    const needle = q.trim().toLowerCase();
    return selected.lokasi.filter((l) => l.lokasi.toLowerCase().includes(needle));
  }, [selected, q]);

  const jenisDokumenSorted = useMemo(() => {
    if (!selected) return [];
    return selected.jenisDokumen
      .map((jenis) => {
        const lengkap = selected.lokasi.filter((l) => l.dokumen[jenis]).length;
        const total = selected.lokasi.length;
        return { jenis, lengkap, total, pct: total ? lengkap / total : null };
      })
      .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
  }, [selected]);

  const pctRataKeseluruhan = useMemo(() => {
    const list = inv.dokumenBulanan.map((m) => m.pctRataRata).filter((v): v is number => v !== null);
    return list.length ? list.reduce((s, v) => s + v, 0) / list.length : null;
  }, [inv.dokumenBulanan]);

  if (!inv.tersedia) {
    return (
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">🧾 Invoice</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">Kelengkapan dokumen invoice per lokasi per bulan</p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-10 text-center">
          <span className="text-4xl">🔌</span>
          <span className="font-mn text-[15px] font-bold">Belum terhubung ke spreadsheet Invoice</span>
          <p className="max-w-md text-[13px] leading-relaxed text-ink-tertiary">
            Buka spreadsheet "MONITORING INVOICE DINI" di Google Sheets, copy ID-nya dari URL (bagian antara{" "}
            <code>/d/</code> dan <code>/edit</code>), lalu isi ke variabel <code>INVOICE_SPREADSHEET_ID</code> di{" "}
            <code>Code.gs</code> pada editor Apps Script. Deploy ulang setelah itu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">🧾 Invoice</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">Kelengkapan dokumen invoice per lokasi per bulan</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Bulan Dipantau</span>
            <EmojiBadge emoji="🗓️" tint="accent" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{inv.dokumenBulanan.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Lokasi Dipantau</span>
            <EmojiBadge emoji="📍" tint="accent" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{selected?.lokasi.length ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Rata-rata Keseluruhan</span>
            <EmojiBadge emoji="📊" tint="good" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{formatPct(pctRataKeseluruhan)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Kelengkapan Bulan Terbaru</span>
            <EmojiBadge emoji="📄" tint="warn" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">
            {formatPct(inv.dokumenBulanan[inv.dokumenBulanan.length - 1]?.pctRataRata ?? null)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="font-mn text-[15px] font-bold">📄 Kelengkapan Dokumen per Bulan</span>
        </div>
        <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
          {inv.dokumenBulanan.map((m) => {
            const pct = m.pctRataRata ?? 0;
            const h = Math.max(4, pct * 160);
            return (
              <div key={m.code} className="flex min-w-[64px] flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-ink-secondary">{formatPct(m.pctRataRata)}</span>
                <div className="flex h-[160px] w-9 items-end rounded-md bg-surface-alt">
                  <div className="w-full rounded-md" style={{ height: h, background: pctColor(m.pctRataRata) }} />
                </div>
                <span className="text-[11px] font-semibold text-ink-tertiary">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.3fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mn text-[15px] font-bold">🧩 Jenis Dokumen Paling Sering Kurang</span>
            <FilterChip label="Bulan" value={bulan} options={bulanOptions} onChange={setBulan} />
          </div>
          <div className="flex flex-col gap-3">
            {jenisDokumenSorted.map((j) => (
              <div key={j.jenis} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12.5px] font-semibold">
                  <span className="truncate">{j.jenis}</span>
                  <span className="flex-shrink-0 text-ink-tertiary">
                    {j.lengkap}/{j.total} &middot; {formatPct(j.pct)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(j.pct ?? 0) * 100}%`, background: pctColor(j.pct) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mn text-[15px] font-bold">📄 Kelengkapan Dokumen per Lokasi</span>
            <div className="flex min-w-[200px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
              <Search className="text-ink-tertiary" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari lokasi..."
                className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <div className="min-w-[480px]">
                <div className="grid grid-cols-[1.4fr_110px_100px_140px] items-center gap-3 border-b border-border-strong bg-surface-alt px-4 py-2.5">
                  {["Lokasi", "Lengkap", "%", "Tanggal Kirim"].map((h) => (
                    <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                      {h}
                    </span>
                  ))}
                </div>
                {lokasiTersaring.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-ink-tertiary">Tidak ada lokasi yang cocok.</div>
                )}
                {lokasiTersaring.map((l) => (
                  <div
                    key={l.lokasi}
                    className="grid grid-cols-[1.4fr_110px_100px_140px] items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <span className="truncate text-[13px] font-semibold">{l.lokasi}</span>
                    <span className="text-[13px] text-ink-secondary">
                      {l.dokumenLengkap}/{l.totalDokumen}
                    </span>
                    <span className="text-[13px] font-bold" style={{ color: pctColor(l.pctLengkap) }}>
                      {formatPct(l.pctLengkap)}
                    </span>
                    <span className="text-[13px] text-ink-tertiary">{l.tanggalKirim ? formatTanggal(l.tanggalKirim) : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

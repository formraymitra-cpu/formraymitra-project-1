import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import EmojiBadge from "../components/EmojiBadge";
import FilterChip from "../components/FilterChip";
import { Search } from "../components/icons";
import { COLORS } from "../lib/colors";
import { formatPct, formatRupiah, formatTanggal } from "../lib/format";
import type { DokumenLokasiBulan } from "../types";

function pctColor(pct: number | null) {
  if (pct === null) return COLORS.inkTertiary;
  if (pct >= 0.9) return COLORS.good;
  if (pct >= 0.6) return COLORS.warn;
  return COLORS.bad;
}

function hasDetailData(l: DokumenLokasiBulan) {
  return Boolean(
    l.noInvoiceKwitansi ||
      l.bapp.nomor ||
      l.bapp.tanggal ||
      l.bast.nomor ||
      l.bast.tanggal ||
      l.bap.nomor ||
      l.bap.tanggal ||
      l.kontrak.noSp ||
      l.kontrak.tanggalSp ||
      l.kontrak.lamaKontrak ||
      l.kontrak.periodeKontrak ||
      l.kontrak.termin ||
      l.kontrak.metode ||
      l.kontrak.statusNomor ||
      l.kontrak.linkNomor
  );
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">{label}</span>
      <span className="whitespace-pre-line text-[12.5px] font-semibold text-ink">{value ?? "—"}</span>
    </div>
  );
}

export default function Invoice() {
  const d = useDataset();
  const inv = d.invoice;

  const bulanOptions = useMemo(() => inv.dokumenBulanan.map((m) => m.label), [inv.dokumenBulanan]);
  const [bulan, setBulan] = useState(bulanOptions[bulanOptions.length - 1] ?? "");
  const selected = inv.dokumenBulanan.find((m) => m.label === bulan) ?? inv.dokumenBulanan[inv.dokumenBulanan.length - 1];

  const [q, setQ] = useState("");
  const [expandedLokasi, setExpandedLokasi] = useState<string | null>(null);

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

  const nominalPerBagian = useMemo(() => {
    if (!selected) return [];
    const map = new Map<string, number>();
    selected.lokasi.forEach((l) => {
      l.tagihan.forEach((t) => {
        if (!t.bagianKerja) return;
        map.set(t.bagianKerja, (map.get(t.bagianKerja) ?? 0) + (t.nominal ?? 0));
      });
    });
    return Array.from(map.entries())
      .map(([bagian, nominal]) => ({ bagian, nominal }))
      .sort((a, b) => b.nominal - a.nominal);
  }, [selected]);
  const maxNominalBagian = Math.max(1, ...nominalPerBagian.map((n) => n.nominal));

  const pctRataKeseluruhan = useMemo(() => {
    const list = inv.dokumenBulanan.map((m) => m.pctRataRata).filter((v): v is number => v !== null);
    return list.length ? list.reduce((s, v) => s + v, 0) / list.length : null;
  }, [inv.dokumenBulanan]);

  const maxNominalBulan = Math.max(1, ...inv.dokumenBulanan.map((m) => m.totalNominal));

  if (!inv.tersedia) {
    return (
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">🧾 Invoice</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">Kelengkapan dokumen &amp; tagihan invoice per lokasi per bulan</p>
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
        <p className="mt-1.5 text-sm text-ink-secondary">Kelengkapan dokumen &amp; tagihan invoice per lokasi per bulan</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
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
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Rata-rata Kelengkapan</span>
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
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Nominal Bulan Terbaru</span>
            <EmojiBadge emoji="💰" tint="good" />
          </div>
          <div className="mt-2.5 font-mn text-[22px] font-extrabold tracking-tight">
            {formatRupiah(inv.dokumenBulanan[inv.dokumenBulanan.length - 1]?.totalNominal ?? null)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">💰 Nominal Tagihan per Bulan</span>
          </div>
          <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
            {inv.dokumenBulanan.map((m) => {
              const h = Math.max(4, (m.totalNominal / maxNominalBulan) * 160);
              return (
                <div key={m.code} className="flex min-w-[84px] flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-ink-secondary">{formatRupiah(m.totalNominal)}</span>
                  <div className="flex h-[160px] w-9 items-end rounded-md bg-surface-alt">
                    <div className="w-full rounded-md" style={{ height: h, background: COLORS.accent }} />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-tertiary">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">🧑‍🔧 Nominal per Bagian Kerja</span>
            <span className="text-xs text-ink-tertiary">{bulan}</span>
          </div>
          {nominalPerBagian.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-tertiary">Belum ada data bagian kerja/nominal untuk bulan ini.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {nominalPerBagian.map((b) => (
                <div key={b.bagian} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12.5px] font-semibold">
                    <span className="truncate">{b.bagian}</span>
                    <span className="flex-shrink-0 text-ink-tertiary">{formatRupiah(b.nominal)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(b.nominal / maxNominalBagian) * 100}%`, background: COLORS.accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mn text-[15px] font-bold">📄 Kelengkapan Dokumen &amp; Tagihan per Lokasi</span>
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
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[1.2fr_90px_80px_1.2fr_140px_120px_80px] items-center gap-3 border-b border-border-strong bg-surface-alt px-4 py-2.5">
                {["Lokasi", "Lengkap", "%", "Bagian Kerja", "Nominal", "Tanggal Kirim", "Detail"].map((h) => (
                  <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                    {h}
                  </span>
                ))}
              </div>
              {lokasiTersaring.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-ink-tertiary">Tidak ada lokasi yang cocok.</div>
              )}
              {lokasiTersaring.map((l) => {
                const isOpen = expandedLokasi === l.lokasi;
                return (
                  <div key={l.lokasi} className="border-b border-border last:border-b-0">
                    <div className="grid grid-cols-[1.2fr_90px_80px_1.2fr_140px_120px_80px] items-center gap-3 px-4 py-2.5">
                      <span className="truncate text-[13px] font-semibold">{l.lokasi}</span>
                      <span className="text-[13px] text-ink-secondary">
                        {l.dokumenLengkap}/{l.totalDokumen}
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: pctColor(l.pctLengkap) }}>
                        {formatPct(l.pctLengkap)}
                      </span>
                      <span className="truncate text-[12.5px] text-ink-secondary">
                        {l.tagihan.length ? l.tagihan.map((t) => t.bagianKerja).filter(Boolean).join(", ") : "—"}
                      </span>
                      <span className="text-[13px] font-semibold">{l.totalNominal ? formatRupiah(l.totalNominal) : "—"}</span>
                      <span className="text-[13px] text-ink-tertiary">{l.tanggalKirim ? formatTanggal(l.tanggalKirim) : "—"}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedLokasi(isOpen ? null : l.lokasi)}
                        className="justify-self-start rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-bold text-accent hover:bg-surface-alt"
                      >
                        {isOpen ? "Tutup" : "Lihat"}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-border bg-surface-alt px-4 py-4">
                        {!hasDetailData(l) ? (
                          <p className="text-[12.5px] text-ink-tertiary">
                            Belum ada data BAPP/BAST/BAP, no. invoice &amp; kwitansi, atau kontrak/SP untuk lokasi ini
                            di bulan ini — fitur ini baru mulai dicatat sejak Agustus 2026.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <DetailField label="No Invoice & Kwitansi" value={l.noInvoiceKwitansi} />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <DetailField label="No. BAPP" value={l.bapp.nomor} />
                              <DetailField label="Tanggal BAPP" value={l.bapp.tanggal} />
                              <DetailField label="No. BAST" value={l.bast.nomor} />
                              <DetailField label="Tanggal BAST" value={l.bast.tanggal} />
                              <DetailField label="No. BAP" value={l.bap.nomor} />
                              <DetailField label="Tanggal BAP" value={l.bap.tanggal} />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-secondary">
                                Kontrak &amp; Surat Pesanan
                              </span>
                              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <DetailField label="No SP" value={l.kontrak.noSp} />
                                <DetailField label="Tanggal SP" value={l.kontrak.tanggalSp} />
                                <DetailField label="Lama Kontrak" value={l.kontrak.lamaKontrak} />
                                <DetailField label="Periode Kontrak" value={l.kontrak.periodeKontrak} />
                                <DetailField label="Termin" value={l.kontrak.termin} />
                                <DetailField label="Metode" value={l.kontrak.metode} />
                                <DetailField label="Nomor / Status" value={l.kontrak.statusNomor} />
                                <DetailField label="Link Nomor" value={l.kontrak.linkNomor} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

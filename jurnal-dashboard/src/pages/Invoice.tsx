import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import EmojiBadge from "../components/EmojiBadge";
import FilterChip from "../components/FilterChip";
import { Search } from "../components/icons";
import { COLORS } from "../lib/colors";
import { formatPct, formatRupiah, formatTanggal } from "../lib/format";
import type { TagihanLokasi } from "../types";

const PAGE_SIZE = 20;

function pctColor(pct: number | null) {
  if (pct === null) return COLORS.inkTertiary;
  if (pct >= 0.9) return COLORS.good;
  if (pct >= 0.6) return COLORS.warn;
  return COLORS.bad;
}

function TagihanStatusBadge({ status }: { status: TagihanLokasi["status"] }) {
  const cfg = {
    selesai: { label: "Selesai", cls: "bg-good-tint text-good-text" },
    proses: { label: "Proses", cls: "bg-warn-tint text-warn-text" },
    belum: { label: "Belum", cls: "bg-bad-tint text-bad-text" },
  }[status];
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function Invoice() {
  const d = useDataset();
  const inv = d.invoice;

  const bulanDokOptions = useMemo(() => inv.dokumenBulanan.map((m) => m.label), [inv.dokumenBulanan]);
  const [bulanDok, setBulanDok] = useState(bulanDokOptions[bulanDokOptions.length - 1] ?? "");
  const selectedDok = inv.dokumenBulanan.find((m) => m.label === bulanDok) ?? inv.dokumenBulanan[inv.dokumenBulanan.length - 1];

  const [lokasiFilter, setLokasiFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState<"Semua" | "selesai" | "belum">("Semua");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const lokasiOptions = useMemo(() => ["Semua", ...inv.tagihan.map((t) => t.lokasi)], [inv.tagihan]);

  const rincianTagihan = useMemo(() => {
    const rows: { lokasi: string; bulan: string; nominal: number | null; keterangan: string | null; status: string | null }[] = [];
    inv.tagihan.forEach((t) => {
      t.perBulan.forEach((b) => rows.push({ lokasi: t.lokasi, bulan: b.bulan, nominal: b.nominal, keterangan: b.keterangan, status: b.status }));
    });
    return rows;
  }, [inv.tagihan]);

  const filteredRincian = useMemo(() => {
    return rincianTagihan.filter((r) => {
      if (lokasiFilter !== "Semua" && r.lokasi !== lokasiFilter) return false;
      if (statusFilter !== "Semua") {
        const st = (r.status ?? "").toUpperCase() === "SELESAI" ? "selesai" : "belum";
        if (st !== statusFilter) return false;
      }
      if (q.trim() && !`${r.lokasi} ${r.bulan}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [rincianTagihan, lokasiFilter, statusFilter, q]);

  const totalPages = Math.max(1, Math.ceil(filteredRincian.length / PAGE_SIZE));
  const pageRows = filteredRincian.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  if (!inv.tersedia) {
    return (
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">🧾 Invoice</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">Monitoring tagihan &amp; kelengkapan dokumen invoice</p>
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
        <p className="mt-1.5 text-sm text-ink-secondary">Monitoring tagihan &amp; kelengkapan dokumen invoice per lokasi</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Lokasi Tagihan</span>
            <EmojiBadge emoji="📍" tint="accent" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{inv.totalLokasiTagihan}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Total Nominal</span>
            <EmojiBadge emoji="💰" tint="good" />
          </div>
          <div className="mt-2.5 font-mn text-[24px] font-extrabold tracking-tight">{formatRupiah(inv.totalNominalKeseluruhan)}</div>
        </div>
        <div className="rounded-2xl border border-[oklch(82%_0.08_25)] bg-bad-tint p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-bad-text">Belum Selesai</span>
            <EmojiBadge emoji="⏳" tint="bad" />
          </div>
          <div className="mt-2.5 font-mn text-[24px] font-extrabold tracking-tight text-bad-text">
            {formatRupiah(inv.totalNominalBelumSelesai)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Kelengkapan Dok. Terbaru</span>
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

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mn text-[15px] font-bold">📄 Kelengkapan Dokumen per Lokasi</span>
          <FilterChip label="Bulan" value={bulanDok} options={bulanDokOptions} onChange={setBulanDok} />
        </div>
        {selectedDok && (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[1.4fr_110px_100px_140px] items-center gap-3 border-b border-border-strong bg-surface-alt px-4 py-2.5">
                  {["Lokasi", "Lengkap", "%", "Tanggal Kirim"].map((h) => (
                    <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                      {h}
                    </span>
                  ))}
                </div>
                {selectedDok.lokasi.map((l) => (
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
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mn text-[15px] font-bold">💰 Rincian Tagihan per Lokasi</span>
          <div className="flex flex-wrap items-center gap-3">
            <FilterChip label="Lokasi" value={lokasiFilter} options={lokasiOptions} onChange={resetPage(setLokasiFilter)} />
            <FilterChip
              label="Status"
              value={statusFilter}
              options={["Semua", "selesai", "belum"]}
              onChange={resetPage(setStatusFilter) as (v: string) => void}
            />
            <div className="flex min-w-[200px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
              <Search className="text-ink-tertiary" />
              <input
                value={q}
                onChange={(e) => resetPage(setQ)(e.target.value)}
                placeholder="Cari lokasi/bulan..."
                className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
              />
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1.4fr_110px_150px_100px_1.5fr] items-center gap-3 border-b border-border-strong bg-surface-alt px-4 py-2.5">
                {["Lokasi", "Bulan", "Nominal", "Status", "Keterangan"].map((h) => (
                  <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                    {h}
                  </span>
                ))}
              </div>
              {pageRows.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-ink-tertiary">Tidak ada tagihan yang cocok dengan filter.</div>
              )}
              {pageRows.map((r, i) => (
                <div
                  key={`${r.lokasi}-${r.bulan}-${i}`}
                  className="grid grid-cols-[1.4fr_110px_150px_100px_1.5fr] items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="truncate text-[13px] font-semibold">{r.lokasi}</span>
                  <span className="text-[13px] text-ink-secondary">{r.bulan}</span>
                  <span className="text-[13px] font-semibold">{formatRupiah(r.nominal)}</span>
                  <TagihanStatusBadge status={(r.status ?? "").toUpperCase() === "SELESAI" ? "selesai" : "belum"} />
                  <span className="truncate text-xs text-ink-tertiary">{r.keterangan ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-ink-tertiary">
              Menampilkan {filteredRincian.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;
              {Math.min(page * PAGE_SIZE, filteredRincian.length)} dari {filteredRincian.length} baris
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-ink-secondary disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="px-2 text-xs text-ink-tertiary">
                Hal {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-ink-secondary disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {inv.catatan.length > 0 && (
        <div className="rounded-2xl border border-[oklch(80%_0.08_75)] bg-warn-tint p-5">
          <span className="font-mn text-[15px] font-bold text-warn-text">📌 Catatan &amp; Pertanyaan Terbuka</span>
          <ul className="mt-3 flex flex-col gap-2">
            {inv.catatan.map((c, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-ink-secondary">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

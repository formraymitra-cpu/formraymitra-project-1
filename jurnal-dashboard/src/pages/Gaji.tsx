import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import EmojiBadge from "../components/EmojiBadge";
import FilterChip from "../components/FilterChip";
import { Search } from "../components/icons";
import { COLORS } from "../lib/colors";
import { formatPct, formatRupiah } from "../lib/format";

function ketBadge(ket: string | null) {
  if (!ket) return <span className="text-[12.5px] text-ink-tertiary">—</span>;
  const sesuai = ket.toUpperCase() === "SESUAI";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        sesuai ? "bg-good-tint text-good-text" : "bg-bad-tint text-bad-text"
      }`}
    >
      {ket}
    </span>
  );
}

function cekMark(cek: boolean | null) {
  if (cek === true) return <span style={{ color: COLORS.good }}>✅</span>;
  if (cek === false) return <span style={{ color: COLORS.bad }}>❌</span>;
  return <span className="text-ink-tertiary">—</span>;
}

export default function Gaji() {
  const d = useDataset();
  const gaji = d.gaji;

  const bulanOptions = useMemo(() => gaji.bulanan.map((b) => b.label), [gaji.bulanan]);
  const [bulan, setBulan] = useState(bulanOptions[bulanOptions.length - 1] ?? "");
  const selected = gaji.bulanan.find((b) => b.label === bulan) ?? gaji.bulanan[gaji.bulanan.length - 1];

  const [q, setQ] = useState("");

  const lokasiTersaring = useMemo(() => {
    if (!selected) return [];
    if (!q.trim()) return selected.lokasi;
    const needle = q.trim().toLowerCase();
    return selected.lokasi.filter(
      (l) => l.lokasi.toLowerCase().includes(needle) || (l.picGaji ?? "").toLowerCase().includes(needle)
    );
  }, [selected, q]);

  const maxNominalBulan = Math.max(1, ...gaji.bulanan.map((b) => b.totalGaji));
  const maxNominalBank = Math.max(1, ...(selected?.perBank.map((b) => b.totalGaji) ?? []));

  if (!gaji.tersedia) {
    return (
      <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">💵 Cek Gaji</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">Rekap pengecekan gaji karyawan per lokasi per bulan</p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-10 text-center">
          <span className="text-4xl">🔌</span>
          <span className="font-mn text-[15px] font-bold">Belum terhubung ke spreadsheet Cek Gaji</span>
          <p className="max-w-md text-[13px] leading-relaxed text-ink-tertiary">
            Buka spreadsheet "CEK GAJI OTOMATIS" di Google Sheets, copy ID-nya dari URL (bagian antara{" "}
            <code>/d/</code> dan <code>/edit</code>), lalu isi ke variabel <code>GAJI_SPREADSHEET_ID</code> di{" "}
            <code>Code.gs</code> pada editor Apps Script. Deploy ulang setelah itu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">💵 Cek Gaji</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">Rekap pengecekan gaji karyawan per lokasi per bulan</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Bulan Dipantau</span>
            <EmojiBadge emoji="🗓️" tint="accent" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{gaji.bulanan.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Lokasi Dipantau</span>
            <EmojiBadge emoji="📍" tint="accent" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{selected?.totalLokasi ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Sudah Dicek</span>
            <EmojiBadge emoji="✅" tint="good" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{formatPct(selected?.pctCek ?? null)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Sesuai</span>
            <EmojiBadge emoji="📋" tint="warn" />
          </div>
          <div className="mt-2.5 font-mn text-[34px] font-extrabold tracking-tight">{formatPct(selected?.pctSesuai ?? null)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Total Gaji Bulan Ini</span>
            <EmojiBadge emoji="💰" tint="good" />
          </div>
          <div className="mt-2.5 font-mn text-[22px] font-extrabold tracking-tight">{formatRupiah(selected?.totalGaji ?? null)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">💰 Total Gaji per Bulan</span>
          </div>
          <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
            {gaji.bulanan.map((b) => {
              const h = Math.max(4, (b.totalGaji / maxNominalBulan) * 160);
              return (
                <div key={b.code} className="flex min-w-[84px] flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-ink-secondary">{formatRupiah(b.totalGaji)}</span>
                  <div className="flex h-[160px] w-9 items-end rounded-md bg-surface-alt">
                    <div className="w-full rounded-md" style={{ height: h, background: COLORS.accent }} />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-tertiary">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mn text-[15px] font-bold">🏦 Nominal Gaji per Bank</span>
            <span className="text-xs text-ink-tertiary">{bulan}</span>
          </div>
          {!selected?.perBank.length ? (
            <p className="py-6 text-center text-sm text-ink-tertiary">Belum ada data bank untuk bulan ini.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selected.perBank.map((b) => (
                <div key={b.bank} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[12.5px] font-semibold">
                    <span className="truncate">
                      {b.bank} <span className="text-ink-tertiary">({b.totalLokasi} lokasi)</span>
                    </span>
                    <span className="flex-shrink-0 text-ink-tertiary">{formatRupiah(b.totalGaji)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(b.totalGaji / maxNominalBank) * 100}%`, background: COLORS.accent }}
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
          <span className="font-mn text-[15px] font-bold">📄 Rekap Cek Gaji per Lokasi</span>
          <div className="flex flex-wrap items-center gap-3">
            <FilterChip label="Bulan" value={bulan} options={bulanOptions} onChange={setBulan} />
            <div className="flex min-w-[200px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
              <Search className="text-ink-tertiary" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari lokasi / PIC..."
                className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
              />
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <div className="min-w-[1650px]">
              <div className="grid grid-cols-[50px_240px_110px_90px_120px_120px_140px_110px_100px_100px_120px_60px_70px] items-center gap-3 border-b border-border-strong bg-surface-alt px-4 py-2.5">
                {["No", "Lokasi", "PIC Gaji", "Bank", "RAB", "Gaji", "Diterima Karyawan", "BPJS Kes", "BPJS TK", "Payroll", "Keterangan", "Cek", "Link"].map(
                  (h) => (
                    <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                      {h}
                    </span>
                  )
                )}
              </div>
              {lokasiTersaring.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-ink-tertiary">Tidak ada lokasi yang cocok.</div>
              )}
              {lokasiTersaring.map((l, i) => (
                <div
                  key={`${l.lokasi}-${i}`}
                  className="grid grid-cols-[50px_240px_110px_90px_120px_120px_140px_110px_100px_100px_120px_60px_70px] items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="text-[12.5px] text-ink-tertiary">{l.no ?? "—"}</span>
                  <span className="truncate text-[13px] font-semibold" title={l.lokasi}>
                    {l.lokasi}
                  </span>
                  <span className="truncate text-[12.5px] text-ink-secondary">{l.picGaji ?? "—"}</span>
                  <span className="truncate text-[12.5px] text-ink-secondary">{l.bank ?? "—"}</span>
                  <span className="text-[12.5px] text-ink-secondary">{l.rab !== null ? formatRupiah(l.rab) : "—"}</span>
                  <span className="text-[13px] font-semibold">{l.gaji !== null ? formatRupiah(l.gaji) : "—"}</span>
                  <span className="text-[12.5px] text-ink-secondary">
                    {l.diterimaKaryawan !== null ? formatRupiah(l.diterimaKaryawan) : "—"}
                  </span>
                  <span className="text-[12.5px] text-ink-secondary">{l.bpjsKes !== null ? formatRupiah(l.bpjsKes) : "—"}</span>
                  <span className="text-[12.5px] text-ink-secondary">{l.bpjsTk !== null ? formatRupiah(l.bpjsTk) : "—"}</span>
                  <span className="text-[12.5px] text-ink-secondary">{l.payroll !== null ? formatRupiah(l.payroll) : "—"}</span>
                  <span>{ketBadge(l.keterangan)}</span>
                  <span className="text-[15px]">{cekMark(l.cek)}</span>
                  <span>
                    {l.linkGajiPic ? (
                      <a
                        href={l.linkGajiPic}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-bold text-accent no-underline hover:bg-surface-alt"
                      >
                        Buka
                      </a>
                    ) : (
                      <span className="text-ink-tertiary">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

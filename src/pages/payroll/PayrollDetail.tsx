import { useMemo, useState } from "react";
import { usePayrollDataset } from "../../usePayrollDataset";
import { formatRupiah } from "../../lib/format";
import { Download, Search, ChevronDown } from "../../components/icons";
import type { PayrollLocation, Role1Status } from "../../payrollTypes";

const PAGE_SIZE = 20;

const ROLE1_BADGE: Record<Role1Status, string> = {
  sesuai: "bg-good-tint text-good-text",
  proses: "bg-warn-tint text-warn-text",
  selisih: "bg-bad-tint text-bad-text",
  "tanpa-data": "bg-surface-alt text-ink-tertiary",
};
const ROLE1_TEXT: Record<Role1Status, string> = {
  sesuai: "Sesuai",
  proses: "Proses",
  selisih: "Selisih",
  "tanpa-data": "Belum ada data",
};

function toCsv(rows: PayrollLocation[]) {
  const header = [
    "Nama Lokasi", "PIC", "Bank", "RAB", "Gaji", "Diterima Karyawan", "BPJS Kes", "BPJS TK", "Payroll",
    "Nominal Tertransfer", "Jumlah Anggota", "Status Role 1", "Status Role 2",
  ];
  const lines = rows.map((r) =>
    [
      r.nama, r.pic ?? "", r.bank ?? "", r.rab ?? "", r.gaji ?? "", r.diterimaKaryawan ?? "", r.bpjsKes ?? "",
      r.bpjsTk ?? "", r.payroll ?? "", r.nominalTertransfer, r.jumlahAnggota, ROLE1_TEXT[r.statusRole1], r.statusRole2,
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

export default function PayrollDetail() {
  const d = usePayrollDataset();

  const [pic, setPic] = useState("Semua");
  const [bank, setBank] = useState("Semua");
  const [status, setStatus] = useState<"Semua" | Role1Status>("Semua");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const picOptions = useMemo(() => ["Semua", ...Array.from(new Set(d.locations.map((l) => l.pic ?? "Belum diisi"))).sort()], [d.locations]);
  const bankOptions = useMemo(() => ["Semua", ...Array.from(new Set(d.locations.map((l) => l.bank ?? "Belum diisi"))).sort()], [d.locations]);

  const filtered = useMemo(() => {
    return d.locations.filter((l) => {
      if (pic !== "Semua" && (l.pic ?? "Belum diisi") !== pic) return false;
      if (bank !== "Semua" && (l.bank ?? "Belum diisi") !== bank) return false;
      if (status !== "Semua" && l.statusRole1 !== status) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const inLokasi = l.nama.toLowerCase().includes(needle);
        const inAnggota = l.anggota.some((a) => a.namaRekap.toLowerCase().includes(needle));
        if (!inLokasi && !inAnggota) return false;
      }
      return true;
    });
  }, [d.locations, pic, bank, status, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Rekap Gaji per Lokasi</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">
            {d.periodeLabel || d.periode} &middot; {d.totalLokasi} lokasi
          </p>
        </div>
        <button
          onClick={() => downloadCsv(toCsv(filtered), `rekap-gaji-lokasi-${d.periode ?? ""}.csv`)}
          className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-secondary"
        >
          <Download />
          Unduh CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FilterChip label="PIC" value={pic} options={picOptions} onChange={resetPage(setPic)} />
        <FilterChip label="Bank" value={bank} options={bankOptions} onChange={resetPage(setBank)} />
        <FilterChip
          label="Status"
          value={status}
          options={["Semua", "sesuai", "proses", "selisih", "tanpa-data"]}
          onChange={resetPage(setStatus) as (v: string) => void}
        />
        <div className="ml-auto flex min-w-[260px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
          <Search className="text-ink-tertiary" />
          <input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Cari lokasi atau nama anggota..."
            className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[1280px]">
            <div className="grid grid-cols-[24px_1.5fr_100px_90px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_70px_110px] items-center gap-2.5 border-b border-border-strong px-5 py-3">
              {["", "Nama Lokasi", "PIC", "Bank", "RAB", "Gaji", "Diterima Karyawan", "BPJS Kes", "BPJS TK", "Payroll", "Nominal Tertransfer", "Anggota", "Status"].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {pageRows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink-tertiary">Tidak ada lokasi yang cocok dengan filter.</div>
            )}
            {pageRows.map((l) => (
              <div key={l.nama}>
                <div
                  onClick={() => setExpanded(expanded === l.nama ? null : l.nama)}
                  className={`grid cursor-pointer grid-cols-[24px_1.5fr_100px_90px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_70px_110px] items-center gap-2.5 border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface-alt ${
                    l.statusRole1 === "selisih" ? "border-l-[3px] border-l-bad bg-bad-tint" : ""
                  }`}
                >
                  <ChevronDown className={`text-ink-tertiary transition-transform ${expanded === l.nama ? "rotate-180" : ""}`} />
                  <span className="truncate text-[12.5px] font-semibold" title={l.nama}>{l.nama}</span>
                  <span className={`truncate text-[12px] ${l.pic ? "" : "italic text-ink-tertiary"}`}>{l.pic ?? "belum diisi"}</span>
                  <span className="truncate text-[12px] text-ink-secondary">{l.bank ?? "—"}</span>
                  <span className="text-[12px] text-ink-secondary">{formatRupiah(l.rab)}</span>
                  <span className="text-[12px] text-ink-secondary">{formatRupiah(l.gaji)}</span>
                  <span className="text-[12px] text-ink-secondary">{formatRupiah(l.diterimaKaryawan)}</span>
                  <span className="text-[12px] text-ink-secondary">{formatRupiah(l.bpjsKes)}</span>
                  <span className="text-[12px] text-ink-secondary">{formatRupiah(l.bpjsTk)}</span>
                  <span className="text-[12px] text-ink-secondary">{formatRupiah(l.payroll)}</span>
                  <span className="text-[12px] font-semibold">{l.jumlahAnggota > 0 ? formatRupiah(l.nominalTertransfer) : "—"}</span>
                  <span className="text-[12px] text-ink-tertiary">
                    {l.jumlahAnggota > 0 ? `${l.jumlahSudahTertransfer}/${l.jumlahAnggota}` : "—"}
                  </span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[10.5px] font-bold ${ROLE1_BADGE[l.statusRole1]}`}>
                    {ROLE1_TEXT[l.statusRole1]}
                  </span>
                </div>
                {expanded === l.nama && (
                  <div className="border-b border-border bg-surface-alt px-5 py-4">
                    {l.matchConfidence === "belum-ada" && (
                      <div className="mb-3 text-[12.5px] text-ink-tertiary">
                        Lokasi ini belum ditemukan di data rekonsiliasi (HASIL_PENGECEKAN).
                      </div>
                    )}
                    {l.matchConfidence === "ambigu" && (
                      <div className="mb-3 rounded-lg bg-warn-tint px-3 py-2 text-[12.5px] text-warn-text">
                        Nama lokasi ambigu, cocok dengan lebih dari satu kandidat: {l.kandidatAmbigu.join("; ")}. Tambahkan
                        pemetaan manual di sheet MAPPING_LOKASI untuk menyelesaikan.
                      </div>
                    )}
                    {l.anggota.length > 0 && (
                      <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr] gap-3 border-b border-border-strong pb-2">
                            {["Nama Anggota", "Nominal Rekap", "Nominal Mutasi", "Selisih", "Status"].map((h) => (
                              <span key={h} className="text-[10px] font-bold uppercase tracking-wide text-ink-tertiary">{h}</span>
                            ))}
                          </div>
                          {l.anggota.map((a, i) => (
                            <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr] items-center gap-3 border-b border-border py-2 last:border-b-0">
                              <span className="text-[12.5px] font-medium">{a.namaRekap}</span>
                              <span className="text-[12px]">{formatRupiah(a.nominalRekap)}</span>
                              <span className="text-[12px]">
                                {a.nominalMutasi !== null ? (
                                  formatRupiah(a.nominalMutasi)
                                ) : a.konfirmasiManual ? (
                                  <span className="text-warn-text" title="Sudah dicek manual tapi nominal mutasi belum dilengkapi di HASIL_PENGECEKAN">
                                    dikonfirmasi manual, nominal belum dilengkapi
                                  </span>
                                ) : (
                                  "belum tertransfer"
                                )}
                              </span>
                              <span className={`text-[12px] font-semibold ${a.selisih && Math.abs(a.selisih) > 5 ? "text-bad-text" : "text-ink-tertiary"}`}>
                                {a.selisih !== null ? formatRupiah(a.selisih) : "—"}
                              </span>
                              <span className="truncate text-[12px]">{a.statusAkhir ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-xs text-ink-tertiary">
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} lokasi
          </span>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-ink-secondary disabled:opacity-40">
              Sebelumnya
            </button>
            <span className="px-2 text-xs text-ink-tertiary">Hal {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-ink-secondary disabled:opacity-40">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: T[] | string[];
  onChange: (v: T) => void;
}) {
  const active = value !== "Semua";
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold ${
        active ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-secondary"
      }`}
    >
      <label className="cursor-pointer">
        {label}:{" "}
        <select value={value} onChange={(e) => onChange(e.target.value as T)} className="cursor-pointer border-none bg-transparent font-semibold outline-none">
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

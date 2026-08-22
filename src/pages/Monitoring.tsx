import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import StatusBadge from "../components/StatusBadge";
import { Download, Search, Warning } from "../components/icons";
import type { Location, Status } from "../types";

const PAGE_SIZE = 15;

function toCsv(rows: Location[]) {
  const header = ["No", "Lokasi", "Tipe", "PIC", "Metode", "Laporan", "Absensi", "Hari Telat", "Catatan"];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      r.nama,
      r.tipeClient ?? "",
      r.pic ?? "",
      r.metode ?? "",
      r.laporan.selesai ? "Selesai" : "Belum",
      r.absensi.selesai ? "Selesai" : "Belum",
      r.hariTelat ?? "",
      r.catatan ?? "",
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

export default function Monitoring() {
  const d = useDataset();
  const current = d.months.find((m) => m.code === d.currentMonth)!;

  const [pic, setPic] = useState("Semua");
  const [tipe, setTipe] = useState("Semua");
  const [metode, setMetode] = useState("Semua");
  const [status, setStatus] = useState<"Semua" | Status>("Semua");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const picOptions = useMemo(() => {
    const set = new Set<string>();
    d.locations.forEach((l) => set.add(l.pic ?? "Belum diisi"));
    return ["Semua", ...Array.from(set).sort()];
  }, [d.locations]);

  const metodeOptions = useMemo(() => {
    const set = new Set<string>();
    d.locations.forEach((l) => set.add(l.metode ?? "Tidak diketahui"));
    return ["Semua", ...Array.from(set).sort()];
  }, [d.locations]);

  const filtered = useMemo(() => {
    return d.locations.filter((l) => {
      if (pic !== "Semua" && (l.pic ?? "Belum diisi") !== pic) return false;
      if (tipe !== "Semua" && (l.tipeClient ?? "Tidak diketahui") !== tipe) return false;
      if (metode !== "Semua" && (l.metode ?? "Tidak diketahui") !== metode) return false;
      if (status !== "Semua" && l.status !== status) return false;
      if (q.trim() && !l.nama.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [d.locations, pic, tipe, metode, status, q]);

  const belumLengkap = current.totalLokasi - current.keduanyaSelesai;
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
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Monitoring Harian</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">
            {d.totalLokasiAktif} lokasi wajib lapor &middot; {current.label} (s.d.{" "}
            {new Date(d.asOfDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
          </p>
        </div>
        <button
          onClick={() => downloadCsv(toCsv(filtered), `monitoring-${d.currentMonth}.csv`)}
          className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-secondary"
        >
          <Download />
          Unduh CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[oklch(82%_0.08_25)] bg-bad-tint px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-surface">
            <Warning className="text-bad" size={22} />
          </div>
          <div>
            <div className="font-mn text-base font-bold text-bad-text">
              {belumLengkap} lokasi berisiko menahan invoice
            </div>
            <div className="mt-0.5 text-[13px] text-ink-secondary">
              Laporan dan/atau Absensi belum lengkap, deadline akhir {current.label}
            </div>
          </div>
        </div>
        <button
          onClick={() => resetPage(setStatus)("proses")}
          className="whitespace-nowrap rounded-lg border-none bg-bad px-5 py-2.5 text-[13px] font-bold text-white"
        >
          Lihat Semua
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FilterChip label="PIC" value={pic} options={picOptions} onChange={resetPage(setPic)} />
        <FilterChip label="Tipe Client" value={tipe} options={["Semua", "LAMA", "BARU", "Tidak diketahui"]} onChange={resetPage(setTipe)} />
        <FilterChip label="Metode" value={metode} options={metodeOptions} onChange={resetPage(setMetode)} />
        <FilterChip
          label="Status"
          value={status}
          options={["Semua", "selesai", "proses", "overdue"]}
          onChange={resetPage(setStatus) as (v: string) => void}
        />
        <div className="ml-auto flex min-w-[240px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
          <Search className="text-ink-tertiary" />
          <input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Cari lokasi..."
            className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[36px_1.3fr_76px_120px_100px_112px_112px_84px_1.5fr] items-center gap-3 border-b border-border-strong px-5 py-3">
              {["No", "Lokasi", "Tipe", "PIC", "Metode", "Laporan", "Absensi", "Hari Telat", "Catatan"].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {pageRows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink-tertiary">Tidak ada lokasi yang cocok dengan filter.</div>
            )}
            {pageRows.map((l, i) => (
              <div
                key={l.nama}
                className={`grid grid-cols-[36px_1.3fr_76px_120px_100px_112px_112px_84px_1.5fr] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 ${
                  l.status === "overdue" ? "border-l-[3px] border-l-bad bg-bad-tint" : ""
                }`}
              >
                <span className="text-xs text-ink-tertiary">{(page - 1) * PAGE_SIZE + i + 1}</span>
                <span className="truncate text-[13.5px] font-semibold">{l.nama}</span>
                <span className="w-fit rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-ink-secondary">
                  {l.tipeClient ?? "—"}
                </span>
                <span className={`text-[12.5px] ${l.pic ? "" : "italic text-ink-tertiary"}`}>{l.pic ?? "belum diisi"}</span>
                <span className="text-[12.5px] text-ink-secondary">{l.metode ?? "—"}</span>
                <StatusBadge status={l.laporan.selesai ? "selesai" : l.status === "overdue" ? "overdue" : "proses"} />
                <StatusBadge status={l.absensi.selesai ? "selesai" : l.status === "overdue" ? "overdue" : "proses"} />
                <span className={`text-[13px] font-bold ${l.hariTelat ? "text-bad-text" : "text-ink-tertiary"}`}>
                  {l.hariTelat ?? "—"}
                </span>
                <span className="truncate text-xs text-ink-tertiary">
                  {l.catatan ?? l.laporan.keterangan ?? l.absensi.keterangan ?? "—"}
                </span>
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
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="cursor-pointer border-none bg-transparent font-semibold outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

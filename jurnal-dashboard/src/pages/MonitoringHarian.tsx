import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import StatusBadge from "../components/StatusBadge";
import { Download, Search } from "../components/icons";
import { formatTanggalPendek } from "../lib/format";
import DinoGreeting from "../components/DinoGreeting";
import FilterChip from "../components/FilterChip";
import type { Task } from "../types";

const PAGE_SIZE = 20;

function toCsv(rows: Task[]) {
  const header = ["Tanggal", "Hari", "No", "Tugas", "Ceklist", "Jadwal", "Keterangan"];
  const lines = rows.map((t) =>
    [t.tanggal, t.hari ?? "", t.no ?? "", t.tugas ?? "", t.selesai ? "Selesai" : "Belum", t.jadwal ?? "", t.keterangan ?? ""]
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

export default function MonitoringHarian() {
  const d = useDataset();

  const bulanOptions = useMemo(() => ["Semua", ...d.months.map((m) => m.label)], [d.months]);
  const [bulan, setBulan] = useState("Semua");
  const [status, setStatus] = useState<"Semua" | "selesai" | "belum">("Semua");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const monthCodeByLabel = useMemo(() => {
    const map = new Map<string, string>();
    d.months.forEach((m) => map.set(m.label, m.code));
    return map;
  }, [d.months]);

  const filtered = useMemo(() => {
    return d.tasks.filter((t) => {
      if (bulan !== "Semua" && !t.tanggal.startsWith(monthCodeByLabel.get(bulan) ?? "\0")) return false;
      if (status === "selesai" && !t.selesai) return false;
      if (status === "belum" && t.selesai) return false;
      if (q.trim() && !(t.tugas ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [d.tasks, bulan, status, q, monthCodeByLabel]);

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
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">📝 Monitoring Harian</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">{d.totalTugas} tugas tercatat di {d.totalHariTercatat} hari</p>
        </div>
        <button
          onClick={() => downloadCsv(toCsv(filtered), "monitoring-harian-jurnal.csv")}
          className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-secondary"
        >
          <Download />
          Unduh CSV
        </button>
      </div>

      <DinoGreeting
        size={56}
        message={
          <>
            aku sudah mencatat {d.totalTugas} tugas harian, {d.totalSelesai} di antaranya sudah selesai.
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <FilterChip label="Bulan" value={bulan} options={bulanOptions} onChange={resetPage(setBulan)} />
        <FilterChip
          label="Status"
          value={status}
          options={["Semua", "selesai", "belum"]}
          onChange={resetPage(setStatus) as (v: string) => void}
        />
        <div className="ml-auto flex min-w-[240px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
          <Search className="text-ink-tertiary" />
          <input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Cari tugas..."
            className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[100px_36px_1.6fr_100px_120px_1.5fr_70px] items-center gap-3 border-b border-border-strong px-5 py-3">
              {["🗓️ Tanggal", "No", "🧩 Tugas", "Status", "⏰ Jadwal", "Keterangan", "📸 Foto"].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {pageRows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink-tertiary">Tidak ada tugas yang cocok dengan filter.</div>
            )}
            {pageRows.map((t, i) => (
              <div
                key={`${t.tanggal}-${t.no}-${i}`}
                className="grid grid-cols-[100px_36px_1.6fr_100px_120px_1.5fr_70px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-semibold">{formatTanggalPendek(t.tanggal)}</span>
                  <span className="text-[10.5px] text-ink-tertiary">{t.hari}</span>
                </div>
                <span className="text-xs text-ink-tertiary">{t.no ?? "—"}</span>
                <span className="truncate text-[13px]">{t.tugas}</span>
                <StatusBadge selesai={t.selesai} />
                <span className="truncate text-[12px] text-ink-secondary">{t.jadwal ?? "—"}</span>
                <span className="truncate text-xs text-ink-tertiary">{t.keterangan ?? "—"}</span>
                <span className="flex items-center gap-1 text-xs text-ink-tertiary">
                  {t.jumlahFoto > 0 ? `📸 ${t.jumlahFoto}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-xs text-ink-tertiary">
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} tugas
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

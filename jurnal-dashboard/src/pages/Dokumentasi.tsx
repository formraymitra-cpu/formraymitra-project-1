import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import DinoGreeting from "../components/DinoGreeting";
import EmojiBadge from "../components/EmojiBadge";
import FilterChip from "../components/FilterChip";
import { Search } from "../components/icons";
import { formatTanggal } from "../lib/format";
import { getFotoLinkUntukTanggal } from "../lib/gas";

const PAGE_SIZE = 20;

export default function Dokumentasi() {
  const d = useDataset();
  const [page, setPage] = useState(1);

  const bulanOptions = useMemo(() => ["Semua", ...d.months.map((m) => m.label)], [d.months]);
  const [bulan, setBulan] = useState("Semua");
  const [q, setQ] = useState("");

  const [openingTanggal, setOpeningTanggal] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const monthCodeByLabel = useMemo(() => {
    const map = new Map<string, string>();
    d.months.forEach((m) => map.set(m.label, m.code));
    return map;
  }, [d.months]);

  const hariBerfoto = useMemo(
    () => d.days.filter((day) => day.jumlahFoto > 0).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)),
    [d.days]
  );

  const filtered = useMemo(() => {
    return hariBerfoto.filter((day) => {
      if (bulan !== "Semua" && !day.tanggal.startsWith(monthCodeByLabel.get(bulan) ?? "\0")) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const haystack = `${formatTanggal(day.tanggal)} ${day.hari ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [hariBerfoto, bulan, q, monthCodeByLabel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  function bukaFoto(tanggal: string) {
    setOpenError(null);
    setOpeningTanggal(tanggal);
    // Dibuka sinkron di dalam click handler supaya tidak diblokir popup blocker,
    // lalu diarahkan ke URL asli setelah didapat dari Apps Script.
    const win = window.open("", "_blank");
    getFotoLinkUntukTanggal(tanggal)
      .then((url) => {
        if (!url) {
          win?.close();
          setOpenError("Tidak menemukan galeri foto untuk tanggal ini di spreadsheet.");
          return;
        }
        if (win) win.location.href = url;
        else window.open(url, "_blank");
      })
      .catch((err: Error) => {
        win?.close();
        setOpenError(err.message);
      })
      .finally(() => setOpeningTanggal(null));
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
      <div>
        <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">📸 Dokumentasi</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">Rekap screenshot bukti progres/hasil kerja per hari</p>
      </div>

      <DinoGreeting
        size={56}
        message={
          <>
            aku sudah menyimpan {d.totalFoto} foto bukti kerja dari {hariBerfoto.length} hari yang terdokumentasi.
          </>
        }
      />

      <div className="rounded-2xl border border-border bg-surface p-5">
        <span className="font-mn text-[15px] font-bold">Total Foto per Bulan</span>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {d.months.map((m) => (
            <div key={m.code} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-alt p-4">
              <EmojiBadge emoji="📸" tint="accent" />
              <span className="font-mn text-xl font-extrabold">{m.totalFoto}</span>
              <span className="text-center text-[11px] font-semibold text-ink-tertiary">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {openError && (
        <div className="flex items-center justify-between rounded-xl border border-[oklch(82%_0.08_25)] bg-bad-tint px-4 py-3 text-[13px] font-semibold text-bad-text">
          {openError}
          <button onClick={() => setOpenError(null)} className="text-xs font-bold underline">
            Tutup
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <FilterChip label="Bulan" value={bulan} options={bulanOptions} onChange={resetPage(setBulan)} />
        <div className="ml-auto flex min-w-[240px] items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
          <Search className="text-ink-tertiary" />
          <input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Cari tanggal atau hari..."
            className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-ink-tertiary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border-strong px-5 py-3.5">
          <span className="font-mn text-[15px] font-bold">Hari dengan Dokumentasi</span>
          <span className="text-xs text-ink-tertiary">{filtered.length} hari</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-3 border-b border-border-strong px-5 py-3">
              {["Tanggal", "Hari", "Tugas Tercatat", "Jumlah Foto"].map((h) => (
                <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                  {h}
                </span>
              ))}
            </div>
            {pageRows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink-tertiary">Tidak ada hari yang cocok dengan filter.</div>
            )}
            {pageRows.map((day) => (
              <button
                key={day.tanggal}
                onClick={() => bukaFoto(day.tanggal)}
                disabled={openingTanggal === day.tanggal}
                className="grid w-full grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-3 border-b border-border bg-transparent px-5 py-3 text-left last:border-b-0 hover:bg-surface-alt disabled:opacity-60"
              >
                <span className="text-[13px] font-semibold">{formatTanggal(day.tanggal)}</span>
                <span className="text-[13px] text-ink-secondary">{day.hari}</span>
                <span className="text-[13px] text-ink-secondary">{day.totalTugas}</span>
                <span className="text-[13px] font-bold text-accent">
                  {openingTanggal === day.tanggal ? "Membuka..." : `📸 ${day.jumlahFoto} · Lihat`}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-xs text-ink-tertiary">
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} hari
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

      <p className="text-xs text-ink-tertiary">
        Klik salah satu baris untuk membuka galeri foto asli di tab baru, langsung ke baris tanggal itu pada sheet{" "}
        <strong>"&lt;BULAN&gt; FOTO"</strong> di spreadsheet sumber (hanya bisa saat dashboard dibuka sebagai Apps
        Script Web App, bukan di preview lokal).
      </p>
    </div>
  );
}

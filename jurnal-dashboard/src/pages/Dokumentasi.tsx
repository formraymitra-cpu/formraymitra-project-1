import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import DinoGreeting from "../components/DinoGreeting";
import EmojiBadge from "../components/EmojiBadge";
import FotoModal from "../components/FotoModal";
import { formatTanggal } from "../lib/format";
import { getFotoUntukTanggal } from "../lib/gas";

const PAGE_SIZE = 20;

export default function Dokumentasi() {
  const d = useDataset();
  const [page, setPage] = useState(1);

  const [modalTanggal, setModalTanggal] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hariBerfoto = useMemo(() => d.days.filter((day) => day.jumlahFoto > 0).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)), [d.days]);

  const totalPages = Math.max(1, Math.ceil(hariBerfoto.length / PAGE_SIZE));
  const pageRows = hariBerfoto.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function bukaFoto(tanggal: string, jumlahFoto: number) {
    setModalTanggal(tanggal);
    setImages([]);
    setError(null);
    setLoading(true);
    getFotoUntukTanggal(tanggal, jumlahFoto)
      .then(setImages)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
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

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border-strong px-5 py-3.5">
          <span className="font-mn text-[15px] font-bold">Hari dengan Dokumentasi</span>
          <span className="text-xs text-ink-tertiary">{hariBerfoto.length} hari</span>
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
            {pageRows.map((day) => (
              <button
                key={day.tanggal}
                onClick={() => bukaFoto(day.tanggal, day.jumlahFoto)}
                className="grid w-full grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-3 border-b border-border bg-transparent px-5 py-3 text-left last:border-b-0 hover:bg-surface-alt"
              >
                <span className="text-[13px] font-semibold">{formatTanggal(day.tanggal)}</span>
                <span className="text-[13px] text-ink-secondary">{day.hari}</span>
                <span className="text-[13px] text-ink-secondary">{day.totalTugas}</span>
                <span className="text-[13px] font-bold text-accent">📸 {day.jumlahFoto} &middot; Lihat</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-xs text-ink-tertiary">
            Menampilkan {hariBerfoto.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(page * PAGE_SIZE, hariBerfoto.length)} dari {hariBerfoto.length} hari
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
        Klik salah satu baris untuk memuat foto aslinya langsung dari sheet <strong>"&lt;BULAN&gt; FOTO"</strong> di
        spreadsheet sumber (hanya bisa saat dashboard dibuka sebagai Apps Script Web App).
      </p>

      {modalTanggal && (
        <FotoModal
          tanggalLabel={formatTanggal(modalTanggal)}
          images={images}
          loading={loading}
          error={error}
          onClose={() => setModalTanggal(null)}
        />
      )}
    </div>
  );
}

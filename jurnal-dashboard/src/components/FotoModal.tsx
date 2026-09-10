export default function FotoModal({
  tanggalLabel,
  images,
  loading,
  error,
  onClose,
}: {
  tanggalLabel: string;
  images: string[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-shrink-0 items-center justify-between">
          <span className="font-mn text-[15px] font-bold">📸 Foto &middot; {tanggalLabel}</span>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-secondary"
          >
            Tutup
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <p className="py-8 text-center text-sm text-ink-tertiary">Memuat foto dari spreadsheet...</p>}
          {!loading && error && <p className="py-8 text-center text-sm text-bad-text">{error}</p>}
          {!loading && !error && images.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-tertiary">Tidak ada foto untuk tanggal ini.</p>
          )}
          {!loading && !error && images.length > 0 && (
            <div className="flex flex-col gap-3">
              {images.map((src, i) => (
                <img key={i} src={src} alt={`Dokumentasi ${i + 1}`} className="w-full rounded-lg border border-border" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useDataset } from "../useDataset";
import { RankedBarChart } from "../components/charts";

export default function Notes() {
  const dataset = useDataset();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const chartData = dataset.notes
    .filter((n) => n.text.toUpperCase() !== "SDH DIBYR")
    .slice(0, 10)
    .map((n) => ({ label: n.text, value: n.count }));

  function toggle(text: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mn text-2xl font-extrabold text-ink">Catatan &amp; Kendala</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Ringkasan keterangan/kendala unik yang tercatat di kolom Keterangan &amp; Note pada tabel progress.
        </p>
      </header>

      {chartData.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-mn text-sm font-bold text-ink">Kategori Kendala Terbanyak</h2>
          <p className="mb-4 text-xs text-ink-secondary">Tidak termasuk catatan "SDH DIBYR" (status pembayaran rutin)</p>
          <RankedBarChart data={chartData} formatValue={(v) => `${v} lokasi`} color="#e2a53a" />
        </section>
      )}

      <section className="space-y-3">
        {dataset.notes.map((n) => {
          const isOpen = expanded.has(n.text);
          return (
            <div key={n.text} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <button className="flex w-full items-center justify-between text-left" onClick={() => toggle(n.text)}>
                <div>
                  <div className="font-semibold text-ink">{n.text}</div>
                  <div className="text-xs text-ink-tertiary">{n.count} kejadian &middot; {n.locations.length} lokasi</div>
                </div>
                <span className="text-ink-tertiary">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {n.locations.map((loc) => (
                    <span key={loc} className="rounded-full bg-surface-alt px-2.5 py-1 text-xs text-ink-secondary">
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

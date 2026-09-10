import { useMemo, useState } from "react";
import { useDataset } from "../useDataset";
import { WeeklyActivityChart } from "../components/charts";
import { formatDateId } from "../lib/format";

const PAGE_SIZE = 40;

function isoWeekLabel(dateStr: string): { key: string; label: string } {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const key = monday.toISOString().slice(0, 10);
  const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(monday);
  return { key, label };
}

export default function ActivityLog() {
  const dataset = useDataset();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sortedDesc = useMemo(() => [...dataset.dailyLog].reverse(), [dataset.dailyLog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedDesc;
    return sortedDesc.filter(
      (e) => e.kegiatan.toLowerCase().includes(q) || (e.keterangan ?? "").toLowerCase().includes(q),
    );
  }, [sortedDesc, query]);

  const weekly = useMemo(() => {
    const last16Weeks = dataset.dailyLog.slice(-16 * 7 * 3);
    const map = new Map<string, { key: string; label: string; value: number }>();
    for (const e of last16Weeks) {
      const { key, label } = isoWeekLabel(e.date);
      const existing = map.get(key);
      if (existing) existing.value += 1;
      else map.set(key, { key, label, value: 1 });
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  }, [dataset.dailyLog]);

  const grouped = useMemo(() => {
    const groups: { date: string; entries: typeof filtered }[] = [];
    for (const e of filtered.slice(0, visible)) {
      const last = groups[groups.length - 1];
      if (last && last.date === e.date) last.entries.push(e);
      else groups.push({ date: e.date, entries: [e] });
    }
    return groups;
  }, [filtered, visible]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mn text-2xl font-extrabold text-ink">Log Aktivitas Harian</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {dataset.dailyLog.length} kegiatan tercatat, {formatDateId(dataset.dailyLog[0].date)} — {formatDateId(dataset.dailyLog[dataset.dailyLog.length - 1].date)}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 font-mn text-sm font-bold text-ink">Beban Kerja Mingguan</h2>
        <p className="mb-4 text-xs text-ink-secondary">Jumlah aktivitas per minggu (12 minggu terakhir)</p>
        <WeeklyActivityChart data={weekly} />
      </section>

      <input
        type="search"
        placeholder="Cari kegiatan atau keterangan..."
        className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setVisible(PAGE_SIZE);
        }}
      />

      <section className="space-y-5">
        {grouped.map((g) => (
          <div key={g.date}>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-tertiary">{formatDateId(g.date)}</div>
            <ul className="space-y-1.5 border-l-2 border-border pl-4">
              {g.entries.map((e, i) => (
                <li key={i} className="text-sm text-ink">
                  <span className="font-medium">{e.kegiatan}</span>
                  {e.keterangan && <span className="text-ink-secondary"> — {e.keterangan}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-tertiary">Tidak ada aktivitas yang cocok.</p>}
      </section>

      {visible < filtered.length && (
        <button
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-alt"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
        >
          Tampilkan lebih banyak ({filtered.length - visible} lagi)
        </button>
      )}
    </div>
  );
}

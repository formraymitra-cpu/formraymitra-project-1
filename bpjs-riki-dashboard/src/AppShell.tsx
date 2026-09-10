import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDataset, useLatestMonthCode } from "./useDataset";

const NAV_ITEMS = [
  { to: "/", label: "Ringkasan", icon: "📊", end: true },
  { to: "/progress", label: "Progress Bulanan", icon: "📅" },
  { to: "/lokasi", label: "Detail Lokasi", icon: "🏢" },
  { to: "/nominal", label: "Rekap Nominal", icon: "💰" },
  { to: "/aktivitas", label: "Log Aktivitas", icon: "📝" },
  { to: "/catatan", label: "Catatan & Kendala", icon: "⚠️" },
];

export interface ShellContext {
  monthCode: string;
  setMonthCode: (code: string) => void;
}

export function AppShell() {
  const dataset = useDataset();
  const latest = useLatestMonthCode();
  const [monthCode, setMonthCode] = useState(latest);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 px-2">
          <div className="font-mn text-lg font-extrabold text-ink">BPJS Monitoring</div>
          <div className="text-xs text-ink-tertiary">PIC: RIKI &middot; Laporan Harian</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-tint text-accent"
                    : "text-ink-secondary hover:bg-surface-alt hover:text-ink"
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <label className="mb-1.5 block px-1 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            Bulan
          </label>
          <select
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink"
            value={monthCode}
            onChange={(e) => setMonthCode(e.target.value)}
          >
            {dataset.months.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="mt-3 px-1 text-[11px] text-ink-tertiary">
            Data diperbarui: {dataset.generatedAt}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-bg px-6 py-6 sm:px-8">
        <Outlet context={{ monthCode, setMonthCode } satisfies ShellContext} />
      </main>
    </div>
  );
}

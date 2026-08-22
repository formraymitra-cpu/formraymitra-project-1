import { NavLink, Outlet } from "react-router-dom";
import { ChevronDown } from "./components/icons";
import { useDataset } from "./useDataset";

const TABS = [
  { to: "/overview", label: "Overview" },
  { to: "/monitoring", label: "Monitoring Harian" },
  { to: "/kinerja-pic", label: "Kinerja PIC" },
];

export default function AppShell() {
  const d = useDataset();
  const currentLabel = d.months.find((m) => m.code === d.currentMonth)?.label ?? d.currentMonth;

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-border bg-surface px-6 sm:px-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-accent font-mn text-[15px] font-extrabold text-white">
              M
            </div>
            <span className="hidden font-mn text-[15px] font-bold tracking-tight sm:inline">
              Monitoring Laporan &amp; Absensi
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-[13.5px] font-semibold no-underline ${
                    isActive ? "bg-accent-tint text-accent" : "text-ink-secondary hover:bg-surface-alt"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] font-semibold text-ink-secondary md:flex">
            {currentLabel}
            <ChevronDown />
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-border-strong bg-surface-alt font-mn text-[12.5px] font-bold text-ink-secondary">
              AD
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

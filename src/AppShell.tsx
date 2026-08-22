import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown } from "./components/icons";
import { useDataset } from "./useDataset";
import { usePayrollDataset } from "./usePayrollDataset";

const TABS = [
  { to: "/overview", label: "Overview" },
  { to: "/monitoring", label: "Monitoring Harian" },
  { to: "/kinerja-pic", label: "Kinerja PIC" },
  { to: "/payroll/ringkasan", label: "Ringkasan Payroll", divider: true },
  { to: "/payroll/progres", label: "Progres Payroll" },
  { to: "/payroll/detail", label: "Detail per Lokasi" },
  { to: "/payroll/notice", label: "Notice Merah" },
];

export default function AppShell() {
  const d = useDataset();
  const p = usePayrollDataset();
  const location = useLocation();
  const isPayroll = location.pathname.startsWith("/payroll");

  const currentLabel = isPayroll
    ? p.periodeLabel || p.periode || "—"
    : d.months.find((m) => m.code === d.currentMonth)?.label ?? d.currentMonth;

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="sticky top-0 z-10 flex h-[64px] items-center justify-between gap-6 border-b border-border bg-surface px-6 sm:px-10">
        <div className="flex min-w-0 flex-shrink-0 items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[9px] bg-accent font-mn text-[15px] font-extrabold text-white">
            M
          </div>
          <span className="hidden whitespace-nowrap font-mn text-[14px] font-bold tracking-tight lg:inline">
            RMP Dashboard
          </span>
        </div>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <span key={t.to} className="flex flex-shrink-0 items-center gap-1">
              {t.divider && <span className="mx-2 h-5 w-px flex-shrink-0 bg-border" />}
              <NavLink
                to={t.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold no-underline ${
                    isActive ? "bg-accent-tint text-accent" : "text-ink-secondary hover:bg-surface-alt"
                  }`
                }
              >
                {t.label}
              </NavLink>
            </span>
          ))}
        </nav>
        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-[13px] font-semibold text-ink-secondary md:flex">
            {currentLabel}
            <ChevronDown />
          </div>
          <div className="h-6 w-px flex-shrink-0 bg-border" />
          <div className="flex flex-shrink-0 items-center gap-2.5">
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

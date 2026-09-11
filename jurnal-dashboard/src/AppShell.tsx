import { NavLink, Outlet } from "react-router-dom";
import { useDataset } from "./useDataset";
import { formatTanggalPendek } from "./lib/format";
import DinoRajin from "./components/DinoRajin";

const TABS = [
  { to: "/overview", label: "Overview" },
  { to: "/rekap-bulanan", label: "Rekap Bulanan" },
  { to: "/monitoring-harian", label: "Monitoring Harian" },
  { to: "/dokumentasi", label: "Dokumentasi" },
  { to: "/invoice", label: "Invoice" },
];

export default function AppShell() {
  const d = useDataset();

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-border bg-surface px-6 sm:px-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-warn-tint">
              <DinoRajin size={30} />
            </div>
            <span className="hidden font-mn text-[15px] font-bold tracking-tight sm:inline">
              Dino Rajin &middot; Monitoring Pekerjaan Harian Dini Saffanah
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
        <div className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] font-semibold text-ink-secondary md:flex">
          {d.rentangTanggal.mulai ? formatTanggalPendek(d.rentangTanggal.mulai) : "—"}
          {" – "}
          {d.rentangTanggal.akhir ? formatTanggalPendek(d.rentangTanggal.akhir) : "—"}
        </div>
      </div>
      <Outlet />
    </div>
  );
}

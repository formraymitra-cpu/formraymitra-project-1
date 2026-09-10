import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Dataset } from "./types";

declare global {
  interface Window {
    __DASHBOARD_DATA__?: Dataset;
  }
}

async function loadDataset(): Promise<Dataset> {
  if (typeof window !== "undefined" && window.__DASHBOARD_DATA__) {
    return window.__DASHBOARD_DATA__;
  }
  // Fallback ini hanya dipakai untuk `npm run dev`/preview statis (mis. GitHub
  // Pages). Vite memecahnya jadi chunk terpisah (dynamic import), sehingga di
  // deployment Apps Script — yang selalu menyuntikkan window.__DASHBOARD_DATA__
  // sebelum baris ini sempat jalan — chunk berisi snapshot ~1MB ini tidak
  // pernah benar-benar diminta oleh browser, dan bundle utama tetap kecil.
  const mod = await import("./data/dashboard-data.json");
  return mod.default as unknown as Dataset;
}

const DatasetContext = createContext<Dataset | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    let alive = true;
    loadDataset().then((d) => {
      if (alive) setDataset(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!dataset) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-secondary">Memuat data...</div>;
  }
  return <DatasetContext.Provider value={dataset}>{children}</DatasetContext.Provider>;
}

export function useDataset(): Dataset {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset() dipanggil di luar <DatasetProvider>");
  return ctx;
}

export function useLatestMonthCode(): string {
  const dataset = useDataset();
  return dataset.months[dataset.months.length - 1].code;
}

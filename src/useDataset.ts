import fallback from "./data/dashboard-data.json";
import type { Dataset } from "./types";

declare global {
  interface Window {
    __DASHBOARD_DATA__?: Dataset;
  }
}

const dataset: Dataset = (typeof window !== "undefined" && window.__DASHBOARD_DATA__) || (fallback as unknown as Dataset);

export function useDataset(): Dataset {
  return dataset;
}

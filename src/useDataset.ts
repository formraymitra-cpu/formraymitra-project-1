import raw from "./data/dashboard-data.json";
import type { Dataset } from "./types";

const dataset = raw as unknown as Dataset;

export function useDataset(): Dataset {
  return dataset;
}

import { useMemo } from "react";
import raw from "./data/dashboard-data.json";
import type { Dataset } from "./types";

const dataset = raw as Dataset;

export function useDataset(): Dataset {
  return dataset;
}

export function useMonthCodes(): string[] {
  return useMemo(() => dataset.months.map((m) => m.code), []);
}

export function useLatestMonthCode(): string {
  return dataset.months[dataset.months.length - 1].code;
}

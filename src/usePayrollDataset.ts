import fallback from "./data/payroll-data.json";
import type { PayrollDataset } from "./payrollTypes";

declare global {
  interface Window {
    __PAYROLL_DATA__?: PayrollDataset;
  }
}

const dataset: PayrollDataset =
  (typeof window !== "undefined" && window.__PAYROLL_DATA__) || (fallback as unknown as PayrollDataset);

export function usePayrollDataset(): PayrollDataset {
  return dataset;
}

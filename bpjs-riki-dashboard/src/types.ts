export type LokasiStatus = "selesai" | "proses" | "belum" | "no-data";

export interface StagePair {
  kes?: boolean | null;
  tk?: boolean | null;
}

export interface LocationStages {
  rekapGaji: StagePair;
  rekapBayar: StagePair;
  nominalBayar: StagePair;
  pengecekanGaji: StagePair;
  finalisasi: StagePair;
  buktiBayar: StagePair;
}

export interface LocationRow {
  month: string;
  no: number;
  kelompokKes: string | null;
  lokasi: string;
  stages: LocationStages;
  keteranganKes: string | null;
  keteranganTk: string | null;
  note: string | null;
  status: LokasiStatus;
  progressPct: number | null;
}

export interface StageCellCount {
  selesai: number;
  belum: number;
  kosong: number;
}

export interface MonthStageCounts {
  rekapGaji: { kes: StageCellCount; tk: StageCellCount };
  rekapBayar: { kes: StageCellCount; tk: StageCellCount };
  nominalBayar: { kes: StageCellCount; tk: StageCellCount };
  pengecekanGaji: { tk: StageCellCount };
  finalisasi: { tk: StageCellCount };
  buktiBayar: { kes: StageCellCount; tk: StageCellCount };
}

export interface MonthSummary {
  code: string;
  label: string;
  totalLokasi: number;
  lokasiSelesai: number;
  lokasiProses: number;
  lokasiBelum: number;
  lokasiNoData: number;
  overallPct: number | null;
  stages: MonthStageCounts;
}

export interface DailyLogEntry {
  date: string;
  kegiatan: string;
  keterangan: string | null;
  sourceMonth: string | null;
}

export interface PaymentRow {
  no: number;
  lokasi: string;
  nominalKes: number | null;
  nominalKesNote: string | null;
  nominalTk: number | null;
  total: number;
}

export interface NoteSummary {
  text: string;
  count: number;
  locations: string[];
}

export interface Dataset {
  generatedAt: string;
  months: MonthSummary[];
  locations: LocationRow[];
  dailyLog: DailyLogEntry[];
  payments: PaymentRow[];
  notes: NoteSummary[];
}

export const STAGE_DEFS: { key: keyof LocationStages; label: string; hasKes: boolean }[] = [
  { key: "rekapGaji", label: "Rekap u/ Penggajian", hasKes: true },
  { key: "rekapBayar", label: "Rekap Pembayaran", hasKes: true },
  { key: "nominalBayar", label: "Nominal Bayar", hasKes: true },
  { key: "pengecekanGaji", label: "Pengecekan Rekap Gaji", hasKes: false },
  { key: "finalisasi", label: "Finalisasi", hasKes: false },
  { key: "buktiBayar", label: "Bukti Bayar BPJS", hasKes: true },
];

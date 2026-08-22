export type Status = "selesai" | "proses" | "overdue" | "no-data";

export interface FieldStatus {
  selesai: boolean;
  tanggalSelesai: string | null;
  keterangan: string | null;
}

export interface Location {
  nama: string;
  baseKey: string;
  tipeClient: "LAMA" | "BARU" | null;
  metode: string | null;
  pic: string | null;
  laporan: FieldStatus;
  absensi: FieldStatus;
  catatan: string | null;
  status: Status;
  hariTelat: number | null;
}

export interface MonthSummary {
  code: string;
  label: string;
  isClosed: boolean;
  totalLokasi: number;
  laporanSelesai: number;
  laporanPct: number | null;
  absensiSelesai: number;
  absensiPct: number | null;
  keduanyaSelesai: number;
  overdueCount: number;
}

export interface HeatmapCell {
  month: string;
  status: Status;
}

export interface HeatmapSite {
  baseKey: string;
  cells: HeatmapCell[];
}

export interface LeaderboardEntry {
  pic: string;
  lokasiDitangani: number;
  selesai: number;
  overdue: number;
  pctTepatWaktu: number;
  basisBulan: string;
  lokasiSaatIni: number;
  selesaiSaatIni: number;
  prosesSaatIni: number;
  overdueSaatIni: number;
}

export interface ExcludedLocation {
  nama: string;
  keterangan: string | null;
}

export interface Dataset {
  generatedAt: string;
  sourceFile: string;
  asOfDate: string;
  currentMonth: string;
  months: MonthSummary[];
  totalLokasiAktif: number;
  totalLokasiDikecualikan: number;
  tipeCounts: { LAMA: number; BARU: number; TIDAK_DIKETAHUI: number };
  picCoveragePct: number;
  locations: Location[];
  excludedLocations: ExcludedLocation[];
  heatmap: HeatmapSite[];
  leaderboard: LeaderboardEntry[];
}

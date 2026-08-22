export type MatchConfidence = "auto" | "manual" | "ambigu" | "belum-ada";

export type Role1Status = "sesuai" | "proses" | "selisih" | "tanpa-data";
export type Role2Status = "sesuai" | "selisih" | "rab-kosong";

export interface PayrollMember {
  namaRekap: string;
  namaMutasi: string | null;
  nominalRekap: number | null;
  nominalMutasi: number | null;
  selisih: number | null;
  bank: string | null;
  tanggalMutasi: string | null;
  statusAkhir: string | null;
  transferGanda: boolean;
  jumlahRefGanda: number;
}

export interface PayrollLocation {
  nama: string;
  pic: string | null;
  namaRekapGaji: string | null;
  linkGajiPic: string | null;
  bank: string | null;
  rab: number | null;
  gaji: number | null;
  diterimaKaryawan: number | null;
  bpjsKes: number | null;
  bpjsTk: number | null;
  payroll: number | null;
  statusKomponen: string | null;

  lokasiRekonsiliasi: string | null;
  matchConfidence: MatchConfidence;
  kandidatAmbigu: string[];

  jumlahAnggota: number;
  jumlahSudahTertransfer: number;
  nominalSeharusnya: number;
  nominalTertransfer: number;

  statusRole1: Role1Status;
  selisihRole1: number | null;
  statusRole2: Role2Status;
  selisihRole2: number | null;

  anggota: PayrollMember[];
}

export type NoticeKategori =
  | "double-transfer"
  | "belum-transfer"
  | "transfer-lebih"
  | "transfer-kurang"
  | "gaji-vs-rab"
  | "nama-lokasi-perlu-cek"
  | "lokasi-tidak-ketemu";

export interface PayrollNotice {
  id: string;
  kategori: NoticeKategori;
  severity: "tinggi" | "sedang";
  lokasi: string;
  namaKaryawan: string | null;
  nominalDampak: number | null;
  keterangan: string;
}

export interface PayrollPicImport {
  pic: string;
  namaFile: string;
  tanggalImport: string | null;
  status: string;
}

export interface PayrollKpi {
  totalRab: number;
  totalGaji: number;
  totalDiterimaKaryawan: number;
  totalBpjsKes: number;
  totalBpjsTk: number;
  totalPayroll: number;
  totalGajiTertransfer: number;
  kewajibanTerekonsiliasi: number;
  kewajibanBelumRekonsiliasi: number;
  selisihRole1: number;
  selisihRole2: number;
  lokasiRabTerisi: number;
}

export interface PayrollMonthlyTotal {
  code: string;
  label: string;
  totalRab: number;
  totalGaji: number;
  totalDiterimaKaryawan: number;
  totalBpjsKes: number;
  totalBpjsTk: number;
  totalPayroll: number;
  lokasiTerisi: number;
  totalLokasi: number;
}

export interface PayrollDataset {
  generatedAt: string;
  periode: string;
  periodeLabel: string;
  periodeMulai: string | null;
  periodeSelesai: string | null;
  asOfDate: string;

  kpi: PayrollKpi;
  totalLokasi: number;
  lokasiSudahDicek: number;
  lokasiSesuai: number;
  lokasiTidakSesuai: number;
  lokasiBelumAdaRekonsiliasi: number;

  picImports: PayrollPicImport[];
  locations: PayrollLocation[];
  notices: PayrollNotice[];
  monthlyTotals: PayrollMonthlyTotal[];
}

export interface Task {
  tanggal: string;
  hari: string | null;
  jamMasuk: string | null;
  jamPulang: string | null;
  no: number | null;
  tugas: string | null;
  selesai: boolean;
  jadwal: string | null;
  keterangan: string | null;
  jumlahFoto: number;
}

export interface DayRecord {
  tanggal: string;
  hari: string | null;
  jamMasuk: string | null;
  jamPulang: string | null;
  jamKerjaJam: number | null;
  totalTugas: number;
  selesai: number;
  pctSelesai: number | null;
  jumlahFoto: number;
}

export interface MonthSummary {
  code: string;
  label: string;
  hariTercatat: number;
  totalTugas: number;
  selesai: number;
  pctSelesai: number | null;
  rataJamKerja: number | null;
  totalFoto: number;
}

export interface TagihanBulanItem {
  bulan: string;
  nominal: number | null;
  keterangan: string | null;
  status: string | null;
}

export interface TagihanLokasi {
  no: number | null;
  lokasi: string;
  noSp: string | null;
  tanggalSp: string | null;
  jumlahTermin: number | null;
  perBulan: TagihanBulanItem[];
  totalNominal: number;
  totalBulan: number;
  selesai: number;
  status: "selesai" | "proses" | "belum";
}

export interface BagianNominal {
  bagianKerja: string | null;
  nominal: number | null;
}

export interface BeritaAcara {
  nomor: string | null;
  tanggal: string | null;
}

export interface KontrakInfo {
  noSp: string | null;
  tanggalSp: string | null;
  lamaKontrak: string | null;
  periodeKontrak: string | null;
  termin: string | null;
  metode: string | null;
  statusNomor: string | null;
  linkNomor: string | null;
}

export interface DokumenLokasiBulan {
  lokasi: string;
  dokumen: Record<string, boolean>;
  tanggalKirim: string | null;
  totalDokumen: number;
  dokumenLengkap: number;
  pctLengkap: number | null;
  tagihan: BagianNominal[];
  totalNominal: number;
  noInvoiceKwitansi: string | null;
  bapp: BeritaAcara;
  bast: BeritaAcara;
  bap: BeritaAcara;
  kontrak: KontrakInfo;
}

export interface DokumenBulan {
  code: string;
  label: string;
  jenisDokumen: string[];
  lokasi: DokumenLokasiBulan[];
  pctRataRata: number | null;
  totalNominal: number;
}

export interface InvoiceDataset {
  generatedAt: string;
  sourceFile: string | null;
  tersedia: boolean;
  tagihan: TagihanLokasi[];
  totalLokasiTagihan: number;
  totalNominalKeseluruhan: number;
  totalNominalBelumSelesai: number;
  totalNominalTagihan: number;
  dokumenBulanan: DokumenBulan[];
  catatan: string[];
}

export interface GajiLokasi {
  no: number | null;
  lokasi: string;
  picGaji: string | null;
  linkGajiPic: string | null;
  cek: boolean | null;
  bank: string | null;
  rab: number | null;
  gaji: number | null;
  diterimaKaryawan: number | null;
  bpjsKes: number | null;
  bpjsTk: number | null;
  payroll: number | null;
  keterangan: string | null;
}

export interface GajiBank {
  bank: string;
  totalLokasi: number;
  totalGaji: number;
}

export interface GajiBulan {
  code: string;
  label: string;
  lokasi: GajiLokasi[];
  totalLokasi: number;
  totalCek: number;
  pctCek: number | null;
  totalSesuai: number;
  pctSesuai: number | null;
  totalGaji: number;
  totalDiterimaKaryawan: number;
  totalBpjsKes: number;
  totalBpjsTk: number;
  totalPayroll: number;
  perBank: GajiBank[];
}

export interface GajiDataset {
  generatedAt: string;
  sourceFile: string | null;
  tersedia: boolean;
  bulanan: GajiBulan[];
}

export interface Dataset {
  generatedAt: string;
  sourceFile: string;
  months: MonthSummary[];
  days: DayRecord[];
  tasks: Task[];
  totalHariTercatat: number;
  totalTugas: number;
  totalSelesai: number;
  pctSelesaiKeseluruhan: number | null;
  totalFoto: number;
  rataJamKerjaKeseluruhan: number | null;
  rentangTanggal: { mulai: string | null; akhir: string | null };
  invoice: InvoiceDataset;
  gaji: GajiDataset;
}

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

export interface DokumenLokasiBulan {
  lokasi: string;
  dokumen: Record<string, boolean>;
  tanggalKirim: string | null;
  totalDokumen: number;
  dokumenLengkap: number;
  pctLengkap: number | null;
}

export interface DokumenBulan {
  code: string;
  label: string;
  jenisDokumen: string[];
  lokasi: DokumenLokasiBulan[];
  pctRataRata: number | null;
}

export interface InvoiceDataset {
  generatedAt: string;
  sourceFile: string | null;
  tersedia: boolean;
  tagihan: TagihanLokasi[];
  totalLokasiTagihan: number;
  totalNominalKeseluruhan: number;
  totalNominalBelumSelesai: number;
  dokumenBulanan: DokumenBulan[];
  catatan: string[];
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
}

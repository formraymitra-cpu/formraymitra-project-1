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
}

# Dashboard Ray Mitra Perkasa

Web app dengan dua dashboard dalam satu aplikasi:

- **Monitoring Laporan & Absensi** — kepatuhan Laporan Bulanan & Absensi tiap lokasi/client (Overview, Monitoring Harian, Kinerja PIC).
- **Rekonsiliasi Payroll** — kesesuaian REKAP GAJI SEMUA LOKASI vs REKONSILIASI REKAP GAJI DAN MUTASI (Ringkasan, Progres, Detail per Lokasi, Notice Merah).

## Menjalankan

```bash
npm install
npm run dev
```

## Data — Monitoring Laporan & Absensi

Dataset di `src/data/dashboard-data.json` dihasilkan dari export Excel spreadsheet sumber ("CEKLIS LAPORAN BULANAN.xlsx") lewat `scripts/build-data.py`:

```bash
python3 scripts/build-data.py <path-ke-xlsx-terbaru> <tanggal-hari-ini YYYY-MM-DD>
```

Live-sync: `apps-script/` (Apps Script **bound** ke spreadsheet sumber, lihat `apps-script/README.md`).

## Data — Rekonsiliasi Payroll

Dataset di `src/data/payroll-data.json` dihasilkan dari export **REKAP GAJI SEMUA LOKASI** + **REKONSILIASI REKAP GAJI DAN MUTASI** lewat `scripts/build-payroll-data.py`:

```bash
python3 scripts/build-payroll-data.py <rekap-gaji.xlsx> <rekonsiliasi.xlsx> [tanggal-hari-ini YYYY-MM-DD]
```

Live-sync: `apps-script-payroll/` (Apps Script **standalone**, tidak bound ke spreadsheet manapun — supaya tidak bentrok dengan script yang sudah ada di kedua spreadsheet sumber. Baca `apps-script-payroll/README.md` untuk deploy, termasuk cara script menemukan file REKONSILIASI bulan berjalan otomatis dan cara menambahkan pemetaan nama lokasi manual lewat sheet `MAPPING_LOKASI`).

Setelah generate ulang salah satu dataset, commit ulang file JSON-nya.

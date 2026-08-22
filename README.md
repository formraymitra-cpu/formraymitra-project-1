# Dashboard Monitoring Laporan & Absensi

Web app untuk memantau kepatuhan Laporan Bulanan & Absensi tiap lokasi/client, dengan 3 halaman: Overview (KPI eksekutif), Monitoring Harian (tabel kerja admin), dan Kinerja PIC (leaderboard).

## Menjalankan

```bash
npm install
npm run dev
```

## Data

Dataset di `src/data/dashboard-data.json` dihasilkan dari export Excel spreadsheet sumber ("CEKLIS LAPORAN BULANAN.xlsx") lewat `scripts/build-data.py`. Untuk update dengan data terbaru:

```bash
python3 scripts/build-data.py <path-ke-xlsx-terbaru> <tanggal-hari-ini YYYY-MM-DD>
```

Lalu commit ulang `src/data/dashboard-data.json`.

**Belum live-sync ke Google Sheets** — data di-generate dari file export, bukan fetch otomatis. Untuk koneksi live, opsi berikutnya: publish sheet sumber sebagai CSV lewat "File > Share > Publish to web", lalu jadwalkan `build-data.py` fetch dari URL itu (atau pindah ke Google Sheets API dengan service account).

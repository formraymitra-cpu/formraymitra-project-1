# Dashboard Monitoring BPJS — Laporan Harian RIKI

Web app untuk memantau progress pengurusan BPJS Kesehatan (KES) & Ketenagakerjaan (TK)
per lokasi/klien, sebagai PIC BPJS. Aplikasi terpisah dari `dashboard-laporan-absensi`
di root repo ini (dataset & tujuan berbeda).

6 halaman:

- **Ringkasan** — KPI eksekutif, progress per tahapan, status keseluruhan, tren antar bulan.
- **Progress Bulanan** — funnel 6 tahap pengurusan untuk bulan terpilih.
- **Detail Lokasi** — checklist lengkap tiap tahap (KES/TK) per lokasi, searchable & filterable.
- **Rekap Nominal** — nominal tagihan BPJS untuk lokasi "rumah baru".
- **Log Aktivitas** — timeline kegiatan harian RIKI + beban kerja mingguan.
- **Catatan & Kendala** — ringkasan keterangan/kendala unik per lokasi.

## Menjalankan

```bash
npm install
npm run dev
```

## Deploy live-sync lewat Google Apps Script (opsional, direkomendasikan)

Ada versi yang jalan langsung di dalam Google Sheets sumbernya sendiri lewat
Apps Script — tidak perlu build/deploy ulang tiap kali spreadsheet diupdate,
karena setiap dashboard dibuka, datanya dibaca ulang live dari spreadsheet.
Lihat **[`apps-script/README.md`](apps-script/README.md)** untuk langkah deploy-nya.

## Data

Dataset di `src/data/dashboard-data.json` dihasilkan dari sheet `APRIL`–`AGUSTUS`
(tabel "PROGRESS KERJA" + bagian "LAPORAN HARIAN" di tiap sheet), `Sheet1` (log
harian konsolidasi), dan `Sheet3` (rekap nominal rumah baru) pada workbook sumber
("LAPORAN HARIAN RIKI.xlsx" / spreadsheet Google Sheets PIC BPJS).

Untuk update dengan data terbaru:

```bash
python3 scripts/build_data.py <path-ke-xlsx-terbaru> src/data/dashboard-data.json
```

Lalu commit ulang `src/data/dashboard-data.json`.

**Catatan parsing tanggal:** pada bagian "LAPORAN HARIAN" di tiap sheet bulan, sebagian
tanggal diketik sebagai teks `dd/mm` lalu otomatis dikonversi Excel memakai urutan
`mm/dd` saat tanggalnya <=12 (mis. "12/08" bisa berubah jadi 8 Desember, bukan 12
Agustus). Script `build_data.py` mendeteksi & mengoreksi kasus ini khusus untuk bagian
log per-bulan; tanggal di `Sheet1` tidak disentuh karena memang diketik langsung dan
sudah benar.

**Belum live-sync ke Google Sheets** — data di-generate dari file export, bukan fetch
otomatis. Untuk koneksi live, opsi berikutnya: publish sheet sumber sebagai CSV lewat
"File > Share > Publish to web", lalu jadwalkan `build_data.py` fetch dari URL itu
(atau pindah ke Google Sheets API dengan service account).

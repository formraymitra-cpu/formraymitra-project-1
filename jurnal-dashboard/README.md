# Dashboard Monitoring Pekerjaan Harian — Dini Saffanah

Web app untuk memantau jurnal harian ("JURNAL HARIAN DINI SAFFANAH 2026"): 6
halaman — Overview (KPI eksekutif + chart), Rekap Bulanan (tabel ringkasan per
bulan), Monitoring Harian (tabel semua tugas, bisa difilter & dicari),
Dokumentasi (rekap screenshot bukti kerja, bisa difilter per bulan/tanggal —
klik satu hari untuk membuka galeri foto aslinya di tab baru, langsung ke
baris tanggal itu pada sheet galeri di spreadsheet; fitur ini hanya aktif saat
dashboard dibuka sebagai Apps Script Web App, bukan di preview lokal),
Invoice (kelengkapan dokumen + nominal tagihan per bagian kerja per lokasi
per bulan — dari sheet bulanan "<BULAN> <TAHUN>" di spreadsheet terpisah
"MONITORING INVOICE DINI" — lihat `apps-script/README.md` bagian
"Menghubungkan submenu Invoice"), dan Cek Gaji (rekap pengecekan gaji
karyawan per lokasi per bulan — dari sheet bulanan polos ("JUNI", "JULI", dst)
di spreadsheet terpisah "CEK GAJI OTOMATIS" — lihat `apps-script/README.md`
bagian "Menghubungkan submenu Cek Gaji").

## Menjalankan (dev lokal)

```bash
npm install
npm run dev
```

## Data

Dataset di `src/data/jurnal-data.json` dihasilkan dari export xlsx sumber
("JURNAL HARIAN DINI SAFFANAH 2026.xlsx", hasil gabungan sheet per bulan)
lewat `scripts/build-data.py`. Untuk update dengan data terbaru:

```bash
python3 scripts/build-data.py <path-ke-jurnal.xlsx> [path-ke-invoice.xlsx] [path-ke-cek-gaji.xlsx]
```

Argumen kedua (opsional) adalah export xlsx dari spreadsheet "MONITORING
INVOICE DINI" — isi kalau mau preview halaman Invoice dengan data asli di
`npm run dev`.

Argumen ketiga (opsional) adalah export xlsx dari spreadsheet "CEK GAJI
OTOMATIS" — isi kalau mau preview halaman Cek Gaji dengan data asli.

Lalu commit ulang `src/data/jurnal-data.json`. Dataset ini hanya dipakai untuk
preview lokal (`npm run dev`) — begitu di-deploy sebagai Apps Script Web App
(lihat `apps-script/README.md`), dashboard baca langsung dari spreadsheet
Google Sheets setiap kali dibuka, jadi selalu versi terbaru tanpa perlu build
ulang.

## Deploy sebagai dashboard live (Google Apps Script)

Lihat `apps-script/README.md` untuk langkah lengkap deploy sebagai Web App
yang terhubung langsung ke spreadsheet "JURNAL HARIAN DINI SAFFANAH 2026" di
Google Sheets kamu.

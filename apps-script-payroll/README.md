# Deploy Dashboard Rekonsiliasi Payroll (Apps Script standalone)

Script ini **standalone** — dibuat sebagai project Apps Script sendiri (bukan
nempel/bound ke spreadsheet manapun), supaya tidak bentrok dengan script yang
sudah berjalan di dalam spreadsheet REKAP GAJI SEMUA LOKASI maupun
REKONSILIASI REKAP GAJI DAN MUTASI. Script ini **hanya membaca** kedua
spreadsheet itu lewat `SpreadsheetApp.openById()` — tidak pernah menulis apa
pun ke sana, jadi aman dijalankan berdampingan dengan otomasi yang sudah ada
(import PDF, fuzzy-matching nama/nominal, dsb).

## Langkah deploy (sekali saja, ~10 menit)

1. Buka **script.google.com** → **New project** (bukan lewat menu Extensions
   di dalam spreadsheet manapun — supaya project ini benar-benar standalone).
2. Beri nama project, misalnya "Dashboard Rekonsiliasi Payroll".
3. Buat 4 file dengan isi dari folder `apps-script-payroll/` di repo ini:
   - **`Code.gs`** — hapus isi default, ganti dengan isi `apps-script-payroll/Code.gs`
   - **`Index.html`** (File → New → HTML) — isi dari `apps-script-payroll/Index.html`
   - **`Bundle.html`** (File → New → HTML) — isi dari `apps-script-payroll/Bundle.html`
   - **`Styles.html`** (File → New → HTML) — isi dari `apps-script-payroll/Styles.html`
   - **`appsscript.json`** — buka lewat ikon gerigi "Project Settings" → centang
     "Show appsscript.json in editor", lalu isi sesuai `apps-script-payroll/appsscript.json`
4. Di `Code.gs`, cek bagian `CONFIG` di paling atas:
   - `REKAP_GAJI_ID` dan `REKONSILIASI_SEED_ID` sudah diisi sesuai link yang
     kamu berikan — cek ulang ID-nya benar (bagian setelah `/d/` di URL
     spreadsheet, sebelum `/edit`).
   - `ABSENSI_SHEET_ID` boleh dikosongkan (default). Isi kalau kamu mau web
     app ini SEKALIGUS menyajikan data dashboard Monitoring Laporan & Absensi
     secara live juga (lihat komentar di fungsi `buildAbsensiDataset()`).
5. **Deploy → New deployment**:
   - Ikon gerigi di "Select type" → **Web app**
   - Description bebas, mis. "Dashboard Payroll v1"
   - **Execute as**: Me (akun kamu)
   - **Who has access**: "Only myself" atau "Anyone" (kalau Direktur/Admin
     lain perlu buka tanpa login Google)
   - **Deploy**, lalu **Authorize access**. Karena script ini baca 2
     spreadsheet lain by ID (bukan spreadsheet aktifnya sendiri) dan mencari
     file lewat Drive, akan diminta izin **Spreadsheets** dan **Drive**
     (read-only) — ini wajar dan sesuai `oauthScopes` di `appsscript.json`.
6. Dapat **Web app URL** (`https://script.google.com/macros/s/XXXXX/exec`) —
   itu link dashboard live-nya.

## Cara kerja penemuan file bulanan (REKONSILIASI)

Karena tiap bulan dibuatkan spreadsheet REKONSILIASI baru (ID berbeda-beda),
script ini **tidak hardcode ID bulanan**. Cara kerjanya:

1. Baca `PERIODE_GAJI` dari file seed (`REKONSILIASI_SEED_ID`) untuk tahu
   nama bulan+tahun yang sedang aktif "sekarang" (menurut file seed itu).
2. Ambil folder Drive tempat file seed itu disimpan
   (`DriveApp...getParents()`).
3. Cari file lain di folder yang sama dengan nama mengandung nama bulan
   (huruf besar, mis. `SEPTEMBER`) dan tahun tsb.
4. Kalau ketemu → pakai file itu. Kalau tidak → fallback ke file seed (supaya
   dashboard tetap tampil, walau mungkin data bulan sebelumnya) dan ini
   akan terlihat di field `_debug.resolvedBy` pada dataset.

**Penting:** ini hanya jalan kalau file REKONSILIASI bulan-bulan berikutnya
disimpan **di folder Drive yang sama** dengan file Agustus 2026 yang jadi
seed. Kalau ternyata polanya beda (mis. di folder terpisah per bulan), kabari
saya dan saya sesuaikan `resolveRekonsiliasiId_()`.

## Pencocokan nama lokasi antar dua spreadsheet (MAPPING_LOKASI)

Nama lokasi di REKAP GAJI SEMUA LOKASI (mis. `UPPD KAB BATANG`) dan di
REKONSILIASI (`HASIL_PENGECEKAN`, mis. `UPPD KAB. BATANG PENGECEKAN PTSP`)
tidak selalu sama persis. Script mencocokkan otomatis (normalisasi + strip
kata "PENGECEKAN" + cocok substring), tapi:

- Kalau **ambigu** (satu nama REKAP cocok dengan >1 lokasi REKONSILIASI, atau
  sebaliknya) → ditandai `matchConfidence: "ambigu"`, datanya TIDAK
  digabungkan otomatis (supaya tidak salah hitung), dan muncul sebagai notice
  "Nama/Lokasi Perlu Dicek" di dashboard.
- Kalau **tidak ketemu sama sekali** → `matchConfidence: "belum-ada"`, wajar
  kalau lokasi itu memang belum diimpor PIC-nya periode ini.

Untuk kasus ambigu/tidak ketemu yang kamu tahu jawabannya, buat sheet baru
bernama **`MAPPING_LOKASI`** di spreadsheet **REKAP GAJI SEMUA LOKASI**,
dengan 2 kolom (baris 1 = header, data mulai baris 2):

| NAMA DI REKAP | NAMA DI REKONSILIASI |
|---|---|
| BAPENDA PROV JATENG | BAPENDA PENGECEKAN |
| BPBD KABUPATEN MAGELANG | BPBD PENGECEKAN |

Script otomatis membaca sheet ini kalau ada (opsional — aman kalau belum
dibuat) dan memprioritaskan mapping manual ini di atas pencocokan otomatis.

## Update tampilan di kemudian hari

Kalau source code React (`src/`) diubah lagi:

```bash
npm run build
node scripts/build-apps-script-payroll.mjs
```

Tempel ulang isi `Bundle.html`/`Styles.html`/`Index.html` yang baru ke file
yang sama di editor Apps Script, lalu **Deploy → Manage deployments → Edit
(ikon pensil) → Deploy** supaya versi live ikut ter-update.

Perubahan di **spreadsheet** (isi data gaji, mutasi, dsb) tidak perlu langkah
ini sama sekali — otomatis ke-refresh tiap dashboard dibuka.

## Cek data tanpa buka web app

Di editor Apps Script, jalankan fungsi `debugPayrollDataset` lewat toolbar
Run, lalu lihat hasilnya di **View → Logs** (atau **Executions**). Field
`_debug` di hasilnya menunjukkan file REKONSILIASI mana yang sebenarnya
kepakai dan sheet bulan mana di REKAP GAJI yang dipilih — berguna untuk
verifikasi kalau ada yang terasa salah.

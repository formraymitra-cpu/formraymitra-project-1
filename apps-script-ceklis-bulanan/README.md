# Monitor Laporan Bulanan — versi live (Google Apps Script)

Dashboard "Ceklist Atas" + "Log Jobdesk Harian" yang baca **langsung** dari
spreadsheet "CEKLIS LAPORAN BULANAN" tiap kali dibuka/di-refresh. Tidak ada
proses build/export — begitu kamu input data baru di spreadsheet, tinggal
refresh (atau tunggu auto-refresh 45 detik), dashboard langsung ikut update.

Isinya cuma HTML/CSS/JS polos (tanpa React/npm/build step), jadi lebih
simpel dari versi di folder `apps-script/` sebelumnya — tinggal copy-paste
5 file ini ke editor Apps Script.

## Cara kerja singkat

- `Code.gs` → tiap sheet yang **namanya persis nama bulan** (boleh + tahun,
  mis. `APRIL`, `FEBRUARI 2026`, `MEI 2026`) otomatis dianggap "sheet
  bulanan" dan ikut ditampilkan. Sheet lain (rekap gabungan, sheet kerja,
  dll — nama tidak persis nama bulan) otomatis diabaikan.
- Posisi kolom (LAPORAN BULANAN, ABSENSI, dst) dideteksi dari **teks
  header**-nya, bukan nomor kolom tetap — jadi tetap benar walau ada sheet
  yang kolomnya lebih banyak (mis. ada tambahan kolom "PIC"/"Nama Group
  WA" seperti di sheet Agustus/September).
- Tidak ada cache di server — `getDashboardData()` selalu baca ulang dari
  spreadsheet, supaya data selalu versi terbaru.

## Langkah deploy (sekali saja, ~5 menit)

1. Buka spreadsheet **"CEKLIS LAPORAN BULANAN"** di Google Sheets (bukan
   file terpisah — harus dari dalam spreadsheet ini, supaya
   `SpreadsheetApp.getActiveSpreadsheet()` otomatis merujuk ke sheet yang
   benar).
2. Menu **Extensions → Apps Script**.
3. Di editor yang terbuka, buat file-file berikut (isi masing-masing dari
   folder `apps-script-ceklis-bulanan/` di repo ini):
   - **`Code.gs`** — hapus isi default `myFunction()`, ganti dengan isi
     `Code.gs`
   - **`Index.html`** (File → New → HTML file, kasih nama `Index`)
   - **`Stylesheet.html`** (File → New → HTML file, nama `Stylesheet`)
   - **`JavaScript.html`** (File → New → HTML file, nama `JavaScript`)
   - **`appsscript.json`** — klik ikon gerigi "Project Settings" → centang
     "Show appsscript.json manifest file in editor", lalu ganti isinya
     sesuai file `appsscript.json` di sini
4. **Deploy → New deployment**:
   - Klik ikon gerigi di "Select type" → **Web app**
   - **Execute as**: Me (akun kamu)
   - **Who has access**: "Only myself" kalau cuma kamu yang buka, atau
     "Anyone" kalau ada admin/direktur lain yang perlu buka tanpa login
   - **Deploy**, lalu **Authorize access** (izinkan akses ke spreadsheet)
5. Kamu dapat **Web app URL** (`https://script.google.com/macros/s/xxx/exec`)
   — itu link dashboard live-nya. Buka kapan saja.

## Setelah data baru diinput

Tidak perlu langkah apa pun di kode. Buka/refresh halaman dashboard, atau
tunggu auto-refresh (default tiap 45 detik) — datanya otomatis narik ulang
dari spreadsheet.

## Kalau nama sheet bulan baru tidak muncul

Pastikan nama sheet-nya PERSIS nama bulan (boleh tambah spasi + tahun),
contoh yang terdeteksi: `OKTOBER`, `OKTOBER 2026`. Nama seperti
`REKAP OKTOBER` atau `Oktober (final)` **tidak** akan terdeteksi sebagai
sheet bulanan — sengaja, supaya sheet kerja/rekap gabungan tidak ikut
kebaca sebagai data bulanan.

## Cek data tanpa buka web app

Di editor Apps Script, pilih fungsi `debugDataset` di toolbar Run, klik
**Run**, lalu lihat hasilnya di **View → Executions** atau **View → Logs**.

## Ubah interval auto-refresh

Di `JavaScript.html`, baris pertama:
```js
var AUTO_REFRESH_MS = 45000; // ganti angka ini (dalam milidetik)
```

## Kalau mau menambah kolom/field baru

Logika parsing ada di `Code.gs`, fungsi `buildColumnMap_` (deteksi kolom
ceklist atas) dan `parseMonthlySheet_` (bagian log jobdesk harian, dekat
komentar `REKAP LAPORAN HARIAN`). Keduanya sudah dites terhadap seluruh
sheet di file sumber asli sebelum dikirim — lihat komentar di kode untuk
penjelasan tiap bagian.

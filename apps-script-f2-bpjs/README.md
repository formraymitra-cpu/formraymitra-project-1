# Convert Tagihan F2 BPJS Ketenagakerjaan -> Rekap Sheet

Script ini dipasang **langsung di spreadsheet rekap BPJS Ketenagakerjaan kamu**
(mis. "08. BPJS KETENAGAKERJAAN AGUSTUS 26") — bukan di repo ini, karena
spreadsheet itu file terpisah di Google Drive.

Spreadsheet itu **sudah punya Apps Script sendiri** (menu "📌 MENU OTOMATIS" —
`buatMenu`, `urutkanSheetAbjad`, `tambahTombolKembali`, `hapusSemuaWarnaFill`).
Panduan di bawah ini ditulis supaya converter F2 **berdampingan**, bukan
menimpa, script yang sudah ada itu.

Yang dikerjakan script: kamu tempel teks tabel "RINCIAN IURAN TENAGA KERJA"
dari Formulir 2a PU (tagihan F2), lalu script otomatis membaca nomor
referensi, nama, dan semua nominal iuran (JKK, JKM, JHT, JP, JKP — porsi
perusahaan & karyawan), lalu mengisi/mengupdate baris yang sesuai di tabel
rekap tab yang sedang aktif. Baris yang belum ada di rekap otomatis
ditambahkan sebelum baris total. Kolom D1 dan A3 (dipakai sistem "⬅ MENU" /
"KEMBALI KE MENU" milik script lama) tidak disentuh sama sekali.

## Kenapa tidak cukup copy-paste langsung

Script lama dan converter F2 sama-sama butuh fungsi `onOpen()` untuk
menampilkan menu masing-masing saat spreadsheet dibuka. Tapi dalam satu
project Apps Script, **hanya boleh ada satu `onOpen()`** — kalau ada dua,
Apps Script cuma menjalankan salah satunya (biasanya yang terakhir dibaca),
dan menu yang satunya lagi hilang tanpa pesan error. Jadi `onOpen()` yang
sudah ada harus **digabung** (diedit), bukan ditambah dobel.

Fungsi lain di converter F2 (`showF2Sidebar`, `getActiveSheetName`,
`processF2Text`, `parseF2Text`, `findHeaderMap`, `applyRecordsToSheet`,
`round2`, dan konstanta `F2_AMOUNT_RE`/`F2_DATE_RE`/`F2_NIK_RE`) namanya
tidak bentrok dengan fungsi yang sudah ada, jadi aman ditaruh sebagai file
terpisah.

## Cara pasang (sekali saja)

1. Buka spreadsheet **"08. BPJS KETENAGAKERJAAN ..."** di Google Sheets →
   menu **Extensions → Apps Script**.
2. **Jangan hapus/timpa `Code.gs` yang sudah ada.** Buat file script baru:
   **File → New → Script**, beri nama **`F2Converter`**, isi dengan seluruh
   isi file `apps-script-f2-bpjs/F2Converter.gs` di repo ini.
3. Buat file HTML baru (**File → New → HTML**), beri nama **`F2Sidebar`**
   (harus persis nama ini), isi dengan `apps-script-f2-bpjs/F2Sidebar.html`.
4. Buka kembali `Code.gs` (yang sudah ada), cari fungsi `onOpen()` di
   paling atas, lalu tambahkan 4 baris berikut **di dalamnya**, setelah
   blok `ui.createMenu("📌 MENU OTOMATIS")...addToUi();` yang sudah ada:

   ```js
   function onOpen() {
     const ui = SpreadsheetApp.getUi();

     ui.createMenu("📌 MENU OTOMATIS")
       .addItem("Buat / Refresh Menu", "buatMenu")
       .addSeparator()
       .addItem("🧹 No Fill Semua Sheet", "hapusSemuaWarnaFill")
       .addToUi();

     // >>> tambahan untuk converter F2 <<<
     ui.createMenu("F2 BPJS")
       .addItem("Convert Tagihan F2 ke Sheet Ini...", "showF2Sidebar")
       .addToUi();
   }
   ```

   Jadi `onOpen()` tetap satu fungsi saja, cuma isinya nambah 4 baris untuk
   memunculkan menu "F2 BPJS" di sebelah menu "📌 MENU OTOMATIS" yang lama.
5. **Simpan** (ikon disket / Ctrl+S), lalu **tutup tab Apps Script dan reload
   spreadsheet-nya** (F5). Saat dibuka ulang, kedua menu — "📌 MENU OTOMATIS"
   dan "F2 BPJS" — akan muncul berdampingan di menu bar. Kalau ini pertama
   kali script baru dijalankan, Google akan minta otorisasi tambahan — wajar,
   setujui saja.

## Cara pakai

1. Buka tab rekap yang mau diisi, mis. **"ATR BPN PALANGKARAYA"**.
2. Menu **F2 BPJS → Convert Tagihan F2 ke Sheet Ini...** — sidebar terbuka di
   kanan, judulnya menunjukkan tab target.
3. Di file/halaman tagihan F2 (Formulir 2a PU), **select tabel "RINCIAN IURAN
   TENAGA KERJA"** (dari baris "No/Nomor Referensi/..." sampai baris terakhir
   tenaga kerja, tidak perlu ikut baris "Jumlah Seluruhnya"), lalu Copy.
4. Paste ke kotak teks di sidebar, klik **Proses**.
5. Script akan melaporkan berapa baris di-update dan berapa baris baru
   ditambahkan, plus peringatan kalau ada baris yang tidak terbaca atau
   totalnya tidak cocok.
6. Ulangi langkah 1-5 untuk tab-tab lain — cukup pindah tab lalu buka lagi
   menunya (atau buka sidebar sekali dan biarkan terbuka, lalu ganti tab aktif
   sebelum klik Proses; sidebar selalu bekerja di tab yang sedang aktif).

## Pemetaan kolom (bagaimana angka F2 masuk ke rekap)

| Kolom di F2 (Formulir 2a PU)                | Kolom di rekap |
| -------------------------------------------- | -------------- |
| Nomor Referensi                              | NOMOR KETENAGAKERJAAN |
| Nama Tenaga Kerja                            | NAMA |
| Iuran Jkk                                    | JKK |
| Iuran JKM                                    | JKM |
| Iuran JHT TK — Pemberi Kerja                 | JHT (grup pertama) |
| Iuran JHT TK — Tenaga Kerja                  | JHT (grup kedua) |
| Iuran JP — Pemberi Kerja                     | JP (grup pertama) |
| Iuran JP — Tenaga Kerja                      | JP (grup kedua) |
| Iuran JKP — Pemberi Kerja                    | JKP |
| JKK + JKM + JHT(Pemberi Kerja) + JP(Pemberi Kerja) + JKP(Pemberi Kerja) | IURAN TK CLIENT |
| JHT(Tenaga Kerja) + JP(Tenaga Kerja)         | IURAN TK KARYAWAN |
| Total Iuran                                  | TOTAL |

Baris baru otomatis diberi **STATUS = AKTIF**. Kolom lain (KETERANGAN, JPG
SIPP/REKAP TK, D1, A3) tidak disentuh — tetap seperti biasa / tetap dikelola
oleh script "📌 MENU OTOMATIS" yang lama.

## Pencocokan baris (update vs tambah baru)

Untuk setiap tenaga kerja di teks F2, script mencari baris yang sudah ada di
rekap berdasarkan **Nomor Referensi** (prioritas pertama), kalau tidak
ketemu dicoba cocokkan berdasarkan **Nama** (case-insensitive). Kalau tetap
tidak ketemu, baris baru disisipkan otomatis sebelum baris total/jumlah,
lengkap dengan nomor urut dan format sel mengikuti baris di atasnya.

## Batasan yang perlu diketahui

- Script mendeteksi baris header rekap dengan mencari baris yang punya kolom
  **NAMA** dan **STATUS** sekaligus (dicek di 15 baris pertama tiap tab) —
  jadi struktur header di tab harus mengikuti pola yang sama seperti
  template ("NO, NAMA, NOMOR KETENAGAKERJAAN, IURAN TK CLIENT, IURAN TK
  KARYAWAN, TOTAL, STATUS, ..., JKK, JKM, JHT, JP, JKP, ..., JHT, JP").
- Baris tenaga kerja di teks F2 harus memuat NIK 16 digit, dua tanggal
  (format `dd-mm-yyyy`), dan 11 angka nominal berurutan (Upah, Rapel, Jkk,
  JKM, JHT×2, JP×2, JKP×2, Total) — ini format standar cetakan Formulir 2a
  PU. Kalau hasil copy-paste dari sumber lain formatnya beda jauh, baris itu
  akan dilewati dan dilaporkan sebagai peringatan di sidebar, bukan gagal
  diam-diam.
- Kalau total hasil hitung script beda lebih dari Rp1 dari "Total Iuran" di
  F2, sidebar menampilkan peringatan supaya dicek manual — data tetap
  ditulis, hanya sebagai flag.
- Kalau nanti "Buat / Refresh Menu" (script lama) dijalankan, itu hanya
  membangun ulang sheet "MENU" dan link D1/A3 — tidak mempengaruhi data yang
  sudah diisi converter F2.

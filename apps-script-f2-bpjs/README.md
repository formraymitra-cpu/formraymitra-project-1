# Convert Tagihan F2 BPJS Ketenagakerjaan -> Rekap Sheet

Script ini dipasang **langsung di spreadsheet rekap BPJS Ketenagakerjaan kamu**
(mis. "08. BPJS KETENAGAKERJAAN AGUSTUS 26") — bukan di repo ini, karena
spreadsheet itu file terpisah di Google Drive.

Spreadsheet itu **sudah punya Apps Script sendiri** (menu "📌 MENU OTOMATIS" —
`buatMenu`, `urutkanSheetAbjad`, `tambahTombolKembali`, `hapusSemuaWarnaFill`).
Panduan di bawah ini ditulis supaya converter F2 **berdampingan**, bukan
menimpa, script yang sudah ada itu.

Ada dua fitur:

- **Convert Tagihan F2** — kamu tempel teks tabel "RINCIAN IURAN TENAGA
  KERJA" dari Formulir 2a PU (tagihan F2), lalu script otomatis membaca
  nomor referensi, nama, dan semua nominal iuran (JKK, JKM, JHT, JP, JKP —
  porsi perusahaan & karyawan), lalu mengisi/mengupdate baris yang sesuai
  di tabel rekap tab yang sedang aktif. Baris yang belum ada di rekap
  otomatis ditambahkan sebelum baris total.
- **HAPUS F2** — mengosongkan sel link lampiran PDF F2 bulan sebelumnya
  (sel ber-ikon 📎, mis. "📎 ATR BPN PALANGKARAYA...") di **semua tab
  sekaligus**, supaya siap ditempel link lampiran bulan berjalan. File PDF
  aslinya di Google Drive **tidak ikut dihapus** — hanya link di selnya
  yang dikosongkan. Tabel data rekap sama sekali tidak disentuh oleh fitur
  ini.

Kolom D1 dan A3 (dipakai sistem "⬅ MENU" / "KEMBALI KE MENU" milik script
lama) tidak disentuh sama sekali oleh kedua fitur di atas.

## Kenapa `onOpen()` tidak boleh didobel

Script lama dan converter F2 sama-sama butuh fungsi `onOpen()` untuk
menampilkan menu masing-masing saat spreadsheet dibuka. Tapi dalam satu
project Apps Script, **hanya boleh ada satu `onOpen()`** — kalau ada dua,
Apps Script cuma menjalankan salah satunya (biasanya yang terakhir dibaca),
dan menu yang satunya lagi hilang tanpa pesan error. Karena itu semuanya
digabung jadi satu `onOpen()` yang memunculkan kedua menu sekaligus (lihat
file `Code-SATU-FILE.gs` di bawah).

## Cara pasang (sekali saja) — cukup 1 file

Semua sudah digabung jadi **satu file `.gs` saja** — script "📌 MENU
OTOMATIS" yang lama, converter F2, HAPUS F2, dan HTML sidebar-nya (dijadikan
string di dalam kode, jadi tidak perlu bikin file `.html` terpisah lagi).

1. Buka spreadsheet **"08. BPJS KETENAGAKERJAAN ..."** di Google Sheets →
   menu **Extensions → Apps Script**.
2. Klik file **`Code.gs`** yang sudah ada di sana → select semua isinya
   (Ctrl+A) → hapus → tempel seluruh isi file
   **`apps-script-f2-bpjs/Code-SATU-FILE.gs`** dari repo ini.
3. **Simpan** (ikon disket / Ctrl+S), lalu **tutup tab Apps Script dan reload
   spreadsheet-nya** (F5). Saat dibuka ulang, kedua menu — "📌 MENU OTOMATIS"
   dan "F2 BPJS" (dengan item Convert & HAPUS F2) — langsung muncul
   berdampingan di menu bar. Google akan minta otorisasi — wajar, setujui
   saja.

Itu saja — tidak perlu bikin file `.gs` atau `.html` tambahan apa pun lagi.
Kalau nanti ada update lagi dari aku, tinggal timpa ulang isi `Code.gs`
dengan versi terbaru `Code-SATU-FILE.gs`, tidak perlu bongkar beberapa file.

<details>
<summary>Opsi lama: 3 file terpisah (kalau lebih suka modular)</summary>

Kalau kamu lebih suka file converter F2 terpisah dari `Code.gs` (lebih rapi
untuk baca-baca kode, tapi harus jaga 3 file sekaligus tiap update):

1. `Code.gs` (yang sudah ada) → timpa dengan
   `apps-script-f2-bpjs/Code-gabungan-siap-pakai.gs` (isinya sama seperti
   yang lama, cuma `onOpen()` ditambah menu "F2 BPJS").
2. File script baru **`F2Converter`** (File → New → Script) → isi dengan
   `apps-script-f2-bpjs/F2Converter.gs`.
3. File HTML baru **`F2Sidebar`** (File → New → HTML, nama harus persis) →
   isi dengan `apps-script-f2-bpjs/F2Sidebar.html`.

Fungsi-fungsi di dalamnya (`showF2Sidebar`, `getActiveSheetName`,
`processF2Text`, `parseF2Text`, `findHeaderMap`, `getDataRows`,
`applyRecordsToSheet`, `round2`, `hapusSemuaF2`,
`findAndClearF2AttachmentLinks`, konstanta
`F2_AMOUNT_RE`/`F2_DATE_RE`/`F2_NIK_RE`) namanya tidak bentrok dengan
`buatMenu`/`urutkanSheetAbjad`/`tambahTombolKembali`/`hapusSemuaWarnaFill`
yang lama, jadi aman kalau mau dipisah begini.

</details>

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

### HAPUS F2

Menu **F2 BPJS → HAPUS F2** — sekali klik langsung memproses **semua tab**
(tidak perlu buka satu-satu). Akan muncul dialog konfirmasi dulu (Ya/Tidak)
karena ini mengubah banyak sel sekaligus. Setelah itu:

- Sel yang berisi link ke file Google Drive (baik hyperlink biasa maupun
  formula `=HYPERLINK(...)`), atau sel yang teksnya diawali ikon 📎, di
  baris 1-10 tiap tab akan dikosongkan.
- File PDF-nya sendiri **tidak dihapus/ditrash** dari Google Drive.
- Muncul ringkasan: berapa link dikosongkan, di berapa tab.
- Sheet "MENU" dilewati otomatis.

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
- **HAPUS F2** hanya memindai baris 1-10 tiap tab untuk cari sel lampiran
  (link Drive / ikon 📎). Kalau lampiran F2 di tab tertentu ternyata ditaruh
  lebih ke bawah dari baris 10, kasih tahu aku posisi persisnya biar
  jangkauan pemindaiannya disesuaikan.
- **HAPUS F2 tidak mengosongkan sel lampirannya?** Kemungkinan besar sel itu
  bukan hyperlink teks biasa, misalnya "smart chip" file Drive (hasil ketik
  `@` lalu pilih file, atau Sheets otomatis mengubah link yang di-paste jadi
  chip dengan ikon), yang caranya dibaca lewat Apps Script beda dari
  hyperlink biasa. Jalankan fungsi diagnostik `debugF2AttachmentCell` untuk
  cek persis apa isi selnya:
  1. Di editor Apps Script, pilih tab sheet yang bermasalah dulu di
     spreadsheet (mis. "ATR / BPN KENDAL").
  2. Di toolbar atas editor Apps Script, ada dropdown pemilih fungsi (biasanya
     bertuliskan nama fungsi terakhir yang dipilih) — pilih
     **`debugF2AttachmentCell`**, lalu klik **Run** (▶).
  3. Setelah selesai, buka **View → Logs** (atau **Executions** → klik
     eksekusi terakhir → Logs).
  4. Salin semua baris log yang muncul (terutama baris untuk sel lampiran F2,
     mis. `H1`/`H2`/`I1`/`I2`), lalu kirim ke aku — dari situ aku bisa lihat
     persis kenapa sel itu tidak terdeteksi dan perbaiki logikanya.

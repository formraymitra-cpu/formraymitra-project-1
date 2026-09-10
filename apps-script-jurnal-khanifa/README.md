# Dashboard Rekap Kerja Khanifa (Apps Script live-sync)

Dashboard untuk jurnal kerja harian administrasi BPJS Kesehatan & BPJS
Ketenagakerjaan ("LAPORAN HARIAN KHANIFA"). Berbeda dari `apps-script/` di
root repo ini (itu untuk dashboard "Monitoring Laporan & Absensi" —
spreadsheet dan dataset yang berbeda sama sekali).

Baca langsung dari spreadsheet setiap kali dibuka — tidak perlu proses
build/deploy ulang tiap kali data berubah, dan otomatis mendeteksi sheet
bulan baru (JULI, AGUSTUS, SEPTEMBER, dst) selama header kolomnya sama:
`TANGGAL | JAM | NO | DAILY WORKING PLAN | STATUS | KETERANGAN`.

## Isi folder

- **`Code.gs`** — logika server: membaca semua sheet bulan & menyiapkan data
- **`Index.html`** — tampilan dashboard (HTML/CSS/JS, tanpa dependency luar)
- **`appsscript.json`** — manifest project (opsional)

## Langkah deploy (sekali saja, ~5 menit)

1. Buka spreadsheet sumbernya ("LAPORAN HARIAN KHANIFA") di Google Sheets.
2. Menu **Extensions/Ekstensi → Apps Script**. Penting dilakukan dari dalam
   spreadsheet-nya (bukan project Apps Script terpisah), supaya
   `SpreadsheetApp.getActiveSpreadsheet()` otomatis menunjuk ke sheet yang benar.
3. Di editor Apps Script:
   - **`Code.gs`** — hapus isi default, ganti dengan isi `Code.gs` di folder ini
   - **`Index.html`** (File → New → HTML, beri nama persis `Index`) — isi
     dengan isi `Index.html` di folder ini
   - **`appsscript.json`** (opsional) — ikon gerigi "Project Settings" →
     centang "Show appsscript.json in editor" → isi sesuai `appsscript.json`
     di folder ini
4. Simpan (Ctrl+S), kembali ke tab spreadsheet, refresh (F5).
5. Menu baru **📊 Dashboard** muncul di sebelah menu Bantuan → klik
   **Buka Dashboard**. Saat pertama kali jalan, Google akan minta izin akses
   ("Aplikasi ini belum diverifikasi") karena ini script milik sendiri —
   klik **Advanced/Lanjutan → Go to [project] (unsafe) → Allow/Izinkan**.

Dashboard tampil dalam jendela popup di atas spreadsheet.

## Opsional — deploy sebagai Web App (tampilan layar penuh)

1. **Deploy → New deployment** → ikon gerigi di "Select type" → **Web app**
2. **Execute as**: Me · **Who has access**: "Only myself" (privat) atau
   "Anyone with the link" untuk dibagikan
3. **Deploy**, izinkan akses saat diminta
4. Salin URL Web App (`https://script.google.com/macros/s/XXXXX/exec`) —
   link dashboard permanen, selalu baca data terbaru dari sheet

Kalau nanti kode diubah lagi: **Deploy → Manage deployments → ikon pensil →
New version → Deploy**, supaya link yang sama ikut ter-update.

## Menambah bulan baru

Tambah sheet baru (misalnya copy sheet bulan sebelumnya, ganti nama & isi)
dengan header kolom yang sama persis. Dashboard otomatis ikut menghitung —
tidak perlu ubah kode. Urutan bulan pada grafik & filter mengikuti urutan
tab sheet di spreadsheet (kiri ke kanan).

## Troubleshooting

- **Menu "📊 Dashboard" tidak muncul** setelah refresh: buka Apps Script,
  jalankan fungsi `onOpen` sekali secara manual (pilih di dropdown atas →
  Run), lalu refresh sheet.
- **Dashboard kosong / "Tidak ada sheet yang terbaca"**: pastikan tulisan
  `TANGGAL` persis ada di kolom A pada baris header tiap sheet bulan.
- Lokasi & status dihitung dari gabungan kolom **STATUS + KETERANGAN**
  (mencari pola "angka LOKASI" dan tanda selesai `√` / kata `SELESAI`) —
  boleh diisi di salah satu kolom itu.

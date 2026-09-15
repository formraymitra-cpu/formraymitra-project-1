# Import PDF F2 BPJS Ketenagakerjaan ke Sheet Rekap

Menu tambahan di dalam spreadsheet **"09. BPJS KETENAGAKERJAAN ..."** (atau spreadsheet rekap bulanan BPJS TK lainnya dengan struktur sheet per lokasi yang sama) untuk membaca PDF **Formulir 2a PU** dari BPJS Ketenagakerjaan dan langsung mengisikan datanya ke sheet lokasi yang sesuai — tanpa copy-paste manual per kolom (JKK, JKM, JHT, Nama, Nomor KPJ).

## Cara kerja singkat

1. Kamu pilih 1 file PDF F2 dari komputer lewat dialog.
2. PDF dibaca langsung di browser (pakai [pdf.js](https://mozilla.github.io/pdf.js/), tidak upload ke server manapun selain Google sendiri) — dipetakan ke kolom berdasarkan posisi tiap teks di halaman PDF (No., Nomor Referensi, NIK, Nama Tenaga Kerja, Iuran JKK/JKM/JHT/JP/JKP), sesuai tata letak resmi Formulir 2a PU.
3. Sistem menebak sheet lokasi tujuan berdasarkan "Nama Unit Kerja" di PDF (termasuk menerjemahkan singkatan umum seperti "Kejaksaan Negeri" → "Kejari", "Kabupaten" → "Kab"). Tebakan ini **selalu bisa diganti manual** lewat dropdown sebelum diproses — supaya data 250 lokasi tidak salah tempat.
4. Untuk tiap karyawan di PDF: kalau **Nomor Ketenagakerjaan (KPJ)**-nya sudah ada di sheet tujuan, baris itu di-update (Nama, JKK, JKM, JHT, JP, JKP). Kalau belum ada, ditambahkan baris baru di bawah data terakhir.
5. Kolom yang berisi formula (IURAN TK CLIENT, IURAN TK KARYAWAN, TOTAL) **tidak disentuh** — biar tetap kehitung otomatis dari nilai JKK/JKM/JHT/JP/JKP yang baru diisi.

## Cara pasang (sekali saja per spreadsheet)

1. Buka spreadsheet rekap BPJS TK-nya di Google Sheets.
2. Menu **Extensions → Apps Script** (harus dari dalam spreadsheet-nya, bukan project terpisah, supaya scriptnya otomatis nempel ke spreadsheet yang benar).
3. Di editor Apps Script yang terbuka:
   - **`Code.gs`** — hapus isi default, ganti dengan isi `apps-script-bpjs-f2/Code.gs` di repo ini.
   - Buat file HTML baru (File → New → HTML), beri nama **`ImportDialog`** — isi dengan `apps-script-bpjs-f2/ImportDialog.html`.
4. **Simpan** (ikon disket / Ctrl+S).
5. **Refresh** tab spreadsheetnya (reload browser). Setelah dimuat ulang, akan muncul menu baru **"Import F2"** di sebelah menu Help.
6. Saat pertama kali dipakai, Google akan minta izin akses ke spreadsheet — klik **Authorize access** lalu izinkan (wajar, karena script perlu baca/tulis ke sheet).

## Cara pakai

1. Menu **Import F2 → Import PDF F2...**.
2. Pilih file PDF Formulir 2a dari komputer.
3. Cek info yang muncul (NPP, Nama Perusahaan/Unit Kerja, Periode) dan preview tabel karyawan — pastikan datanya benar terbaca.
4. Cek/ganti dropdown **"Masuk ke sheet lokasi"** kalau tebakannya salah.
5. Klik **Proses ke Spreadsheet**. Hasil (berapa baris diupdate/ditambah) akan muncul di bawah.

## Batasan yang perlu diketahui

- Diasumsikan file PDF adalah **Formulir 2a PU** dengan tata letak standar BPJS Ketenagakerjaan (sama seperti contoh yang dipakai untuk membangun tool ini). Kalau BPJS mengubah template resminya, koordinat kolom di `ImportDialog.html` (variabel `TABLE_COLS` dan `TOP_COLS`) perlu disesuaikan ulang.
- Kolom **"Nomor Pegawai"** di Formulir 2a (kolom internal perusahaan, biasanya kosong) belum ditangani khusus — kalau suatu saat kolom itu terisi, ada kemungkinan kecil ikut tercampur ke kolom Nama. Tidak berpengaruh ke contoh yang sudah diuji karena kolom itu memang kosong.
- Pencocokan sheet lokasi otomatis hanya bantuan awal (skor kecocokan kata + singkatan umum) — **selalu konfirmasi manual** di dropdown, terutama untuk lokasi yang namanya mirip-mirip (banyak lokasi share kata yang sama, mis. "SEMARANG", "KOTA", dll).
- Satu file PDF diproses satu per satu (sesuai cara kerja yang dipilih) — untuk banyak lokasi sekaligus, ulangi langkah "Import PDF F2..." per file.

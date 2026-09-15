# Import PDF F2 BPJS Ketenagakerjaan ke Sheet Rekap

Menu tambahan di dalam spreadsheet **"09. BPJS KETENAGAKERJAAN ..."** (atau spreadsheet rekap bulanan BPJS TK lainnya dengan struktur sheet per lokasi yang sama) untuk membaca PDF **Formulir 2a PU** dari BPJS Ketenagakerjaan dan langsung mengisikan datanya ke sheet lokasi yang sesuai — tanpa copy-paste manual per kolom (JKK, JKM, JHT, Nama, Nomor KPJ).

`Code.gs` di sini juga sudah menggabungkan menu **"📌 MENU OTOMATIS"** (buat/refresh MENU, no-fill semua sheet, hapus link PDF & teks H2:I2) yang sudah ada sebelumnya — kedua menu jalan berdampingan, tidak saling mengganti.

## Cara kerja singkat

1. Kamu pilih 1 file PDF F2 dari komputer lewat dialog.
2. PDF dibaca langsung di browser (pakai [pdf.js](https://mozilla.github.io/pdf.js/), tidak upload ke server manapun selain Google sendiri) — dipetakan ke kolom berdasarkan posisi tiap teks di tiap halaman PDF (No., Nomor Referensi, NIK, Nama Tenaga Kerja, Iuran JKK/JKM/JHT/JP/JKP), sesuai tata letak resmi Formulir 2a PU. Halaman diproses satu-satu (bukan digabung dulu) supaya PDF yang isinya banyak orang (banyak halaman) tidak salah-gabung antar baris.
3. Sistem menebak sheet lokasi tujuan berdasarkan "Nama Unit Kerja" di PDF (termasuk menerjemahkan singkatan umum seperti "Kejaksaan Negeri" → "Kejari", "Kabupaten" → "Kab"). Tebakan ini **selalu bisa diganti manual** lewat dropdown sebelum diproses — supaya data 250 lokasi tidak salah tempat.
4. Untuk tiap karyawan di PDF: kalau **Nomor Ketenagakerjaan (KPJ)**-nya sudah ada di sheet tujuan, baris itu di-update. Kalau belum ada, ditambahkan baris baru tepat di bawah data terakhir (baris kosong/area manual di bawahnya otomatis ikut turun, isinya tidak pernah disentuh/dihapus).
5. Yang diisi per baris karyawan: NAMA, NOMOR KETENAGAKERJAAN, STATUS ("AKTIF"), JKK, JKM, JHT, JP, JKP (dari PDF) — lalu **IURAN TK CLIENT** (D) diisi rumus `=SUM(JKK:JKP)`, **IURAN TK KARYAWAN** (E) diisi rumus `=SUM(JHT karyawan:JP karyawan)`, dan **TOTAL** (F) diisi rumus `=D+E`. Kolom **KETERANGAN** dan kolom "JPG SIPP / REKAP TK" **tidak pernah disentuh** — itu area manual kamu.
6. Baris **TOTAL** otomatis dibuat/diperbarui tepat di bawah baris data terakhir, isi rumus SUM untuk kolom JKK sampai JP-karyawan dan kolom TOTAL. Kalau baris TOTAL sudah ada dari proses sebelumnya, dipakai ulang (tidak dobel, tidak bikin baris baru tiap import).
7. Header gabungan **"IURAN TK CLIENT"** (merge di atas kolom JKK–JKP) dan **"IURAN TK KARYAWAN"** (merge di atas kolom JHT karyawan–JP karyawan) otomatis dipasang di baris tepat di atas header kolom.
8. Setiap baris yang diisi/diupdate otomatis dirapikan: **tanpa warna latar**, **tidak bold**, dan **NAMA rata kiri** — ikut membetulkan baris-baris lama yang formatnya masih ikut warna header, asal orangnya ada di PDF yang sedang diproses.
9. File PDF F2 aslinya diunggah ke folder Drive **"PDF F2 Sumber"** (sejajar dengan spreadsheet-nya) lalu link-nya dipasang di **H2:I2** (merge), diberi nama `<nama sheet> <bulan>-<2 digit tahun>.pdf` — menimpa link sebelumnya kalau sheet itu diimport ulang.

## Cara pasang (sekali saja per spreadsheet)

1. Buka spreadsheet rekap BPJS TK-nya di Google Sheets.
2. Menu **Extensions → Apps Script** (harus dari dalam spreadsheet-nya, bukan project terpisah, supaya scriptnya otomatis nempel ke spreadsheet yang benar).
3. Di editor Apps Script yang terbuka:
   - **`Code.gs`** — hapus isi default, ganti dengan isi `apps-script-bpjs-f2/Code.gs` di repo ini (sudah termasuk menu "📌 MENU OTOMATIS" yang lama).
   - Buat file HTML baru (File → New → HTML), beri nama **`ImportDialog`** — isi dengan `apps-script-bpjs-f2/ImportDialog.html`.
4. **Simpan** (ikon disket / Ctrl+S).
5. **Refresh** tab spreadsheetnya (reload browser). Setelah dimuat ulang, akan muncul 2 menu baru: **"📌 MENU OTOMATIS"** dan **"Import F2"**.
6. Saat pertama kali dipakai, Google akan minta izin akses ke spreadsheet dan Drive — klik **Authorize access** lalu izinkan (wajar, karena script perlu baca/tulis sheet dan menyimpan file PDF sumber ke Drive).

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
- Link PDF di H2:I2 selalu pakai alamat sel H2:I2 secara literal (sama seperti konvensi menu "Hapus Link PDF & Teks H2:I2" yang sudah ada), bukan dihitung dari posisi header — jadi pastikan H2:I2 memang area yang dipakai untuk link PDF di semua sheet lokasi.

# CEK GAJI OTOMATIS (Apps Script)

Script ini di-bind ke spreadsheet **"CEK GAJI"** (Extensions → Apps Script dari
dalam spreadsheet-nya, bukan project terpisah). Isi file `CekGajiOtomatis.gs`
ke editor Apps Script di sana.

## Fitur

- **Cek Gaji per Batch** — mengambil GAJI, DITERIMA KARYAWAN, BPJS KES, BPJS TK,
  dan PAYROLL dari spreadsheet PIC masing-masing lokasi (`CONFIG_CEK_GAJI.PIC_SOURCES`),
  dengan pencocokan nama lokasi yang ketat (strict, anti-ambigu).
- **Isi Nominal Mutasi** — mengisi kolom **NOMINAL MUTASI** dari spreadsheet
  "Salinan REKONSILIASI GAJI [BULAN] [TAHUN]", sheet `NOMINAL LOKASI` (sudah
  berisi total per lokasi hasil rekap dari sheet `MUTASI`), dengan
  menjumlahkan lagi grup-grup lokasi yang sejenis dengan NAMA LOKASI pada
  sheet tujuan.

## Menambah link REKONSILIASI bulan baru

Setiap bulan biasanya punya salinan spreadsheet REKONSILIASI sendiri. Tambahkan
link-nya di `CONFIG_MUTASI.SOURCES`, dengan key persis sama dengan nama sheet
bulan tujuan (JUNI, JULI, AGUSTUS, dst):

```js
SOURCES: {
  "AGUSTUS": "https://docs.google.com/spreadsheets/d/xxxx/edit",
  "SEPTEMBER": "https://docs.google.com/spreadsheets/d/yyyy/edit",
}
```

## Cara kerja pencocokan Nominal Mutasi

1. Membuka sheet `NOMINAL LOKASI` pada spreadsheet REKONSILIASI bulan yang
   sesuai (dicari lewat `CONFIG_MUTASI.SHEET_NAME`, dengan fallback ke sheet
   mentah `MUTASI` kalau nama itu tidak ada). Script mencoba dua bentuk tabel:
   - Tabel ringkasan yang sudah ada (header `NAMA LOKASI` + kolom yang
     mengandung kata `TOTAL`, mis. "TOTAL GAJI TERTRANSFER") — ini yang
     dipakai di `NOMINAL LOKASI`.
   - Kalau tidak ada, fallback ke tabel rincian per transaksi (header
     `NAMA LOKASI` + `NOMINAL`), lalu dijumlahkan manual per lokasi.
2. Nama lokasi di `NOMINAL LOKASI` biasanya punya akhiran seperti
   "PENGECEKAN" / "PENGECEKAN PTSP" (mis. "BAPENDA PENGECEKAN"), kadang juga
   ada angka "0" nyasar (mis. "BSN KENDAL 0 PENGECEKAN"). Kata/token ini
   dibuang (`CONFIG_MUTASI.NOISE_WORDS` + token "0") sebelum dicocokkan
   dengan NAMA LOKASI di sheet tujuan.
3. Pencocokan dilakukan **per kata (token), dua tahap** (`cocokkanSemuaLokasiMutasi_`),
   bukan per-substring string utuh — supaya nama yang urutan/kelengkapan
   katanya beda tetap kecocok, mis. "BSN KENDAL 0 PENGECEKAN" (mutasi) tetap
   cocok dengan "PT BSN TEKNOLOGI KENDAL" (tujuan) walau ada kata "TEKNOLOGI"
   di tengah yang tidak ada di sisi mutasi.
   - **Tahap 1 (exact)**: kalau kumpulan kata grup mutasi persis sama dengan
     kumpulan kata satu lokasi tujuan, langsung dipasangkan. Ini mencegah
     nama pendek seperti "BPTIK PROV JATENG" salah merebut grup mutasi milik
     "BPTIK PROV JATENG CAKRA" hanya karena sama-sama mengandung kata itu.
   - **Tahap 2 (subset kata)**: untuk sisanya, dicocokkan lagi — cocok kalau
     semua kata dari yang lebih pendek ada di yang lebih panjang (kedua arah
     dicoba, urutan kata tidak masalah). Satu lokasi tujuan boleh
     menjumlahkan beberapa grup mutasi. Tapi kalau satu grup mutasi (di
     tahap ini) cocok dengan **lebih dari satu** lokasi tujuan yang tersisa,
     dianggap ambigu dan nilainya TIDAK ditulis — supaya nominal yang sama
     tidak terhitung ganda. Baris yang ambigu ditandai di kolom ERROR (kalau
     kolom itu ada) dengan pesan "NOMINAL MUTASI AMBIGU, CEK MANUAL" untuk
     dicek manual (mis. kalau mutasinya cuma tertulis "BAPENDA PENGECEKAN"
     padahal ada dua kandidat lokasi tujuan, "BAPENDA PROV JATENG" dan
     "BAPENDA KALTENG").
4. **Pengaman tambahan**: kalau kolom DITERIMA KARYAWAN sudah terisi, hasil
   NOMINAL MUTASI dibandingkan dengan nilai itu. Kalau bedanya lebih dari
   `CONFIG_MUTASI.SANITY_CHECK_RATIO` (default 15%), nilainya TETAP ditulis
   (masih data terbaik yang ada) tapi ditandai "NOMINAL MUTASI BEDA JAUH DARI
   DITERIMA KARYAWAN, CEK MANUAL" di kolom ERROR. Ini biasanya tanda data
   sumber di sheet MUTASI/NOMINAL LOKASI kena masalah dobel-impor rekening
   koran (pernah ditemukan: rekening koran yang sama ke-import 2x pada
   tanggal impor berbeda, bikin beberapa lokasi di `NOMINAL LOKASI`
   nilainya dobel). Kalau ini terjadi, sumbernya perlu dibersihkan &
   di-generate ulang di REKONSILIASI-nya — bukan sesuatu yang bisa dibetulkan
   dari sisi pencocokan lokasi di script ini.

Gunakan menu **🧪 Test Nominal Mutasi (Baris Aktif)** untuk mengecek satu
lokasi dulu sebelum menjalankan **💵 Isi Nominal Mutasi (Sheet Aktif)** untuk
seluruh sheet.

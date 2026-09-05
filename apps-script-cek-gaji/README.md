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
   "PENGECEKAN" / "PENGECEKAN PTSP" (mis. "BAPENDA PENGECEKAN"). Akhiran ini
   dibuang (`CONFIG_MUTASI.NOISE_WORDS`) sebelum dicocokkan dengan NAMA LOKASI
   di sheet tujuan (mis. "BAPENDA PROV JATENG").
3. Pencocokan dilakukan **dua tahap** (`cocokkanSemuaLokasiMutasi_`):
   - **Tahap 1 (exact)**: kalau kunci grup mutasi persis sama dengan kunci
     satu lokasi tujuan, langsung dipasangkan. Ini mencegah nama pendek
     seperti "BPTIK PROV JATENG" salah merebut grup mutasi milik
     "BPTIK PROV JATENG CAKRA" hanya karena sama-sama mengandung kata itu.
   - **Tahap 2 (containment)**: untuk sisanya, dicocokkan lagi lewat
     substring. Satu lokasi tujuan boleh menjumlahkan beberapa grup mutasi.
     Tapi kalau satu grup mutasi (di tahap ini) cocok dengan **lebih dari
     satu** lokasi tujuan yang tersisa, dianggap ambigu dan nilainya
     TIDAK ditulis — supaya nominal yang sama tidak terhitung ganda. Baris
     yang ambigu ditandai di kolom ERROR (kalau kolom itu ada) dengan pesan
     "NOMINAL MUTASI AMBIGU, CEK MANUAL" untuk dicek manual (mis. kalau
     mutasinya cuma tertulis "BAPENDA PENGECEKAN" padahal ada dua kandidat
     lokasi tujuan, "BAPENDA PROV JATENG" dan "BAPENDA KALTENG").

Gunakan menu **🧪 Test Nominal Mutasi (Baris Aktif)** untuk mengecek satu
lokasi dulu sebelum menjalankan **💵 Isi Nominal Mutasi (Sheet Aktif)** untuk
seluruh sheet.

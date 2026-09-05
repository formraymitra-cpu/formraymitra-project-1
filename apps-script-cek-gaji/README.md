# CEK GAJI OTOMATIS (Apps Script)

Script ini di-bind ke spreadsheet **"CEK GAJI"** (Extensions → Apps Script dari
dalam spreadsheet-nya, bukan project terpisah). Isi file `CekGajiOtomatis.gs`
ke editor Apps Script di sana.

## Fitur

- **Cek Gaji per Batch** — mengambil GAJI, DITERIMA KARYAWAN, BPJS KES, BPJS TK,
  dan PAYROLL dari spreadsheet PIC masing-masing lokasi (`CONFIG_CEK_GAJI.PIC_SOURCES`),
  dengan pencocokan nama lokasi yang ketat (strict, anti-ambigu).
- **Isi Nominal Mutasi** — mengisi kolom **NOMINAL MUTASI** dari spreadsheet
  "Salinan REKONSILIASI GAJI [BULAN] [TAHUN]", sheet `MUTASI`, dengan
  menjumlahkan semua baris mutasi yang lokasinya sejenis dengan NAMA LOKASI
  pada sheet tujuan.

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

1. Membaca sheet `MUTASI` pada spreadsheet REKONSILIASI bulan yang sesuai.
   Script mencoba dua bentuk tabel:
   - Tabel ringkasan yang sudah ada (header `NAMA LOKASI` + kolom yang
     mengandung kata `TOTAL`, mis. "TOTAL GAJI TERTRANSFER").
   - Kalau tidak ada, fallback ke tabel rincian per transaksi (header
     `NAMA LOKASI` + `NOMINAL`), lalu dijumlahkan manual per lokasi.
2. Nama lokasi di sheet `MUTASI` biasanya punya akhiran seperti
   "PENGECEKAN" / "PENGECEKAN PTSP" (mis. "BAPENDA PENGECEKAN"). Akhiran ini
   dibuang (`CONFIG_MUTASI.NOISE_WORDS`) sebelum dicocokkan dengan NAMA LOKASI
   di sheet tujuan (mis. "BAPENDA PROV JATENG") lewat pencocokan substring.
3. Satu lokasi tujuan boleh menjumlahkan beberapa grup mutasi. Tapi kalau satu
   grup mutasi cocok dengan **lebih dari satu** lokasi tujuan (ambigu), nilai
   TIDAK ditulis — supaya nominal yang sama tidak terhitung ganda. Baris yang
   ambigu ditandai di kolom ERROR (kalau kolom itu ada) dengan pesan
   "NOMINAL MUTASI AMBIGU, CEK MANUAL" untuk dicek manual.

Gunakan menu **🧪 Test Nominal Mutasi (Baris Aktif)** untuk mengecek satu
lokasi dulu sebelum menjalankan **💵 Isi Nominal Mutasi (Sheet Aktif)** untuk
seluruh sheet.

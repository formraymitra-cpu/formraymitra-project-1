# Sistem Rekonsiliasi Gaji — Multi Bank + Multi PIC

Google Apps Script (container-bound ke Google Sheets) untuk mencocokkan REKAP PIC (gaji yang seharusnya ditransfer) dengan MUTASI BANK (transfer yang benar-benar terjadi): BCA (HTML), BRI/BPD/MANDIRI (PDF, termasuk PDF Transfer Massal/Bulk).

## Cara pasang

1. Buka spreadsheet sumbernya di Google Sheets.
2. Menu **Extensions → Apps Script** (harus dari dalam spreadsheet-nya, bukan project terpisah).
3. Hapus isi default `Code.gs`, ganti dengan isi `Code.gs` di folder ini.
4. Reload spreadsheet. Menu **🏦 CEK GAJI** akan muncul.
5. Jalankan **⚙️ Buat / Perbaiki Struktur** sekali untuk membuat semua sheet yang dibutuhkan.

## Perubahan pada revisi ini

- **Baca Mutasi Bulk BRI & Mandiri diperbaiki.** Nominal yang terpecah spasi oleh hasil ekstraksi PDF (mis. `Rp3. 147 .680`) sekarang dibaca benar, dan nama yang terpotong tanda hubung akibat word-wrap PDF (mis. `MUHAM- MAD IRWAN`) sekarang disambung jadi `MUHAMMAD IRWAN`. Deteksi jenis PDF (bulk vs mutasi biasa) juga dibuat lebih toleran terhadap variasi hasil ekstraksi teks, supaya tidak gagal total hanya karena satu frasa sedikit berbeda.
- **Pencocokan nama & lokasi lebih cermat.** Selain nama lengkap dan nama terpotong, mesin pencocokan sekarang mentolerir typo/selisih ejaan kecil (mis. `PRAYOGO` vs `PRAYOGA`) memakai jarak edit terbatas, supaya lebih banyak hasil otomatis SESUAI dan cek manual berkurang — tanpa mengorbankan kehati-hatian pada nama pendek yang benar-benar berbeda.
- **REKAP_AKHIR: kolom NOMINAL selalu nominal mutasi riil.** Baris tidak lagi diam-diam memakai nominal REKAP saat nominal mutasi belum ada; lokasi seperti itu ditandai belum lengkap di ringkasan, bukan dimasukkan dengan angka yang mungkin salah.
- **Warna blok lokasi otomatis di REKAP_AKHIR.** Setiap blok baris dengan lokasi yang sama diberi warna solid berselang-seling pink → kuning → pink → kuning, dihitung ulang otomatis setiap kali **📊 Update Rekap Akhir** dijalankan.

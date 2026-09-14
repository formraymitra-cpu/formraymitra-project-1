# Deploy sebagai Apps Script Web App (live-sync)

Dashboard ini baca langsung dari spreadsheet "JURNAL HARIAN DINI SAFFANAH 2026"
setiap kali dibuka — tidak perlu proses build/deploy ulang tiap kali ada bulan
atau hari baru ditambahkan ke spreadsheet.

## Langkah deploy (sekali saja, ~5-10 menit)

1. **Buka spreadsheet sumbernya** ("JURNAL HARIAN DINI SAFFANAH 2026") di Google Sheets.
2. Menu **Extensions → Apps Script**. Ini penting dilakukan dari dalam spreadsheet-nya (bukan bikin project Apps Script terpisah), supaya `SpreadsheetApp.getActiveSpreadsheet()` di kode otomatis menunjuk ke sheet yang benar.
3. Di editor Apps Script yang terbuka, akan ada file default `Code.gs` dan `appsscript.json`. Buat 4 file dengan isi dari folder `jurnal-dashboard/apps-script/` di repo ini:
   - **`Code.gs`** — hapus isi default, ganti dengan isi `apps-script/Code.gs`
   - **`Index.html`** (File → New → HTML) — isi dari `apps-script/Index.html`
   - **`Bundle.html`** (File → New → HTML) — isi dari `apps-script/Bundle.html`
   - **`Styles.html`** (File → New → HTML) — isi dari `apps-script/Styles.html`
   - **`appsscript.json`** — buka lewat ikon gerigi "Project Settings" → centang "Show appsscript.json in editor", lalu isi sesuai `apps-script/appsscript.json`
4. **Deploy → New deployment** (ikon di kanan atas):
   - Klik ikon gerigi di "Select type" → pilih **Web app**
   - Description bebas (mis. "Dashboard Jurnal v1")
   - **Execute as**: Me (akun kamu)
   - **Who has access**: pilih sesuai kebutuhan — "Only myself" kalau cuma kamu, atau "Anyone" kalau atasan/pihak lain juga perlu buka tanpa login Google
   - Klik **Deploy**, lalu **Authorize access** (izinkan akses ke spreadsheet — wajar, karena script perlu baca datanya)
5. Setelah deploy selesai, kamu dapat **Web app URL** (format `https://script.google.com/macros/s/XXXXX/exec`). Itu link dashboard live-nya — buka kapan saja, datanya selalu versi terbaru dari spreadsheet.
6. **Reload/tutup-buka lagi spreadsheet-nya.** Akan muncul menu baru **"📊 Dashboard"** di sebelah menu Bantuan, dengan item **"Buka Dashboard"** — klik itu untuk langsung buka dashboard di tab baru tanpa perlu simpan/cari link `.../exec` lagi. Pertama kali dipakai mungkin diminta otorisasi tambahan, izinkan saja.

## Menghubungkan submenu Invoice

Submenu **Invoice** (kelengkapan dokumen + nominal tagihan per lokasi per
bulan — dari sheet bulanan "<BULAN> <TAHUN>", mis. "JULI 2026") baca dari
spreadsheet **terpisah** "MONITORING INVOICE DINI" — bukan spreadsheet
jurnal harian. Supaya submenu ini aktif:

1. Buka spreadsheet "MONITORING INVOICE DINI" di Google Sheets.
2. Copy ID-nya dari URL — bagian antara `/d/` dan `/edit`, contoh:
   `https://docs.google.com/spreadsheets/d/`**`ID_DI_SINI`**`/edit`
3. Di editor Apps Script (yang terhubung ke spreadsheet jurnal harian), buka `Code.gs`, cari baris:
   ```js
   var INVOICE_SPREADSHEET_ID = "";
   ```
   isi di antara tanda kutip dengan ID yang tadi di-copy.
4. **Deploy → Manage deployments → Edit (pensil) → Deploy** supaya perubahan ini ikut live.
5. Buka dashboard lagi — submenu Invoice sekarang menampilkan data asli, bukan pesan "belum terhubung".

Selama `INVOICE_SPREADSHEET_ID` masih kosong, submenu Invoice tetap muncul
di dashboard tapi menampilkan pesan bahwa belum terhubung — dashboard yang
lain (Overview, Rekap Bulanan, dst) tidak terpengaruh sama sekali.

Sheet bulan kelengkapan dokumen di spreadsheet invoice (mis. "JULI 2026")
otomatis terbaca asal namanya `<BULAN> <TAHUN>` (contoh: `OKTOBER 2026`) —
tambah bulan baru di sana juga tidak perlu ubah kode.

Kolom **BAGIAN KERJA** dan **NOMINAL TAGIHAN** di sheet bulan itu juga
otomatis kebaca (dicari lewat nama header, jadi posisinya boleh digeser).
Kalau satu lokasi punya beberapa bagian kerja sekaligus, isi tiap kolom
dengan baris terpisah (Alt+Enter di Google Sheets) — baris ke-1 di BAGIAN
KERJA dipasangkan dengan baris ke-1 di NOMINAL TAGIHAN, dst. NOMINAL TAGIHAN
boleh angka polos atau teks seperti "Rp. 6.577.423".

Kolom **BAPP**, **BAST**, **BAP** (nomor + tanggal), **NO INVOICE DAN
KWITANSI**, serta blok **Kontrak & Surat Pesanan** (No SP, Tanggal SP, Lama
Kontrak, Periode Kontrak, Termin, Metode, Nomor/Status, Link Nomor) juga
otomatis kebaca lewat nama header — semuanya dicari mulai SETELAH kolom
TANGGAL KIRIM (karena "BAPP"/"BAST"/"BAP" juga dipakai sebagai nama kolom
checklist boolean di awal sheet). Di dashboard, kolom-kolom ini tampil
sebagai panel detail per lokasi — klik tombol **"Lihat"** di tabel
"Kelengkapan Dokumen & Tagihan per Lokasi" untuk membukanya. Sel boleh diisi
tanggal asli maupun teks yang diketik manual (mis. "29 Juni 2026"), dan
boleh multi-baris (Alt+Enter) kalau satu lokasi punya beberapa SP/berita
acara sekaligus. Kalau sheet bulan tertentu belum punya kolom-kolom ini
(misalnya bulan-bulan sebelum fitur ini mulai dipakai), panel detailnya
otomatis menampilkan keterangan bahwa datanya belum ada — tidak error.

## Menambah bulan baru

Karena `Code.gs` membaca semua sheet yang namanya cocok dengan nama bulan
(MARET, APRIL, ... dst) dan bukan sheet "... FOTO", menambah sheet bulan baru
ke spreadsheet (misalnya OKTOBER) otomatis langsung muncul di dashboard —
tidak perlu ubah kode apa pun. Cukup pastikan sheet baru itu:
- diberi nama bulan dalam huruf besar (MARET, APRIL, MEI, ...)
- ikuti format kolom yang sama: `TANGGAL | HARI | JAM MASUK | JAM PULANG | NO | DAILY WORK PLAN | CEKLIST | TIME SCHEDULE | KETERANGAN`
- header ada di baris 3, data mulai baris 4
- jumlah foto **tidak perlu diisi manual** — dihitung otomatis dari header di sheet galeri `<BULAN> FOTO` (format `DD/MM/YYYY (Hari) - N foto`)

## Update tampilan di kemudian hari

Kalau source code React (`jurnal-dashboard/src/`) diubah lagi:

```bash
cd jurnal-dashboard
npm install
npm run build
node scripts/build-apps-script.mjs
```

Ini regenerate `apps-script/Bundle.html` dan `apps-script/Styles.html`. Tempel ulang isinya ke file yang sama di editor Apps Script, lalu **Deploy → Manage deployments → Edit (ikon pensil) → Deploy** supaya versi live ikut ter-update (bikin deployment baru tidak otomatis update URL yang sudah dibagikan — harus lewat "Manage deployments").

Perubahan di **spreadsheet** (isi data, tambah bulan/hari baru) tidak perlu langkah ini sama sekali — otomatis ke-refresh tiap dashboard dibuka.

## Kalau mau cek data tanpa buka web app

Di editor Apps Script, jalankan fungsi `debugDataset` lewat toolbar Run, lalu lihat hasilnya di **View → Logs** (atau **Executions**).

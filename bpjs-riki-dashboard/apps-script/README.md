# Deploy sebagai Apps Script Web App (live-sync)

Versi ini baca langsung dari spreadsheet setiap kali dibuka — tidak perlu proses build/deploy ulang tiap kali datanya berubah. Cocok untuk kamu sebagai PIC BPJS: tinggal isi/update spreadsheet seperti biasa, dashboard-nya otomatis ikut ter-update.

## Langkah deploy (sekali saja, ~5-10 menit)

1. **Buka spreadsheet sumbernya** ("LAPORAN HARIAN RIKI", link Google Sheets kamu) di browser.
2. Menu **Extensions → Apps Script**. Ini penting dilakukan dari dalam spreadsheet-nya (bukan bikin project Apps Script terpisah), supaya `SpreadsheetApp.getActiveSpreadsheet()` di kode otomatis menunjuk ke sheet yang benar.
3. Di editor Apps Script yang terbuka, akan ada file default `Code.gs` dan `appsscript.json`. Buat 4 file dengan isi dari folder `apps-script/` di repo ini:
   - **`Code.gs`** — hapus isi default, ganti dengan isi `apps-script/Code.gs`
   - **`Index.html`** (File → New → HTML) — isi dari `apps-script/Index.html`
   - **`Bundle.html`** (File → New → HTML) — isi dari `apps-script/Bundle.html`
   - **`Styles.html`** (File → New → HTML) — isi dari `apps-script/Styles.html`
   - **`appsscript.json`** — buka lewat ikon gerigi "Project Settings" → centang "Show appsscript.json in editor", lalu isi sesuai `apps-script/appsscript.json`
4. **Deploy → New deployment** (ikon di kanan atas):
   - Klik ikon gerigi di "Select type" → pilih **Web app**
   - Description bebas (mis. "Dashboard BPJS v1")
   - **Execute as**: Me (akun kamu)
   - **Who has access**: pilih sesuai kebutuhan — "Only myself" kalau cuma kamu, atau "Anyone" kalau atasan/tim lain juga perlu buka tanpa login Google
   - Klik **Deploy**, lalu **Authorize access** (izinkan akses ke spreadsheet — wajar, karena script perlu baca datanya)
5. Setelah deploy selesai, kamu dapat **Web app URL** (format `https://script.google.com/macros/s/XXXXX/exec`). Itu link dashboard live-nya — buka kapan saja, datanya selalu versi terbaru dari spreadsheet.

## Kenapa ini bisa auto-update

`Code.gs` (fungsi `buildDataset()`) membaca ulang seluruh sheet — semua sheet bulan (dideteksi otomatis dari nama: APRIL, MEI, JUNI, dst — jadi kalau kamu tambah sheet bulan baru seperti SEPTEMBER dengan format yang sama, otomatis ikut muncul di dashboard tanpa edit kode), `Sheet1` (log harian konsolidasi), dan `Sheet3` (rekap nominal) — **setiap kali halaman dashboard dibuka/di-refresh**. Tidak ada data yang disimpan statis di dalam script.

## Update tampilan (kalau source code React di `src/` diubah lagi)

```bash
npm run build
node scripts/build-apps-script.mjs
```

Ini regenerate `apps-script/Bundle.html` dan `apps-script/Styles.html`. Tempel ulang isinya ke file yang sama di editor Apps Script, lalu **Deploy → Manage deployments → Edit (ikon pensil) → Deploy** supaya versi live ikut ter-update (bikin deployment baru tidak otomatis update URL yang sudah dibagikan — harus lewat "Manage deployments").

Perubahan di **isi spreadsheet** (data harian/bulanan) tidak perlu langkah ini sama sekali — otomatis ke-refresh tiap dashboard dibuka.

## Kalau spreadsheet sudah masuk tahun baru (mis. 2027)

Nama sheet bulan di file ini tidak menyertakan tahun (cuma "AGUSTUS", bukan "AGUSTUS 2026"), jadi `Code.gs` perlu tahu tahunnya lewat variabel `YEAR` di baris atas file. Kalau spreadsheet sudah lanjut ke tahun berikutnya, ubah `var YEAR = 2026;` jadi tahun yang sesuai, lalu tempel ulang `Code.gs` di editor Apps Script.

## Kalau mau cek data tanpa buka web app

Di editor Apps Script, jalankan fungsi `debugDataset` lewat toolbar Run, lalu lihat hasilnya di **View → Logs** (atau **Executions**).

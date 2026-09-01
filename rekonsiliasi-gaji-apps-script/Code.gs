/************************************************************
 * ==========================================================
 * SISTEM PENGECEKAN GAJI
 * MULTI BANK + MULTI MUTASI + MULTI PIC
 * ==========================================================
 *
 * ALUR:
 *
 * REKAP PIC
 *   PAK TOHAR
 *   ZAHRA
 *   ADI
 *   ELA
 *   KALIMANTAN
 *   KEDU
 *          ↓
 *
 * MUTASI BANK
 *   BCA     → HTML
 *   BRI     → PDF
 *   BPD     → PDF
 *   MANDIRI → PDF
 *          ↓
 *
 *       MUTASI
 *          ↓
 *   CEK NAMA
 *   CEK LOKASI
 *   CEK NOMINAL
 *   CEK DUPLIKAT
 *          ↓
 *
 * HASIL_PENGECEKAN
 *
 ************************************************************/


/************************************************************
 * MATCH ENGINE V8.1 - NAMA + LOKASI + NOMINAL + BANK
 * Hanya mesin pencocokan yang diperbarui.
 * ==========================================================
 * CONFIG
 * ==========================================================
 ************************************************************/

const CONFIG = {

  SHEET_PERIODE:
    'PERIODE_GAJI',

  SHEET_SUMBER_MUTASI:
    'SUMBER_MUTASI',

  SHEET_SUMBER_REKAP:
    'SUMBER_REKAP',

  SHEET_MUTASI:
    'MUTASI',

  SHEET_RAW:
    'RAW',

  SHEET_HASIL:
    'HASIL_PENGECEKAN',

  SHEET_CEK:
    'CEK_KARYAWAN',

  SHEET_MASTER:
    'MASTER_KARYAWAN',

  MIN_SCORE_NAMA_SESUAI:
    0.75,

  MIN_SCORE_NAMA_PERLU_CEK:
    0.50,

  MIN_SCORE_LOKASI_SESUAI:
    0.50,

  TOLERANSI_NOMINAL:
    0,

  // Kandidat dengan nominal sama tetapi nama DAN lokasi sama-sama lemah
  // tidak boleh dianggap sebagai pasangan.

  // Warna blok lokasi di REKAP_AKHIR, berselang-seling otomatis
  // per blok lokasi yang berurutan (bukan per baris).
  WARNA_BLOK_LOKASI_1:
    '#F8C6D9',

  WARNA_BLOK_LOKASI_2:
    '#FFF3A3',

};


/************************************************************
 * ==========================================================
 * MENU
 * ==========================================================
 ************************************************************/

function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('🏦 CEK GAJI')

    .addItem(
      '⚙️ Buat / Perbaiki Struktur',
      'buatStrukturSistem'
    )

    .addItem(
      '📅 Atur Periode Gaji',
      'aturPeriodeGaji'
    )

    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('🗂️ Kelola Data')
        .addItem('📅 Aktifkan Periode', 'aktifkanPeriodeMenu')
        .addItem('📅 Nonaktifkan Periode', 'nonaktifkanPeriodeMenu')
        .addItem('🗑️ Hapus Periode', 'hapusPeriodeMenu')
        .addSeparator()
        .addItem('👥 Aktifkan Rekap PIC', 'aktifkanRekapPICMenu')
        .addItem('👥 Nonaktifkan Rekap PIC', 'nonaktifkanRekapPICMenu')
        .addItem('🗑️ Hapus Rekap PIC', 'hapusRekapPICMenu')
        .addSeparator()
        .addItem('🏦 Aktifkan Sumber Mutasi', 'aktifkanSumberMutasiMenu')
        .addItem('🏦 Nonaktifkan Sumber Mutasi', 'nonaktifkanSumberMutasiMenu')
        .addItem('🗑️ Hapus Sumber Mutasi', 'hapusSumberMutasiMenu')
    )

    .addSeparator()

    .addItem(
      '📥 Import Mutasi Bank',
      'importMutasiBank'
    )

    .addItem(
      '📥 Import HTML BCA',
      'importHTMLBCA'
    )

    .addItem(
      '🧪 Tes Baca PDF / Drive',
      'tesBacaPDFDrive'
    )

    .addSeparator()

    .addItem(
      '👥 Tambah Rekap PIC',
      'tambahRekapPIC'
    )

    .addItem(
      '📋 Lihat Sumber Rekap PIC',
      'lihatSumberRekap'
    )

    .addSeparator()

    .addItem(
      '🆕 Cek Mutasi Baru',
      'cekMutasiBaru'
    )

    .addItem(
      '🔄 Cek Ulang Periode',
      'cekUlangPeriode'
    )

    .addItem(
      '☑️ Update Cek Manual',
      'updateCekManual'
    )

    .addItem(
      '📊 Update Rekap Akhir',
      'updateRekapAkhir'
    )

    .addItem(
      '💰 Update Nominal Lokasi',
      'updateNominalLokasi'
    )

    .addItem(
      '🔎 Jalankan Pengecekan Gaji',
      'jalankanPengecekanGaji'
    )

    .addItem(
      '🔍 Cek Data Belum Dikenali',
      'cekDataBelumDikenali'
    )

    .addItem(
      '🧮 Audit Selisih Rekonsiliasi',
      'auditSelisihRekonsiliasi'
    )

    .addSeparator()

    .addItem(
      '📊 Ringkasan Hasil',
      'ringkasanHasil'
    )

    .addSeparator()

    .addItem(
      '🧹 Bersihkan Mutasi',
      'bersihkanMutasi'
    )

    .addItem(
      '🗑️ Hapus Sumber Mutasi + Data Terkait (Pilih Nomor)',
      'hapusSumberMutasiPilihan'
    )

    .addItem(
      '🗑️ Hapus Baris Mutasi (Pilih Nomor)',
      'hapusBarisMutasiPilihan'
    )

    .addItem(
      '🧹 Bersihkan Hasil Pengecekan',
      'bersihkanHasilPengecekan'
    )

    .addToUi();

}


/************************************************************
 * ==========================================================
 * BUAT STRUKTUR SISTEM
 * ==========================================================
 ************************************************************/

function buatStrukturSistem() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  buatSheet(
    CONFIG.SHEET_PERIODE,
    [
      'NO',
      'NAMA PERIODE',
      'TANGGAL MULAI',
      'TANGGAL SELESAI',
      'STATUS'
    ]
  );

  buatSheet(
    CONFIG.SHEET_SUMBER_MUTASI,
    [
      'NO',
      'BANK',
      'NAMA FILE',
      'PERIODE',
      'TANGGAL IMPORT',
      'TOTAL TRANSAKSI',
      'STATUS'
    ]
  );

  buatSheet(
    CONFIG.SHEET_SUMBER_REKAP,
    [
      'NO',
      'PIC',
      'LINK REKAP',
      'NAMA FILE',
      'SHEET REKAP',
      'PERIODE',
      'STATUS'
    ]
  );

  buatSheet(
    CONFIG.SHEET_MUTASI,
    [
      'ID MUTASI',
      'TANGGAL',
      'BANK',
      'NO REK PT',
      'NAMA REKENING PT',
      'KETERANGAN',
      'NOMINAL',
      'SUMBER FILE',
      'PERIODE',
      'STATUS PEMAKAIAN',
      'STATUS PROSES'
    ]
  );

  buatSheet(
    CONFIG.SHEET_RAW,
    [
      'ID RAW',
      'BANK',
      'NAMA FILE',
      'TANGGAL ASLI',
      'NO REK PT',
      'NAMA REKENING PT',
      'KETERANGAN ASLI',
      'CABANG',
      'NOMINAL',
      'PERIODE',
      'STATUS'
    ]
  );

  buatSheet(
    'REKAP_AKHIR',
    [
      'NO',
      'TANGGAL MUTASI',
      'NAMA KARYAWAN',
      'NAMA LOKASI',
      'NOMINAL'
    ]
  );

  buatSheet(
    CONFIG.SHEET_MASTER,
    [
      'NAMA KARYAWAN',
      'NAMA LOKASI KERJA'
    ]
  );

  buatSheet(
    CONFIG.SHEET_HASIL,
    [
      'NO',
      'PIC',
      'LOKASI',
      'NAMA REKAP',
      'NAMA MUTASI',
      'NOMINAL REKAP',
      'NOMINAL MUTASI',
      'SELISIH',
      'BANK',
      'TANGGAL MUTASI',
      'SUMBER MUTASI',
      'SKOR NAMA',
      'SKOR LOKASI',
      'STATUS NAMA',
      'STATUS NOMINAL',
      'STATUS LOKASI',
      'STATUS AKHIR',
      'ACUAN TRANSFER GANDA'
    ]
  );

  buatSheet(
    CONFIG.SHEET_CEK,
    [
      'TANGGAL',
      'BANK',
      'KETERANGAN',
      'NOMINAL',
      'STATUS'
    ]
  );

  SpreadsheetApp
    .getUi()
    .alert(
      '✅ STRUKTUR SISTEM BERHASIL DIBUAT / DIPERBARUI.'
    );

}

/************************************************************
 * ==========================================================
 * BUAT SHEET
 * ==========================================================
 ************************************************************/

function buatSheet(
  nama,
  header
) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sh =
    ss.getSheetByName(nama);

  if (!sh) {

    sh =
      ss.insertSheet(nama);

  }

  if (
    sh.getLastRow() === 0
  ) {

    sh
      .getRange(
        1,
        1,
        1,
        header.length
      )
      .setValues([
        header
      ]);

  } else {

    const existing =
      sh
        .getRange(
          1,
          1,
          1,
          header.length
        )
        .getValues()[0];

    const kosong =
      existing.every(
        function(x) {
          return !x;
        }
      );

    if (kosong) {

      sh
        .getRange(
          1,
          1,
          1,
          header.length
        )
        .setValues([
          header
        ]);

    }

  }

  formatHeader(
    sh,
    header.length
  );

}


/************************************************************
 * ==========================================================
 * ATUR PERIODE GAJI
 * ==========================================================
 ************************************************************/

function aturPeriodeGaji() {

  const ui =
    SpreadsheetApp.getUi();

  const nama =
    ui.prompt(
      '📅 NAMA PERIODE GAJI',
      'Contoh: GAJI AGUSTUS 2026',
      ui.ButtonSet.OK_CANCEL
    );

  if (
    nama.getSelectedButton() !==
    ui.Button.OK
  ) {
    return;
  }

  const namaPeriode =
    nama
      .getResponseText()
      .trim();

  if (!namaPeriode) {

    ui.alert(
      '❌ Nama periode tidak boleh kosong.'
    );

    return;
  }

  const mulai =
    ui.prompt(
      '📅 TANGGAL MULAI',
      'Format: DD/MM/YYYY\nContoh: 23/08/2026',
      ui.ButtonSet.OK_CANCEL
    );

  if (
    mulai.getSelectedButton() !==
    ui.Button.OK
  ) {
    return;
  }

  const selesai =
    ui.prompt(
      '📅 TANGGAL SELESAI',
      'Format: DD/MM/YYYY\nContoh: 03/09/2026',
      ui.ButtonSet.OK_CANCEL
    );

  if (
    selesai.getSelectedButton() !==
    ui.Button.OK
  ) {
    return;
  }

  const tanggalMulai =
    parseTanggalInput(
      mulai.getResponseText()
    );

  const tanggalSelesai =
    parseTanggalInput(
      selesai.getResponseText()
    );

  if (
    !tanggalMulai ||
    !tanggalSelesai
  ) {

    ui.alert(
      '❌ Format tanggal salah.\n\n' +
      'Gunakan DD/MM/YYYY.'
    );

    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  pastikanSheetPeriodeCepat(ss);
  const sh = ss.getSheetByName(CONFIG.SHEET_PERIODE);

  const last =
    sh.getLastRow();

  if (last > 1) {

    sh
      .getRange(
        2,
        5,
        last - 1,
        1
      )
      .setValue(
        'NONAKTIF'
      );

  }

  sh.appendRow([
    last,
    namaPeriode,
    tanggalMulai,
    tanggalSelesai,
    'AKTIF'
  ]);

  sh
    .getRange(
      sh.getLastRow(),
      3,
      1,
      2
    )
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  ui.alert(
    '✅ PERIODE GAJI AKTIF\n\n' +
    namaPeriode +
    '\n\n' +
    formatTanggal(tanggalMulai) +
    ' - ' +
    formatTanggal(tanggalSelesai)
  );

}


/************************************************************
 * ==========================================================
 * AMBIL PERIODE AKTIF
 * ==========================================================
 ************************************************************/

function getPeriodeAktif() {

  const sh =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEET_PERIODE
      );

  if (!sh) {
    return null;
  }

  const last =
    sh.getLastRow();

  if (last < 2) {
    return null;
  }

  const data =
    sh
      .getRange(
        2,
        1,
        last - 1,
        5
      )
      .getValues();

  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    if (
      String(data[i][4])
        .toUpperCase()
        .trim() ===
      'AKTIF'
    ) {

      return {
        no:
          data[i][0],

        nama:
          String(data[i][1] || '')
            .trim(),

        mulai:
          data[i][2],

        selesai:
          data[i][3]
      };

    }

  }

  return null;

}


/************************************************************
 * ==========================================================
 * IMPORT MUTASI BANK
 * ==========================================================
 ************************************************************/

function importMutasiBank() {

  // Struktur diasumsikan sudah dibuat saat setup. Jangan migrasi ulang setiap import.
  const periode =
    getPeriodeAktif();

  if (!periode) {

    SpreadsheetApp
      .getUi()
      .alert(
        '❌ Belum ada PERIODE GAJI aktif.\n\n' +
        'Atur terlebih dahulu melalui:\n' +
        '🏦 CEK GAJI → 📅 Atur Periode Gaji'
      );

    return;
  }

  const html = `

<!DOCTYPE html>

<html>

<head>

<base target="_top">

<style>

body {
  font-family: Arial, sans-serif;
  padding: 18px;
}

h2 {
  margin-top: 0;
}

.info {
  background: #f1f3f4;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.6;
  margin-bottom: 15px;
}

select,
input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px;
  margin: 6px 0 15px;
}

button {
  width: 100%;
  padding: 11px;
  border: 0;
  border-radius: 7px;
  background: #1a73e8;
  color: white;
  font-weight: bold;
}

button:disabled {
  background: #999;
}

#status {
  margin-top: 15px;
  line-height: 1.6;
}

</style>

</head>

<body>

<h2>📥 Import Mutasi Bank</h2>

<div class="info">

<b>PERIODE AKTIF:</b><br>
${escapeHtml(periode.nama)}

<br><br>

<b>Bank:</b><br>
BCA / BRI / BPD / MANDIRI

<br><br>

<b>Format:</b><br>
BCA → HTML<br>
BRI → PDF / BULK PDF otomatis<br>
BPD → PDF / BULK PDF otomatis<br>
MANDIRI → PDF / BULK PDF otomatis

<br><br>

Kamu bisa memilih beberapa file sekaligus.

</div>

<label><b>Pilih Bank</b></label>

<select id="bank">

<option value="BCA">BCA</option>
<option value="BRI">BRI</option>
<option value="BPD">BPD</option>
<option value="MANDIRI">MANDIRI</option>

</select>

<label><b>Pilih File Mutasi</b></label>

<input
  type="file"
  id="files"
  multiple
  accept=".html,.htm,.pdf"
>

<button
  id="btn"
  onclick="mulaiUpload()"
>
IMPORT MUTASI
</button>

<div id="status"></div>

<script>

let files = [];
let index = 0;
let bank = '';
window.importRingkasan = {berhasil:0, gagal:0};

function mulaiUpload() {

  const input =
    document.getElementById('files');

  bank =
    document.getElementById('bank')
      .value;

  if (
    !input.files ||
    input.files.length === 0
  ) {

    document.getElementById('status')
      .innerHTML =
      '❌ Pilih file terlebih dahulu.';

    return;

  }

  files =
    Array.from(input.files);

  index = 0;
  window.importRingkasan = {berhasil:0, gagal:0};

  document.getElementById('btn')
    .disabled = true;

  prosesBerikutnya();

}

function prosesBerikutnya() {

  if (
    index >= files.length
  ) {

    const statusEl = document.getElementById('status');
    const ringkasan = window.importRingkasan || {berhasil:0, gagal:0};

    statusEl.innerHTML +=
      '<hr><b>' +
      (ringkasan.gagal === 0
        ? '🎉 SEMUA FILE BERHASIL DIPROSES.'
        : '⚠️ IMPORT SELESAI, TETAPI ADA FILE YANG GAGAL.') +
      '</b><br>' +
      'File berhasil: ' + ringkasan.berhasil +
      ' &nbsp; | &nbsp; File gagal: ' + ringkasan.gagal +
      '<br><br>Silakan buka sheet <b>MUTASI</b> untuk melihat hasil.';

    document.getElementById('btn')
      .disabled = false;

    return;

  }

  const file =
    files[index];

  document.getElementById('status')
    .innerHTML =
    '⏳ Memproses ' +
    (index + 1) +
    ' / ' +
    files.length +
    '<br>' +
    file.name;

  const reader =
    new FileReader();

  reader.onload =
    function(e) {

      const data =
        e.target.result;

      const posisi =
        data.indexOf(',');

      const base64 =
        data.substring(
          posisi + 1
        );

      google.script.run
        .withSuccessHandler(
          function(result) {

            if (
              result &&
              result.success
            ) {

              window.importRingkasan.berhasil++;

              document.getElementById('status')
                .innerHTML +=
                '<br>✅ ' +
                String(result.message || 'Berhasil diproses.')
                  .replace(/\\n/g, '<br>');

            } else {

              window.importRingkasan.gagal++;

              document.getElementById('status')
                .innerHTML +=
                '<br>❌ ' +
                String(
                  result &&
                  result.message
                    ? result.message
                    : 'Gagal.'
                ).replace(/\\n/g, '<br>');

            }

            index++;

            setTimeout(
              prosesBerikutnya,
              50
            );

          }
        )
        .withFailureHandler(
          function(error) {

            window.importRingkasan.gagal++;

            document.getElementById('status')
              .innerHTML +=
              '<br>❌ ERROR: ' +
              (error && error.message
                ? error.message
                : 'Terjadi error pada server.');

            index++;

            setTimeout(
              prosesBerikutnya,
              50
            );

          }
        )
        .prosesFileMutasi(
          file.name,
          base64,
          bank
        );

    };

  reader.readAsDataURL(file);

}

</script>

</body>

</html>

`;

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      HtmlService
        .createHtmlOutput(html)
        .setWidth(520)
        .setHeight(650),
      '📥 Import Mutasi Bank'
    );

}


/************************************************************
 * ==========================================================
 * ALIAS IMPORT HTML BCA
 * ==========================================================
 *
 * Fungsi ini sengaja tetap ada untuk memperbaiki error:
 *
 * Fungsi skrip tidak ditemukan: importHTMLBCA
 *
 ************************************************************/

function importHTMLBCA() {

  importMutasiBank();

}


/************************************************************
 * ==========================================================
 * PROSES FILE MUTASI
 * ==========================================================
 ************************************************************/

function prosesFileMutasi(namaFile, base64Data, bank) {
  const laporan = {file:namaFile, bank:String(bank||'').toUpperCase(), jenis:'', kandidat:0, terbaca:0, valid:0, diLuarPeriode:0, ditulisMutasi:0, ditulisRaw:0, error:0, errorDetail:[], pesanError:''};
  try {
    const periode=getPeriodeAktif();
    if(!periode) throw new Error('Periode Gaji belum aktif.');
    if(!namaFile || !base64Data) throw new Error('Nama file atau data file kosong.');
    const bytes=Utilities.base64Decode(base64Data);
    if(!bytes || !bytes.length) throw new Error('File berhasil diterima tetapi isinya kosong.');
    const lower=String(namaFile).toLowerCase(); let hasil;
    if(lower.endsWith('.html')||lower.endsWith('.htm')) {
      if(laporan.bank!=='BCA') throw new Error('File HTML saat ini hanya diproses sebagai BCA.');
      const html=Utilities.newBlob(bytes,'text/html',namaFile).getDataAsString('UTF-8');
      if(!html||html.trim().length<20) throw new Error('HTML BCA kosong atau tidak dapat dibaca.');
      hasil=parseHTMLBCABaru(html,namaFile,periode.nama);
    } else if(lower.endsWith('.pdf')) {
      hasil=prosesPDFMutasi(bytes,namaFile,laporan.bank,periode.nama);
    } else throw new Error('Format file tidak didukung. Gunakan HTML/HTM untuk BCA atau PDF untuk BRI/BPD/MANDIRI.');
    laporan.jenis=hasil&&hasil.diagnostik&&hasil.diagnostik.jenis?String(hasil.diagnostik.jenis):''; laporan.kandidat=hasil&&hasil.diagnostik&&Number(hasil.diagnostik.kandidat)>=0?Number(hasil.diagnostik.kandidat):(hasil&&hasil.mutasi?hasil.mutasi.length:0);
    laporan.tanggalBulk=hasil&&hasil.diagnostik&&hasil.diagnostik.tanggalBulk?String(hasil.diagnostik.tanggalBulk):'';
    laporan.errorDetail=hasil&&hasil.diagnostik&&Array.isArray(hasil.diagnostik.errors)?hasil.diagnostik.errors:[];
    laporan.terbaca=hasil&&Array.isArray(hasil.mutasi)?hasil.mutasi.length:0; laporan.valid=laporan.terbaca; if(laporan.jenis && laporan.jenis.indexOf('BULK')===0) laporan.error=Math.max(0,laporan.kandidat-laporan.terbaca);
    if(!laporan.terbaca){laporan.error=Math.max(1,laporan.kandidat); throw new Error('Parser tidak menghasilkan transaksi valid. Kandidat terdeteksi: '+laporan.kandidat+'.');}
    const hasilSaring=saringHasilMenurutPeriode(hasil,periode);
    laporan.diLuarPeriode=Math.max(0,laporan.terbaca-hasilSaring.mutasi.length);
    if(!hasilSaring.mutasi.length) {
      // Bulk BPD memakai SATU tanggal header untuk semua penerima (lihat
      // saringHasilMenurutPeriode). Kalau tanggal itu sama sekali tidak
      // ditemukan di PDF (pola teksnya beda dari file yang biasa berhasil),
      // SEMUA baris otomatis tertolak walau transaksinya sendiri valid.
      // Bedakan pesan ini dari kasus "tanggal ketemu tapi memang di luar
      // periode", supaya jelas ini soal ekstraksi tanggal, bukan tanggal
      // yang salah.
      const jenisSekarang=hasil&&hasil.diagnostik&&hasil.diagnostik.jenis?String(hasil.diagnostik.jenis).toUpperCase():'';
      const tanggalBulkKetemu=hasil&&hasil.diagnostik?hasil.diagnostik.tanggalBulk:'';
      // Ditandai eksplisit (bukan ditebak dari isi pesan) supaya blok catch
      // di bawah tahu ini BUKAN kegagalan parsing sungguhan — parser
      // membaca semua kandidat dengan benar, cuma tidak ada tanggal yang
      // cocok untuk memutuskan masuk periode mana.
      laporan._bukanKegagalanParsing=true;
      if(jenisSekarang==='BULK BPD' && !tanggalBulkKetemu) {
        throw new Error(
          'Transaksi berhasil dibaca ('+laporan.terbaca+' baris), tetapi TANGGAL TRANSAKSI BULK BPD tidak ditemukan di PDF ini '+
          '(pola teks tanggalnya berbeda dari file BPD lain yang sudah berhasil). '+
          'Karena Bulk BPD memakai satu tanggal header untuk semua penerima, tanpa tanggal itu semua baris tidak bisa dicocokkan ke periode manapun. '+
          'Kirim PDF ini untuk diperiksa polanya, atau cek apakah PDF ini memang PDF Bulk BPD yang lengkap (bukan hasil potongan/cetak ulang sebagian).'
        );
      }
      throw new Error('Transaksi berhasil dibaca, tetapi 0 transaksi berada dalam periode aktif '+periode.nama+' ('+formatTanggal(periode.mulai)+' - '+formatTanggal(periode.selesai)+').');
    }
    const hasilTulis=tulisImportMutasi(hasilSaring);
    laporan.ditulisMutasi=hasilTulis.jumlahMutasi||0; laporan.ditulisRaw=hasilTulis.jumlahRaw||0;
    if(laporan.ditulisMutasi!==hasilSaring.mutasi.length) throw new Error('Verifikasi gagal: parser menghasilkan '+hasilSaring.mutasi.length+', tetapi MUTASI hanya menyimpan '+laporan.ditulisMutasi+'.');
    catatSumberMutasi(laporan.bank,namaFile,periode.nama,laporan.ditulisMutasi);
    return {success:true,laporan:laporan,message:formatLaporanImport(laporan)};
  } catch(error) {
    const pesanErrorAsli=error&&error.message?error.message:String(error);
    // Kasus "0 di luar periode" / "tanggal bulk BPD tidak ditemukan" BUKAN
    // kegagalan parsing — semua kandidat berhasil dibaca (kandidat===terbaca),
    // hanya saja tidak bisa dicocokkan ke periode. Jangan paksa Error/tidak
    // valid jadi minimal 1 untuk kasus ini, supaya laporan tidak menyesatkan
    // (seolah ada baris rusak padahal sebenarnya 0).
    const diLuarPeriodeSaja=laporan._bukanKegagalanParsing===true && laporan.kandidat===laporan.terbaca;
    laporan.error=diLuarPeriodeSaja
      ? Math.max(0,laporan.kandidat-laporan.terbaca)
      : Math.max(laporan.error, laporan.kandidat-laporan.terbaca, 1);
    laporan.pesanError=pesanErrorAsli;
    Logger.log('prosesFileMutasi ERROR: '+(error&&error.stack?error.stack:error));
    return {success:false,laporan:laporan,message:formatLaporanImport(laporan)+'\n❌ '+laporan.pesanError};
  }
}

function formatLaporanImport(laporan) {
  const MAKS_DETAIL=8;
  const detail=Array.isArray(laporan.errorDetail)?laporan.errorDetail:[];
  return laporan.file+' ['+laporan.bank+']'+
    (laporan.jenis ? '\n  Jenis mutasi        : '+laporan.jenis : '')+
    (laporan.tanggalBulk ? '\n  Tanggal bulk        : '+laporan.tanggalBulk : '')+
    '\n  Kandidat terdeteksi : '+laporan.kandidat+
    '\n  Transaksi terbaca   : '+laporan.terbaca+
    '\n  Valid               : '+laporan.valid+
    '\n  Di luar periode     : '+laporan.diLuarPeriode+
    '\n  Masuk MUTASI        : '+laporan.ditulisMutasi+
    '\n  Masuk RAW            : '+laporan.ditulisRaw+
    '\n  Error/tidak valid   : '+laporan.error+
    (detail.length
      ? '\n  Rincian kandidat gagal dibaca:\n    - '+
        detail.slice(0,MAKS_DETAIL).join('\n    - ')+
        (detail.length>MAKS_DETAIL ? '\n    ... dan '+(detail.length-MAKS_DETAIL)+' lainnya.' : '')
      : '');
}
/************************************************************
 * ==========================================================
 * PARSER HTML BCA
 * ==========================================================
 * Dikembalikan dari V5 asli. Parser ini sengaja dipertahankan
 * agar format HTML BCA yang sebelumnya sudah berhasil dibaca
 * tidak rusak oleh penambahan workflow V5 PLUS.
 ************************************************************/

function parseHTMLBCABaru(
  html,
  namaFile,
  periode
) {

  const noRekPT = cariHeaderBCA(html, 'No. rekening');
  const namaRekeningPT = cariHeaderBCA(html, 'Nama');
  const transaksi = ekstrakTransaksiBCA(html);

  const mutasi = [];
  const raw = [];

  transaksi.forEach(function(item, index) {
    const tanggal = parseTanggalAtauPend(item.tanggal);
    const nominal = parseNominalBCA(item.jumlah);

    if (!nominal || nominal <= 0) return;

    const id = buatID('BCA', namaFile, index);

    mutasi.push([
      id,
      tanggal,
      'BCA',
      noRekPT,
      namaRekeningPT,
      item.keterangan,
      nominal,
      namaFile,
      periode,
      ''
    ]);

    raw.push([
      id,
      'BCA',
      namaFile,
      item.tanggal,
      noRekPT,
      namaRekeningPT,
      item.keterangan,
      item.cabang,
      nominal,
      periode,
      /\bGAJI\b/i.test(item.keterangan)
        ? 'GAJI'
        : 'TRANSAKSI UMUM'
    ]);
  });

  return {
    mutasi: mutasi,
    raw: raw,
    diagnostik: {
      kandidat: transaksi.length,
      valid: mutasi.length
    }
  };
}


/************************************************************
 * ==========================================================
 * EKSTRAK TRANSAKSI BCA
 * ==========================================================
 ************************************************************/

function ekstrakTransaksiBCA(
  html
) {

  const hasil = [];

  const rowRegex =
    /<TR\b[^>]*>([\s\S]*?)<\/TR>/gi;

  let rowMatch;

  while (
    (
      rowMatch =
      rowRegex.exec(html)
    ) !== null
  ) {

    const rowHTML =
      rowMatch[1];

    const cells = [];

    const cellRegex =
      /<TD\b[^>]*>([\s\S]*?)<\/TD>/gi;

    let cellMatch;

    while (
      (
        cellMatch =
        cellRegex.exec(rowHTML)
      ) !== null
    ) {

      cells.push(
        htmlToText(
          cellMatch[1]
        )
      );

    }

    if (
      cells.length >= 4 &&
      (
        /^\d{2}\/\d{2}\/\d{4}$/
          .test(cells[0]) ||
        /^PEND$/i
          .test(cells[0])
      )
    ) {

      hasil.push({

        tanggal:
          cells[0],

        keterangan:
          cells[1],

        cabang:
          cells[2],

        jumlah:
          parseNominalBCA(
            cells[3]
          )

      });

    }

  }

  return hasil;

}


/************************************************************
 * ==========================================================
 * PDF MUTASI - PARSER BARU
 * ==========================================================
 *
 * PERBAIKAN UTAMA:
 * 1. BRI mengenali tanggal DD/MM/YY + JAM.
 * 2. BPD mengenali tanggal DD Mon YYYY.
 * 3. MANDIRI memakai parser fleksibel.
 * 4. PDF dicoba dibaca sebagai teks terlebih dahulu.
 * 5. Jika teks tidak cukup, dicoba OCR.
 * 6. Mendukung Drive API V2 maupun V3.
 * 7. Nominal debit/kredit tidak lagi diambil sekadar
 *    sebagai angka terbesar pada baris.
 * 8. Setiap transaksi dibuat dalam format standar MUTASI.
 *
 ************************************************************/


function prosesPDFMutasi(
  bytes,
  namaFile,
  bank,
  periode
) {

  if (!bytes || !bytes.length) {
    throw new Error('Isi PDF kosong.');
  }

  const hasilTeks = ambilTeksDariPDF(bytes, namaFile);
  const text = hasilTeks.text;

  if (!text || text.trim().length < 20) {
    throw new Error(
      'PDF berhasil diterima tetapi teks tidak berhasil diekstrak. ' +
      'Pastikan Advanced Drive Service aktif.'
    );
  }

  let hasil;
  const bankUpper = String(bank || '').toUpperCase().trim();

  const jenisBulk = deteksiJenisPDFBulk(text, bankUpper);

  if (jenisBulk === 'BRI') {
    hasil = parsePDFBulkBRI(text, namaFile, periode);
  } else if (jenisBulk === 'BPD') {
    hasil = parsePDFBulkBPD(text, namaFile, periode);
  } else if (jenisBulk === 'MANDIRI') {
    hasil = parsePDFBulkMandiri(text, namaFile, periode);
  } else if (bankUpper === 'BRI') {
    hasil = parsePDFBRI(text, namaFile, periode);
  } else if (bankUpper === 'BPD') {
    hasil = parsePDFBPD(text, namaFile, periode);
  } else if (bankUpper === 'MANDIRI') {
    hasil = parsePDFMandiri(text, namaFile, periode);
  } else {
    hasil = parsePDFMutasiGenerik(text, namaFile, bankUpper, periode);
  }

  if (!hasil || !hasil.mutasi || hasil.mutasi.length === 0) {
    throw new Error(
      'PDF terbaca, tetapi tidak ada transaksi yang berhasil dikenali.\n\n' +
      'Bank: ' + bankUpper + '\n' +
      'File: ' + namaFile + '\n' +
      'Parser: ' +
      (hasil && hasil.diagnostik && hasil.diagnostik.jenis
        ? hasil.diagnostik.jenis
        : bankUpper)
    );
  }

  return hasil;
}


/************************************************************
 * EKSTRAK TEKS PDF

 * Mendukung Drive API V2 dan V3.
 ************************************************************/

function ambilTeksDariPDF(bytes, namaFile) {
  const blob = Utilities.newBlob(bytes, 'application/pdf', namaFile);
  let errors = [];

  // ========================================================
  // 1) Advanced Drive Service V3
  // ========================================================
  if (typeof Drive !== 'undefined' && Drive.Files && typeof Drive.Files.create === 'function') {
    let tempId = null;
    try {
      const meta = {
        name: 'TEMP PDF TEXT - ' + namaFile,
        mimeType: 'application/vnd.google-apps.document'
      };
      const created = Drive.Files.create(meta, blob, {
        fields: 'id,name,mimeType',
        ocrLanguage: 'id'
      });
      tempId = created && created.id;
      if (tempId) {
        Utilities.sleep(800);
        const doc = DocumentApp.openById(tempId);
        const text = doc.getBody().getText();
        if (text && text.trim().length >= 20) {
          return {text:text, metode:'DRIVE V3 CONVERT'};
        }
        errors.push('Drive V3 berhasil membuat Google Doc tetapi teks kosong.');
      }
    } catch(e) {
      errors.push('Drive V3: ' + (e && e.message ? e.message : String(e)));
    } finally {
      if (tempId) {
        try { Drive.Files.remove(tempId); } catch(ignore) {}
      }
    }
  } else {
    errors.push('Advanced Drive Service V3 belum aktif.');
  }

  // ========================================================
  // 2) Advanced Drive Service V2 (jika tersedia)
  // ========================================================
  if (typeof Drive !== 'undefined' && Drive.Files && typeof Drive.Files.insert === 'function') {
    let tempId = null;
    try {
      const created = Drive.Files.insert(
        {title:'TEMP PDF TEXT - ' + namaFile, mimeType:'application/vnd.google-apps.document'},
        blob,
        {convert:true, ocr:false}
      );
      tempId = created && created.id;
      if (tempId) {
        Utilities.sleep(800);
        const text = DocumentApp.openById(tempId).getBody().getText();
        if (text && text.trim().length >= 20) {
          return {text:text, metode:'DRIVE V2 CONVERT'};
        }
        errors.push('Drive V2 berhasil membuat Google Doc tetapi teks kosong.');
      }
    } catch(e) {
      errors.push('Drive V2: ' + (e && e.message ? e.message : String(e)));
    } finally {
      if (tempId) {
        try { Drive.Files.remove(tempId); } catch(ignore) {}
      }
    }
  }

  // ========================================================
  // 3) REST Drive API v3 langsung via OAuth token.
  //    Ini fallback jika Advanced Drive Service tidak tersedia.
  // ========================================================
  let restId = null;
  try {
    const token = ScriptApp.getOAuthToken();
    const boundary = '----AppsScriptPDF' + new Date().getTime();
    const metadata = JSON.stringify({
      name: 'TEMP PDF TEXT REST - ' + namaFile,
      mimeType: 'application/vnd.google-apps.document'
    });
    const blobBytes = bytes;
    const prefix =
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: application/pdf\r\n\r\n';
    const suffix = '\r\n--' + boundary + '--';
    const prefixBytes = Utilities.newBlob(prefix).getBytes();
    const suffixBytes = Utilities.newBlob(suffix).getBytes();
    const body = prefixBytes.concat(blobBytes).concat(suffixBytes);

    const response = UrlFetchApp.fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType',
      {
        method:'post',
        contentType:'multipart/related; boundary=' + boundary,
        headers:{Authorization:'Bearer ' + token},
        payload:body,
        muteHttpExceptions:true
      }
    );
    const code = response.getResponseCode();
    const txt = response.getContentText();
    if (code >= 200 && code < 300) {
      const obj = JSON.parse(txt);
      restId = obj.id;
      Utilities.sleep(1200);

      const exportResponse = UrlFetchApp.fetch(
        'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(restId) + '/export?mimeType=text/plain',
        {
          method:'get',
          headers:{Authorization:'Bearer ' + token},
          muteHttpExceptions:true
        }
      );
      const exportCode = exportResponse.getResponseCode();
      const text = exportResponse.getContentText();
      if (exportCode >= 200 && exportCode < 300 && text && text.trim().length >= 20) {
        return {text:text, metode:'DRIVE REST V3'};
      }
      errors.push('REST Drive: file berhasil dibuat tetapi export teks gagal (' + exportCode + ').');
    } else {
      errors.push('REST Drive create gagal HTTP ' + code + ': ' + txt.substring(0,500));
    }
  } catch(e) {
    errors.push('REST Drive: ' + (e && e.message ? e.message : String(e)));
  } finally {
    if (restId) {
      try {
        const token = ScriptApp.getOAuthToken();
        UrlFetchApp.fetch(
          'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(restId),
          {
            method:'delete',
            headers:{Authorization:'Bearer ' + token},
            muteHttpExceptions:true
          }
        );
      } catch(ignore) {}
    }
  }

  throw new Error(
    'PDF gagal dibaca sebelum parser bank dijalankan.\n\n' +
    errors.join('\n') +
    '\n\nJika REST Drive juga gagal, pastikan Apps Script memiliki izin Drive dan layanan Drive/API yang diperlukan.'
  );
}


function tesBacaPDFDrive() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('🧪 Tes Baca PDF', 'Masukkan ID file PDF di Google Drive untuk dites:', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const id = String(r.getResponseText() || '').trim();
  if (!id) { ui.alert('ID file kosong.'); return; }
  try {
    const file = DriveApp.getFileById(id);
    const text = ambilTeksDariPDF(file.getBlob().getBytes(), file.getName());
    ui.alert('✅ PDF BERHASIL DIBACA\n\nMetode: ' + text.metode + '\nPanjang teks: ' + text.text.length + ' karakter.');
  } catch(e) {
    ui.alert('❌ PDF GAGAL DIBACA\n\n' + (e && e.message ? e.message : String(e)));
  }
}


/************************************************************
 * PARSER BRI
 *
 * Contoh format:
 * 24/07/26 15:26:46  GAJI ... CMSPYRL 119,043,095.00 0.00 saldo
 *
 * Deskripsi dapat terpotong menjadi beberapa baris.
 ************************************************************/


/************************************************************
 * ==========================================================
 * PARSER BULK BANK
 * ==========================================================
 *
 * BULK DIDUKUNG:
 *   BRI     -> BUKTI TRANSAKSI / TRANSFER MASSAL
 *   BPD     -> TRANSFER BULK DETAIL
 *   MANDIRI -> TRANSACTION STATUS / TRANSACTION RECORD
 *
 * Prinsip:
 *   1 penerima = 1 baris MUTASI.
 *
 * Mandiri Bulk:
 *   Dokumen contoh tidak menyediakan tanggal transfer per
 *   penerima. Sistem TIDAK menggunakan tanggal cetak/report.
 *   Tanggal MUTASI dibiarkan kosong dan transaksi tetap dapat
 *   masuk periode bila remark gaji cocok dengan periode aktif.
 ************************************************************/

function normalisasiTeksBulkPDF(text) {
  return String(text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u00AD\uFFFE]/g, '')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ambilTanggalBulkBRI(text) {
  const m = String(text || '').match(
    /Tanggal\s+Transaksi\s+(\d{2}\/\d{2}\/\d{4})\s+\d{1,2}:\d{2}:\d{2}/i
  );
  return m ? parseTanggalFlexible(m[1]) : null;
}

function ambilTanggalBulkBPD(text) {
  /*
   * Format Bulk BPD dapat berubah sedikit tergantung hasil ekstraksi PDF.
   * Contoh yang pernah muncul:
   *   ID : B1785231538219033 - 28-Jul-2026 16:38:58
   *   ID : B1785231538219033 28-Jul-2026 16:38:58
   *   Tanggal : 28-Jul-2026 16:38:58
   *   28-Jul-2026 16:38:58
   *
   * Jangan hanya bergantung pada satu bentuk regex.
   */
  const s = String(text || '');

  let m = s.match(
    /\bID\s*:\s*[A-Z0-9-]+\s*-?\s*(\d{1,2}-[A-Za-z]{3,9}-\d{4})\s+\d{1,2}:\d{2}:\d{2}/i
  );
  if (m) return parseTanggalFlexible(m[1]);

  m = s.match(
    /\b(?:Tanggal|Tanggal\s+Transaksi|Waktu\s+Transaksi)\s*[:\-]?\s*(\d{1,2}-[A-Za-z]{3,9}-\d{4})(?:\s+\d{1,2}:\d{2}:\d{2})?/i
  );
  if (m) return parseTanggalFlexible(m[1]);

  m = s.match(
    /\b(\d{1,2}-[A-Za-z]{3,9}-\d{4})\s+\d{1,2}:\d{2}:\d{2}\b/i
  );
  if (m) return parseTanggalFlexible(m[1]);

  /*
   * Fallback terakhir: tanggal bertuliskan 28-Jul-2026.
   * Ini sengaja hanya menerima nama bulan, bukan angka tanggal
   * generik, agar tidak salah mengambil nomor rekening/referensi.
   */
  m = s.match(
    /\b(\d{1,2}-[A-Za-z]{3,9}-\d{4})\b/i
  );
  return m ? parseTanggalFlexible(m[1]) : null;
}

function parsePDFBulkBRI(text, namaFile, periode) {
  const clean = normalisasiTeksBulkPDF(text);
  const tanggal = ambilTanggalBulkBRI(clean);

  const idMatch = clean.match(/ID\s+Transaksi\s+([A-Z0-9-]+)/i);
  const idBulk = idMatch ? idMatch[1] : '';

  const sumberMatch = clean.match(
    /Rekening\s+Sumber\s+(.+?)\s+Total\s+Rekening\s+Tujuan/i
  );
  const sumber = sumberMatch ? sumberMatch[1].trim() : '';

  const catatanMatch = clean.match(
    /Catatan\s+(.+?)\s+Waktu\s+Transfer/i
  );
  const catatan = catatanMatch
    ? catatanMatch[1].trim()
    : 'TRANSFER MASSAL BRI';

  const totalTargetMatch = clean.match(
    /Total\s+Rekening\s+Tujuan\s+(\d+)\s+Rekening/i
  );
  const expectedSuccessMatch = clean.match(
    /Sukses\s*:\s*(\d+)\s+Rekening/i
  );
  const expected = totalTargetMatch
    ? Number(totalTargetMatch[1])
    : (expectedSuccessMatch ? Number(expectedSuccessMatch[1]) : 0);

  const mutasi = [];
  const raw = [];
  const errors = [];
  let nomor = 0;

  /*
   * Karena PDF BRI Bulk menggunakan layout kolom, posisi
   * "BRI - 0002", nomor rekening, nama, nominal dan Status
   * dapat berpindah baris. Parser bekerja berdasarkan blok
   * nomor rekening tujuan.
   */
  const re = /(?:^|\s)(\d{8,})\s*-\s*([\s\S]*?)(?=\s+\d{8,}\s*-\s*|\s+Silakan\s+simpan|\s+Date\s+Printed|$)/gi;

  let m;
  while ((m = re.exec(clean)) !== null) {
    const rekening = String(m[1] || '').trim();
    const blok = String(m[2] || '');

    // Nominal terkadang terpecah oleh spasi akibat ekstraksi PDF,
    // mis. "Rp3. 147 .680" seharusnya dibaca 3.147.680.
    const amountMatch = blok.match(/Rp\.?\s*(\d[\d.,\s]*\d|\d)/i);
    if (!amountMatch) {
      errors.push('Rekening ' + rekening + ': nominal "Rp..." tidak ditemukan pada blok ini.');
      continue;
    }

    const nominal = parseNominalUmum(amountMatch[1].replace(/\s+/g, ''));
    if (!nominal || nominal <= 0) {
      errors.push('Rekening ' + rekening + ': nominal terbaca tetapi tidak valid ("' + amountMatch[1] + '").');
      continue;
    }

    const sebelumNominal = blok.substring(0, amountMatch.index);
    const sesudahNominal = blok.substring(
      amountMatch.index + amountMatch[0].length
    );

    /*
     * Nama utama berada sebelum nominal. Hapus label kolom bank.
     */
    let nama = sebelumNominal
      .replace(/\bBRI\s*-\s*0002\b/ig, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    /*
     * Karena nama dapat terpotong ke baris setelah nominal,
     * ambil juga teks setelah "Sukses" sampai sebelum rekening
     * berikutnya. Buang label bank/status.
     */
    const lanjutan = sesudahNominal
      .replace(/^\s*-\s*Sukses\b/i, '')
      .replace(/\bBRI\s*-\s*0002\b/ig, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (lanjutan) {
      nama = (nama + ' ' + lanjutan).trim();
    }

    /*
     * Nama sering terpotong PDF di tengah kata karena word-wrap,
     * mis. "MUHAM- MAD IRWAN" seharusnya "MUHAMMAD IRWAN". Hanya
     * gabungkan tanda hubung yang MENEMPEL ke huruf sebelumnya
     * (tanpa spasi) lalu diikuti spasi + huruf, supaya pemisah
     * ganda yang memang disengaja (" - ") tidak ikut disatukan.
     */
    nama = nama
      .replace(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2')
      .replace(/^\s*-\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!nama) {
      errors.push('Rekening ' + rekening + ': nominal Rp' + nominal.toLocaleString('id-ID') + ' ditemukan tetapi nama penerima kosong.');
      continue;
    }

    /*
     * Jika sisa blok hanya noise, jangan dimasukkan.
     */
    nama = nama
      .replace(/\bSukses\b/ig, '')
      .replace(/\s+/g, ' ')
      .trim();

    const keterangan =
      '[BULK BRI] ' +
      catatan +
      ' | ' +
      nama;

    const id = buatID('BRI-BULK', namaFile, nomor++);

    mutasi.push([
      id,
      tanggal,
      'BRI',
      sumber,
      '',
      keterangan,
      nominal,
      namaFile,
      periode,
      ''
    ]);

    raw.push([
      id,
      'BRI',
      namaFile,
      tanggal || '',
      sumber,
      '',
      'BULK ID ' + idBulk +
        ' | REK TUJUAN ' + rekening +
        ' | ' + keterangan,
      '',
      nominal,
      periode,
      'GAJI BULK'
    ]);
  }

  return {
    mutasi: mutasi,
    raw: raw,
    diagnostik: {
      kandidat: expected || mutasi.length,
      valid: mutasi.length,
      jenis: 'BULK BRI',
      idBulk: idBulk,
      errors: errors
    }
  };
}

function parsePDFBulkBPD(text, namaFile, periode) {
  const clean = normalisasiTeksBulkPDF(text);

  const tanggal = ambilTanggalBulkBPD(clean);

  const idMatch = clean.match(/\bID\s*:\s*([A-Z0-9-]+)\s*-/i);
  const idBulk = idMatch ? idMatch[1] : '';

  const refMatch = clean.match(/Referensi\s+Transaksi\s*:\s*([A-Z0-9-]+)/i);
  const refBulk = refMatch ? refMatch[1] : '';

  const sumberMatch = clean.match(
    /No\s+Rekening\s+Sumber\s*:\s*(.+?)\s+Jumlah\s*:/i
  );
  const sumber = sumberMatch ? sumberMatch[1].trim() : '';

  const jumlahMatch = clean.match(/\bJumlah\s*:\s*(\d+)/i);
  const expected = jumlahMatch ? Number(jumlahMatch[1]) : 0;

  const mutasi = [];
  const raw = [];
  const errors = [];
  let nomor = 0;

  /*
   * Karena layout PDF BPD menaruh "JATENG" kadang pada baris
   * setelah nominal, parser bekerja berdasarkan blok nomor rekening.
   */
  const re = /(?:^|\s)(\d{8,})\s+([\s\S]*?)(?=\s+\d{8,}\s+|\s+No\b|$)/gi;

  let m;
  while ((m = re.exec(clean)) !== null) {
    const rekening = String(m[1] || '').trim();
    const blok = String(m[2] || '');

    /*
     * Kode referensi per baris TIDAK selalu berprefix "BLQ" — beberapa
     * bulk BPD (mis. hasil transfer dari user/cabang lain) memakai
     * prefix lain seperti "BLWZ" (contoh: BLWZ743550). Prefixnya boleh
     * apa saja asal berupa huruf diikuti langsung angka tanpa spasi,
     * supaya tidak terikat ke satu prefix tertentu.
     */
    const refMatchDetail = blok.match(/\b([A-Z]{2,8}\d{4,})\b/i);
    const ref = refMatchDetail ? refMatchDetail[1] : '';

    // Nominal terkadang terpecah oleh spasi akibat ekstraksi PDF,
    // mis. "27 .147 .680" seharusnya dibaca 27.147.680.
    const amountMatch = blok.match(/(\d[\d.,\s]*\d|\d)\s+Success/i);
    if (!amountMatch) {
      errors.push('Rekening ' + rekening + ': nominal diikuti "Success" tidak ditemukan pada blok ini.');
      continue;
    }

    const nominal = parseNominalUmum(amountMatch[1].replace(/\s+/g, ''));
    if (!nominal || nominal <= 0) {
      errors.push('Rekening ' + rekening + ': nominal terbaca tetapi tidak valid ("' + amountMatch[1] + '").');
      continue;
    }

    const posAmount = amountMatch.index;

    const sebelumAmount = blok.substring(0, posAmount);
    const sesudahAmount = blok.substring(
      posAmount + amountMatch[0].length
    );

    const bankPos = sebelumAmount.search(/\bBANK\b/i);
    if (bankPos < 0 || !ref) {
      errors.push('Rekening ' + rekening + ': label "BANK" atau kode referensi transaksi tidak ditemukan pada blok ini.');
      continue;
    }

    let nama = sebelumAmount
      .substring(0, bankPos)
      .replace(/^\s+/, '')
      .trim();

    /*
     * Bagian setelah BANK berisi referensi dan keterangan. Contoh layout:
     * DANY IRFAN BANK BLQ6038580 GAJI JULI 26 2.324.902 Success JATENG KEC PWJ
     * Variasi lain menaruh nama cabang bank (mis. "JATENG") tepat
     * setelah label BANK, SEBELUM kode referensinya:
     * WAHYU AWAN BANK JATENG BLWZ743550 GAJI AGS 26 SEKDA PROV DRIVER
     * Kode referensi dicari dengan pola umum (huruf+angka), bukan
     * prefix "BLQ" saja, supaya kedua variasi ini tetap terbaca.
     */
    const setelahBank = sebelumAmount.substring(bankPos);

    const refPos = setelahBank.search(/\b[A-Z]{2,8}\d{4,}\b/i);
    let keteranganBulk = '';

    if (refPos >= 0) {
      keteranganBulk =
        setelahBank
          .substring(refPos + ref.length)
          .replace(/\s+/g, ' ')
          .trim();
    }

    /*
     * JATENG sering berada setelah "Success" pada ekstraksi PDF.
     * Buang label bank dan gabungkan sisa keterangan.
     */
    let lanjutan = sesudahAmount
      .replace(/^\s+/, '')
      .replace(/^JATENG\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (lanjutan) {
      keteranganBulk = (keteranganBulk + ' ' + lanjutan)
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Nomor urut baris berikutnya kadang ikut terbawa ke blok sebelumnya.
    keteranganBulk = keteranganBulk
      .replace(/\s+\d{1,2}\s*$/g, '')
      .trim();

    // Baris TERAKHIR pada tabel tidak punya nomor baris berikutnya sebagai
    // batas, jadi footer tabel HTML ("Showing 1 to 24 of 24 entries...")
    // kadang ikut terbawa ke keterangan baris itu. Buang footer ini secara
    // eksplisit supaya keterangan baris terakhir tetap bersih.
    keteranganBulk = keteranganBulk
      .replace(/\s*Showing\s+\d+\s+to\s+\d+\s+of\s+\d+\s+entries[\s\S]*$/i, '')
      .trim();

    /*
     * Nama sering terpotong PDF di tengah kata karena word-wrap,
     * mis. "AMBRO- SIUS SIJABAT" seharusnya "AMBROSIUS SIJABAT".
     */
    nama = nama
      .replace(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2')
      .replace(/\s+/g, ' ')
      .trim();

    if (!nama) {
      errors.push('Rekening ' + rekening + ': nominal Rp' + nominal.toLocaleString('id-ID') + ' ditemukan tetapi nama penerima kosong.');
      continue;
    }

    const keterangan =
      '[BULK BPD] ' +
      nama +
      ' | ' +
      keteranganBulk;

    const id = buatID('BPD-BULK', namaFile, nomor++);

    mutasi.push([
      id,
      tanggal,
      'BPD',
      sumber,
      '',
      keterangan,
      nominal,
      namaFile,
      periode,
      ''
    ]);

    raw.push([
      id,
      'BPD',
      namaFile,
      tanggal || '',
      sumber,
      '',
      'BULK ID ' + idBulk +
        ' | REF BULK ' + refBulk +
        ' | REF DETAIL ' + ref +
        ' | REK TUJUAN ' + rekening +
        ' | ' + keterangan,
      '',
      nominal,
      periode,
      'GAJI BULK'
    ]);
  }

  return {
    mutasi: mutasi,
    raw: raw,
    diagnostik: {
      kandidat: expected || mutasi.length,
      valid: mutasi.length,
      jenis: 'BULK BPD',
      tanggalBulk: tanggal ? formatTanggal(tanggal) : '',
      tanggalBulkDate: tanggal || null,
      idBulk: idBulk,
      refBulk: refBulk,
      errors: errors
    }
  };
}

function parsePDFBulkMandiri(text, namaFile, periode) {
  /*
   * BULK MANDIRI - FIX17 MULTI-FORMAT
   *
   * Prinsip parser:
   * 1. "Inhouse Transfer" = awal kandidat transaksi.
   * 2. "Success" = penutup transaksi.
   * 3. "IDR ..." = jangkar nominal.
   * 4. Nama tidak dijadikan syarat pemisah blok karena PDF Mandiri
   *    dapat memecah nama menjadi beberapa baris / menggandakannya.
   * 5. Semua angka di area antara header bank dan nominal dianggap
   *    metadata rekening/ID dan dibuang dari nama.
   *
   * Ini membuat format seperti:
   *   MAHDALENA MAHDALENA
   *   PRIDA DWI WIDIANTO / PRIDA DWI WIDIANTO
   *   WENDI SIRITOITET / WENDI SIRITOITET
   *   BAMBANG EKO IRWANTO / BAMBANG EKO IRWANTO
   * tetap menjadi 1 transaksi masing-masing.
   */

  const original = String(text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u00AD\uFFFE]/g, '')
    .replace(/\r/g, '\n');

  const source = original
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const starts = [];
  const reStart = /\bInhouse\s+Transfer\b/ig;
  let sm;

  while ((sm = reStart.exec(source)) !== null) {
    starts.push(sm.index);
  }

  const mutasi = [];
  const raw = [];
  const errors = [];
  const remarksAsli = [];
  const lokasiDariNamaFile = ekstrakLokasiDariNamaFileBulkMandiri_(namaFile);

  function cleanName(value) {
    let s = String(value || '')
      .replace(/\s+/g, ' ')
      .trim();

    // Buang nomor/ID yang ikut terbawa.
    s = s.replace(/\b\d{3,}\b/g, ' ');

    // Buang label teknis yang kadang muncul di antara rekening dan nama.
    s = s.replace(
      /\b(?:Account\s+Name|Beneficiary|Name|Bank|PT\.?\s*Bank\s+Mandiri\s+Tbk\.?|Inhouse|Transfer)\b/ig,
      ' '
    );

    // Nama sering terpotong PDF di tengah kata karena word-wrap,
    // mis. "MUHAM- MAD IRWAN" seharusnya "MUHAMMAD IRWAN". Gabungkan
    // dulu SEBELUM tanda hubung lain dibuang, supaya tidak ikut
    // terpisah menjadi dua token yang salah.
    s = s.replace(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2');

    // Buang tanda/artefak ekstraksi PDF lain (termasuk pemisah " - ").
    s = s.replace(/[-|:]+/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();

    return s;
  }

  function cleanRemark(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/^\s*[-:]+\s*/, '')
      .trim();
  }

  for (let i = 0; i < starts.length; i++) {
    const a = starts[i];

    /*
     * Jangan langsung memotong ke Inhouse berikutnya.
     * Ambil sampai "Success" pertama setelah kandidat.
     * Ini lebih tahan terhadap variasi ekstraksi PDF.
     */
    const nextStart = (i + 1 < starts.length)
      ? starts[i + 1]
      : source.length;

    const successPos = source.search(
      new RegExp('\\bSuccess\\b', 'i')
    );

    // search() dari awal tidak bisa dipakai; cari Success relatif ke a.
    const afterStart = source.slice(a);
    const successMatch = afterStart.match(/\bSuccess\b/i);

    let z;
    if (successMatch) {
      z = a + successMatch.index + successMatch[0].length;
      // Jangan melewati awal transaksi berikutnya.
      if (z > nextStart) z = nextStart;
    } else {
      z = nextStart;
    }

    const block = source.slice(a, z).trim();

    try {
      if (!/\bInhouse\s+Transfer\b/i.test(block)) {
        errors.push('Blok ' + (i + 1) + ': Inhouse Transfer tidak ditemukan');
        continue;
      }

      /*
       * "Success" TIDAK LAGI menjadi syarat wajib blok dianggap valid.
       * Kata ini sebelumnya harus ditemukan atau seluruh blok ditolak,
       * padahal "Success" sama sekali tidak dipakai untuk mengambil
       * nominal (jangkarnya "IDR ...") maupun nama (diambil dari teks
       * sebelum IDR). Beberapa hasil ekstraksi PDF (terutama lewat
       * konversi Google Drive, yang bisa berbeda dari hasil ekstraksi
       * teks biasa) memisahkan/menghilangkan kata "Success" pada
       * sebagian baris — terutama baris yang kebetulan terpotong di
       * batas halaman seperti contoh nyata:
       *   ... GAJI AGS 26 ARTOS [Page 1 of 2] [header tabel terulang] MA
       *       - OUR Immediate - Success
       * Padahal blok itu sendiri tetap lengkap dan valid untuk dibaca.
       * Batas akhir blok (variabel z di atas) sudah punya fallback ke
       * awal transaksi berikutnya kalau "Success" tidak ketemu, jadi
       * tidak perlu menolak blok ini sama sekali — cukup lanjutkan,
       * validasi IDR + nama di bawah tetap jadi penjaga blok sampah.
       */

      /*
       * Variasi header Mandiri:
       * PT. Bank Mandiri Tbk.
       * PT Bank Mandiri Tbk.
       * PT. Bank Mandiri Tbk
       */
      const bankMatch = block.match(
        /PT\.?\s*Bank\s+Mandiri\s+Tbk\.?/i
      );

      /* FIX18: header bank tidak lagi menjadi syarat valid.
       * Sebagian hasil konversi PDF memecah/menghilangkan header.
       * Jangkar wajib: Inhouse Transfer + IDR + Success. */
      const bankEnd = bankMatch
        ? bankMatch.index + bankMatch[0].length
        : a;

      /*
       * Nominal menjadi jangkar utama.
       * Mendukung:
       * IDR 3,733,960.00
       * IDR 3,733,960. 00
       * IDR 3,733,960
       */
      const nominalMatch = block.match(
        /\bIDR\s*([0-9][0-9.,]*)(?:\s*\.\s*00|\s*00)?/i
      );

      if (!nominalMatch) {
        errors.push('Blok ' + (i + 1) + ': nominal IDR tidak ditemukan');
        continue;
      }

      const nominal = parseNominalUmum(
        String(nominalMatch[1] || '').replace(/[.,]+$/, '')
      );

      if (!nominal || nominal <= 0) {
        errors.push('Blok ' + (i + 1) + ': nominal tidak valid');
        continue;
      }

      const beforeIdr = block.slice(
        bankEnd,
        nominalMatch.index
      ).trim();

      /*
       * Ambil seluruh token angka sebelum nominal.
       * Pada Mandiri biasanya ada:
       *   ID transaksi
       *   ID transaksi kedua
       *   rekening tujuan bagian 1
       *   rekening tujuan bagian 2
       *
       * Kita tidak mengunci jumlahnya karena tiap PDF bisa berbeda.
       */
      const numberTokens = [];
      const numberRe = /\b\d{3,}\b/g;
      let nm;

      while ((nm = numberRe.exec(beforeIdr)) !== null) {
        numberTokens.push({
          value: nm[0],
          index: nm.index,
          end: numberRe.lastIndex
        });
      }

      /*
       * Rekening tujuan paling aman diambil dari dua token angka
       * terakhir sebelum nama/nominal. Jika formatnya hanya satu token,
       * tetap gunakan token tersebut.
       */
      let rekening = '';
      if (numberTokens.length >= 2) {
        rekening =
          numberTokens[numberTokens.length - 2].value +
          numberTokens[numberTokens.length - 1].value;
      } else if (numberTokens.length === 1) {
        rekening = numberTokens[0].value;
      }

      /*
       * Nama:
       * Buang semua angka dari area setelah header bank.
       * Yang tersisa adalah account name uploaded/host.
       */
      let nama = cleanName(beforeIdr);

      /*
       * Jika PDF menggandakan nama:
       * "PRIDA DWI WIDIANTO PRIDA DWI WIDIANTO"
       * jangan perlu dipaksa menjadi satu nama. Tetapi kita rapikan
       * spasi agar proses pencocokan nama berikutnya lebih mudah.
       */
      nama = nama
        .replace(/\s+/g, ' ')
        .trim();

      /*
       * Jika nama masih kosong, coba ambil bagian sebelum token angka
       * pertama dari area tersebut sebagai fallback.
       */
      if (!nama && beforeIdr) {
        const firstNum = beforeIdr.search(/\b\d{3,}\b/);
        if (firstNum > 0) {
          nama = cleanName(beforeIdr.slice(0, firstNum));
        }
      }

      if (!nama) {
        errors.push('Blok ' + (i + 1) + ': nama penerima tidak ditemukan');
        continue;
      }

      /*
       * Remark berada setelah nominal sampai status Success.
       * Hilangkan bagian routing OUR Immediate jika ada.
       */
      const afterIdr = block.slice(
        nominalMatch.index + nominalMatch[0].length
      );

      let remark = afterIdr
        .replace(/\bOUR\s+Immediate\b/ig, ' ')
        .replace(/\bSuccess\b.*$/i, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      remark = cleanRemark(remark);

      /*
       * Kadang ada "00" pecahan rupiah tepat setelah nominal.
       */
      remark = remark.replace(/^\s*00\s*/, '').trim();

      // Remark ASLI (dari isi PDF) tetap disimpan untuk pencocokan periode
      // di bawah — supaya perubahan tampilan KETERANGAN (lihat lokasiTampilan)
      // tidak ikut mengubah cara sistem menentukan transaksi ini termasuk
      // periode aktif atau tidak.
      remarksAsli.push(remark);

      /*
       * KETERANGAN yang DITAMPILKAN di sheet MUTASI memakai LOKASI dari
       * NAMA FILE (bukan remark mentah hasil ekstraksi PDF). Nama file
       * selalu satu teks utuh per file ("GAJI 08 UNZA VITALIS", "HOTEL
       * ARTOS MAGELANG", dst) sehingga jauh lebih stabil dibanding remark
       * yang bisa berulang/rusak kalau satu blok PDF kebetulan menggabung
       * beberapa transaksi (lihat catatan di ekstrakLokasiDariNamaFileBulkMandiri_).
       * Kalau nama file tidak menghasilkan apa pun (kasus sangat jarang),
       * baru jatuh ke remark asli supaya keterangan tidak pernah kosong.
       */
      const lokasiTampilan = lokasiDariNamaFile || remark;

      const keterangan =
        '[BULK MANDIRI] ' +
        nama +
        (lokasiTampilan ? ' | ' + lokasiTampilan : '');

      const id = buatID('MANDIRI-BULK', namaFile, i);

      /*
       * Tanggal individual tidak dipaksakan dari timestamp laporan.
       * saringHasilMenurutPeriode() akan memakai remark
       * "Gaji Juli 26 ..." untuk menentukan apakah transaksi masuk
       * periode aktif.
       */
      mutasi.push([
        id,
        '',
        'MANDIRI',
        '',
        '',
        keterangan,
        nominal,
        namaFile,
        periode,
        ''
      ]);

      raw.push([
        id,
        'MANDIRI',
        namaFile,
        '',
        rekening,
        '',
        keterangan,
        '',
        nominal,
        periode,
        'GAJI BULK'
      ]);

    } catch (err) {
      errors.push(
        'Blok ' + (i + 1) + ': ' +
        (err && err.message ? err.message : String(err))
      );
    }
  }

  /* FIX18: untuk Bulk Mandiri tanpa tanggal individual, validasi periode
   * dilakukan dari remark ASLI (bukan KETERANGAN yang ditampilkan di
   * sheet, yang sejak perbaikan lokasi-dari-nama-file bisa berbeda isi).
   * Jika remark hasil ekstraksi rusak/terpotong, fallback ke nama file,
   * mis. "BPN PROV KALTENG JULI.pdf". */
  const semuaKeterangan = remarksAsli.join(' ');

  const bulkPeriodeCocok =
    periodeCocokDenganKeterangan(semuaKeterangan, {nama: periode}) ||
    periodeCocokDenganNamaFileBulkMandiri(namaFile, {nama: periode});

  return {
    mutasi: mutasi,
    raw: raw,
    diagnostik: {
      kandidat: starts.length,
      valid: mutasi.length,
      jenis: 'BULK MANDIRI',
      tanggalBulk: '',
      tanggalBulkDate: null,
      bulkPeriodeCocok: bulkPeriodeCocok,
      catatanTanggal:
        'PDF Mandiri tidak memuat tanggal transfer individual; timestamp laporan tidak digunakan. Periode bulk dicocokkan melalui remark dan fallback nama file.',
      errors: errors
    }
  };
}

/*
 * Nama file Bulk Mandiri biasanya diawali judul laporan bank yang selalu
 * sama ("Transaction Status Multiple Transfer by File Upload - ..." atau
 * variasi "Transaction Record ..."), diikuti nama lokasi/perusahaan yang
 * sebenarnya ingin ditampilkan di KETERANGAN mutasi, mis.:
 *   "Transaction Status Multiple Transfer by File Upload - HOTEL ARTOS MAGELANG.pdf"
 *   -> "HOTEL ARTOS MAGELANG"
 *   "Transaction Status Multiple Transfer by File Upload - GAJI_08_UNZA_VITALIS.pdf"
 *   -> "GAJI 08 UNZA VITALIS"
 * Judul laporan itu sendiri tidak informatif untuk KETERANGAN (sama di
 * semua file), jadi dibuang; sisanya dirapikan (underscore -> spasi).
 */
function ekstrakLokasiDariNamaFileBulkMandiri_(namaFile) {
  let s = String(namaFile || '').trim();
  s = s.replace(/\.pdf$/i, '');
  s = s.replace(
    /^Transaction\s+(?:Status|Record)(?:\s+Multiple\s+Transfer)?(?:\s+by\s+File\s+Upload)?\s*-\s*/i,
    ''
  );
  s = s.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

function periodeCocokDenganNamaFileBulkMandiri(namaFile, periode) {
  const teks = normalisasiTeks(String(namaFile || ''));
  const namaPeriode = normalisasiTeks(periode && periode.nama ? periode.nama : '');
  const bulan = {
    JANUARI: 0, JAN: 0, FEBRUARI: 1, FEB: 1, MARET: 2, MAR: 2,
    APRIL: 3, APR: 3, MEI: 4, MAY: 4, JUNI: 5, JUN: 5,
    JULI: 6, JUL: 6, AGUSTUS: 7, AGU: 7, AGS: 7, AUG: 7,
    SEPTEMBER: 8, SEP: 8, OKTOBER: 9, OKT: 9, OCT: 9,
    NOVEMBER: 10, NOV: 10, DESEMBER: 11, DES: 11, DEC: 11
  };
  let bulanFile = null;
  Object.keys(bulan).some(function(k) {
    if (new RegExp('\\b' + k + '\\b').test(teks)) { bulanFile = bulan[k]; return true; }
    return false;
  });
  let bulanPeriode = null;
  Object.keys(bulan).some(function(k) {
    if (new RegExp('\\b' + k + '\\b').test(namaPeriode)) { bulanPeriode = bulan[k]; return true; }
    return false;
  });
  if (bulanFile === null || bulanPeriode === null || bulanFile !== bulanPeriode) return false;
  const yp = namaPeriode.match(/\b20\d{2}\b/);
  const yf = teks.match(/\b20\d{2}\b/);
  if (yp && yf) return Number(yp[0]) === Number(yf[0]);
  return true;
}

function deteksiJenisPDFBulk(text, bank) {
  const clean = normalisasiTeksBulkPDF(text);
  const b = String(bank || '').toUpperCase().trim();

  /*
   * Deteksi dibuat toleran (cukup 2 sinyal, bukan mewajibkan semua
   * frasa persis cocok) karena hasil ekstraksi teks PDF (Drive/OCR)
   * dapat sedikit berbeda dari satu dokumen ke dokumen lain. Kalau
   * salah satu frase berubah tipis, deteksi bulk jangan sampai gagal
   * total dan jatuh ke parser transaksi tunggal yang pasti 0 hasil.
   */

  if (b === 'BRI') {
    const sinyalMassal = /TRANSFER\s+MASSAL/i.test(clean);
    const sinyalBukti = /BUKTI\s+TRANSAKSI/i.test(clean);
    const sinyalTabel =
      /Rekening\s+Tujuan/i.test(clean) &&
      /\bNominal\b/i.test(clean);

    if (sinyalMassal && (sinyalBukti || sinyalTabel)) {
      return 'BRI';
    }
  }

  if (b === 'BPD') {
    const sinyalJudul = /TRANSFER\s+BULK\s+DETAIL/i.test(clean);
    const sinyalReferensi = /Referensi\s+Transaksi/i.test(clean);
    const sinyalJumlah = /\bJumlah\s*:\s*\d+/i.test(clean);

    if (sinyalJumlah && (sinyalJudul || sinyalReferensi)) {
      return 'BPD';
    }
  }

  if (b === 'MANDIRI') {
    const sinyalInhouse = /Inhouse\s+Transfer/i.test(clean);
    const sinyalBank = /PT\.?\s*Bank\s+Mandiri\s+Tbk/i.test(clean);
    const sinyalTransaksi =
      /Transaction\s+Status/i.test(clean) ||
      /Transaction\s+Record/i.test(clean);

    if (sinyalInhouse && (sinyalBank || sinyalTransaksi)) {
      return 'MANDIRI';
    }
  }

  return '';
}


function parsePDFBRI(
  text,
  namaFile,
  periode
) {

  const info = ambilInfoRekeningPDF(text, 'BRI');
  const lines = pecahBarisPDF(text);
  const blocks = [];
  let current = null;

  // BRI dapat keluar dari PDF sebagai:
  // 1) tanggal + jam dalam satu baris, atau
  // 2) tanggal dan jam terpisah, atau
  // 3) tanggal berada setelah nomor/karakter lain.
  const isTanggalBRI = function(line) {
    return /\b\d{2}\/\d{2}\/\d{2}\b/.test(String(line || ''));
  };

  for (let i = 0; i < lines.length; i++) {
    const line = String(lines[i] || '').trim();
    if (!line) continue;

    if (isTanggalBRI(line)) {
      if (current) blocks.push(current);
      current = [line];
    } else if (current) {
      if (/^LAPORAN TRANSAKSI FINANSIAL/i.test(line)) continue;
      if (/^Halaman\s+\d+\s+dari\s+\d+/i.test(line)) continue;
      current.push(line);
    }
  }

  if (current) blocks.push(current);

  const mutasi = [];
  const raw = [];
  let nomor = 0;

  blocks.forEach(function(block) {
    const combined = block.join(' ').replace(/\s+/g, ' ').trim();
    const tanggalText = ambilTanggalBRI(combined);
    const tanggal = parseTanggalFlexible(tanggalText);
    if (!tanggal) return;

    const amounts = ambilTokenNominalDenganPosisi(combined);
    if (amounts.length < 2) return;

    // Cari tiga angka terakhir yang paling masuk akal sebagai:
    // debit, kredit, saldo. Jika hanya dua angka, gunakan angka
    // pertama sebagai transaksi dan angka kedua sebagai saldo.
    let debit = null;
    let kredit = null;
    let transaksiToken = null;

    if (amounts.length >= 3) {
      const a = amounts[amounts.length - 3];
      const b = amounts[amounts.length - 2];
      debit = parseNominalUmum(a.value);
      kredit = parseNominalUmum(b.value);
      transaksiToken = (debit !== null && debit > 0) ? a : b;
    } else {
      const a = amounts[amounts.length - 2];
      const b = amounts[amounts.length - 1];
      const na = parseNominalUmum(a.value);
      const nb = parseNominalUmum(b.value);
      transaksiToken = (na !== null && na > 0) ? a : b;
      debit = na;
      kredit = nb;
    }

    const nominal = (debit !== null && debit > 0)
      ? debit
      : ((kredit !== null && kredit > 0) ? kredit : null);

    if (!nominal || nominal <= 0) return;

    let keterangan = '';
    if (transaksiToken && transaksiToken.index >= 0) {
      keterangan = combined.substring(0, transaksiToken.index);
    } else {
      keterangan = combined;
    }

    // Buang tanggal + jam di depan.
    keterangan = keterangan
      .replace(/^.*?\b\d{2}\/\d{2}\/\d{2}\b\s*(?:\d{2}:\d{2}:\d{2})?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Buang user/teller BRI yang biasanya berada di ujung uraian.
    keterangan = keterangan
      .replace(/\s+(?:CMSPYRL|CMS|IBIZ)\s*$/i, '')
      .trim();

    if (!keterangan) return;

    const id = buatID('BRI', namaFile, nomor++);

    mutasi.push([
      id, tanggal, 'BRI', info.noRek, info.namaRekening,
      keterangan, nominal, namaFile, periode, ''
    ]);

    raw.push([
      id, 'BRI', namaFile, tanggalText, info.noRek,
      info.namaRekening, combined, info.cabang, nominal,
      periode, /\bGAJI\b/i.test(keterangan) ? 'GAJI' : 'TRANSAKSI UMUM'
    ]);
  });

  return { mutasi: mutasi, raw: raw, diagnostik: { kandidat: blocks.length, valid: mutasi.length } };
}

function ambilTanggalBRI(text) {
  const m = String(text || '').match(
    /\b(\d{2}\/\d{2}\/\d{2})\s+\d{2}:\d{2}:\d{2}\b/
  );
  return m ? m[1] : '';
}


function ambilKeteranganBRI(
  combined,
  amounts,
  tanggalText
) {

  let s = String(combined || '');

  if (tanggalText) {
    s = s.replace(
      new RegExp('^' + escapeRegex(tanggalText) + '\\s+\\d{2}:\\d{2}:\\d{2}\\s*'),
      ''
    );
  }

  // Ambil seluruh teks sebelum angka debit pertama.
  // Posisi token dihitung dari string COMBINED sebelum tanggal dihapus,
  // jadi prefix diambil terlebih dahulu lalu tanggal dibersihkan.
  if (amounts && amounts.length >= 3) {
    const debitToken = amounts[amounts.length - 3];
    if (debitToken && debitToken.index >= 0) {
      s = combined.substring(0, debitToken.index);
    }
  }

  if (tanggalText) {
    s = s.replace(
      new RegExp('^' + escapeRegex(tanggalText) + '\\s+\\d{2}:\\d{2}:\\d{2}\\s*'),
      ''
    );
  }

  s = s
    .replace(/\s+/g, ' ')
    .trim();

  // Hapus user ID/teller yang biasanya berada di ujung keterangan.
  s = s.replace(/\s+(?:CMSPYRL|CMS|IBIZ|[A-Z]{3,10}\d{0,4})\s*$/i, '');

  return s.trim();
}


/************************************************************
 * PARSER BPD / BANK JATENG
 *
 * Contoh:
 * 1 25 Jul 2026 BLQ6050220 GAJI JULI 26 ESDM MERAPI (-2,519,500) 2,394...
 ************************************************************/

function parsePDFBPD(
  text,
  namaFile,
  periode
) {

  const info = ambilInfoRekeningPDF(text, 'BPD');
  const lines = pecahBarisPDF(text);
  const mutasi = [];
  const raw = [];
  let nomor = 0;
  let current = null;
  let kandidatBlock = 0;

  const isTanggalBPD = function(line) {
    return /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\s+\d{4}\b/i.test(String(line || ''));
  };

  for (let i = 0; i < lines.length; i++) {
    const line = String(lines[i] || '').trim();
    if (!line) continue;

    if (isTanggalBPD(line)) {
      if (current) processBPDBlock(current);
      current = [line];
    } else if (current) {
      if (/^laporan|^tanggal|^saldo|^halaman/i.test(line)) continue;
      current.push(line);
    }
  }
  if (current) processBPDBlock(current);

  function processBPDBlock(block) {
    kandidatBlock++;
    const combined = block.join(' ').replace(/\s+/g, ' ').trim();
    const dateMatch = combined.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\s+\d{4})\b/i);
    if (!dateMatch) return;

    const tanggalText = dateMatch[1];
    const tanggal = parseTanggalFlexible(tanggalText);
    if (!tanggal) return;

    // BPD: nominal debit biasanya dalam kurung.
    let nominal = null;
    let nominalStart = -1;
    const debitMatch = combined.match(/\(\s*-?\s*([\d.,]+)\s*\)/);
    if (debitMatch) {
      nominal = parseNominalUmum(debitMatch[1]);
      nominalStart = debitMatch.index;
    } else {
      const amounts = ambilTokenNominalDenganPosisi(combined);
      if (amounts.length >= 2) {
        const kandidat = amounts[amounts.length - 2];
        nominal = parseNominalUmum(kandidat.value);
        nominalStart = kandidat.index;
      } else if (amounts.length === 1) {
        const kandidat = amounts[0];
        nominal = parseNominalUmum(kandidat.value);
        nominalStart = kandidat.index;
      }
    }

    if (!nominal || nominal <= 0) return;

    let keterangan = nominalStart >= 0
      ? combined.substring(0, nominalStart)
      : combined;

    keterangan = keterangan
      .replace(/^[^\d]*\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\s+\d{4}\b\s*/i, '')
      .replace(/^\S+\s+/, function(m) {
        // Hapus nomor referensi jika memang berada tepat setelah tanggal.
        return /^(?:[A-Z0-9-]{5,})\s+$/.test(m) ? '' : m;
      })
      .replace(/\s+/g, ' ')
      .trim();

    if (!keterangan || isBarisNonTransaksi(keterangan)) return;

    const id = buatID('BPD', namaFile, nomor++);
    mutasi.push([
      id, tanggal, 'BPD', info.noRek, info.namaRekening,
      keterangan, nominal, namaFile, periode, ''
    ]);

    raw.push([
      id, 'BPD', namaFile, tanggalText, info.noRek,
      info.namaRekening, combined, info.cabang, nominal,
      periode, /\bGAJI\b/i.test(keterangan) ? 'GAJI' : 'TRANSAKSI UMUM'
    ]);
  }

  return { mutasi: mutasi, raw: raw, diagnostik: { kandidat: kandidatBlock, valid: mutasi.length } };
}

/************************************************************
 * PARSER MANDIRI
 *
 * Karena format Mandiri dapat berbeda antar jenis laporan,
 * parser ini menggunakan blok transaksi fleksibel.
 ************************************************************/

function parsePDFMandiri(text,namaFile,periode) {
  const info=ambilInfoRekeningPDF(text,'MANDIRI'); const lines=pecahBarisPDF(text); const mutasi=[]; const raw=[]; let nomor=0,kandidat=0,current=null;
  const isDate=function(line){return /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?)?\b/i.test(line);};
  function processBlock(block){
    if(!block||!block.length)return; kandidat++; const combined=block.join(' ').replace(/\s+/g,' ').trim();
    const mt=combined.match(/^(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?)?/i); if(!mt)return;
    const tanggal=parseTanggalFlexible(mt[1]); if(!tanggal)return;
    const debitMatches=[]; const re=/-\s*([\d.,]+(?:\.\d{2})?)/g; let m;
    while((m=re.exec(combined))!==null){const n=parseNominalUmum(m[1]); if(n!==null&&n>0)debitMatches.push({index:m.index,number:n,value:m[1]});}
    if(!debitMatches.length)return;
    const debit=debitMatches[debitMatches.length-1];
    let keterangan=combined.substring(mt[0].length,debit.index).replace(/\s+/g,' ').trim();
    if(!keterangan||isBarisNonTransaksi(keterangan))return;
    const id=buatID('MANDIRI',namaFile,nomor++);
    mutasi.push([id,tanggal,'MANDIRI',info.noRek,info.namaRekening,keterangan,debit.number,namaFile,periode,'']);
    raw.push([id,'MANDIRI',namaFile,mt[1],info.noRek,info.namaRekening,combined,info.cabang,debit.number,periode,/\bGAJI\b/i.test(keterangan)?'GAJI':'TRANSAKSI UMUM']);
  }
  lines.forEach(function(line){if(isDate(line)){if(current)processBlock(current);current=[line];}else if(current&&!/^For further questions/i.test(line)&&!/^Page\s+\d+/i.test(line)){current.push(line);}}); if(current)processBlock(current);
  return {mutasi:mutasi,raw:raw,diagnostik:{kandidat:kandidat,valid:mutasi.length}};
}

/************************************************************
 * PARSER GENERIK
 * Untuk format PDF bank yang tidak persis sama dengan BRI/BPD.
 ************************************************************/

function parsePDFMutasiGenerik(
  text,
  namaFile,
  bank,
  periode
) {

  const info = ambilInfoRekeningPDF(text, bank);
  const lines = pecahBarisPDF(text);
  const mutasi = [];
  const raw = [];
  let nomor = 0;

  const polaTanggal = /^(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?\b|^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?)?\b/i;
  let current = null;

  function prosesBlock(block) {

    if (!block || !block.length) {
      return;
    }

    const combined = block.join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tanggalText = ambilTanggalGenerik(combined);
    const tanggal = parseTanggalFlexible(tanggalText);

    if (!tanggal) {
      return;
    }

    const amounts = ambilTokenNominalDenganPosisi(combined);

    if (!amounts.length) {
      return;
    }

    let nominal = null;
    let nominalToken = null;

    // Jika ada minimal 3 angka, pola umum adalah debit/kredit/saldo.
    if (amounts.length >= 3) {
      nominalToken = amounts[amounts.length - 3];
      nominal = parseNominalUmum(nominalToken.value);

      // Jika angka pertama dari tiga tersebut 0, gunakan yang kedua.
      if (!nominal || nominal <= 0) {
        nominalToken = amounts[amounts.length - 2];
        nominal = parseNominalUmum(nominalToken.value);
      }
    } else {
      nominalToken = amounts[0];
      nominal = parseNominalUmum(nominalToken.value);
    }

    if (!nominal || nominal <= 0) {
      return;
    }

    let keterangan = combined;

    if (nominalToken && nominalToken.index >= 0) {
      keterangan = combined.substring(0, nominalToken.index);
    }

    keterangan = keterangan
      .replace(
        new RegExp('^' + escapeRegex(tanggalText) + '\\s*'),
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();

    if (!keterangan || isBarisNonTransaksi(keterangan)) {
      return;
    }

    const id = buatID(bank, namaFile, nomor++);

    mutasi.push([
      id,
      tanggal,
      bank,
      info.noRek,
      info.namaRekening,
      keterangan,
      nominal,
      namaFile,
      periode,
      ''
    ]);

    raw.push([
      id,
      bank,
      namaFile,
      tanggalText,
      info.noRek,
      info.namaRekening,
      combined,
      info.cabang,
      nominal,
      periode,
      /\bGAJI\b/i.test(keterangan)
        ? 'GAJI'
        : 'TRANSAKSI UMUM'
    ]);
  }

  for (let i = 0; i < lines.length; i++) {

    const line = lines[i];

    if (polaTanggal.test(line)) {

      if (current) {
        prosesBlock(current);
      }

      current = [line];

    } else if (current) {

      current.push(line);

    }
  }

  if (current) {
    prosesBlock(current);
  }

  return {
    mutasi: mutasi,
    raw: raw,
    diagnostik: { kandidat: lines.filter(function(x){ return polaTanggal.test(x); }).length, valid: mutasi.length }
  };
}


/************************************************************
 * INFO REKENING PDF
 ************************************************************/

function ambilInfoRekeningPDF(
  text,
  bank
) {

  const t = String(text || '');
  const lines = pecahBarisPDF(t);

  let noRek = '';
  let namaRekening = '';
  let cabang = '';

  let m = t.match(
    /No\.?\s*Rekening\s*:?\s*([0-9]{6,20})/i
  );

  if (m) {
    noRek = m[1];
  }

  m = t.match(
    /Account\s*No\.?\s*:?\s*([0-9]{6,20})/i
  );

  if (!noRek && m) {
    noRek = m[1];
  }

  m = t.match(
    /Nama\s+Rekening\s*:?\s*([^\n\r]+)/i
  );

  if (m) {
    namaRekening = m[1].trim();
  }

  m = t.match(
    /Account\s+Name\s*:?\s*([^\n\r]+)/i
  );

  if (!namaRekening && m) {
    namaRekening = m[1].trim();
  }

  // BRI: nama perusahaan berada tepat setelah "Kepada Yth. / To :"
  if (!namaRekening) {
    for (let i = 0; i < lines.length; i++) {
      if (/Kepada Yth\.?\s*\/\s*To/i.test(lines[i])) {
        if (lines[i + 1]) {
          namaRekening = lines[i + 1]
            .split(/Periode Transaksi/i)[0]
            .trim();
          break;
        }
      }
    }
  }

  // BPD: nama perusahaan biasanya berada sebelum alamat dan nomor rekening.
  if (!namaRekening && bank === 'BPD') {
    for (let i = 0; i < lines.length; i++) {
      if (/Laporan Mutasi/i.test(lines[i])) {
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const kandidat = lines[j].trim();
          if (
            kandidat &&
            !/^(CABANG|No CIF|No Rekening|Periode|Mutasi|Tanggal)/i.test(kandidat) &&
            /[A-Za-z]{3,}/.test(kandidat)
          ) {
            namaRekening = kandidat
              .split(/No\.?\s*Rekening/i)[0]
              .trim();
            break;
          }
        }
        if (namaRekening) break;
      }
    }
  }

  m = t.match(
    /(?:Unit\s+Kerja|Cabang|Branch)\s*:?\s*([^\n\r]+)/i
  );

  if (m) {
    cabang = m[1].trim();
  }

  return {
    noRek: noRek,
    namaRekening: namaRekening,
    cabang: cabang
  };
}


/************************************************************
 * PECAH BARIS PDF
 ************************************************************/

function pecahBarisPDF(text) {

  return String(text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .split('\n')
    .map(function(x) {
      return x.replace(/\s+/g, ' ').trim();
    })
    .filter(function(x) {
      return x !== '';
    });
}


/************************************************************
 * TOKEN NOMINAL DENGAN POSISI
 ************************************************************/

function ambilTokenNominalDenganPosisi(text) {

  const s = String(text || '');
  const hasil = [];

  // Mendukung:
  // 119,043,095.00
  // 3,500,000
  // 3.500.000,00
  // 0.00
  // (2,519,500)
  // -2,519,500
  const regex = /\(?-?\d{1,3}(?:(?:[.,]\d{3})+)(?:[.,]\d{2})?\)?|\(?-?\d+(?:[.,]\d{2})\)?/g;

  let m;

  while ((m = regex.exec(s)) !== null) {

    const raw = m[0];
    const n = parseNominalUmum(raw);

    if (n !== null) {
      hasil.push({
        value: raw,
        number: n,
        index: m.index,
        length: raw.length
      });
    }
  }

  return hasil;
}


/************************************************************
 * CARI TANGGAL GENERIK
 ************************************************************/

function ambilTanggalGenerik(text) {

  const t = String(text || '');

  let m = t.match(
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/i
  );

  if (m) {
    return m[0];
  }

  m = t.match(
    /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/i
  );

  return m ? m[0] : '';
}


/************************************************************
 * PARSE TANGGAL FLEKSIBEL
 ************************************************************/

function parseTanggalFlexible(value) {

  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (/^PEND$/i.test(text)) {
    return 'PEND';
  }

  let m = text.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (m) {
    let year = Number(m[3]);

    if (year < 100) {
      year += 2000;
    }

    return new Date(
      year,
      Number(m[2]) - 1,
      Number(m[1]),
      m[4] ? Number(m[4]) : 0,
      m[5] ? Number(m[5]) : 0,
      m[6] ? Number(m[6]) : 0
    );
  }

  m = text.match(
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      m[4] ? Number(m[4]) : 0,
      m[5] ? Number(m[5]) : 0,
      m[6] ? Number(m[6]) : 0
    );
  }

  // Format BULK BPD: 28-Jul-2026 / 29-Jul-2026
  // Harus ditangani sebelum format "28 Jul 2026".
  m = text.match(
    /^(\d{1,2})-([A-Za-z]{3,9})-(\d{4})$/i
  );

  if (m) {

    const bulan = {
      jan: 0,
      january: 0,
      januari: 0,
      feb: 1,
      february: 1,
      februari: 1,
      mar: 2,
      march: 2,
      maret: 2,
      apr: 3,
      april: 3,
      may: 4,
      mei: 4,
      jun: 5,
      june: 5,
      juni: 5,
      jul: 6,
      july: 6,
      juli: 6,
      aug: 7,
      august: 7,
      // "Agu"/"Ags" adalah singkatan Agustus yang lazim dipakai bank
      // (mis. PDF Bulk BPD: "26-Agu-2026"). Tanpa ini, tanggal Agustus
      // gagal diparse dan SEMUA transaksi Bulk BPD bulan itu tertolak
      // dari periode aktif walau datanya sendiri valid.
      agu: 7,
      ags: 7,
      agustus: 7,
      sep: 8,
      sept: 8,
      september: 8,
      okt: 9,
      oct: 9,
      october: 9,
      oktober: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
      // "Des" adalah singkatan Desember yang lazim, sebelumnya cuma "Dec".
      des: 11,
      desember: 11
    };

    const key = String(m[2]).toLowerCase();

    if (Object.prototype.hasOwnProperty.call(bulan, key)) {
      return new Date(
        Number(m[3]),
        bulan[key],
        Number(m[1])
      );
    }
  }

  m = text.match(
    /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/i
  );

  if (m) {

    const bulan = {
      jan: 0,
      january: 0,
      januari: 0,
      feb: 1,
      february: 1,
      februari: 1,
      mar: 2,
      march: 2,
      maret: 2,
      apr: 3,
      april: 3,
      may: 4,
      mei: 4,
      jun: 5,
      june: 5,
      juni: 5,
      jul: 6,
      july: 6,
      juli: 6,
      aug: 7,
      august: 7,
      agu: 7,
      ags: 7,
      agustus: 7,
      sep: 8,
      sept: 8,
      september: 8,
      okt: 9,
      oct: 9,
      october: 9,
      oktober: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
      des: 11,
      desember: 11
    };

    const key = String(m[2]).toLowerCase();

    if (Object.prototype.hasOwnProperty.call(bulan, key)) {
      return new Date(
        Number(m[3]),
        bulan[key],
        Number(m[1])
      );
    }
  }

  return null;
}


/************************************************************
 * ESCAPE REGEX
 ************************************************************/

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


/************************************************************
 * CARI TANGGAL
 * Tetap dipertahankan untuk fungsi lain dalam sistem.
 ************************************************************/

function cariTanggalDalamTeks(text) {
  const t = String(text || '');
  return parseTanggalFlexible(ambilTanggalGenerik(t));
}


/************************************************************
 * CARI NOMINAL
 * Tetap dipertahankan untuk fungsi lain dalam sistem.
 ************************************************************/

function cariNominalDalamTeks(text) {

  const kandidat =
    ambilTokenNominalDenganPosisi(text)
      .map(function(x) {
        return x.number;
      })
      .filter(function(x) {
        return x !== null && x > 1000;
      });

  if (!kandidat.length) {
    return null;
  }

  return Math.max.apply(null, kandidat);
}


/************************************************************
 * PARSE NOMINAL UMUM
 ************************************************************/

function parseNominalUmum(value) {

  let text = String(value || '')
    .trim()
    .replace(/[()]/g, '')
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '');

  if (!text) {
    return null;
  }

  const negatif = text.indexOf('-') === 0;
  text = text.replace(/-/g, '');

  if (!text) {
    return null;
  }

  if (
    text.indexOf('.') !== -1 &&
    text.indexOf(',') !== -1
  ) {

    if (
      text.lastIndexOf(',') >
      text.lastIndexOf('.')
    ) {
      // 3.500.000,00
      text = text
        .replace(/\./g, '')
        .replace(',', '.');
    } else {
      // 3,500,000.00
      text = text.replace(/,/g, '');
    }

  } else if (
    /^\d{1,3}(?:\.\d{3})+$/.test(text)
  ) {

    text = text.replace(/\./g, '');

  } else if (
    /^\d{1,3}(?:,\d{3})+$/.test(text)
  ) {

    text = text.replace(/,/g, '');
  }

  const n = Number(text);

  if (isNaN(n)) {
    return null;
  }

  return Math.abs(n);
}


/************************************************************
 * BARIS NON TRANSAKSI
 ************************************************************/

function isBarisNonTransaksi(text) {

  const upper = String(text || '').toUpperCase();

  const noise = [
    'SALDO AWAL',
    'SALDO AKHIR',
    'TOTAL',
    'MUTASI REKENING',
    'STATEMENT',
    'TANGGAL',
    'DESCRIPTION',
    'KETERANGAN',
    'DEBIT',
    'KREDIT',
    'CREDIT',
    'BALANCE',
    'JUMLAH TRANSAKSI'
  ];

  return noise.some(function(x) {
    return upper.indexOf(x) !== -1;
  });
}

/************************************************************
 * ==========================================================
 * TULIS IMPORT MUTASI
 * ==========================================================
 ************************************************************/

function tulisImportMutasi(hasil) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet aktif tidak ditemukan.');

  const mutasi = ss.getSheetByName(CONFIG.SHEET_MUTASI);
  const raw = ss.getSheetByName(CONFIG.SHEET_RAW);
  if (!mutasi || !raw) throw new Error('Sheet MUTASI/RAW tidak ditemukan. Jalankan setup struktur sekali jika sheet belum ada.');

  const dataMutasi = (hasil.mutasi || [])
    .filter(function(row) { return Array.isArray(row) && row.length >= 10; })
    .map(function(row) {
      const r = row.slice(0, 10);
      r[9] = r[9] || '';
      return r.concat(['BELUM DIPROSES']);
    });

  const dataRaw = (hasil.raw || [])
    .filter(function(row) { return Array.isArray(row) && row.length === 11; });

  if (!dataMutasi.length) throw new Error('Tidak ada baris MUTASI valid untuk ditulis.');

  // Tulis sekaligus. Tidak ada setValue per baris.
  const startMutasiRow = Math.max(2, mutasi.getLastRow() + 1);
  mutasi.getRange(startMutasiRow, 1, dataMutasi.length, 11).setValues(dataMutasi);

  let startRawRow = 0;
  if (dataRaw.length) {
    startRawRow = Math.max(2, raw.getLastRow() + 1);
    raw.getRange(startRawRow, 1, dataRaw.length, 11).setValues(dataRaw);
  }

  // Validasi di memory, tanpa membaca ulang seluruh data yang baru ditulis.
  let validCount = 0;
  dataMutasi.forEach(function(row) {
    const tanggalOK = row[1] instanceof Date ||
      (String(row[2] || '').toUpperCase() === 'MANDIRI' &&
       !row[1] &&
       /^\[BULK MANDIRI\]/i.test(String(row[5] || '')));

    if (String(row[0] || '').trim() &&
        tanggalOK &&
        String(row[2] || '').trim() &&
        String(row[5] || '').trim() &&
        Number(row[6] || 0) > 0) {
      validCount++;
    }
  });

  if (validCount !== dataMutasi.length) {
    throw new Error('Validasi data import gagal: ' + validCount + ' dari ' + dataMutasi.length + ' baris valid.');
  }

  // Format hanya baris baru. Tidak auto-resize/filter seluruh sheet setiap import.
  if (dataMutasi.length) {
    mutasi.getRange(startMutasiRow, 2, dataMutasi.length, 1).setNumberFormat('dd/MM/yyyy');
    mutasi.getRange(startMutasiRow, 7, dataMutasi.length, 1).setNumberFormat('#,##0');
  }
  if (dataRaw.length) {
    raw.getRange(startRawRow, 9, dataRaw.length, 1).setNumberFormat('#,##0');
  }

  return {
    mutasiTersimpan: true,
    jumlahMutasi: validCount,
    jumlahRaw: dataRaw.length,
    startRow: startMutasiRow,
    startRawRow: startRawRow
  };
}

/************************************************************
 * ==========================================================
 * TAMBAH REKAP PIC
 * ==========================================================
 ************************************************************/

function tambahRekapPIC() {

  const ui =
    SpreadsheetApp.getUi();

  const pic =
    ui.prompt(
      '👥 PIC REKAP GAJI',
      'Contoh: PAK TOHAR',
      ui.ButtonSet.OK_CANCEL
    );

  if (
    pic.getSelectedButton() !==
    ui.Button.OK
  ) {
    return;
  }

  const namaPIC =
    pic
      .getResponseText()
      .trim();

  if (!namaPIC) {
    return;
  }

  const link =
    ui.prompt(
      '🔗 LINK REKAP GAJI',
      'Masukkan URL Spreadsheet Rekap Gaji.',
      ui.ButtonSet.OK_CANCEL
    );

  if (
    link.getSelectedButton() !==
    ui.Button.OK
  ) {
    return;
  }

  const url =
    link
      .getResponseText()
      .trim();

  if (!url) {
    return;
  }

  let rekap;

  try {

    rekap =
      SpreadsheetApp
        .openByUrl(
          url
        );

  }
  catch (e) {

    ui.alert(
      '❌ Link Rekap tidak bisa dibuka.\n\n' +
      e.message
    );

    return;

  }

  const sheets =
    rekap.getSheets();

  let daftar =
    '';

  sheets.forEach(
    function(sh, index) {

      daftar +=
        (index + 1) +
        '. ' +
        sh.getName() +
        '\n';

    }
  );

  const pilih =
    ui.prompt(
      '📋 PILIH SHEET REKAP',
      'Daftar sheet:\n\n' +
      daftar +
      '\nKetik NAMA SHEET:',
      ui.ButtonSet.OK_CANCEL
    );

  if (
    pilih.getSelectedButton() !==
    ui.Button.OK
  ) {
    return;
  }

  const namaSheet =
    pilih
      .getResponseText()
      .trim();

  const sheet =
    rekap.getSheetByName(
      namaSheet
    );

  if (!sheet) {

    ui.alert(
      '❌ Sheet tidak ditemukan.'
    );

    return;

  }

  const periode =
    getPeriodeAktif();

  if (!periode) {

    ui.alert(
      '❌ Atur Periode Gaji terlebih dahulu.'
    );

    return;

  }

  const sh =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEET_SUMBER_REKAP
      );

  sh.appendRow([
    sh.getLastRow(),
    namaPIC,
    url,
    rekap.getName(),
    namaSheet,
    periode.nama,
    'AKTIF'
  ]);

  ui.alert(
    '✅ REKAP PIC BERHASIL DITAMBAHKAN\n\n' +
    'PIC: ' +
    namaPIC +
    '\n' +
    'File: ' +
    rekap.getName() +
    '\n' +
    'Sheet: ' +
    namaSheet +
    '\n' +
    'Periode: ' +
    periode.nama
  );

}


/************************************************************
 * ==========================================================
 * LIHAT SUMBER REKAP
 * ==========================================================
 ************************************************************/

function lihatSumberRekap() {

  const sh =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEET_SUMBER_REKAP
      );

  if (
    !sh ||
    sh.getLastRow() < 2
  ) {

    SpreadsheetApp
      .getUi()
      .alert(
        'Belum ada sumber Rekap PIC.'
      );

    return;

  }

  SpreadsheetApp
    .setActiveSheet(
      sh
    );

}


/************************************************************
 * ==========================================================
 * JALANKAN PENGECEKAN GAJI
 * ==========================================================
 ************************************************************/

function cekMutasiBaru(){prosesPengecekanMode(true);}
function cekUlangPeriode(){prosesPengecekanMode(false);}
function prosesPengecekanMode(hanyaBaru){
  const ui=SpreadsheetApp.getUi();
  const periode=getPeriodeAktif();
  if(!periode){ui.alert('❌ Tidak ada Periode Gaji aktif.');return;}
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sh=ss.getSheetByName(CONFIG.SHEET_MUTASI);
  if(!sh||sh.getLastRow()<2){ui.alert('❌ MUTASI belum memiliki data.');return;}

  // V8.6: MUTASI dibaca dengan fungsi lama, lalu dipakai sebagai
  // petunjuk lokasi untuk mencari sheet REKAP yang relevan.
  // PARSER MUTASI TIDAK DIUBAH.
  const semua=bacaMutasi(sh,periode);
  const data=hanyaBaru?semua.filter(function(x){return x.statusProses!=='SUDAH DIPROSES';}):semua;
  if(!data.length){ui.alert(hanyaBaru?'✅ Tidak ada mutasi baru yang belum diproses.':'❌ Tidak ditemukan mutasi untuk periode aktif.');return;}

  let rekap=bacaSemuaRekapPIC_V82(periode,data);

  if(hanyaBaru){
    /*
     * "Cek Mutasi Baru" cuma memproses mutasi yang BELUM diproses (data
     * di atas). REKAP yang barisnya di HASIL_PENGECEKAN sudah punya
     * pasangan mutasi nyata (NAMA MUTASI terisi) TIDAK BOLEH dicoba
     * dicocokkan ulang di sini — mutasi asli mereka sudah ditandai
     * "SUDAH DIPROSES" dari proses sebelumnya, jadi tidak akan pernah
     * muncul lagi di `data` di atas, dan mereka pasti akan berakhir
     * "🔴 MUTASI TIDAK DITEMUKAN". Sebelumnya ini menghasilkan BARIS
     * DUPLIKAT untuk karyawan yang sama tiap kali menu ini dijalankan
     * (baris lama yang sudah benar tetap ada, ditambah baris baru yang
     * salah menyatakan "tidak ditemukan" walau sudah pernah cocok dan
     * bahkan sudah dicek manual DONE).
     */
    const sudahPunyaMatch=ambilIdentitasSudahMatch_(ss);
    rekap=rekap.filter(function(r){
      return !sudahPunyaMatch[kunciRekap_(r.pic,r.lokasi,r.nama,r.diterima)];
    });
  }

  if(!rekap.length){
    ui.alert(
      hanyaBaru
        ? '✅ Tidak ada REKAP baru yang perlu dicocokkan. Semua karyawan pada mutasi yang belum diproses sudah punya hasil pencocokan sebelumnya.'
        : '❌ Tidak ditemukan data karyawan dari Rekap PIC.\n\nSistem sudah membaca MUTASI, tetapi tidak menemukan sheet REKAP yang relevan dengan lokasi mutasi periode aktif.'
    );
    return;
  }

  const hasilCocok=cocokkanSemua_V82(rekap,data);
  const hasil=hasilCocok.hasil;
  tulisHasilPengecekan(hasil,hanyaBaru);
  if(hanyaBaru)tandaiMutasiSudahDiproses(sh,data);

  const lokasiRekap={};
  rekap.forEach(function(r){const k=normalisasiNamaMatch_(r.lokasi||'')||'(LOKASI KOSONG)';lokasiRekap[k]=(lokasiRekap[k]||0)+1;});
  ui.alert((hanyaBaru?'🆕 CEK MUTASI BARU SELESAI':'🔄 CEK ULANG PERIODE SELESAI')+
    '\n\nRekap karyawan: '+rekap.length+
    '\nMutasi yang diproses: '+data.length+
    '\nHasil: '+hasil.length+
    '\nLokasi REKAP yang terbaca: '+Object.keys(lokasiRekap).length+
    '\n\nAcuan: REKAP PIC + lokasi + nama + nominal, lalu disandingkan dengan MUTASI lokasi terkait.');
}
function tandaiMutasiSudahDiproses(sh,data){
  if(!data || !data.length) return;
  const lastRow=sh.getLastRow();
  if(lastRow<2) return;
  const col=sh.getRange(2,11,lastRow-1,1).getValues();
  data.forEach(function(x){
    const idx=x.row-2;
    if(idx>=0 && idx<col.length) col[idx][0]='SUDAH DIPROSES';
  });
  sh.getRange(2,11,col.length,1).setValues(col);
}

/*
 * Identitas satu REKAP (bukan satu pasangan REKAP+MUTASI): PIC + LOKASI +
 * NAMA REKAP + NOMINAL REKAP. Ini SENGAJA sama persis dengan kunci yang
 * dipakai FIX21_kunciManual_/manualKey di tulisHasilPengecekan, supaya
 * "REKAP yang sama" selalu dikenali konsisten di seluruh sistem —
 * terlepas dari mutasi apa (kalau ada) yang kebetulan cocok dengannya
 * pada satu waktu proses tertentu.
 */
function kunciRekap_(pic,lokasi,nama,diterima){
  return [pic,lokasi,nama,diterima].map(function(x){
    return String(x==null?'':x).trim().toUpperCase();
  }).join('¦');
}

/*
 * Baca HASIL_PENGECEKAN apa adanya, kembalikan set identitas REKAP yang
 * STATUS FINAL-nya sudah DONE (benar-benar dikonfirmasi — otomatis
 * karena 🟢 SESUAI, atau manual lewat HASIL MANUAL = "SESUAI").
 *
 * SENGAJA bukan "punya NAMA MUTASI apa pun" — baris berstatus
 * 🟡 PERLU CEK atau yang sudah ditulis "BELUM SESUAI" lewat cek manual
 * BUKAN kandidat yang sudah selesai; itu masih menunggu keputusan
 * (baik keputusan pemakai, maupun kesempatan dicocokkan ulang kalau
 * transaksi yang benar baru belakangan masuk MUTASI). Kalau baris
 * begini disaring keluar juga, REKAP itu terkunci selamanya ke
 * pasangan yang salah walau transaksi aslinya sudah ada di MUTASI —
 * karena mutasi yang salah itu sudah kadung "SUDAH DIPROSES" dan
 * REKAP-nya tidak pernah dicoba dicocokkan ulang lagi.
 *
 * Dipakai prosesPengecekanMode(true) supaya "Cek Mutasi Baru" tidak
 * mencoba mencocokkan ulang REKAP yang SUDAH DONE (mutasi aslinya
 * sudah "SUDAH DIPROSES" dan pasti tidak ketemu lagi) — mencegah baris
 * duplikat/menimpa hasil yang sudah benar-benar final.
 */
function ambilIdentitasSudahMatch_(ss){
  const out={};
  const sh=ss.getSheetByName(CONFIG.SHEET_HASIL);
  if(!sh||sh.getLastRow()<2) return out;

  const data=sh.getRange(2,1,sh.getLastRow()-1,21).getValues();
  data.forEach(function(r){
    const statusFinal=String(r[20]||'').trim().toUpperCase();
    if(statusFinal!=='DONE') return;
    out[kunciRekap_(r[1],r[2],r[3],r[5])]=true;
  });
  return out;
}
function updateRekapAkhir(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const hasil = ss.getSheetByName(CONFIG.SHEET_HASIL);
  let out = ss.getSheetByName('REKAP_AKHIR');

  if (!hasil || hasil.getLastRow() < 2) {
    ui.alert('❌ HASIL_PENGECEKAN belum memiliki data.');
    return;
  }

  if (!out) {
    out = ss.insertSheet('REKAP_AKHIR');
  }

  const headers = ['NO','TANGGAL MUTASI','NAMA KARYAWAN','NAMA LOKASI','NOMINAL'];
  out.getRange(1,1,1,headers.length).setValues([headers]);

  const rows = hasil.getRange(2,1,hasil.getLastRow()-1,21).getValues();
  const groups = {};
  let totalRows = 0;
  let totalDone = 0;

  rows.forEach(function(r){
    const loc = String(r[2] || '').trim();
    if (!loc) return;

    totalRows++;
    const statusFinal = String(r[20] || '').trim().toUpperCase();
    if (statusFinal === 'DONE') totalDone++;

    const key = loc.toUpperCase().replace(/\s+/g,' ').trim();
    if (!groups[key]) groups[key] = { loc: loc, rows: [] };
    groups[key].rows.push(r);
  });

  // ==========================================================
  // REKAP AKHIR:
  // - Data lama dipertahankan dalam urutan yang sudah ada.
  // - Data DONE baru selalu ditambahkan di bawah data lama.
  // - Tidak ada pengurutan ulang.
  // ==========================================================

  const oldLastRow = out.getLastRow();
  const oldData = oldLastRow > 1
    ? out.getRange(2,1,oldLastRow-1,headers.length).getValues()
    : [];

  /*
   * KUNCI DUPLIKAT REKAP AKHIR
   *
   * Tanggal sengaja TIDAK dipakai sebagai identitas.
   * Pada sebagian data tanggal dapat kosong di satu hasil
   * pengecekan tetapi terisi di hasil pengecekan lainnya.
   *
   * Identitas transaksi untuk mencegah duplikat:
   * NAMA + LOKASI + NOMINAL
   */
  function keyRekapAkhir_(nama, lokasi, nominal) {
    return [
      String(nama || '').trim().toUpperCase().replace(/\s+/g,' '),
      String(lokasi || '').trim().toUpperCase().replace(/\s+/g,' '),
      String(Number(nominal || 0))
    ].join('¦');
  }

  const sudahAda = {};

  oldData.forEach(function(r){
    if (!r || r.length < 5) return;
    if (!r[2] && !r[3]) return;

    sudahAda[keyRekapAkhir_(r[2],r[3],r[4])] = true;
  });

  const doneRowsBaru = [];
  const incomplete = [];

  /*
   * NOMINAL di REKAP_AKHIR mengutamakan NOMINAL MUTASI (nilai riil
   * yang benar-benar tertransfer di bank, dari pencocokan otomatis).
   * Kalau baris itu DONE lewat CEK MANUAL (HASIL MANUAL diisi
   * "SESUAI" secara sadar oleh pemakai) tetapi mutasi otomatisnya
   * tidak/belum ketemu, NOMINAL REKAP dipakai sebagai gantinya —
   * DONE tetap DONE berarti pemakai sudah mengonfirmasi sendiri
   * transaksinya benar, jadi lokasi itu tidak lagi ditahan.
   */
  function punyaNominalMutasiRiil_(r) {
    const v = r[6];
    if (v === '' || v === null || v === undefined) return false;
    const n = Number(v);
    return !isNaN(n) && n > 0;
  }

  // Object.keys(groups) mempertahankan urutan kemunculan lokasi
  // pada HASIL_PENGECEKAN. Tidak dilakukan sort.
  Object.keys(groups).forEach(function(k){
    const g = groups[k];

    const doneCount = g.rows.filter(function(r){
      return String(r[20] || '').trim().toUpperCase() === 'DONE';
    }).length;

    if (doneCount === g.rows.length && g.rows.length > 0) {
      g.rows.forEach(function(r){
        const nilaiNominal = punyaNominalMutasiRiil_(r)
          ? Number(r[6])
          : Number(r[5] || 0);
        const key = keyRekapAkhir_(r[3],r[2],nilaiNominal);

        if (!sudahAda[key]) {
          doneRowsBaru.push([
            r[9],
            r[3],
            r[2],
            nilaiNominal
          ]);
          sudahAda[key] = true;
        }
      });
    } else {
      incomplete.push(g.loc + ' (' + doneCount + '/' + g.rows.length + ' DONE)');
    }
  });

  // Tambahkan hanya data baru ke bawah.
  // Baris lama & urutannya tidak disentuh; warna blok lokasi dihitung
  // ulang otomatis di akhir fungsi ini (lihat warnaiBlokLokasiRekapAkhir_).
  if (doneRowsBaru.length) {
    const startRow = Math.max(2, out.getLastRow() + 1);

    const output = doneRowsBaru.map(function(r,i){
      return [
        oldData.length + i + 1,
        r[0],
        r[1],
        r[2],
        r[3]
      ];
    });

    out.getRange(startRow,1,output.length,headers.length).setValues(output);
    out.getRange(startRow,5,output.length,1).setNumberFormat('#,##0');
  }

  warnaiBlokLokasiRekapAkhir_(out, headers.length);
  formatHeader(out, headers.length);
  buatFilterJikaPerlu(out, headers.length);
  out.autoResizeColumns(1,headers.length);

  let pesan = '📊 REKAP AKHIR DIPERBARUI\n\n' +
    'Baris HASIL_PENGECEKAN : ' + totalRows + '\n' +
    'Baris STATUS FINAL DONE : ' + totalDone + '\n' +
    'Data baru ditambahkan  : ' + doneRowsBaru.length + '\n' +
    'Total REKAP AKHIR      : ' + Math.max(0,out.getLastRow()-1) + '\n' +
    'Lokasi selesai         : ' +
      Object.keys(groups).filter(function(k){
        return groups[k].rows.every(function(r){
          return String(r[20]||'').trim().toUpperCase()==='DONE';
        });
      }).length + '\n' +
    'Lokasi belum selesai   : ' + incomplete.length;

  if (!doneRowsBaru.length) {
    pesan += '\n\nℹ️ Tidak ada data DONE baru yang perlu ditambahkan.' +
             '\nData lama di REKAP AKHIR tetap dipertahankan.';
  }

  if (incomplete.length) {
    const tampil = incomplete.slice(0,12).join('\n');
    pesan += '\n\nLokasi yang masih tertahan:\n' + tampil;
    if (incomplete.length > 12) {
      pesan += '\n... dan ' + (incomplete.length-12) + ' lokasi lainnya.';
    }
  }

  ui.alert(pesan);
}

/************************************************************
 * ==========================================================
 * WARNA BLOK LOKASI — REKAP_AKHIR
 * ==========================================================
 *
 * Setiap blok baris yang berurutan dengan NAMA LOKASI yang sama
 * diwarnai satu warna solid, lalu berganti warna (pink <-> kuning)
 * begitu lokasinya berubah. Ini murni presentasi, dijalankan ulang
 * dari awal setiap kali REKAP AKHIR diperbarui sehingga selalu
 * konsisten dengan urutan baris yang ada saat ini.
 ************************************************************/

function warnaiBlokLokasiRekapAkhir_(sheet, totalKolom) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const warnaBlok = [
    CONFIG.WARNA_BLOK_LOKASI_1,
    CONFIG.WARNA_BLOK_LOKASI_2
  ];

  const lokasiValues = sheet.getRange(2, 4, lastRow - 1, 1).getValues();

  let warnaIdx = -1;
  let lokasiSebelumnya = null;
  let awalBlok = 2;

  function terapkanBlok(mulai, akhir, warna) {
    if (akhir < mulai) return;
    sheet.getRange(mulai, 1, akhir - mulai + 1, totalKolom).setBackground(warna);
  }

  for (let i = 0; i < lokasiValues.length; i++) {
    const baris = i + 2;
    const lokasi = String(lokasiValues[i][0] || '').trim().toUpperCase();

    if (lokasi !== lokasiSebelumnya) {
      if (lokasiSebelumnya !== null) {
        terapkanBlok(awalBlok, baris - 1, warnaBlok[warnaIdx % 2]);
      }
      warnaIdx++;
      awalBlok = baris;
      lokasiSebelumnya = lokasi;
    }
  }

  terapkanBlok(awalBlok, lastRow, warnaBlok[warnaIdx % 2]);
}



/************************************************************
 * ==========================================================
 * REKAP NOMINAL LOKASI
 * Sumber: REKAP_AKHIR
 *
 * Hanya membuat rekap:
 *   - Nama Lokasi
 *   - Jumlah karyawan/transaksi
 *   - Total nominal gaji tertransfer
 *
 * Tidak mengubah REKAP_AKHIR.
 * Setiap UPDATE akan menyusun ulang isi sheet
 * NOMINAL LOKASI berdasarkan kondisi terbaru REKAP_AKHIR.
 * ==========================================================
 ************************************************************/
function updateNominalLokasi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sumber = ss.getSheetByName('REKAP_AKHIR');

  if (!sumber || sumber.getLastRow() < 2) {
    ui.alert(
      '❌ REKAP_AKHIR belum memiliki data.'
    );
    return;
  }

  let out = ss.getSheetByName('NOMINAL LOKASI');

  if (!out) {
    out = ss.insertSheet('NOMINAL LOKASI');
  }

  const data = sumber
    .getRange(
      2,
      1,
      sumber.getLastRow() - 1,
      5
    )
    .getValues();

  /*
   * Object dipakai agar urutan lokasi mengikuti
   * kemunculan pertama di REKAP_AKHIR.
   */
  const rekap = {};
  const urutanLokasi = [];

  data.forEach(function(row) {
    const lokasi = String(row[3] || '')
      .trim()
      .replace(/\s+/g, ' ');

    if (!lokasi) return;

    const key = lokasi.toUpperCase();

    if (!rekap[key]) {
      rekap[key] = {
        lokasi: lokasi,
        jumlah: 0,
        total: 0
      };

      urutanLokasi.push(key);
    }

    const nominal = Number(row[4]) || 0;

    rekap[key].jumlah += 1;
    rekap[key].total += nominal;
  });

  const headers = [
    'NO',
    'NAMA LOKASI',
    'JUMLAH DATA',
    'TOTAL GAJI TERTRANSFER'
  ];

  /*
   * NOMINAL LOKASI adalah sheet hasil rekap,
   * sehingga isinya boleh diperbarui ulang.
   * REKAP_AKHIR sama sekali tidak disentuh.
   */
  if (out.getLastRow() > 1) {
    out
      .getRange(
        2,
        1,
        out.getLastRow() - 1,
        headers.length
      )
      .clearContent();
  }

  out
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  const output = urutanLokasi.map(function(key, i) {
    return [
      i + 1,
      rekap[key].lokasi,
      rekap[key].jumlah,
      rekap[key].total
    ];
  });

  if (output.length) {
    out
      .getRange(
        2,
        1,
        output.length,
        headers.length
      )
      .setValues(output);

    out
      .getRange(
        2,
        4,
        output.length,
        1
      )
      .setNumberFormat('#,##0');
  }

  formatHeader(out, headers.length);
  buatFilterJikaPerlu(out, headers.length);
  out.autoResizeColumns(1, headers.length);

  const totalNominal = output.reduce(
    function(total, row) {
      return total + Number(row[3] || 0);
    },
    0
  );

  ui.alert(
    '💰 NOMINAL LOKASI BERHASIL DIPERBARUI.' +
    '\n\n' +
    'Jumlah lokasi : ' + output.length +
    '\n' +
    'Jumlah data   : ' + data.filter(function(row) {
      return String(row[3] || '').trim() !== '';
    }).length +
    '\n' +
    'Total gaji    : Rp ' +
      totalNominal.toLocaleString('id-ID')
  );
}


function jalankanPengecekanGaji(){prosesPengecekanMode(false);}

/************************************************************
 * ==========================================================
 * AUDIT SELISIH REKONSILIASI
 * ==========================================================
 *
 * Menjawab pertanyaan "kenapa total di NOMINAL LOKASI / REKAP_AKHIR
 * masih beda dari total MUTASI?" dengan angka pasti, bukan tebakan:
 *
 *   Total MUTASI periode aktif
 *     = sudah cocok ke REKAP (HASIL_PENGECEKAN)
 *       + TIDAK PERNAH cocok ke REKAP mana pun  <- lihat sheet
 *                                                   AUDIT_SELISIH_MUTASI
 *
 *   Yang sudah cocok ke REKAP
 *     = sudah DONE + punya nominal riil (siap masuk REKAP AKHIR)
 *       + belum DONE / belum lolos cek manual
 *
 *   REKAP_AKHIR (snapshot sheet) dibandingkan dengan total yang
 *   sebenarnya sudah DONE saat ini, untuk mendeteksi kalau REKAP_AKHIR
 *   belum di-"Update Rekap Akhir" ulang setelah ada cek manual baru.
 *
 * TIDAK menulis apa pun ke MUTASI / REKAP / HASIL_PENGECEKAN.
 * Satu-satunya sheet yang ditulis adalah AUDIT_SELISIH_MUTASI (rincian
 * transaksi MUTASI yang tidak pernah menjadi kandidat siapa pun).
 ************************************************************/

function auditSelisihRekonsiliasi() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const periode = getPeriodeAktif();
  if (!periode) {
    ui.alert('❌ Tidak ada Periode Gaji aktif.');
    return;
  }

  const shMutasi = ss.getSheetByName(CONFIG.SHEET_MUTASI);
  if (!shMutasi || shMutasi.getLastRow() < 2) {
    ui.alert('❌ MUTASI belum memiliki data.');
    return;
  }

  // === 1) Semua MUTASI periode aktif ===
  const dataMutasi = bacaMutasi(shMutasi, periode);
  const totalMutasi = dataMutasi.reduce(function(s, m) { return s + Number(m.nominal || 0); }, 0);

  // === 2) Jalankan ulang pencocokan di memori (tidak menulis apa pun)
  // untuk menemukan baris MUTASI yang tidak pernah jadi kandidat REKAP
  // mana pun sama sekali. ===
  const rekap = bacaSemuaRekapPIC_V82(periode, dataMutasi);
  const mutasiTerpakai = rekap.length
    ? cocokkanSemua_V82(rekap, dataMutasi).mutasiTerpakai
    : {};

  const mutasiYatim = dataMutasi.filter(function(m) { return !mutasiTerpakai[m.row]; });
  const totalYatim = mutasiYatim.reduce(function(s, m) { return s + Number(m.nominal || 0); }, 0);
  const totalTerpakai = totalMutasi - totalYatim;

  // === 3) Baca HASIL_PENGECEKAN apa adanya (termasuk hasil cek manual) ===
  // Mengikuti aturan updateRekapAkhir: satu lokasi masuk REKAP_AKHIR kalau
  // SEMUA barisnya sudah DONE (baik lewat pencocokan otomatis maupun cek
  // manual). Nominalnya mengutamakan NOMINAL MUTASI riil, dan memakai
  // NOMINAL REKAP sebagai pengganti untuk baris yang DONE lewat cek manual
  // tanpa pasangan mutasi otomatis -- DONE berarti pemakai sudah
  // mengonfirmasi sendiri, jadi tidak lagi dianggap "tertahan".
  const shHasil = ss.getSheetByName(CONFIG.SHEET_HASIL);
  let totalSiapMasukRekapAkhir = 0;
  let totalFallbackRekap = 0;
  let totalBelumDone = 0;
  const lokasiGrup = {};

  if (shHasil && shHasil.getLastRow() > 1) {
    const rows = shHasil.getRange(2, 1, shHasil.getLastRow() - 1, 21).getValues();

    rows.forEach(function(r) {
      const loc = String(r[2] || '').trim();
      if (!loc) return;

      const statusFinal = String(r[20] || '').trim().toUpperCase();
      const nominalMutasiVal = r[6];
      const nominalRekapVal = r[5];
      const punyaReal = nominalMutasiVal !== '' && nominalMutasiVal !== null &&
        !isNaN(Number(nominalMutasiVal)) && Number(nominalMutasiVal) > 0;

      const key = loc.toUpperCase().replace(/\s+/g, ' ').trim();
      if (!lokasiGrup[key]) {
        lokasiGrup[key] = { loc: loc, totalRow: 0, doneCount: 0, nominalSiap: 0, doneFallback: 0 };
      }
      const g = lokasiGrup[key];
      g.totalRow++;

      if (statusFinal === 'DONE') {
        g.doneCount++;
        if (punyaReal) {
          g.nominalSiap += Number(nominalMutasiVal);
        } else {
          g.nominalSiap += Number(nominalRekapVal || 0);
          g.doneFallback++;
        }
      } else if (punyaReal) {
        totalBelumDone += Number(nominalMutasiVal);
      }
    });
  }

  const lokasiTertahan = [];
  Object.keys(lokasiGrup).forEach(function(k) {
    const g = lokasiGrup[k];
    if (g.doneCount === g.totalRow) {
      totalSiapMasukRekapAkhir += g.nominalSiap;
      totalFallbackRekap += g.doneFallback;
    } else {
      lokasiTertahan.push(g);
    }
  });

  // === 4) REKAP_AKHIR saat ini (snapshot) ===
  const shRekapAkhir = ss.getSheetByName('REKAP_AKHIR');
  let totalRekapAkhir = 0;
  if (shRekapAkhir && shRekapAkhir.getLastRow() > 1) {
    const nilai = shRekapAkhir.getRange(2, 5, shRekapAkhir.getLastRow() - 1, 1).getValues();
    nilai.forEach(function(row) { totalRekapAkhir += Number(row[0] || 0); });
  }

  // === 5) Tulis rincian mutasi "yatim" (tidak pernah cocok) ===
  let shAudit = ss.getSheetByName('AUDIT_SELISIH_MUTASI');
  if (!shAudit) shAudit = ss.insertSheet('AUDIT_SELISIH_MUTASI');
  shAudit.clear();

  const headerAudit = ['BARIS DI MUTASI', 'ID MUTASI', 'TANGGAL', 'BANK', 'KETERANGAN', 'NOMINAL', 'CATATAN'];
  shAudit.getRange(1, 1, 1, headerAudit.length).setValues([headerAudit]);

  if (mutasiYatim.length) {
    const outAudit = mutasiYatim.map(function(m) {
      return [
        'MUTASI!A' + m.row,
        m.id,
        m.tanggal || '',
        m.bank,
        m.keterangan,
        m.nominal,
        'Tidak pernah cocok ke REKAP mana pun — cek manual (transaksi asing/duplikat/karyawan belum ada di REKAP/nama meleset jauh)'
      ];
    });
    shAudit.getRange(2, 1, outAudit.length, headerAudit.length).setValues(outAudit);
    shAudit.getRange(2, 6, outAudit.length, 1).setNumberFormat('#,##0');
  }

  formatHeader(shAudit, headerAudit.length);
  buatFilterJikaPerlu(shAudit, headerAudit.length);
  shAudit.autoResizeColumns(1, headerAudit.length);

  // === 6) Ringkasan ===
  let pesan = '🧮 AUDIT SELISIH REKONSILIASI — ' + periode.nama + '\n\n' +
    'Total MUTASI periode aktif        : Rp ' + totalMutasi.toLocaleString('id-ID') + ' (' + dataMutasi.length + ' transaksi)\n' +
    '  ├─ sudah cocok ke REKAP          : Rp ' + totalTerpakai.toLocaleString('id-ID') + '\n' +
    '  └─ TIDAK PERNAH cocok ke REKAP   : Rp ' + totalYatim.toLocaleString('id-ID') + ' (' + mutasiYatim.length + ' transaksi)\n' +
    (mutasiYatim.length ? '       → rincian di sheet AUDIT_SELISIH_MUTASI\n' : '') +
    '\nDari yang sudah cocok ke REKAP (HASIL_PENGECEKAN):\n' +
    '  ├─ siap masuk REKAP AKHIR (lokasi 100% DONE) : Rp ' + totalSiapMasukRekapAkhir.toLocaleString('id-ID') +
    (totalFallbackRekap > 0 ? ' (' + totalFallbackRekap + ' baris di antaranya pakai NOMINAL REKAP, DONE lewat cek manual tanpa mutasi otomatis)' : '') + '\n' +
    '  └─ sudah cocok tapi belum DONE                 : Rp ' + totalBelumDone.toLocaleString('id-ID') + '\n' +
    '\nREKAP_AKHIR saat ini (snapshot)     : Rp ' + totalRekapAkhir.toLocaleString('id-ID');

  if (totalRekapAkhir < totalSiapMasukRekapAkhir) {
    pesan += '\n⚠️ REKAP_AKHIR ketinggalan Rp ' +
      (totalSiapMasukRekapAkhir - totalRekapAkhir).toLocaleString('id-ID') +
      ' dari HASIL_PENGECEKAN. Klik ulang 📊 Update Rekap Akhir.';
  }

  if (lokasiTertahan.length) {
    pesan += '\n\nLokasi yang masih tertahan (belum 100% DONE):\n' +
      lokasiTertahan.slice(0, 12).map(function(g) {
        return '• ' + g.loc + ' (' + g.doneCount + '/' + g.totalRow + ' DONE)';
      }).join('\n');
    if (lokasiTertahan.length > 12) {
      pesan += '\n... dan ' + (lokasiTertahan.length - 12) + ' lokasi lainnya.';
    }
  }

  ui.alert(pesan);
}

/************************************************************
 * ==========================================================
 * BACA SEMUA REKAP PIC
 * ==========================================================
 ************************************************************/

function bacaSemuaRekapPIC(
  periode
) {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const sh =
    ss.getSheetByName(
      CONFIG.SHEET_SUMBER_REKAP
    );

  const data =
    sh
      .getRange(
        2,
        1,
        sh.getLastRow() - 1,
        7
      )
      .getValues();

  const hasil = [];

  data.forEach(
    function(row) {

      const pic =
        String(
          row[1] || ''
        ).trim();

      const url =
        String(
          row[2] || ''
        ).trim();

      const namaFile =
        String(
          row[3] || ''
        ).trim();

      const namaSheet =
        String(
          row[4] || ''
        ).trim();

      const periodeSumber =
        String(
          row[5] || ''
        ).trim();

      const status =
        String(
          row[6] || ''
        ).trim()
        .toUpperCase();

      if (
        status !== 'AKTIF'
      ) {
        return;
      }

      if (
        periodeSumber !==
        periode.nama
      ) {
        return;
      }

      if (
        !url ||
        !namaSheet
      ) {
        return;
      }

      try {

        const rekap =
          SpreadsheetApp
            .openByUrl(
              url
            );

        const sheet =
          rekap
            .getSheetByName(
              namaSheet
            );

        if (!sheet) {
          return;
        }

        const dataPIC =
          bacaRekapGaji(
            sheet
          );

        dataPIC.forEach(
          function(item) {

            hasil.push({

              pic:
                pic,

              file:
                namaFile,

              sheet:
                namaSheet,

              lokasi:
                item.lokasi,

              nama:
                item.nama,

              diterima:
                item.diterima,

              row:
                item.row

            });

          }
        );

      }
      catch (e) {

        Logger.log(
          'Rekap PIC gagal: ' +
          pic +
          ' - ' +
          e.message
        );

      }

    }
  );

  return hasil;

}


/************************************************************
 * ==========================================================
 * BACA REKAP GAJI
 * ==========================================================
 *
 * Mengikuti struktur kode sebelumnya:
 *
 * B = NAMA KARYAWAN (kolom indeks 1)
 * DITERIMA KARYAWAN = dicari berdasarkan header setiap blok tabel
 * PERINCIAN GAJI = LOKASI
 *
 ************************************************************/

function bacaRekapGaji(
  sheet
) {

  const values =
    sheet
      .getDataRange()
      .getValues();

  const hasil = [];

  let lokasiSekarang = '';
  let colDiterimaAktif = -1;
  let colBankAktif = -1;

  for (let r = 0; r < values.length; r++) {

    const row = values[r];

    const teksBaris = row.map(function(x) {
      return String(x == null ? '' : x).trim();
    }).join(' ');

    const lokasi = deteksiLokasi(teksBaris);
    if (lokasi) lokasiSekarang = lokasi;

    // Setiap blok PERINCIAN GAJI dapat mengulang header.
    // Karena posisi DITERIMA KARYAWAN / NAMA BANK bisa berbeda,
    // kolom dicari dari header aktual, bukan nomor kolom tetap.
    const idxDiterima = cariKolomDiterimaKaryawan_(row);
    if (idxDiterima >= 0) colDiterimaAktif = idxDiterima;

    const idxBank = cariKolomNamaBank_(row);
    if (idxBank >= 0) colBankAktif = idxBank;

    const nama = String(row[1] == null ? '' : row[1]).trim();

    if (!nama || !adalahNamaKaryawan(nama)) continue;

    const diterima =
      colDiterimaAktif >= 0 && colDiterimaAktif < row.length
        ? ambilAngka(row[colDiterimaAktif])
        : null;

    if (diterima === null || diterima <= 0) continue;

    const bank =
      colBankAktif >= 0 && colBankAktif < row.length
        ? String(row[colBankAktif] == null ? '' : row[colBankAktif]).trim()
        : '';

    hasil.push({
      lokasi: lokasiSekarang,
      nama: nama,
      diterima: diterima,
      bank: bank,
      row: r + 1
    });
  }

  return hasil;
}


/************************************************************
 * ==========================================================
 * DETEKSI LOKASI
 * ==========================================================
 ************************************************************/

/**
 * Mencari header DITERIMA KARYAWAN pada satu baris tabel Rekap Gaji.
 * Dibuat toleran terhadap kapitalisasi, spasi, titik, dan line break.
 */
function cariKolomDiterimaKaryawan_(row) {
  if (!row || !row.length) return -1;

  for (let c = 0; c < row.length; c++) {
    const h = String(row[c] == null ? '' : row[c])
      .toUpperCase()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (h === 'DITERIMA KARYAWAN' ||
        h.indexOf('DITERIMA KARYAWAN') !== -1) {
      return c;
    }
  }

  return -1;
}

function barisAdalahHeaderDiterimaKaryawan_(row) {
  return cariKolomDiterimaKaryawan_(row) >= 0;
}

function cariKolomNamaBank_(row) {
  if (!row || !row.length) return -1;

  for (let c = 0; c < row.length; c++) {
    const h = String(row[c] == null ? '' : row[c])
      .toUpperCase()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (h === 'NAMA BANK' || h === 'BANK' || h.indexOf('NAMA BANK') !== -1) {
      return c;
    }
  }

  return -1;
}

function deteksiLokasi(
  teks
) {

  if (!teks) {
    return '';
  }

  const upper =
    teks
      .toUpperCase()
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  if (
    upper.indexOf(
      'PERINCIAN GAJI'
    ) === -1
  ) {

    return '';

  }

  let lokasi =
    upper
      .replace(
        /PERINCIAN GAJI/g,
        ''
      )
      .replace(
        /PEGAWAI/g,
        ''
      )
      .replace(
        /KARYAWAN/g,
        ''
      )
      .replace(
        /[:-]+/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  if (
    lokasi.length < 3
  ) {

    return '';

  }

  return lokasi;

}


/************************************************************
 * ==========================================================
 * VALIDASI NAMA KARYAWAN
 * ==========================================================
 ************************************************************/

function adalahNamaKaryawan(
  nama
) {

  const upper =
    String(
      nama || ''
    )
      .toUpperCase()
      .trim();

  const tanpaNomor =
    upper
      .replace(
        /^\d+\s*/,
        ''
      )
      .trim();

  const ignore = [

    'NAMA',
    'N A M A',
    'JUMLAH',
    'JUMLAH KARYAWAN',
    'JUMLAH GAJI',
    'PERINCIAN',
    'GAJI',
    'DITERIMA KARYAWAN'

  ];

  if (
    ignore.indexOf(
      tanpaNomor
    ) !== -1
  ) {

    return false;

  }

  if (
    tanpaNomor.length < 3
  ) {

    return false;

  }

  if (
    !/[A-Z]/i.test(
      tanpaNomor
    )
  ) {

    return false;

  }

  return true;

}


/************************************************************
 * ==========================================================
 * BACA MUTASI
 * ==========================================================
 ************************************************************/

function bacaMutasi(
  sheet,
  periode
) {
  const values = sheet.getDataRange().getValues();
  const hasil = [];

  const periodeTarget = normalisasiPeriodeMatch_(periode.nama);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const periodeRow = normalisasiPeriodeMatch_(row[8]);
    if (periodeRow !== periodeTarget) continue;

    const tanggal = row[1];
    const bank = String(row[2] || '').trim();
    const noRek = String(row[3] || '').trim();
    const namaRekening = String(row[4] || '').trim();
    const keterangan = String(row[5] || '').trim();
    const nominal = ambilAngka(row[6]);

    if (nominal === null || nominal <= 0) continue;

    // Nama rekening + keterangan sengaja digabung untuk matching.
    // Ini penting untuk transaksi Bulk BRI/BPD/Mandiri.
    const teksMatch = [namaRekening, keterangan]
      .filter(Boolean)
      .join(' | ');

    hasil.push({
      row: r + 1,
      id: row[0],
      tanggal: tanggal,
      bank: bank,
      noRek: noRek,
      namaRekening: namaRekening,
      keterangan: keterangan,
      teksMatch: teksMatch,
      nominal: nominal,
      sumber: row[7],
      statusProses: String(row[10] || '').trim().toUpperCase()
    });
  }

  return hasil;
}

function normalisasiPeriodeMatch_(v) {
  return String(v || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}



/************************************************************
 * ==========================================================
 * COCOKKAN SEMUA
 * ==========================================================
 ************************************************************/

function cocokkanSemua(
  dataRekap,
  dataMutasi
) {
  const hasil = [];
  const sudahDigunakan = {};

  /*
   * MATCH ENGINE V8.1
   *
   * Prinsip:
   *   NAMA + LOKASI + NOMINAL + BANK
   *
   * NOMINAL TIDAK LAGI MENJADI PINTU PENYARING.
   * Semua mutasi periode aktif tetap menjadi kandidat.
   *
   * Bobot:
   *   Nama    45%
   *   Lokasi  25%
   *   Nominal 25%
   *   Bank     5%
   *
   * Dengan demikian:
   * - nama yang benar tetap dapat ditemukan walau nominal berbeda
   * - nominal yang benar tetap diverifikasi
   * - lokasi membantu membedakan nama yang sama
   * - bank menjadi faktor tambahan bila informasi bank tersedia
   */

  const mutasiPrepared = dataMutasi.map(function(m) {
    const teks = [
      m.namaRekening || '',
      m.keterangan || '',
      m.teksMatch || ''
    ].join(' | ');

    return {
      ...m,
      _teksMatch: teks,
      _namaNorm: normalisasiNamaMatch_(m.namaRekening || ''),
      _ketNorm: normalisasiNamaMatch_(m.keterangan || ''),
      _teksNorm: normalisasiNamaMatch_(teks)
    };
  });

  for (let i = 0; i < dataRekap.length; i++) {
    const rekap = dataRekap[i];
    const nominalRekap = Number(rekap.diterima || 0);

    const kandidat = [];

    for (let j = 0; j < mutasiPrepared.length; j++) {
      if (sudahDigunakan[j]) continue;

      const m = mutasiPrepared[j];
      const scoreNama = skorNamaMatchV81_(
        rekap.nama,
        m._namaNorm,
        m._teksNorm
      );

      const scoreLokasi = skorLokasiMatchV81_(
        rekap.lokasi,
        m._teksNorm
      );

      const nominalMutasi = Number(m.nominal || 0);
      const selisih = Math.abs(nominalRekap - nominalMutasi);

      const scoreNominal = skorNominalMatchV81_(
        nominalRekap,
        nominalMutasi
      );

      // Rekap saat ini belum memiliki kolom BANK.
      // Karena itu bank dibuat netral agar tidak merusak sistem lama.
      const scoreBank = skorBankMatchV81_(
        rekap.bank || '',
        m.bank || ''
      );

      const scoreGabungan =
        (scoreNama * 0.45) +
        (scoreLokasi * 0.25) +
        (scoreNominal * 0.25) +
        (scoreBank * 0.05);

      kandidat.push({
        index: j,
        mutasi: m,
        scoreNama: scoreNama,
        scoreLokasi: scoreLokasi,
        scoreNominal: scoreNominal,
        scoreBank: scoreBank,
        scoreGabungan: scoreGabungan,
        selisih: selisih
      });
    }

    if (!kandidat.length) {
      hasil.push({
        pic: rekap.pic,
        lokasi: rekap.lokasi,
        nama: rekap.nama,
        namaMutasi: '',
        diterima: rekap.diterima,
        nominalMutasi: '',
        selisih: -rekap.diterima,
        bank: '',
        tanggal: '',
        sumber: '',
        scoreNama: 0,
        scoreLokasi: 0,
        statusNama: '🔴 TIDAK DITEMUKAN',
        statusNominal: '🔴 TIDAK DITEMUKAN',
        statusLokasi: '🔴 TIDAK DITEMUKAN',
        statusAkhir: '🔴 MUTASI TIDAK DITEMUKAN',
        acuanDuplikat: ''
      });
      continue;
    }

    kandidat.sort(function(a, b) {
      if (b.scoreGabungan !== a.scoreGabungan) {
        return b.scoreGabungan - a.scoreGabungan;
      }

      if (b.scoreNama !== a.scoreNama) {
        return b.scoreNama - a.scoreNama;
      }

      if (b.scoreLokasi !== a.scoreLokasi) {
        return b.scoreLokasi - a.scoreLokasi;
      }

      if (b.scoreNominal !== a.scoreNominal) {
        return b.scoreNominal - a.scoreNominal;
      }

      return a.selisih - b.selisih;
    });

    const terbaik = kandidat[0];
    const m = terbaik.mutasi;

    // Jangan memakai transaksi yang sama dua kali.
    sudahDigunakan[terbaik.index] = true;

    const scoreNama = terbaik.scoreNama;
    const scoreLokasi = terbaik.scoreLokasi;
    const scoreNominal = terbaik.scoreNominal;

    const statusNama = tentukanStatusNama(scoreNama);

    // STATUS NOMINAL — toleransi selisih maksimal Rp0,50.
    // Selisih <= 0,50 dianggap SESUAI, termasuk nilai seperti 0,1 / 0,2 / 0,5.
    // Perubahan ini hanya memengaruhi pengecekan/status nominal.
    const nominalRekapFinal = Number(nominalRekap || 0);
    const nominalMutasiFinal = Number(nominalMutasi || 0);
    const selisihNominalFinal = Math.abs(nominalRekapFinal - nominalMutasiFinal);
    const nominalSesuaiToleransi = (
      nominalRekapFinal > 0 &&
      nominalMutasiFinal > 0 &&
      selisihNominalFinal <= 0.5
    );

    const statusNominal =
      nominalSesuaiToleransi
        ? '🟢 SESUAI'
        : '🔴 TIDAK SESUAI';

    const statusLokasi =
      scoreLokasi >= CONFIG.MIN_SCORE_LOKASI_SESUAI
        ? '🟢 SESUAI'
        : '🟡 PERLU CEK';

    // Kandidat kedua yang sangat dekat → jangan diam-diam dianggap aman.
    const kandidatKembar =
      kandidat.length > 1 &&
      Math.abs(
        kandidat[0].scoreGabungan -
        kandidat[1].scoreGabungan
      ) < 0.08;

    let statusAkhir;

    if (kandidatKembar) {
      statusAkhir = '🟠 POTENSI TRANSFER GANDA';
    } else if (
      scoreNama >= CONFIG.MIN_SCORE_NAMA_SESUAI &&
      scoreLokasi >= CONFIG.MIN_SCORE_LOKASI_SESUAI &&
      scoreNominal >= 1
    ) {
      statusAkhir = '🟢 SESUAI';
    } else if (
      scoreNama >= CONFIG.MIN_SCORE_NAMA_SESUAI &&
      scoreLokasi >= CONFIG.MIN_SCORE_LOKASI_SESUAI
    ) {
      statusAkhir = '🟡 NAMA/LOKASI SESUAI • NOMINAL PERLU CEK';
    } else if (
      scoreNama >= CONFIG.MIN_SCORE_NAMA_SESUAI &&
      nominalSesuaiToleransi
    ) {
      statusAkhir = '🟡 NAMA & NOMINAL SESUAI • LOKASI PERLU CEK';
    } else if (
      scoreLokasi >= CONFIG.MIN_SCORE_LOKASI_SESUAI &&
      nominalSesuaiToleransi
    ) {
      statusAkhir = '🟡 NOMINAL & LOKASI SESUAI • NAMA PERLU CEK';
    } else if (scoreNama >= CONFIG.MIN_SCORE_NAMA_PERLU_CEK) {
      statusAkhir = '🟡 NAMA PERLU CEK';
    } else if (nominalSesuaiToleransi) {
      statusAkhir = '🟡 NOMINAL SESUAI • NAMA/LOKASI PERLU CEK';
    } else {
      statusAkhir = '🔴 KANDIDAT LEMAH • PERLU CEK';
    }

    let acuanDuplikat = '';

    if (kandidat.length > 1) {
      acuanDuplikat = kandidat
        .slice(0, 5)
        .map(function(k) {
          return 'MUTASI!A' + k.mutasi.row + ':G' + k.mutasi.row;
        })
        .join(' ↔ ');
    }

    hasil.push({
      pic: rekap.pic,
      lokasi: rekap.lokasi,
      nama: rekap.nama,

      // Prioritaskan nama rekening hasil parser Bulk.
      // Jika tidak tersedia, tampilkan nama yang ditemukan dari keterangan.
      namaMutasi:
        m.namaRekening ||
        ambilNamaDariKeterangan(rekap.nama, m.keterangan) ||
        m.keterangan,

      diterima: rekap.diterima,
      nominalMutasi: m.nominal,
      selisih: m.nominal - rekap.diterima,
      bank: m.bank,
      tanggal: m.tanggal,
      sumber: m.sumber,
      scoreNama: scoreNama,
      scoreLokasi: scoreLokasi,
      statusNama: statusNama,
      statusNominal: statusNominal,
      statusLokasi: statusLokasi,
      statusAkhir: statusAkhir,
      acuanDuplikat: acuanDuplikat
    });
  }

  tandaiDoubleTransfer(hasil, dataRekap, dataMutasi);
  return hasil;
}

/* ============================
 * MATCH ENGINE HELPERS V8.1
 * ============================ */

function normalisasiNamaMatch_(v) {
  return String(v || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u00b4`]/g, "'")
    // Tanda kutip DI TENGAH kata (mis. "MU'ALIM", "SYA'BAN") dilebur,
    // bukan dijadikan pemisah token. Sisi mutasi/bank biasanya menyimpan
    // nama seperti itu sebagai satu kata utuh tanpa tanda kutip, jadi kalau
    // sisi REKAP dipecah jadi "MU" + "ALIM" keduanya tidak akan pernah
    // ketemu dengan token "MUALIM" di sisi mutasi.
    .replace(/([A-Z0-9])'+(?=[A-Z0-9])/g, '$1')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenMatch_(v) {
  const stop = {
    'GAJI': true,
    'TRANSFER': true,
    'INHOUSE': true,
    'CMS': true,
    'PAYROLL': true,
    'BULK': true,
    'JULI': true,
    'AGUSTUS': true,
    'SEPTEMBER': true,
    'OKTOBER': true,
    'NOVEMBER': true,
    'DESEMBER': true,
    'JANUARI': true,
    'FEBRUARI': true,
    'MARET': true,
    'APRIL': true,
    'MEI': true,
    'JUNI': true,
    'IDR': true,
    'SUCCESS': true,
    'OUR': true,
    'IMMEDIATE': true,
    'PT': true,
    'BANK': true,
    'MANDIRI': true,
    'TBK': true
  };

  return normalisasiNamaMatch_(v)
    .split(' ')
    .filter(function(x) {
      return x.length >= 2 && !stop[x];
    });
}

function skorNamaMatchV81_(namaRekap, namaRekeningNorm, teksNorm) {
  const target = tokenMatch_(namaRekap);

  if (!target.length) return 0;

  const sumberNama = tokenMatch_(namaRekeningNorm);
  const sumberTeks = tokenMatch_(teksNorm);

  let cocok = 0;

  target.forEach(function(token) {
    if (sumberNama.indexOf(token) !== -1) {
      cocok++;
      return;
    }

    if (sumberTeks.indexOf(token) !== -1) {
      cocok++;
      return;
    }

    // Dukungan nama terpotong oleh PDF.
    if (token.length >= 4) {
      for (let i = 0; i < sumberTeks.length; i++) {
        const t = sumberTeks[i];

        if (
          t.length >= 3 &&
          (
            t.indexOf(token) === 0 ||
            token.indexOf(t) === 0
          )
        ) {
          cocok++;
          break;
        }
      }
    }
  });

  let score = cocok / target.length;

  // Bonus jika nama rekening memuat keseluruhan nama.
  const targetFull = normalisasiNamaMatch_(namaRekap);
  if (
    targetFull &&
    namaRekeningNorm &&
    (
      namaRekeningNorm === targetFull ||
      namaRekeningNorm.indexOf(targetFull) !== -1
    )
  ) {
    score = Math.min(1, score + 0.20);
  }

  return Math.min(1, score);
}

function skorLokasiMatchV81_(lokasi, teksNorm) {
  const target = tokenMatch_(lokasi);
  const sumber = tokenMatch_(teksNorm);

  if (!target.length || !sumber.length) return 0;

  let cocok = 0;

  target.forEach(function(token) {
    if (sumber.indexOf(token) !== -1) {
      cocok++;
      return;
    }

    if (token.length >= 4) {
      for (let i = 0; i < sumber.length; i++) {
        const t = sumber[i];
        if (
          t.length >= 3 &&
          (
            t.indexOf(token) === 0 ||
            token.indexOf(t) === 0
          )
        ) {
          cocok++;
          break;
        }
      }
    }
  });

  return Math.min(1, cocok / target.length);
}

function skorNominalMatchV81_(a, b) {
  a = Number(a || 0);
  b = Number(b || 0);

  if (a <= 0 || b <= 0) return 0;
  if (a === b) return 1;

  const selisih = Math.abs(a - b);
  const relatif = selisih / Math.max(a, b);

  // Perbedaan kecil tetap mendapat skor, tetapi tidak pernah
  // mengalahkan kecocokan nama kuat + nominal sama.
  if (relatif <= 0.001) return 0.95;
  if (relatif <= 0.005) return 0.75;
  if (relatif <= 0.01) return 0.50;
  if (relatif <= 0.03) return 0.20;

  return 0;
}

function skorBankMatchV81_(bankRekap, bankMutasi) {
  const a = normalisasiNamaMatch_(bankRekap);
  const b = normalisasiNamaMatch_(bankMutasi);

  // Rekap lama belum punya kolom bank → netral.
  if (!a) return 1;

  if (!b) return 0.5;

  return a === b ? 1 : 0;
}



/************************************************************
 * ==========================================================
 * STATUS NAMA
 * ==========================================================
 ************************************************************/

function tentukanStatusNama(
  score
) {

  if (
    score >=
    CONFIG.MIN_SCORE_NAMA_SESUAI
  ) {

    const namaTerpotong =
      score < 0.98;

    return namaTerpotong
      ? '🟡 TERPOTONG / SEBAGIAN'
      : '🟢 SESUAI';

  }

  if (
    score >=
    CONFIG.MIN_SCORE_NAMA_PERLU_CEK
  ) {

    return '🟡 PERLU CEK';

  }

  return '🔴 TIDAK COCOK';

}


/************************************************************
 * ==========================================================
 * SKOR NAMA
 * ==========================================================
 ************************************************************/

function skorNama(
  nama,
  keterangan
) {

  const namaTokens =
    tokenNama(
      nama
    );

  const ketTokens =
    tokenNama(
      keterangan
    );

  if (
    namaTokens.length === 0
  ) {

    return 0;

  }

  let cocok =
    0;

  namaTokens.forEach(
    function(token) {

      if (
        token.length < 2
      ) {
        return;
      }

      if (
        ketTokens.indexOf(
          token
        ) !== -1
      ) {

        cocok++;

        return;

      }

      if (
        token.length >= 4
      ) {

        for (
          let i = 0;
          i < ketTokens.length;
          i++
        ) {

          const t =
            ketTokens[i];

          if (
            t.length >= 2 &&
            (
              t.indexOf(token) === 0 ||
              token.indexOf(t) === 0
            )
          ) {

            if (
              Math.min(
                token.length,
                t.length
              ) >= 3
            ) {

              cocok++;

              break;

            }

          }

        }

      }

    }
  );

  let score =
    cocok /
    namaTokens.length;

  /*
   * Bonus urutan dua token pertama.
   */

  if (
    namaTokens.length >= 2
  ) {

    const p1 =
      ketTokens.indexOf(
        namaTokens[0]
      );

    const p2 =
      ketTokens.indexOf(
        namaTokens[1]
      );

    if (
      p1 !== -1 &&
      p2 === p1 + 1
    ) {

      score += 0.15;

    }

  }

  return Math.min(
    1,
    score
  );

}


/************************************************************
 * ==========================================================
 * SKOR LOKASI
 * ==========================================================
 ************************************************************/

function skorLokasi(
  lokasi,
  keterangan
) {

  if (!lokasi) {
    return 0;
  }

  const target =
    normalisasiTeks(
      lokasi
    );

  const teks =
    normalisasiTeks(
      keterangan
    );

  if (
    !target ||
    !teks
  ) {

    return 0;

  }

  if (
    teks.indexOf(
      target
    ) !== -1
  ) {

    return 1;

  }

  const targetTokens =
    target
      .split(' ')
      .filter(
        function(x) {
          return x.length >= 2;
        }
      );

  if (
    targetTokens.length === 0
  ) {

    return 0;

  }

  let cocok =
    0;

  targetTokens.forEach(
    function(token) {

      if (
        teks.indexOf(token) !== -1
      ) {

        cocok++;

      }

    }
  );

  return (
    cocok /
    targetTokens.length
  );

}


/************************************************************
 * ==========================================================
 * AMBIL NAMA DARI KETERANGAN
 * ==========================================================
 ************************************************************/

function ambilNamaDariKeterangan(
  namaRekap,
  keterangan
) {

  /*
   * Kalau nama utuh ditemukan,
   * tampilkan nama rekap.
   */

  const normalNama =
    normalisasiTeks(
      namaRekap
    );

  const normalKet =
    normalisasiTeks(
      keterangan
    );

  if (
    normalKet.indexOf(
      normalNama
    ) !== -1
  ) {

    return namaRekap;

  }

  /*
   * Untuk kasus nama terpotong,
   * tampilkan bagian keterangan
   * setelah kata GAJI.
   */

  const tokens =
    normalKet
      .split(' ');

  const noise = {

    'GAJI': true,
    'TRF': true,
    'DB': true,
    'CR': true,
    'TRANSFER': true,
    'E': true,
    'BANKING': true,
    'EBANKING': true,
    'BCA': true,
    'BRI': true,
    'BPD': true,
    'MANDIRI': true

  };

  const calon =
    tokens.filter(
      function(t) {

        return (
          t.length >= 3 &&
          !noise[t]
        );

      }
    );

  return calon
    .join(' ');

}


/************************************************************
 * ==========================================================
 * TOKEN NAMA
 * ==========================================================
 ************************************************************/

function tokenNama(
  text
) {

  return normalisasiTeks(
    text
  )
    .split(' ')
    .filter(
      function(token) {

        const noise = {

          'TRF': true,
          'DB': true,
          'CR': true,
          'DR': true,
          'GAJI': true,
          'TRANSFER': true,
          'SWITCHING': true,
          'BANKING': true,
          'EBANKING': true,
          'BCA': true,
          'BRI': true,
          'BPD': true,
          'MANDIRI': true,
          'JATENG': true,
          'FAST': true,
          'BY': true,
          'TXN': true

        };

        return (
          token &&
          !noise[token]
        );

      }
    );

}


/************************************************************
 * ==========================================================
 * NORMALISASI TEKS
 * ==========================================================
 ************************************************************/

function normalisasiTeks(
  value
) {

  return String(
    value || ''
  )
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

}


/************************************************************
 * ==========================================================
 * TULIS HASIL PENGECEKAN
 * ==========================================================
 ************************************************************/

function identitasHasil(item){return [item.pic,item.lokasi,item.nama,item.namaMutasi,item.diterima,item.nominalMutasi,item.bank,item.tanggal,item.sumber].map(function(x){return String(x instanceof Date?x.getTime():(x==null?'':x)).trim().toUpperCase();}).join('¦');}
function ambilManualLama(sh){const map={};if(!sh||sh.getLastRow()<2)return map;const lastCol=Math.max(sh.getLastColumn(),21),data=sh.getRange(2,1,sh.getLastRow()-1,lastCol).getValues();data.forEach(function(r){const key=identitasHasil({pic:r[1],lokasi:r[2],nama:r[3],namaMutasi:r[4],diterima:r[5],nominalMutasi:r[6],bank:r[8],tanggal:r[9],sumber:r[10]});map[key]={s:r[18]||false,t:r[19]||'',u:r[20]||''};});return map;}
function tulisHasilPengecekan(hasil,hanyaBaru){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_HASIL);if(!sh)throw new Error('Sheet HASIL_PENGECEKAN tidak ditemukan.');
  const headers=['NO','PIC','LOKASI','NAMA REKAP','NAMA MUTASI','NOMINAL REKAP','NOMINAL MUTASI','SELISIH','BANK','TANGGAL MUTASI','SUMBER MUTASI','SKOR NAMA','SKOR LOKASI','STATUS NAMA','STATUS NOMINAL','STATUS LOKASI','STATUS AKHIR','ACUAN TRANSFER GANDA','CEK MANUAL','HASIL MANUAL','STATUS FINAL'];
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  const oldRows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,21).getValues():[];
  const oldManual=FIX21_bacaManualLama_(sh);
  const makeRow=function(item){const manualKey=[item.pic,item.lokasi,item.nama,item.diterima].map(function(x){return String(x==null?'':x).trim().toUpperCase();}).join('¦'); const old=oldManual[manualKey]||{s:false,t:'',u:''};let u=old.u||'';const t=String(old.t||'').trim().toUpperCase();if(t==='SESUAI')u='DONE';else if(t==='BELUM SESUAI')u='BELUM CLEAR';else if(String(item.statusAkhir||'').toUpperCase().indexOf('🟢 SESUAI')===0)u='DONE';return [item.pic,item.lokasi,item.nama,item.namaMutasi,item.diterima,item.nominalMutasi,item.selisih,item.bank,item.tanggal,item.sumber,item.scoreNama,item.scoreLokasi,item.statusNama,item.statusNominal,item.statusLokasi,item.statusAkhir,item.acuanDuplikat||'',old.s,old.t,u];};
  if(hanyaBaru){
    /*
     * Kunci "baris lama vs baris baru sama" HARUS identitas REKAP yang
     * stabil (PIC+LOKASI+NAMA REKAP+NOMINAL REKAP), BUKAN identitasHasil
     * yang ikut memuat detail mutasi (nama/nominal/bank/tanggal mutasi).
     * Detail mutasi itu justru yang WAJAR berubah antar proses (mis.
     * pasangan yang tadinya salah/lemah dikoreksi begitu transaksi yang
     * benar baru masuk MUTASI belakangan). Kalau identitasHasil dipakai,
     * baris lama yang salah tidak pernah dianggap tergantikan oleh baris
     * baru yang benar — keduanya cuma menumpuk jadi duplikat.
     */
    const newKeys={}; hasil.forEach(function(item){newKeys[kunciRekap_(item.pic,item.lokasi,item.nama,item.diterima)]=true;});

    // oldRows memiliki 21 kolom termasuk NO, sedangkan makeRow() memiliki 20 kolom tanpa NO.
    // Untuk menghindari error 20 kolom vs 21 kolom, lepaskan kolom NO dari data lama terlebih dahulu.
    const merged=oldRows
      .filter(function(r){
        return !newKeys[kunciRekap_(r[1],r[2],r[3],r[5])];
      })
      .map(function(r){ return r.slice(1,21); });

    const fresh=hasil.map(makeRow); // 20 kolom, tanpa NO
    const all=merged.concat(fresh);  // seluruh baris sekarang 20 kolom

    if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,21).clearContent();

    if(all.length){
      const output=all.map(function(r,i){ return [i+1].concat(r); }); // kembali menjadi 21 kolom
      sh.getRange(2,1,output.length,21).setValues(output);
      sh.getRange(2,19,output.length,1).insertCheckboxes();
    }
  } else {
    const output=hasil.map(function(item,i){const r=makeRow(item);return [i+1].concat(r);});
    const oldLastRow=sh.getLastRow();
    if(oldLastRow>1)sh.getRange(2,1,oldLastRow-1,21).clearContent();
    if(output.length){sh.getRange(2,1,output.length,21).setValues(output);sh.getRange(2,19,output.length,1).insertCheckboxes();}

    /*
     * Kalau data baru lebih pendek dari sebelumnya (mis. setelah baris
     * duplikat karyawan dibersihkan), buang sisa baris di bawahnya.
     * Tanpa ini, baris sisa hanya kehilangan isi kolom A-U tapi tetap
     * ada sebagai baris kosong menggantung di sheet.
     */
    const lastRowBaru=Math.max(2,output.length+1);
    if(sh.getLastRow()>lastRowBaru){
      sh.deleteRows(lastRowBaru+1, sh.getLastRow()-lastRowBaru);
    }
  }
  const rowsNow=sh.getLastRow()-1;if(rowsNow>0){sh.getRange(2,6,rowsNow,3).setNumberFormat('#,##0');sh.getRange(2,12,rowsNow,2).setNumberFormat('0.00');}
  formatHeader(sh,21);buatFilterJikaPerlu(sh,21);sh.autoResizeColumns(1,21);sh.setColumnWidth(18,320);sh.setColumnWidth(19,100);sh.setColumnWidth(20,140);sh.setColumnWidth(21,120);
}
/************************************************************
 * ==========================================================
 * DOUBLE TRANSFER
 * ==========================================================
 ************************************************************/

function tandaiDoubleTransfer(
  hasil,
  dataRekap,
  dataMutasi
) {

  /*
   * Transfer ganda TIDAK ditentukan hanya dari nominal.
   * Dua transaksi hanya dianggap kandidat ganda jika: 
   * - nominal sama;
   * - nama punya bukti minimal PERLU CEK; DAN
   * - lokasi punya bukti minimal SESUAI.
   *
   * Referensi yang ditulis adalah baris transaksi di MUTASI,
   * misalnya MUTASI!A124:G124 ↔ MUTASI!A125:G125.
   */

  hasil.forEach(function(item) {

    if (!item.nominalMutasi) return;

    const kandidat = dataMutasi.filter(function(m) {

      if (Number(m.nominal) !== Number(item.nominalMutasi)) {
        return false;
      }

      const namaScore = skorNama(item.nama, m.keterangan);
      const lokasiScore = skorLokasi(item.lokasi, m.keterangan);

      return (
        namaScore >= CONFIG.MIN_SCORE_NAMA_PERLU_CEK &&
        lokasiScore >= CONFIG.MIN_SCORE_LOKASI_SESUAI
      );
    });

    if (kandidat.length <= 1) return;

    item.statusAkhir = '🟠 POTENSI TRANSFER GANDA';
    item.acuanDuplikat = kandidat.map(function(m) {
      return 'MUTASI!A' + m.row + ':G' + m.row;
    }).join(' ↔ ');
  });
}


/************************************************************
 * ==========================================================
 * CEK DATA BELUM DIKENALI
 * ==========================================================
 ************************************************************/

function cekDataBelumDikenali() {

  const sh =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEET_HASIL
      );

  if (
    !sh ||
    sh.getLastRow() < 2
  ) {

    SpreadsheetApp
      .getUi()
      .alert(
        'Belum ada hasil pengecekan.'
      );

    return;

  }

  const data =
    sh
      .getRange(
        2,
        1,
        sh.getLastRow() - 1,
        17
      )
      .getValues();

  const belum =
    data.filter(
      function(row) {

        const status =
          String(
            row[16] || ''
          );

        return (
          status.indexOf('🔴') === 0 ||
          status.indexOf('🟡') === 0 ||
          status.indexOf('🟠') === 0
        );

      }
    );

  let cek =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEET_CEK
      );

  if (!cek) {

    cek =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .insertSheet(
          CONFIG.SHEET_CEK
        );

  }

  cek.clear();

  cek
    .getRange(
      1,
      1,
      1,
      17
    )
    .setValues([[
      'NO',
      'PIC',
      'LOKASI',
      'NAMA REKAP',
      'NAMA MUTASI',
      'NOMINAL REKAP',
      'NOMINAL MUTASI',
      'SELISIH',
      'BANK',
      'TANGGAL MUTASI',
      'SUMBER MUTASI',
      'SKOR NAMA',
      'SKOR LOKASI',
      'STATUS NAMA',
      'STATUS NOMINAL',
      'STATUS LOKASI',
      'STATUS AKHIR',
      'ACUAN TRANSFER GANDA'
    ]]);

  if (
    belum.length
  ) {

    cek
      .getRange(
        2,
        1,
        belum.length,
        17
      )
      .setValues(
        belum
      );

  }

  formatHeader(
    cek,
    17
  );

  cek.autoResizeColumns(
    1,
    17
  );

  buatFilterJikaPerlu(
    cek,
    17
  );

  SpreadsheetApp
    .getUi()
    .alert(
      '⚠️ DITEMUKAN ' +
      belum.length +
      ' DATA YANG PERLU DICEK.\n\n' +
      'Buka sheet CEK_KARYAWAN.'
    );

}


/************************************************************
 * ==========================================================
 * RINGKASAN HASIL
 * ==========================================================
 ************************************************************/

function ringkasanHasil() {

  const sh =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        CONFIG.SHEET_HASIL
      );

  if (
    !sh ||
    sh.getLastRow() < 2
  ) {

    SpreadsheetApp
      .getUi()
      .alert(
        'Belum ada hasil.'
      );

    return;

  }

  const data =
    sh
      .getRange(
        2,
        17,
        sh.getLastRow() - 1,
        1
      )
      .getValues();

  let sesuai = 0;
  let kuning = 0;
  let merah = 0;
  let ganda = 0;

  data.forEach(
    function(row) {

      const s =
        String(
          row[0] || ''
        );

      if (
        s.indexOf(
          '🟢'
        ) === 0
      ) {

        sesuai++;

      }
      else if (
        s.indexOf(
          '🟠'
        ) === 0
      ) {

        ganda++;

      }
      else if (
        s.indexOf(
          '🟡'
        ) === 0
      ) {

        kuning++;

      }
      else if (
        s.indexOf(
          '🔴'
        ) === 0
      ) {

        merah++;

      }

    }
  );

  SpreadsheetApp
    .getUi()
    .alert(

      '📊 RINGKASAN PENGECEKAN GAJI\n\n' +

      '🟢 Sesuai: ' +
      sesuai +

      '\n🟡 Perlu cek: ' +
      kuning +

      '\n🔴 Bermasalah: ' +
      merah +

      '\n🟠 Potensi double transfer: ' +
      ganda

    );

}



/************************************************************
 * ==========================================================
 * FILTER TRANSAKSI BERDASARKAN PERIODE AKTIF
 * ==========================================================
 *
 * Periode gaji tetap satu rentang besar.
 * File mutasi boleh diunggah per hari atau beberapa hari.
 * Hanya transaksi yang tanggalnya berada di rentang periode
 * aktif yang dimasukkan ke MUTASI/RAW.
 * ==========================================================
 ************************************************************/

function periodeCocokDenganKeterangan(keterangan, periode) {
  const teks = normalisasiTeks(keterangan);
  const namaPeriode = normalisasiTeks(periode && periode.nama ? periode.nama : '');

  const bulan = {
    JANUARI: 0, JAN: 0,
    FEBRUARI: 1, FEB: 1,
    MARET: 2, MAR: 2,
    APRIL: 3, APR: 3,
    MEI: 4, MAY: 4,
    JUNI: 5, JUN: 5,
    JULI: 6, JUL: 6,
    // "AGS" adalah singkatan Agustus yang lazim dipakai laporan bank
    // (mis. remark Bulk Mandiri: "GAJI AGS 26 ARTOS MA"). Tanpa ini,
    // transaksi Agustus yang keterangannya memakai singkatan ini
    // selalu dianggap di luar periode walau bulannya benar.
    AGUSTUS: 7, AGU: 7, AGS: 7, AUG: 7,
    SEPTEMBER: 8, SEP: 8,
    OKTOBER: 9, OKT: 9, OCT: 9,
    NOVEMBER: 10, NOV: 10,
    DESEMBER: 11, DES: 11, DEC: 11
  };

  let bulanPeriode = null;
  Object.keys(bulan).some(function(k) {
    if (new RegExp('\\b' + k + '\\b').test(namaPeriode)) {
      bulanPeriode = bulan[k];
      return true;
    }
    return false;
  });

  const tahunPeriodeMatch = namaPeriode.match(/\b(20\d{2})\b/);
  const tahunPeriode = tahunPeriodeMatch
    ? Number(tahunPeriodeMatch[1])
    : null;

  if (bulanPeriode === null) return false;

  /*
   * "teks" pada Bulk Mandiri adalah KETERANGAN gabungan banyak baris,
   * yang juga memuat NAMA KARYAWAN (bukan cuma remark gaji). Mencari
   * token bulan di SELURUH teks berisiko salah tangkap kalau kebetulan
   * ada nama karyawan yang sama dengan singkatan bulan — nyata terjadi
   * untuk karyawan bernama depan "JAN" (cocok dengan singkatan Januari)
   * pada remark yang sebenarnya berbunyi "GAJI AGS 26 ...": tanpa
   * penjagaan ini, "JAN" pada NAMA ditemukan lebih dulu dan periode
   * salah dianggap Januari padahal keterangannya jelas Agustus.
   *
   * Karena format remark selalu "GAJI <BULAN> <TAHUN> <LOKASI>", cari
   * token bulan & tahun TEPAT SETELAH kata "GAJI" dulu — nama karyawan
   * tidak pernah muncul di posisi itu. Baru kalau kata "GAJI" sama
   * sekali tidak ada, jatuh ke pencarian lama di seluruh teks.
   */
  let bulanKeterangan = null;
  let tahunKeterangan = null;

  const gajiRe = /\bGAJI\s+([A-Z]+)\s+(\d{2,4})\b/g;
  let gm;
  while ((gm = gajiRe.exec(teks)) !== null) {
    const token = gm[1];
    if (Object.prototype.hasOwnProperty.call(bulan, token)) {
      bulanKeterangan = bulan[token];
      tahunKeterangan = Number(gm[2]);
      break;
    }
  }

  if (bulanKeterangan === null && !/\bGAJI\b/.test(teks)) {
    Object.keys(bulan).some(function(k) {
      if (new RegExp('\\b' + k + '\\b').test(teks)) {
        bulanKeterangan = bulan[k];
        return true;
      }
      return false;
    });

    const tahunMatch = teks.match(/\b(20\d{2}|\d{2})\b/);
    if (tahunMatch) tahunKeterangan = Number(tahunMatch[1]);
  }

  if (bulanKeterangan !== bulanPeriode) return false;

  if (tahunPeriode !== null && tahunKeterangan !== null) {
    if (tahunKeterangan < 100) tahunKeterangan += 2000;
    if (tahunKeterangan !== tahunPeriode) return false;
  }

  return true;
}

function saringHasilMenurutPeriode(hasil, periode) {

  const mulai = normalisasiTanggalHanyaTanggal(periode.mulai);
  const selesai = normalisasiTanggalHanyaTanggal(periode.selesai);

  const mutasiAwal = Array.isArray(hasil.mutasi) ? hasil.mutasi : [];
  const rawAwal = Array.isArray(hasil.raw) ? hasil.raw : [];

  const mutasi = [];
  const raw = [];

  /*
   * KHUSUS BULK BPD:
   * tanggal transaksi berada di HEADER bulk, bukan di setiap
   * baris penerima. Semua penerima harus mewarisi tanggal header.
   * Ini penting karena hasil ekstraksi PDF BPD dapat membuat
   * tanggal pada row individual kosong/tidak konsisten.
   */
  let tanggalBulkBPD = null;
  const jenisHasil = hasil && hasil.diagnostik
    ? String(hasil.diagnostik.jenis || '').toUpperCase()
    : '';

  if (jenisHasil === 'BULK BPD') {
    if (hasil.diagnostik.tanggalBulkDate) {
      tanggalBulkBPD = normalisasiTanggalHanyaTanggal(
        hasil.diagnostik.tanggalBulkDate
      );
    }

    if (!tanggalBulkBPD && hasil.diagnostik.tanggalBulk) {
      tanggalBulkBPD = normalisasiTanggalHanyaTanggal(
        parseTanggalFlexible(hasil.diagnostik.tanggalBulk)
      );
    }
  }

  const bulkBPDDalamPeriode =
    jenisHasil === 'BULK BPD' &&
    tanggalBulkBPD &&
    tanggalBulkBPD >= mulai &&
    tanggalBulkBPD <= selesai;

  mutasiAwal.forEach(function(row) {
    const bank = String(row[2] || '').toUpperCase().trim();
    const keterangan = String(row[5] || '').trim();
    const tanggalRow = normalisasiTanggalHanyaTanggal(row[1]);

    /*
     * Untuk Bulk BPD, tanggal header adalah sumber kebenaran.
     * Paksa tanggal tersebut ke row agar MUTASI juga menyimpan
     * tanggal transaksi yang benar.
     */
    let tanggal = tanggalRow;
    if (bank === 'BPD' && jenisHasil === 'BULK BPD' && tanggalBulkBPD) {
      tanggal = tanggalBulkBPD;
      row[1] = tanggalBulkBPD;
    }

    const tanggalDalamPeriode =
      tanggal &&
      tanggal >= mulai &&
      tanggal <= selesai;

    const bulkBPDHeaderValid =
      bank === 'BPD' &&
      jenisHasil === 'BULK BPD' &&
      bulkBPDDalamPeriode;

    const mandiriBulkTanpaTanggal =
      bank === 'MANDIRI' &&
      jenisHasil === 'BULK MANDIRI' &&
      !tanggal &&
      /^\[BULK MANDIRI\]/i.test(keterangan) &&
      hasil.diagnostik &&
      hasil.diagnostik.bulkPeriodeCocok === true;

    if (tanggalDalamPeriode || bulkBPDHeaderValid || mandiriBulkTanpaTanggal) {
      mutasi.push(row);
    }
  });

  rawAwal.forEach(function(row) {
    const bank = String(row[1] || '').toUpperCase().trim();
    const keterangan = String(row[6] || '').trim();
    const tanggalRow = normalisasiTanggalHanyaTanggal(row[3]);

    let tanggal = tanggalRow;
    if (bank === 'BPD' && jenisHasil === 'BULK BPD' && tanggalBulkBPD) {
      tanggal = tanggalBulkBPD;
      row[3] = tanggalBulkBPD;
    }

    const tanggalDalamPeriode =
      tanggal &&
      tanggal >= mulai &&
      tanggal <= selesai;

    const bulkBPDHeaderValid =
      bank === 'BPD' &&
      jenisHasil === 'BULK BPD' &&
      bulkBPDDalamPeriode;

    const mandiriBulkTanpaTanggal =
      bank === 'MANDIRI' &&
      jenisHasil === 'BULK MANDIRI' &&
      !tanggal &&
      /^BULK MANDIRI/i.test(keterangan) &&
      hasil.diagnostik &&
      hasil.diagnostik.bulkPeriodeCocok === true;

    if (tanggalDalamPeriode || bulkBPDHeaderValid || mandiriBulkTanpaTanggal) {
      raw.push(row);
    }
  });

  return {
    mutasi: mutasi,
    raw: raw
  };
}


function normalisasiTanggalHanyaTanggal(value) {

  if (!value) return null;

  let d = value instanceof Date ? new Date(value) : new Date(value);

  if (isNaN(d.getTime())) return null;

  d.setHours(0, 0, 0, 0);
  return d;
}


/************************************************************
 * ==========================================================
 * KELOLA PERIODE
 * ==========================================================
 ************************************************************/

function aktifkanPeriodeMenu() {
  kelolaBarisStatus(
    CONFIG.SHEET_PERIODE,
    'AKTIF',
    '📅 AKTIFKAN PERIODE',
    true
  );
}

function nonaktifkanPeriodeMenu() {
  kelolaBarisStatus(
    CONFIG.SHEET_PERIODE,
    'NONAKTIF',
    '📅 NONAKTIFKAN PERIODE',
    false
  );
}

function hapusPeriodeMenu() {
  hapusBarisTerpilih(
    CONFIG.SHEET_PERIODE,
    '🗑️ HAPUS PERIODE',
    function(row) {
      return 'Periode: ' + row[1] + '\nStatus: ' + row[4] +
        '\n\nMenghapus periode TIDAK otomatis menghapus MUTASI/RAW.\n' +
        'Data transaksi tetap dipertahankan agar aman.';
    }
  );
}


/************************************************************
 * ==========================================================
 * CATAT SUMBER MUTASI
 * ==========================================================
 * Mencatat file yang berhasil diproses ke SUMBER_MUTASI.
 * Jika kombinasi BANK + NAMA FILE + PERIODE sudah ada,
 * baris lama diperbarui agar tidak membuat duplikat.
 ************************************************************/

function catatSumberMutasi(bank, namaFile, periodeNama, totalTransaksi) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet aktif tidak ditemukan.');

  const sh = ss.getSheetByName(CONFIG.SHEET_SUMBER_MUTASI);
  if (!sh) throw new Error('Sheet SUMBER_MUTASI tidak ditemukan.');

  const bankNorm = String(bank || '').trim().toUpperCase();
  const fileNorm = String(namaFile || '').trim();
  const periodeNorm = String(periodeNama || '').trim();
  const total = Number(totalTransaksi || 0);

  if (!bankNorm || !fileNorm || !periodeNorm) {
    throw new Error('Data SUMBER_MUTASI tidak lengkap.');
  }

  const lastRow = sh.getLastRow();

  if (lastRow >= 2) {
    const data = sh.getRange(2, 1, lastRow - 1, 7).getValues();

    for (let i = 0; i < data.length; i++) {
      const rowBank = String(data[i][1] || '').trim().toUpperCase();
      const rowFile = String(data[i][2] || '').trim();
      const rowPeriode = String(data[i][3] || '').trim();

      if (
        rowBank === bankNorm &&
        rowFile === fileNorm &&
        rowPeriode === periodeNorm
      ) {
        sh.getRange(i + 2, 5, 1, 3).setValues([[
          new Date(),
          total,
          'AKTIF'
        ]]);

        return {
          row: i + 2,
          updated: true
        };
      }
    }
  }

  const nextNo = Math.max(1, lastRow);

  sh.appendRow([
    nextNo,
    bankNorm,
    fileNorm,
    periodeNorm,
    new Date(),
    total,
    'AKTIF'
  ]);

  return {
    row: sh.getLastRow(),
    updated: false
  };
}


/************************************************************
 * ==========================================================
 * KELOLA SUMBER REKAP PIC
 * ==========================================================
 ************************************************************/

function aktifkanRekapPICMenu() {
  kelolaBarisStatus(
    CONFIG.SHEET_SUMBER_REKAP,
    'AKTIF',
    '👥 AKTIFKAN REKAP PIC',
    false
  );
}

function nonaktifkanRekapPICMenu() {
  kelolaBarisStatus(
    CONFIG.SHEET_SUMBER_REKAP,
    'NONAKTIF',
    '👥 NONAKTIFKAN REKAP PIC',
    false
  );
}

function hapusRekapPICMenu() {
  hapusBarisTerpilih(
    CONFIG.SHEET_SUMBER_REKAP,
    '🗑️ HAPUS REKAP PIC',
    function(row) {
      return 'PIC: ' + row[1] +
        '\nFile: ' + row[3] +
        '\nSheet: ' + row[4] +
        '\nPeriode: ' + row[5] +
        '\nStatus: ' + row[6] +
        '\n\nData Rekap PIC di spreadsheet sumber TIDAK akan dihapus.';
    }
  );
}


/************************************************************
 * ==========================================================
 * KELOLA SUMBER MUTASI
 * ==========================================================
 ************************************************************/

function aktifkanSumberMutasiMenu() {
  kelolaBarisStatus(
    CONFIG.SHEET_SUMBER_MUTASI,
    'AKTIF',
    '🏦 AKTIFKAN SUMBER MUTASI',
    false
  );
}

function nonaktifkanSumberMutasiMenu() {
  kelolaBarisStatus(
    CONFIG.SHEET_SUMBER_MUTASI,
    'NONAKTIF',
    '🏦 NONAKTIFKAN SUMBER MUTASI',
    false
  );
}

function hapusSumberMutasiMenu() {
  hapusBarisTerpilih(
    CONFIG.SHEET_SUMBER_MUTASI,
    '🗑️ HAPUS SUMBER MUTASI',
    function(row) {
      return 'Bank: ' + row[1] +
        '\nFile: ' + row[2] +
        '\nPeriode: ' + row[3] +
        '\nTotal transaksi: ' + row[5] +
        '\nStatus: ' + row[6] +
        '\n\nMenghapus sumber hanya menghapus catatan sumber.\n' +
        'Data MUTASI/RAW tidak otomatis dihapus.';
    }
  );
}


/************************************************************
 * ==========================================================
 * UTILITAS KELOLA STATUS
 * ==========================================================
 ************************************************************/

function kelolaBarisStatus(sheetName, statusBaru, judul, satuAktif) {

  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);

  if (!sh || sh.getLastRow() < 2) {
    ui.alert('❌ Tidak ada data pada sheet ' + sheetName + '.');
    return;
  }

  const last = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const data = sh.getRange(2, 1, last - 1, lastCol).getValues();

  let daftar = '';
  data.forEach(function(row, i) {
    const noBaris = i + 2;
    const status = String(row[lastCol - 1] || '').trim().toUpperCase();
    let identitas = '';

    if (sheetName === CONFIG.SHEET_PERIODE) {
      identitas = row[1] + ' | ' + row[2] + ' - ' + row[3];
    } else if (sheetName === CONFIG.SHEET_SUMBER_REKAP) {
      identitas = row[1] + ' | ' + row[3] + ' | ' + row[5];
    } else if (sheetName === CONFIG.SHEET_SUMBER_MUTASI) {
      identitas = row[1] + ' | ' + row[2] + ' | ' + row[3];
    } else {
      identitas = row[1] || row[0];
    }

    daftar += noBaris + '. [' + status + '] ' + identitas + '\n';
  });

  const pilih = ui.prompt(
    judul,
    daftar + '\nKetik NOMOR BARIS yang ingin diubah:',
    ui.ButtonSet.OK_CANCEL
  );

  if (pilih.getSelectedButton() !== ui.Button.OK) return;

  const nomor = Number(pilih.getResponseText().trim());
  if (!Number.isInteger(nomor) || nomor < 2 || nomor > last) {
    ui.alert('❌ Nomor baris tidak valid.');
    return;
  }

  const row = sh.getRange(nomor, 1, 1, lastCol).getValues()[0];

  let identitas = '';
  if (sheetName === CONFIG.SHEET_PERIODE) {
    identitas = row[1];
  } else if (sheetName === CONFIG.SHEET_SUMBER_REKAP) {
    identitas = row[1] + ' - ' + row[3];
  } else if (sheetName === CONFIG.SHEET_SUMBER_MUTASI) {
    identitas = row[1] + ' - ' + row[2];
  }

  if (statusBaru === 'AKTIF') {
    const konfirmasi = ui.alert(
      judul,
      'Aktifkan:\n\n' + identitas +
        '\n\n' + (satuAktif
          ? 'Semua periode lain akan otomatis menjadi NONAKTIF.'
          : 'Data ini akan digunakan dalam proses berikutnya jika periodenya sesuai.') ,
      ui.ButtonSet.YES_NO
    );
    if (konfirmasi !== ui.Button.YES) return;

    if (satuAktif) {
      sh.getRange(2, lastCol, last - 1, 1).setValue('NONAKTIF');
    }
  } else {
    const konfirmasi = ui.alert(
      judul,
      'Nonaktifkan:\n\n' + identitas +
        '\n\nData tidak akan digunakan dalam proses pengecekan.',
      ui.ButtonSet.YES_NO
    );
    if (konfirmasi !== ui.Button.YES) return;
  }

  sh.getRange(nomor, lastCol).setValue(statusBaru);

  ui.alert('✅ Status berhasil diubah menjadi ' + statusBaru + '.');
}


function hapusBarisTerpilih(sheetName, judul, detailFn) {

  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);

  if (!sh || sh.getLastRow() < 2) {
    ui.alert('❌ Tidak ada data pada sheet ' + sheetName + '.');
    return;
  }

  const last = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const data = sh.getRange(2, 1, last - 1, lastCol).getValues();

  let daftar = '';
  data.forEach(function(row, i) {
    const noBaris = i + 2;
    let identitas = '';

    if (sheetName === CONFIG.SHEET_PERIODE) {
      identitas = row[1] + ' | ' + row[2] + ' - ' + row[3];
    } else if (sheetName === CONFIG.SHEET_SUMBER_REKAP) {
      identitas = row[1] + ' | ' + row[3] + ' | ' + row[5];
    } else if (sheetName === CONFIG.SHEET_SUMBER_MUTASI) {
      identitas = row[1] + ' | ' + row[2] + ' | ' + row[3];
    } else {
      identitas = row[1] || row[0];
    }

    daftar += noBaris + '. ' + identitas + '\n';
  });

  const pilih = ui.prompt(
    judul,
    daftar + '\nKetik NOMOR BARIS yang ingin dihapus:',
    ui.ButtonSet.OK_CANCEL
  );

  if (pilih.getSelectedButton() !== ui.Button.OK) return;

  const nomor = Number(pilih.getResponseText().trim());
  if (!Number.isInteger(nomor) || nomor < 2 || nomor > last) {
    ui.alert('❌ Nomor baris tidak valid.');
    return;
  }

  const row = sh.getRange(nomor, 1, 1, lastCol).getValues()[0];
  const detail = detailFn ? detailFn(row) : 'Data akan dihapus.';

  const konfirmasi = ui.alert(
    judul,
    detail + '\n\n⚠️ TINDAKAN INI TIDAK BISA DI-UNDO.',
    ui.ButtonSet.YES_NO
  );

  if (konfirmasi !== ui.Button.YES) return;

  sh.deleteRow(nomor);

  // Rapikan nomor pada kolom NO untuk tiga sheet sumber/periode.
  if (
    sheetName === CONFIG.SHEET_PERIODE ||
    sheetName === CONFIG.SHEET_SUMBER_REKAP ||
    sheetName === CONFIG.SHEET_SUMBER_MUTASI
  ) {
    rapikanNomorKolom(sh);
  }

  ui.alert('✅ Data berhasil dihapus dari ' + sheetName + '.');
}


function rapikanNomorKolom(sh) {

  if (!sh || sh.getLastRow() < 2) return;

  const jumlah = sh.getLastRow() - 1;
  const nomor = [];

  for (let i = 1; i <= jumlah; i++) {
    nomor.push([i]);
  }

  sh.getRange(2, 1, jumlah, 1).setValues(nomor);
}


/************************************************************
 * ==========================================================
 * HAPUS SUMBER MUTASI + DATA TERKAIT (PILIH NOMOR)
 * ==========================================================
 *
 * Menghapus baris terpilih di sheet SUMBER_MUTASI (nomor baris sheet,
 * boleh rentang/daftar seperti "85-90" atau "85,90,95" — format input
 * sama dengan hapusBarisMutasiPilihan di bawah), lalu OTOMATIS ikut
 * menghapus semua baris di sheet MUTASI dan RAW yang berasal dari
 * file itu (dicocokkan lewat BANK + NAMA FILE + PERIODE yang sama
 * persis dengan baris SUMBER_MUTASI yang dipilih).
 *
 * Ini jauh lebih praktis dibanding hapusBarisMutasiPilihan untuk
 * kasus "saya mau buang SEMUA hasil import satu file tertentu" —
 * user tidak perlu cari sendiri baris berapa saja di MUTASI yang
 * berasal dari file itu, cukup pilih baris di SUMBER_MUTASI (yang
 * satu baris = satu file, jauh lebih sedikit dan gampang dikenali).
 ************************************************************/

function hapusSumberMutasiPilihan() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const shSumber = ss.getSheetByName(CONFIG.SHEET_SUMBER_MUTASI);
  const shMutasi = ss.getSheetByName(CONFIG.SHEET_MUTASI);
  const shRaw = ss.getSheetByName(CONFIG.SHEET_RAW);

  if (!shSumber || shSumber.getLastRow() < 2) {
    ui.alert('❌ Sheet SUMBER_MUTASI belum memiliki data.');
    return;
  }

  const lastRow = shSumber.getLastRow();

  const prompt = ui.prompt(
    '🗑️ HAPUS SUMBER MUTASI + DATA TERKAIT',
    'Masukkan NOMOR BARIS SHEET SUMBER_MUTASI (sesuai nomor baris di sisi kiri Google Sheets) yang ingin dihapus.\n\n' +
    'Semua baris di sheet MUTASI dan RAW yang berasal dari file itu (BANK + NAMA FILE + PERIODE sama persis) akan ikut terhapus otomatis.\n\n' +
    'Boleh gabungan rentang dan nomor tunggal, dipisah koma. Contoh:\n' +
    '85-90       -> baris 85 sampai 90\n' +
    '85,90,95    -> hanya baris 85, 90, dan 95\n\n' +
    'Data SUMBER_MUTASI saat ini ada di baris 2 sampai ' + lastRow + '.',
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() !== ui.Button.OK) return;

  const inputText = String(prompt.getResponseText() || '').trim();
  if (!inputText) {
    ui.alert('❌ Input kosong.');
    return;
  }

  const rows = {};
  const formatSalahList = [];

  inputText.split(',').forEach(function(bagian) {
    const b = bagian.trim();
    if (!b) return;

    const rangeMatch = b.match(/^(\d+)\s*-\s*(\d+)$/);
    const tunggalMatch = b.match(/^(\d+)$/);

    if (rangeMatch) {
      let a = Number(rangeMatch[1]);
      let z = Number(rangeMatch[2]);
      if (a > z) { const tmp = a; a = z; z = tmp; }
      for (let n = a; n <= z; n++) rows[n] = true;
    } else if (tunggalMatch) {
      rows[Number(tunggalMatch[1])] = true;
    } else {
      formatSalahList.push(b);
    }
  });

  if (formatSalahList.length) {
    ui.alert(
      '❌ Format tidak dikenali: ' + formatSalahList.join(', ') +
      '\n\nGunakan contoh seperti "85-90" atau "85,90,95".'
    );
    return;
  }

  const nomorValid = [];
  const nomorDiabaikan = [];

  Object.keys(rows).map(Number).sort(function(a, b) { return a - b; }).forEach(function(n) {
    if (n >= 2 && n <= lastRow) {
      nomorValid.push(n);
    } else {
      nomorDiabaikan.push(n);
    }
  });

  if (!nomorValid.length) {
    ui.alert('❌ Tidak ada nomor baris valid (harus di antara 2 dan ' + lastRow + ').');
    return;
  }

  // Kunci pencocokan: BANK + NAMA FILE + PERIODE, sama persis dengan yang
  // dicatat catatSumberMutasi() saat file itu diimpor pertama kali, dan
  // sama persis dengan kolom SUMBER FILE/PERIODE (MUTASI) & NAMA FILE/
  // PERIODE (RAW) yang ditulis tulisImportMutasi().
  const kunciTerpilih = [];
  const previewSumber = [];

  nomorValid.forEach(function(n) {
    const r = shSumber.getRange(n, 1, 1, 7).getValues()[0];
    const bank = String(r[1] || '').trim().toUpperCase();
    const namaFile = String(r[2] || '').trim();
    const periodeNama = String(r[3] || '').trim();
    kunciTerpilih.push({ bank: bank, namaFile: namaFile, periode: periodeNama });
    previewSumber.push('Baris ' + n + ': [' + bank + '] ' + namaFile + ' (' + periodeNama + ')');
  });

  function cocokKunci(bank, namaFile, periode) {
    const b = String(bank || '').trim().toUpperCase();
    const f = String(namaFile || '').trim();
    const p = String(periode || '').trim();
    return kunciTerpilih.some(function(k) {
      return k.bank === b && k.namaFile === f && k.periode === p;
    });
  }

  // MUTASI: kolom C=BANK, H=SUMBER FILE, I=PERIODE (indeks 0-based: 2,7,8).
  const barisMutasiHapus = [];
  if (shMutasi && shMutasi.getLastRow() > 1) {
    const dataMutasi = shMutasi.getRange(2, 1, shMutasi.getLastRow() - 1, 11).getValues();
    dataMutasi.forEach(function(r, idx) {
      if (cocokKunci(r[2], r[7], r[8])) barisMutasiHapus.push(idx + 2);
    });
  }

  // RAW: kolom B=BANK, C=NAMA FILE, J=PERIODE (indeks 0-based: 1,2,9).
  const barisRawHapus = [];
  if (shRaw && shRaw.getLastRow() > 1) {
    const dataRaw = shRaw.getRange(2, 1, shRaw.getLastRow() - 1, 11).getValues();
    dataRaw.forEach(function(r, idx) {
      if (cocokKunci(r[1], r[2], r[9])) barisRawHapus.push(idx + 2);
    });
  }

  let pesan =
    'Akan menghapus ' + nomorValid.length + ' baris SUMBER_MUTASI:\n' +
    previewSumber.slice(0, 10).join('\n') +
    (previewSumber.length > 10 ? '\n... dan ' + (previewSumber.length - 10) + ' lainnya.' : '') +
    '\n\nBeserta data terkait:\n' +
    '- ' + barisMutasiHapus.length + ' baris di sheet MUTASI\n' +
    '- ' + barisRawHapus.length + ' baris di sheet RAW';

  if (nomorDiabaikan.length) {
    pesan += '\n\n⚠️ Diabaikan (di luar rentang data 2-' + lastRow + '): ' + nomorDiabaikan.join(', ');
  }

  pesan +=
    '\n\n⚠️ Setelah menghapus, jalankan 🔄 Cek Ulang Periode agar HASIL_PENGECEKAN ikut diperbarui.' +
    '\n⚠️ TINDAKAN INI TIDAK BISA DI-UNDO.';

  const konfirmasi = ui.alert('🗑️ HAPUS SUMBER MUTASI + DATA TERKAIT', pesan, ui.ButtonSet.YES_NO);
  if (konfirmasi !== ui.Button.YES) return;

  // Hapus dari nomor baris TERBESAR ke TERKECIL di MASING-MASING sheet
  // (baris yang dihapus sudah dihitung dari data sebelum ada penghapusan
  // apa pun, jadi ketiga daftar ini tidak saling memengaruhi urutannya).
  barisMutasiHapus.sort(function(a, b) { return b - a; }).forEach(function(n) { shMutasi.deleteRow(n); });
  barisRawHapus.sort(function(a, b) { return b - a; }).forEach(function(n) { shRaw.deleteRow(n); });
  nomorValid.sort(function(a, b) { return b - a; }).forEach(function(n) { shSumber.deleteRow(n); });

  ui.alert(
    '✅ Berhasil menghapus:\n' +
    '- ' + nomorValid.length + ' baris SUMBER_MUTASI\n' +
    '- ' + barisMutasiHapus.length + ' baris MUTASI\n' +
    '- ' + barisRawHapus.length + ' baris RAW'
  );
}


/************************************************************
 * ==========================================================
 * HAPUS BARIS MUTASI (PILIH NOMOR)
 * ==========================================================
 *
 * Menghapus baris tertentu di sheet MUTASI berdasarkan NOMOR BARIS
 * SHEET (bukan urutan data), bisa berupa rentang ("50-57"), nomor
 * tunggal dipisah koma ("50,52,55"), atau gabungan keduanya
 * ("50-53,60,65-67"). Dibuat karena menu hapus baris yang ada
 * (hapusBarisTerpilih) hanya bisa satu baris per kali jalan — untuk
 * MUTASI yang bisa berisi ratusan baris hasil import Bulk, ini
 * terlalu lambat kalau baris yang mau dibuang banyak & berurutan.
 *
 * Sheet RAW SENGAJA TIDAK ikut dihapus di sini: RAW adalah daftar
 * terpisah (ID sendiri, tidak sejajar baris dengan MUTASI), jadi
 * "baris 50 di MUTASI" tidak berarti apa-apa untuk RAW. Kalau ingin
 * sekaligus membuang data terkait di RAW dan catatan importnya di
 * SUMBER_MUTASI, pakai menu 🗑️ Hapus Sumber Mutasi + Data Terkait.
 ************************************************************/

function hapusBarisMutasiPilihan() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_MUTASI);

  if (!sh || sh.getLastRow() < 2) {
    ui.alert('❌ Sheet MUTASI belum memiliki data.');
    return;
  }

  const lastRow = sh.getLastRow();

  const prompt = ui.prompt(
    '🗑️ HAPUS BARIS MUTASI (PILIH NOMOR)',
    'Masukkan NOMOR BARIS SHEET (sesuai nomor baris di sisi kiri Google Sheets, bukan urutan data) yang ingin dihapus.\n\n' +
    'Boleh gabungan rentang dan nomor tunggal, dipisah koma. Contoh:\n' +
    '50-57          -> baris 50 sampai 57\n' +
    '50,52,55       -> hanya baris 50, 52, dan 55\n' +
    '50-53,60,65-67 -> gabungan rentang dan tunggal\n\n' +
    'Data MUTASI saat ini ada di baris 2 sampai ' + lastRow + '.',
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() !== ui.Button.OK) return;

  const inputText = String(prompt.getResponseText() || '').trim();
  if (!inputText) {
    ui.alert('❌ Input kosong.');
    return;
  }

  const rows = {};
  const formatSalahList = [];

  inputText.split(',').forEach(function(bagian) {
    const b = bagian.trim();
    if (!b) return;

    const rangeMatch = b.match(/^(\d+)\s*-\s*(\d+)$/);
    const tunggalMatch = b.match(/^(\d+)$/);

    if (rangeMatch) {
      let a = Number(rangeMatch[1]);
      let z = Number(rangeMatch[2]);
      if (a > z) { const tmp = a; a = z; z = tmp; }
      for (let n = a; n <= z; n++) rows[n] = true;
    } else if (tunggalMatch) {
      rows[Number(tunggalMatch[1])] = true;
    } else {
      formatSalahList.push(b);
    }
  });

  if (formatSalahList.length) {
    ui.alert(
      '❌ Format tidak dikenali: ' + formatSalahList.join(', ') +
      '\n\nGunakan contoh seperti "50-57" atau "50,52,55".'
    );
    return;
  }

  const nomorValid = [];
  const nomorDiabaikan = [];

  Object.keys(rows).map(Number).sort(function(a, b) { return a - b; }).forEach(function(n) {
    // Baris 1 (header) tidak boleh terhapus lewat menu ini.
    if (n >= 2 && n <= lastRow) {
      nomorValid.push(n);
    } else {
      nomorDiabaikan.push(n);
    }
  });

  if (!nomorValid.length) {
    ui.alert('❌ Tidak ada nomor baris valid (harus di antara 2 dan ' + lastRow + ').');
    return;
  }

  const PREVIEW_MAKS = 10;
  let preview = '';
  nomorValid.slice(0, PREVIEW_MAKS).forEach(function(n) {
    const nilai = sh.getRange(n, 1, 1, 6).getValues()[0];
    const ringkas = String(nilai[5] || nilai[0] || '(kosong)').substring(0, 70);
    preview += '\nBaris ' + n + ': ' + ringkas;
  });
  if (nomorValid.length > PREVIEW_MAKS) {
    preview += '\n... dan ' + (nomorValid.length - PREVIEW_MAKS) + ' baris lainnya.';
  }

  let pesan =
    'Akan menghapus ' + nomorValid.length + ' baris dari sheet MUTASI:\n' +
    preview;

  if (nomorDiabaikan.length) {
    pesan += '\n\n⚠️ Diabaikan (di luar rentang data 2-' + lastRow + '): ' +
      nomorDiabaikan.join(', ');
  }

  pesan +=
    '\n\n⚠️ Sheet RAW TIDAK ikut dihapus di sini (baris RAW tidak sejajar dengan MUTASI).' +
    '\n⚠️ Setelah menghapus, jalankan 🔄 Cek Ulang Periode agar HASIL_PENGECEKAN ikut diperbarui.' +
    '\n⚠️ TINDAKAN INI TIDAK BISA DI-UNDO.';

  const konfirmasi = ui.alert('🗑️ HAPUS BARIS MUTASI', pesan, ui.ButtonSet.YES_NO);
  if (konfirmasi !== ui.Button.YES) return;

  // Hapus dari nomor baris TERBESAR ke TERKECIL, supaya nomor baris yang
  // belum diproses tidak ikut bergeser saat baris di atasnya sudah dihapus.
  nomorValid.sort(function(a, b) { return b - a; });
  nomorValid.forEach(function(n) {
    sh.deleteRow(n);
  });

  ui.alert('✅ ' + nomorValid.length + ' baris berhasil dihapus dari sheet MUTASI.');
}


/************************************************************
 * ==========================================================
 * BERSIHKAN MUTASI
 * ==========================================================
 ************************************************************/

function bersihkanMutasi() {

  const ui =
    SpreadsheetApp.getUi();

  const periode =
    getPeriodeAktif();

  if (!periode) {

    ui.alert(
      '❌ Tidak ada periode aktif.'
    );

    return;

  }

  const jawab =
    ui.alert(

      '🧹 BERSIHKAN MUTASI',

      'Hapus seluruh MUTASI dan RAW untuk periode:\n\n' +
      periode.nama +
      '\n\n' +
      'SUMBER_MUTASI juga akan ditandai NONAKTIF.\n\n' +
      'MASTER_KARYAWAN dan Rekap PIC tidak dihapus.',

      ui.ButtonSet.YES_NO

    );

  if (
    jawab !==
    ui.Button.YES
  ) {

    return;

  }

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const mutasi =
    ss.getSheetByName(
      CONFIG.SHEET_MUTASI
    );

  const raw =
    ss.getSheetByName(
      CONFIG.SHEET_RAW
    );

  if (mutasi) {

    hapusBarisBerdasarkanPeriode(
      mutasi,
      9,
      periode.nama
    );

  }

  if (raw) {

    hapusBarisBerdasarkanPeriode(
      raw,
      10,
      periode.nama
    );

  }

  const sumber =
    ss.getSheetByName(
      CONFIG.SHEET_SUMBER_MUTASI
    );

  if (sumber) {

    const last =
      sumber.getLastRow();

    if (
      last > 1
    ) {

      const data =
        sumber
          .getRange(
            2,
            1,
            last - 1,
            7
          )
          .getValues();

      data.forEach(
        function(row, i) {

          if (
            String(
              row[3] || ''
            ).trim() ===
            periode.nama
          ) {

            sumber
              .getRange(
                i + 2,
                7
              )
              .setValue(
                'NONAKTIF'
              );

          }

        }
      );

    }

  }

  ui.alert(
    '✅ MUTASI PERIODE\n\n' +
    periode.nama +
    '\n\nSUDAH DIBERSIHKAN.'
  );

}


/************************************************************
 * ==========================================================
 * HAPUS BARIS BERDASARKAN PERIODE
 * ==========================================================
 ************************************************************/

function hapusBarisBerdasarkanPeriode(
  sheet,
  kolomPeriode,
  periode
) {

  const last =
    sheet.getLastRow();

  if (
    last < 2
  ) {
    return;
  }

  const data =
    sheet
      .getRange(
        2,
        1,
        last - 1,
        sheet.getLastColumn()
      )
      .getValues();

  const keep = [];

  data.forEach(
    function(row) {

      if (
        String(
          row[kolomPeriode - 1] || ''
        ).trim() !==
        periode
      ) {

        keep.push(
          row
        );

      }

    }
  );

  sheet
    .getRange(
      2,
      1,
      last - 1,
      sheet.getLastColumn()
    )
    .clearContent();

  if (
    keep.length
  ) {

    sheet
      .getRange(
        2,
        1,
        keep.length,
        sheet.getLastColumn()
      )
      .setValues(
        keep
      );

  }

}


/************************************************************
 * ==========================================================
 * BERSIHKAN HASIL
 * ==========================================================
 ************************************************************/

function bersihkanHasilPengecekan() {

  const ui =
    SpreadsheetApp.getUi();

  const jawab =
    ui.alert(

      '🧹 BERSIHKAN HASIL',

      'Hapus seluruh hasil HASIL_PENGECEKAN?',

      ui.ButtonSet.YES_NO

    );

  if (
    jawab !==
    ui.Button.YES
  ) {

    return;

  }

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  [
    CONFIG.SHEET_HASIL,
    CONFIG.SHEET_CEK
  ]
  .forEach(
    function(nama) {

      const sh =
        ss.getSheetByName(
          nama
        );

      if (
        sh &&
        sh.getLastRow() > 1
      ) {

        sh
          .getRange(
            2,
            1,
            sh.getLastRow() - 1,
            sh.getLastColumn()
          )
          .clearContent();

      }

    }
  );

  ui.alert(
    '✅ HASIL PENGECEKAN SUDAH DIBERSIHKAN.'
  );

}


/************************************************************
 * ==========================================================
 * STRUKTUR LAMA
 * ==========================================================
 ************************************************************/

function pastikanSheetPeriodeCepat(ss){
  let sh=ss.getSheetByName(CONFIG.SHEET_PERIODE);
  if(!sh){
    sh=ss.insertSheet(CONFIG.SHEET_PERIODE);
    sh.getRange(1,1,1,5).setValues([['NO','NAMA PERIODE','TANGGAL MULAI','TANGGAL SELESAI','STATUS']]);
    formatHeader(sh,5);
  }
  return sh;
}

function pastikanStrukturTambahanCepat(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let m=ss.getSheetByName(CONFIG.SHEET_MUTASI);
  if(m){
    if(m.getLastColumn()<11){
      m.insertColumnAfter(m.getLastColumn());
    }
    const h=String(m.getRange(1,11).getValue()||'').trim();
    if(h!=='STATUS PROSES') m.getRange(1,11).setValue('STATUS PROSES');
  }
  let h=ss.getSheetByName(CONFIG.SHEET_HASIL);
  if(h){
    while(h.getLastColumn()<21) h.insertColumnAfter(h.getLastColumn());
    const hdr=h.getRange(1,19,1,3).getValues()[0];
    if(String(hdr[0]||'').trim()!=='CEK MANUAL' || String(hdr[1]||'').trim()!=='HASIL MANUAL' || String(hdr[2]||'').trim()!=='STATUS FINAL'){
      h.getRange(1,19,1,3).setValues([['CEK MANUAL','HASIL MANUAL','STATUS FINAL']]);
    }
  }
  let r=ss.getSheetByName('REKAP_AKHIR');
  if(!r){
    r=ss.insertSheet('REKAP_AKHIR');
    r.getRange(1,1,1,5).setValues([['NO','TANGGAL MUTASI','NAMA KARYAWAN','NAMA LOKASI','NOMINAL']]);
    formatHeader(r,5);
  }
}

function migrasiStrukturV5Plus(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let m=ss.getSheetByName(CONFIG.SHEET_MUTASI);if(m){if(m.getLastColumn()<11)m.insertColumnAfter(10);m.getRange(1,11).setValue('STATUS PROSES');}
  let h=ss.getSheetByName(CONFIG.SHEET_HASIL);if(h){while(h.getLastColumn()<21)h.insertColumnAfter(h.getLastColumn());h.getRange(1,19,1,3).setValues([['CEK MANUAL','HASIL MANUAL','STATUS FINAL']]);}
  let r=ss.getSheetByName('REKAP_AKHIR');if(!r){r=ss.insertSheet('REKAP_AKHIR');r.getRange(1,1,1,5).setValues([['NO','TANGGAL MUTASI','NAMA KARYAWAN','NAMA LOKASI','NOMINAL']]);}
}

function buatStrukturSistemDiam() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const daftar = [

    [
      CONFIG.SHEET_PERIODE,
      [
        'NO',
        'NAMA PERIODE',
        'TANGGAL MULAI',
        'TANGGAL SELESAI',
        'STATUS'
      ]
    ],

    [
      CONFIG.SHEET_SUMBER_MUTASI,
      [
        'NO',
        'BANK',
        'NAMA FILE',
        'PERIODE',
        'TANGGAL IMPORT',
        'TOTAL TRANSAKSI',
        'STATUS'
      ]
    ],

    [
      CONFIG.SHEET_SUMBER_REKAP,
      [
        'NO',
        'PIC',
        'LINK REKAP',
        'NAMA FILE',
        'SHEET REKAP',
        'PERIODE',
        'STATUS'
      ]
    ],

    [
      CONFIG.SHEET_MUTASI,
      [
        'ID MUTASI',
        'TANGGAL',
        'BANK',
        'NO REK PT',
        'NAMA REKENING PT',
        'KETERANGAN',
        'NOMINAL',
        'SUMBER FILE',
        'PERIODE',
        'STATUS PEMAKAIAN',
        'STATUS PROSES'
      ]
    ],

    [
      CONFIG.SHEET_RAW,
      [
        'ID RAW',
        'BANK',
        'NAMA FILE',
        'TANGGAL ASLI',
        'NO REK PT',
        'NAMA REKENING PT',
        'KETERANGAN ASLI',
        'CABANG',
        'NOMINAL',
        'PERIODE',
        'STATUS'
      ]
    ],

    [
      'REKAP_AKHIR',
      [
        'NO',
        'TANGGAL MUTASI',
        'NAMA KARYAWAN',
        'NAMA LOKASI',
        'NOMINAL'
      ]
    ],

    [
      CONFIG.SHEET_MASTER,
      [
        'NAMA KARYAWAN',
        'NAMA LOKASI KERJA'
      ]
    ],

    [
      CONFIG.SHEET_HASIL,
      [
        'NO',
        'PIC',
        'LOKASI',
        'NAMA REKAP',
        'NAMA MUTASI',
        'NOMINAL REKAP',
        'NOMINAL MUTASI',
        'SELISIH',
        'BANK',
        'TANGGAL MUTASI',
        'SUMBER MUTASI',
        'SKOR NAMA',
        'SKOR LOKASI',
        'STATUS NAMA',
        'STATUS NOMINAL',
        'STATUS LOKASI',
        'STATUS AKHIR',
        'ACUAN TRANSFER GANDA'
      ]
    ]

  ];

  daftar.forEach(
    function(item) {

      buatSheet(
        item[0],
        item[1]
      );

    }
  );

  pastikanStrukturTambahanCepat();

}


/************************************************************
 * ==========================================================
 * FORMAT MUTASI
 * ==========================================================
 ************************************************************/

function formatMutasi() {

  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();

  const mutasi =
    ss.getSheetByName(
      CONFIG.SHEET_MUTASI
    );

  const raw =
    ss.getSheetByName(
      CONFIG.SHEET_RAW
    );

  if (
    mutasi &&
    mutasi.getLastRow() > 1
  ) {

    mutasi
      .getRange(
        2,
        2,
        mutasi.getLastRow() - 1,
        1
      )
      .setNumberFormat(
        'dd/MM/yyyy'
      );

    mutasi
      .getRange(
        2,
        7,
        mutasi.getLastRow() - 1,
        1
      )
      .setNumberFormat(
        '#,##0'
      );

    mutasi.autoResizeColumns(
      1,
      11
    );

    buatFilterJikaPerlu(
      mutasi,
      11
    );

  }

  if (
    raw &&
    raw.getLastRow() > 1
  ) {

    raw
      .getRange(
        2,
        9,
        raw.getLastRow() - 1,
        1
      )
      .setNumberFormat(
        '#,##0'
      );

    raw.autoResizeColumns(
      1,
      11
    );

    buatFilterJikaPerlu(
      raw,
      11
    );

  }

}


/************************************************************
 * ==========================================================
 * FILTER
 * ==========================================================
 ************************************************************/

function buatFilterJikaPerlu(
  sheet,
  jumlahKolom
) {

  if (
    !sheet ||
    sheet.getLastRow() < 2
  ) {
    return;
  }

  const filter =
    sheet.getFilter();

  if (
    filter
  ) {

    filter.remove();

  }

  sheet
    .getRange(
      1,
      1,
      sheet.getLastRow(),
      jumlahKolom
    )
    .createFilter();

}


/************************************************************
 * ==========================================================
 * FORMAT HEADER
 * ==========================================================
 ************************************************************/

function formatHeader(
  sheet,
  jumlahKolom
) {

  sheet
    .getRange(
      1,
      1,
      1,
      jumlahKolom
    )
    .setFontWeight(
      'bold'
    );

  sheet
    .getRange(
      1,
      1,
      1,
      jumlahKolom
    )
    .setBackground(
      '#d9ead3'
    );

  sheet.setFrozenRows(
    1
  );

  sheet.autoResizeColumns(
    1,
    jumlahKolom
  );

}


/************************************************************
 * ==========================================================
 * CARI HEADER BCA
 * ==========================================================
 ************************************************************/

function cariHeaderBCA(
  html,
  label
) {

  const regex =
    new RegExp(

      '<TD[^>]*>' +
      '[\\s\\S]*?' +
      escapeRegex(
        label
      ) +
      '[\\s\\S]*?' +
      '<\\/TD>' +
      '\\s*' +
      '<TD[^>]*>' +
      '([\\s\\S]*?)' +
      '<\\/TD>',

      'i'

    );

  const match =
    html.match(
      regex
    );

  if (
    match
  ) {

    return htmlToText(
      match[1]
    );

  }

  return '';

}


/************************************************************
 * ==========================================================
 * HTML TO TEXT
 * ==========================================================
 ************************************************************/

function htmlToText(
  html
) {

  return String(
    html || ''
  )

    .replace(
      /&nbsp;/gi,
      ' '
    )

    .replace(
      /&amp;/gi,
      '&'
    )

    .replace(
      /&lt;/gi,
      '<'
    )

    .replace(
      /&gt;/gi,
      '>'
    )

    .replace(
      /&#39;/gi,
      "'"
    )

    .replace(
      /&quot;/gi,
      '"'
    )

    .replace(
      /<[^>]*>/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();

}


/************************************************************
 * ==========================================================
 * PARSE NOMINAL BCA
 * ==========================================================
 ************************************************************/

function parseNominalBCA(
  value
) {

  let text =
    String(
      value || ''
    ).trim();

  text =
    text.replace(
      /\b(DB|CR|DR)\b/gi,
      ''
    );

  text =
    text.replace(
      /[^\d.,]/g,
      ''
    );

  if (!text) {
    return null;
  }

  text =
    text.replace(
      /,/g,
      ''
    );

  const number =
    Number(
      text
    );

  return isNaN(number)
    ? null
    : number;

}


/************************************************************
 * ==========================================================
 * PARSE TANGGAL BCA
 * ==========================================================
 ************************************************************/

function parseTanggalAtauPend(
  value
) {

  const text =
    String(
      value || ''
    ).trim();

  if (
    /^PEND$/i.test(
      text
    )
  ) {

    return 'PEND';

  }

  const match =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (
    !match
  ) {

    return text;

  }

  return new Date(

    Number(
      match[3]
    ),

    Number(
      match[2]
    ) - 1,

    Number(
      match[1]
    )

  );

}


/************************************************************
 * ==========================================================
 * AMBIL ANGKA
 * ==========================================================
 ************************************************************/

function ambilAngka(
  value
) {

  if (
    value === null ||
    value === '' ||
    typeof value === 'undefined'
  ) {

    return null;

  }

  if (
    typeof value === 'number'
  ) {

    return isNaN(value)
      ? null
      : value;

  }

  const n =
    parseNominalUmum(
      value
    );

  return n;

}


/************************************************************
 * ==========================================================
 * ID
 * ==========================================================
 ************************************************************/

function buatID(
  bank,
  file,
  index
) {

  const waktu =
    new Date()
      .getTime();

  const clean =
    String(
      file || ''
    )
      .replace(
        /[^A-Z0-9]/gi,
        ''
      )
      .substring(
        0,
        15
      );

  return (

    bank +
    '-' +
    waktu +
    '-' +
    index +
    '-' +
    clean

  );

}


/************************************************************
 * ==========================================================
 * PARSE TANGGAL INPUT
 * ==========================================================
 ************************************************************/

function parseTanggalInput(
  text
) {

  const match =
    String(
      text || ''
    )
      .trim()
      .match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

  if (
    !match
  ) {

    return null;

  }

  return new Date(

    Number(
      match[3]
    ),

    Number(
      match[2]
    ) - 1,

    Number(
      match[1]
    )

  );

}


/************************************************************
 * ==========================================================
 * FORMAT TANGGAL
 * ==========================================================
 ************************************************************/

function formatTanggal(
  date
) {

  if (
    !date
  ) {

    return '';

  }

  return Utilities.formatDate(

    date,

    Session.getScriptTimeZone(),

    'dd/MM/yyyy'

  );

}


/************************************************************
 * ==========================================================
 * ESCAPE HTML
 * ==========================================================
 ************************************************************/

function escapeHtml(
  text
) {

  return String(
    text || ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/************************************************************
 * ==========================================================
 * SELESAI
 * ==========================================================
 ************************************************************/
/************************************************************
 * ==========================================================
 * FIX21 — IDENTITAS MANUAL STABIL
 * ==========================================================
 *
 * S/T/U disimpan berdasarkan:
 * PIC + LOKASI + NAMA REKAP + NOMINAL REKAP
 *
 * Jadi bila pasangan MUTASI berubah saat pengecekan ulang,
 * catatan manual tetap dipertahankan.
 ************************************************************/

function FIX21_kunciManual_(r) {
  return [
    r[1],
    r[2],
    r[3],
    r[5]
  ].map(function(x) {
    return String(
      x instanceof Date ? x.getTime() : (x == null ? '' : x)
    ).trim().toUpperCase();
  }).join('¦');
}

function FIX21_bacaManualLama_(sh) {
  const map = {};

  if (!sh || sh.getLastRow() < 2) return map;

  const data = sh.getRange(
    2,
    1,
    sh.getLastRow() - 1,
    21
  ).getValues();

  data.forEach(function(r) {
    map[FIX21_kunciManual_(r)] = {
      s: r[18] || false,
      t: r[19] || '',
      u: r[20] || ''
    };
  });

  return map;
}

/************************************************************
 * ==========================================================
 * UPDATE CEK MANUAL
 * ==========================================================
 * Hanya memperbarui kolom U (STATUS FINAL).
 * Kolom S (checkbox) dan T (HASIL MANUAL) tidak pernah dihapus
 * atau ditimpa oleh fungsi ini.
 *
 * Prioritas:
 * 1. T = SESUAI        -> U = DONE
 * 2. T = BELUM SESUAI  -> U = BELUM CLEAR
 * 3. Jika S dicentang dan T kosong:
 *      Q = SESUAI -> U = DONE
 *      selain itu -> U tidak diubah
 * 4. Jika T kosong dan U kosong:
 *      Q = SESUAI -> U = DONE
 *
 * Baris yang sudah T = SESUAI/BELUM SESUAI dan U sudah benar
 * dilewati agar proses tetap ringan.
 ************************************************************/
function updateCekManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sh = ss.getSheetByName(CONFIG.SHEET_HASIL);

  if (!sh) {
    ui.alert('❌ Sheet HASIL_PENGECEKAN tidak ditemukan.');
    return;
  }

  if (sh.getLastRow() < 2) {
    ui.alert('ℹ️ Belum ada data di HASIL_PENGECEKAN.');
    return;
  }

  const lastRow = sh.getLastRow();
  const data = sh.getRange(2, 1, lastRow - 1, 21).getValues();
  const uValues = data.map(function(r) { return [r[20] || '']; });

  let changed = 0;
  let skipped = 0;
  let manualDone = 0;
  let manualNotDone = 0;
  let autoDone = 0;

  data.forEach(function(r, i) {
    const checked = r[18] === true || String(r[18] || '').toUpperCase() === 'TRUE' || String(r[18] || '').trim() === '✓';
    const manual = String(r[19] || '').trim().toUpperCase();
    const statusAkhir = String(r[16] || '').trim().toUpperCase();
    const current = String(r[20] || '').trim().toUpperCase();

    let next = r[20] || '';
    let shouldProcess = false;

    // Hasil manual selalu memiliki prioritas tertinggi.
    if (manual === 'SESUAI') {
      next = 'DONE';
      shouldProcess = true;
      manualDone++;
    } else if (manual === 'BELUM SESUAI') {
      next = 'BELUM CLEAR';
      shouldProcess = true;
      manualNotDone++;
    } else if (checked && !manual) {
      // Checkbox sudah dicentang tetapi hasil manual belum diisi.
      // Jangan menebak hasil selain kasus Q sudah otomatis SESUAI.
      if (statusAkhir.indexOf('🟢 SESUAI') === 0 || statusAkhir === 'SESUAI') {
        next = 'DONE';
        shouldProcess = true;
        autoDone++;
      }
    } else if (!manual && !current && (statusAkhir.indexOf('🟢 SESUAI') === 0 || statusAkhir === 'SESUAI')) {
      // Otomatis menandai hasil yang memang sudah SESUAI,
      // tetapi hanya jika U masih kosong.
      next = 'DONE';
      shouldProcess = true;
      autoDone++;
    }

    if (shouldProcess) {
      if (String(next).trim().toUpperCase() !== current) {
        uValues[i][0] = next;
        changed++;
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
  });

  // Hanya kolom U yang ditulis kembali. S dan T aman.
  sh.getRange(2, 21, uValues.length, 1).setValues(uValues);

  ui.alert(
    '☑️ UPDATE CEK MANUAL SELESAI\n\n' +
    'Baris diperbarui : ' + changed + '\n' +
    'Manual SESUAI     : ' + manualDone + '\n' +
    'Manual BELUM SESUAI: ' + manualNotDone + '\n' +
    'Otomatis DONE      : ' + autoDone + '\n' +
    'Baris dilewati     : ' + skipped + '\n\n' +
    'Kolom S dan T tidak diubah.'
  );
}

/************************************************************
 * V8.2 — REKAP LOCATION-AWARE MATCH ENGINE
 *
 * PARSER MUTASI / IMPORT BANK TIDAK DIUBAH.
 * Mesin ini hanya mengganti sumber REKAP dan pencocokan untuk
 * menu pengecekan, agar REKAP lokasi yang relevan benar-benar
 * dibaca sebelum dibandingkan dengan MUTASI.
 ************************************************************/

function bacaSemuaRekapPIC_V82(periode,dataMutasi){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const sh=ss.getSheetByName(CONFIG.SHEET_SUMBER_REKAP);
  if(!sh||sh.getLastRow()<2)return [];

  const rows=sh.getRange(2,1,sh.getLastRow()-1,7).getValues();
  const hasil=[];
  const seen={};

  rows.forEach(function(row){
    const pic=String(row[1]||'').trim();
    const url=String(row[2]||'').trim();
    const namaFile=String(row[3]||'').trim();
    const namaSheet=String(row[4]||'').trim();
    const periodeSumber=String(row[5]||'').trim();
    const status=String(row[6]||'').trim().toUpperCase();

    if(status!=='AKTIF')return;
    if(normalisasiPeriodeMatch_(periodeSumber)!==normalisasiPeriodeMatch_(periode.nama))return;
    if(!url)return;

    try{
      const wb=SpreadsheetApp.openByUrl(url);
      const sheets=wb.getSheets();
      const dipilih=[];
      const sudah={};

      function tambah(sheet){
        if(!sheet)return;
        const id=String(sheet.getSheetId());
        if(sudah[id])return;
        sudah[id]=true;
        dipilih.push(sheet);
      }

      // Sheet yang tercatat di SUMBER_REKAP selalu dibaca lebih dahulu.
      if(namaSheet)tambah(wb.getSheetByName(namaSheet));

      // Rekap workbook biasanya menyimpan beberapa bulan sebagai tab.
      // Karena itu jangan membaca JUNI/MEI saat periode aktif JULI.
      // Sheet yang tercatat di SUMBER_REKAP tetap diprioritaskan, lalu
      // tab yang namanya memuat bulan periode aktif ikut dibaca.
      let adaTabPeriode=false;
      sheets.forEach(function(sheet){
        if(sudah[String(sheet.getSheetId())])return;
        if(sheet.getLastRow()<2)return;

        const n=String(sheet.getName()||'').toUpperCase();
        if(/MASTER|CONFIG|SETTING|MENU|RAW|MUTASI|PERIODE|SUMBER/.test(n))return;

        if(sheetNamaSesuaiPeriodeAktif_V86_(n,periode.nama)){
          tambah(sheet);
          adaTabPeriode=true;
        }
      });

      // Bila workbook tidak menggunakan nama tab berdasarkan bulan,
      // barulah scan seluruh tab non-sistem sebagai fallback.
      if(!adaTabPeriode && !dipilih.length){
        sheets.forEach(function(sheet){
          if(sudah[String(sheet.getSheetId())])return;
          if(sheet.getLastRow()<2)return;
          const n=String(sheet.getName()||'').toUpperCase();
          if(/MASTER|CONFIG|SETTING|MENU|RAW|MUTASI|PERIODE|SUMBER/.test(n))return;
          tambah(sheet);
        });
      }

      dipilih.forEach(function(sheet){
        let dataPIC=[];
        try{
          dataPIC=bacaRekapGaji(sheet);
        }catch(e){
          Logger.log('V8.6 sheet '+sheet.getName()+' gagal: '+e.message);
          return;
        }

        dataPIC.forEach(function(item){
          if(!item.nama||item.diterima<=0)return;

          const key=[
            pic,
            namaFile,
            sheet.getSheetId(),
            item.row,
            item.nama,
            item.lokasi,
            item.diterima,
            item.bank
          ].map(function(x){
            return String(x==null?'':x).trim().toUpperCase();
          }).join('¦');

          if(seen[key])return;
          seen[key]=true;

          hasil.push({
            pic:pic,
            file:namaFile,
            sheet:sheet.getName(),
            lokasi:item.lokasi,
            nama:item.nama,
            diterima:item.diterima,
            bank:item.bank||'',
            row:item.row
          });
        });
      });

    }catch(e){
      Logger.log('V8.6 Rekap PIC gagal: '+pic+' - '+e.message);
    }
  });

  return hasil;
}

function sheetNamaSesuaiPeriodeAktif_V86_(sheetName,periodeName){
  const s=normalisasiNamaMatch_(sheetName||'');
  const p=normalisasiNamaMatch_(periodeName||'');
  const bulan={
    JANUARI:['JANUARI','JAN'],FEBRUARI:['FEBRUARI','FEB'],MARET:['MARET','MAR'],
    APRIL:['APRIL','APR'],MEI:['MEI','MAY'],JUNI:['JUNI','JUN'],
    JULI:['JULI','JUL'],AGUSTUS:['AGUSTUS','AGU','AUG'],
    SEPTEMBER:['SEPTEMBER','SEP'],OKTOBER:['OKTOBER','OKT','OCT'],
    NOVEMBER:['NOVEMBER','NOV'],DESEMBER:['DESEMBER','DES','DEC']
  };

  let cocokBulan=false;
  Object.keys(bulan).some(function(nama){
    const adaDiPeriode=bulan[nama].some(function(v){return new RegExp('\\b'+v+'\\b').test(p);});
    const adaDiSheet=bulan[nama].some(function(v){return new RegExp('\\b'+v+'\\b').test(s);});
    if(adaDiPeriode && adaDiSheet){cocokBulan=true;return true;}
    return false;
  });

  if(!cocokBulan)return false;

  const yp=p.match(/\b20\d{2}\b/);
  const ys=s.match(/\b20\d{2}\b/);
  if(yp&&ys)return Number(yp[0])===Number(ys[0]);
  return true;
}

function buatPetunjukLokasiMutasi_V82(dataMutasi){
  const out=[]; const seen={};
  dataMutasi.forEach(function(m){
    let s=normalisasiNamaMatch_([m.sumber||'',m.keterangan||''].join(' '));
    s=s.replace(/\bMUTASI\b|\bGAJI\b|\bTRANSFER\b|\bINHOUSE\b|\bBULK\b|\bSUCCESS\b|\bIDR\b/g,' ')
      .replace(/\bJULI\b|\bAGUSTUS\b|\bSEPTEMBER\b|\bOKTOBER\b|\bNOVEMBER\b|\bDESEMBER\b|\bJANUARI\b|\bFEBRUARI\b|\bMARET\b|\bAPRIL\b|\bMEI\b|\bJUNI\b/g,' ')
      .replace(/\b\d{1,4}\b/g,' ').replace(/\s+/g,' ').trim();
    const tokens=tokenMatch_(s); if(tokens.length<2)return;
    // Buang token nama penerima dengan memprioritaskan pola lokasi yang lazim.
    const key=tokens.slice(0,8).join(' '); const norm=normalisasiNamaMatch_(key);
    if(!norm||seen[norm])return; seen[norm]=true;
    out.push({norm:norm,text:key,tokens:tokens});
  });
  return out;
}

function skorNamaSheetKeLokasiV82_(sheetName,hints){
  if(!sheetName||!hints||!hints.length)return 0;
  const a=tokenMatch_(sheetName); if(!a.length)return 0; let best=0;
  hints.forEach(function(h){
    const b=h.tokens||[]; if(!b.length)return; let hit=0;
    b.forEach(function(t){if(a.indexOf(t)!==-1)hit++;});
    best=Math.max(best,hit/b.length);
    const sa=normalisasiNamaMatch_(sheetName),sb=normalisasiNamaMatch_(h.text);
    if(sa&&sb&&(sa===sb||sa.indexOf(sb)!==-1||sb.indexOf(sa)!==-1))best=1;
  });
  return Math.min(1,best);
}

function skorLokasiKePetunjukV82_(lokasi,hints){
  if(!lokasi||!hints||!hints.length)return 0;
  const a=tokenMatch_(lokasi); if(!a.length)return 0; let best=0;
  hints.forEach(function(h){
    const b=h.tokens||[]; if(!b.length)return; let hit=0;
    a.forEach(function(t){
      if(b.indexOf(t)!==-1){hit++;return;}
      if(t.length>=4){for(let i=0;i<b.length;i++){if(b[i].indexOf(t)===0||t.indexOf(b[i])===0){hit++;break;}}}
    });
    best=Math.max(best,hit/a.length);
    const na=normalisasiNamaMatch_(lokasi),nb=normalisasiNamaMatch_(h.text);
    if(na&&nb&&(na===nb||na.indexOf(nb)!==-1||nb.indexOf(na)!==-1))best=1;
  });
  return Math.min(1,best);
}

/************************************************************
 * ==========================================================
 * KEMIRIPAN TOKEN (TERPOTONG + TYPO/OCR)
 * ==========================================================
 *
 * Selain token identik dan token terpotong (prefix), nama dari
 * PDF bank kadang berbeda tipis dari master REKAP karena typo
 * input, salah eja, atau hasil OCR (mis. "PRAYOGO" vs "PRAYOGA",
 * "PRIDA" vs "PIRDA"). tokenMiripV86_ menambahkan toleransi jarak
 * edit kecil untuk token yang panjangnya berdekatan, supaya kasus
 * seperti itu tidak selalu jatuh ke status PERLU CEK manual.
 ************************************************************/

function levenshteinV86_(a, b) {
  a = String(a || '');
  b = String(b || '');

  if (a === b) return 0;

  const al = a.length;
  const bl = b.length;

  if (!al) return bl;
  if (!bl) return al;

  let prev = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    const cur = new Array(bl + 1);
    cur[0] = i;

    for (let j = 1; j <= bl; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + cost
      );
    }

    prev = cur;
  }

  return prev[bl];
}

function tokenMiripV86_(t, x) {
  if (!t || !x) return false;
  if (t === x) return true;

  // Terpotong (word-wrap / singkatan): salah satu adalah awalan dari yang lain.
  if (t.length >= 3 && x.length >= 3 && (x.indexOf(t) === 0 || t.indexOf(x) === 0)) {
    return true;
  }

  // Typo/OCR kecil: panjang berdekatan (selisih maksimal 1) dan jarak edit kecil.
  if (t.length >= 5 && x.length >= 5 && Math.abs(t.length - x.length) <= 1) {
    const batas = Math.max(t.length, x.length) >= 8 ? 2 : 1;
    if (levenshteinV86_(t, x) <= batas) return true;
  }

  return false;
}

function cocokkanSemua_V82(dataRekap, dataMutasi) {
  /*
   * ==========================================================
   * V8.6 — MATCH NAMA + LOKASI + NOMINAL + BANK
   * ==========================================================
   *
   * PARSER / IMPORT MUTASI TIDAK DISENTUH.
   * Mesin ini hanya bekerja setelah data MUTASI sudah masuk.
   *
   * Sumber identitas REKAP:
   *   PIC       -> SUMBER_REKAP
   *   LOKASI    -> blok PERINCIAN GAJI pada rekap PIC
   *   NAMA      -> kolom B
   *   NOMINAL   -> DITERIMA KARYAWAN berdasarkan header aktual
   *   BANK      -> NAMA BANK berdasarkan header aktual
   *
   * Sumber identitas MUTASI:
   *   NAMA MUTASI, NOMINAL, BANK, TANGGAL, SUMBER -> MUTASI
   *
   * Pemilihan kandidat memakai empat indikator:
   *   NAMA    45%
   *   LOKASI  30%
   *   NOMINAL 20%
   *   BANK     5%
   *
   * NOMINAL BOLEH BERBEDA SAAT MENCARI KANDIDAT, tetapi hanya
   * nominal tepat yang dianggap SESUAI pada hasil akhir.
   */

  const hasil=[];
  const sudahDigunakan={};

  function norm_(v){
    return normalisasiNamaMatch_(v);
  }

  function tokens_(v){
    return tokenMatch_(v);
  }

  function namaTampilanMutasi_(m){
    /*
     * KETERANGAN selalu diutamakan karena berisi detail per transaksi
     * (nama karyawan, lokasi, periode). NAMA REKENING PT hanya nama
     * pemilik rekening PERUSAHAAN pengirim (sama untuk semua baris di
     * satu file, mis. "RAY MITRA PERKASA PT") — sama sekali tidak
     * membedakan transaksi satu dari yang lain, jadi tidak berguna
     * sebagai nama tampilan/pencocokan. Ini berlaku untuk semua bank
     * (BCA, BRI, BPD, MANDIRI non-bulk); untuk mutasi Bulk, NAMA
     * REKENING PT memang sengaja dikosongkan oleh parsernya sehingga
     * baris ini tetap jatuh ke KETERANGAN juga.
     * ambilNamaDariKeterangan('', ...) SELALU mengembalikan string
     * kosong (indexOf string kosong selalu 0), jadi sengaja tidak
     * dipakai lagi di sini — dulu hanya kebetulan membuat rantai ini
     * jatuh ke KETERANGAN untuk mutasi Bulk saja.
     */
    return String(
      m.keterangan ||
      m.namaRekening ||
      ''
    ).trim();
  }

  /*
   * aNorm/aTokens (sisi REKAP) diterima SUDAH dinormalisasi/ditokenisasi
   * oleh pemanggil, bukan dihitung ulang di sini — REKAP yang sama
   * dibandingkan ke ribuan baris MUTASI dalam satu proses, jadi
   * menghitung ulang norm_/tokens_ untuk nama REKAP yang SAMA di setiap
   * pasangan (i,j) hanya membuang waktu berkali-kali lipat tanpa
   * mengubah hasilnya sama sekali (lihat precompute per-REKAP di Tahap 1
   * di bawah). Sisi MUTASI (m._namaNormV86, m._tbTokensV86) sudah
   * dipracompute sekali per baris MUTASI saat mutasiPrepared dibangun,
   * dengan alasan yang sama.
   */
  function skorNama_(aNorm,aTokens,m){
    if(!aNorm)return 0;
    const b=m._namaNormV86;
    const tb=m._tbTokensV86;
    const tbSet=m._tbSetV86;

    if(b && (aNorm===b || b.indexOf(aNorm)!==-1))return 1;
    if(!aTokens.length||!tb.length)return 0;

    let hit=0;
    aTokens.forEach(function(t){
      // Cocok persis: lookup O(1) lewat Set, bukan menelusuri array tb
      // satu per satu (indexOf) — hasilnya identik, cuma lebih cepat.
      if(tbSet.has(t)){hit++;return;}
      for(let i=0;i<tb.length;i++){
        if(tokenMiripV86_(t,tb[i])){hit++;return;}
      }
    });

    let score=hit/aTokens.length;
    if(b && (b.indexOf(aNorm)!==-1))score=Math.min(1,score+0.20);
    return Math.min(1,score);
  }

  function normLokasi_(v){
    return norm_(v)
      .replace(/\bKECAMATAN\b/g,'KEC')
      .replace(/\bKABUPATEN\b/g,'KAB')
      .replace(/\bPROVINSI\b/g,'PROV')
      .replace(/\s+/g,' ')
      .trim();
  }

  function aliasLokasi_(token){
    const alias={
      PWJ:'PURWOREJO',
      PURW:'PURWOREJO',
      SMG:'SEMARANG',
      BLR:'BLORA',
      BTG:'BATANG',
      DMG:'DEMAK',
      KDL:'KENDAL',
      PKL:'PEKALONGAN',
      PML:'PEMALANG',
      BRS:'BREBES',
      MGL:'MAGELANG',
      WSB:'WONOSOBO',
      TGL:'TEGAL',
      KURUN:'KUALA KURUN',
      KUALAKURUN:'KUALA KURUN'
    };
    return alias[token]||'';
  }

  function tokenLokasi_(v){
    const s=normLokasi_(v);
    if(!s)return [];
    const stop={
      KEC:true,KAB:true,KOTA:true,PROV:true,
      PENGECEKAN:true,CEK:true,BULK:true,MUTASI:true,
      GAJI:true,TRANSFER:true,INHOUSE:true,
      JULI:true,AGUSTUS:true,SEPTEMBER:true,OKTOBER:true,
      NOVEMBER:true,DESEMBER:true,JANUARI:true,FEBRUARI:true,
      MARET:true,APRIL:true,MEI:true,JUNI:true,
      IDR:true,SUCCESS:true,OUR:true,IMMEDIATE:true
    };
    return s.split(' ').filter(function(x){return x.length>=2&&!stop[x];});
  }

  function tokenLokasiCocok_(a,b){
    if(a===b)return true;
    const aa=aliasLokasi_(a);
    const bb=aliasLokasi_(b);
    if(aa && norm_(aa)===norm_(b))return true;
    if(bb && norm_(bb)===norm_(a))return true;
    if(a.length<=4 && b.length>=a.length && b.indexOf(a)===0)return true;
    if(b.length<=4 && a.length>=b.length && a.indexOf(b)===0)return true;
    if(tokenMiripV86_(a,b))return true;
    return false;
  }

  /*
   * aTokens/naLokasi (sisi REKAP) dan bTokens/nbTeks (sisi MUTASI, dari
   * m._lokasiTokensV86/m._lokasiNormV86) sama-sama diterima sudah
   * dipracompute oleh pemanggil, dengan alasan performa yang sama
   * seperti skorNama_ di atas.
   */
  function skorLokasi_(aTokens,bTokens,bTokensSet,naLokasi,nbTeks){
    if(!aTokens.length||!bTokens.length)return 0;

    let hit=0;
    aTokens.forEach(function(t){
      // Cocok persis: lookup O(1) lewat Set — hasilnya identik dengan
      // bTokens.indexOf(t)!==-1, cuma lebih cepat untuk dataset besar.
      if(bTokensSet.has(t)){hit++;return;}
      for(let i=0;i<bTokens.length;i++){
        if(tokenLokasiCocok_(t,bTokens[i])){hit++;return;}
      }
    });

    let score=hit/aTokens.length;
    if(naLokasi && nbTeks && (naLokasi===nbTeks || nbTeks.indexOf(naLokasi)!==-1 || naLokasi.indexOf(nbTeks)!==-1))score=1;
    return Math.min(1,score);
  }

  function skorNominal_(a,b){
    a=Number(a||0);b=Number(b||0);
    if(a<=0||b<=0)return 0;
    if(a===b)return 1;
    const rel=Math.abs(a-b)/Math.max(a,b);
    if(rel<=0.001)return 0.95;
    if(rel<=0.005)return 0.75;
    if(rel<=0.01)return 0.50;
    if(rel<=0.03)return 0.20;
    if(rel<=0.05)return 0.10;
    return 0;
  }

  const mutasiPrepared=dataMutasi.map(function(m,index){
    const namaTampilan=namaTampilanMutasi_(m);
    const teks=[m.sumber||'',m.keterangan||'',m.namaRekening||'',namaTampilan||''].join(' ');
    const namaNorm=norm_(namaTampilan);
    const ketNorm=norm_(m.keterangan||'');
    const tbTokens=tokens_([namaNorm,ketNorm].join(' '));
    const lokasiTokens=tokenLokasi_(teks);
    return Object.assign({},m,{
      _indexV86:index,
      _namaTampilanV86:namaTampilan,
      _teksV86:teks,
      _namaNormV86:namaNorm,
      // Dipracompute sekali per baris MUTASI (bukan per pasangan REKAP x
      // MUTASI) — lihat catatan performa di skorNama_/skorLokasi_ di atas.
      // Versi Set (selain array aslinya) dipakai untuk lookup cocok-persis
      // O(1), array aslinya tetap dipertahankan untuk fallback pencarian
      // mirip/typo (tokenMiripV86_/tokenLokasiCocok_) yang butuh iterasi.
      _tbTokensV86:tbTokens,
      _tbSetV86:new Set(tbTokens),
      _lokasiTokensV86:lokasiTokens,
      _lokasiTokensSetV86:new Set(lokasiTokens),
      _lokasiNormV86:normLokasi_(teks)
    });
  });

  function urutkanKandidat_(list){
    list.sort(function(a,b){
      if(Math.abs(b.gabungan-a.gabungan)>0.0001)return b.gabungan-a.gabungan;
      if(b.namaUtuh!==a.namaUtuh)return b.namaUtuh?1:-1;
      if(b.scoreLokasi!==a.scoreLokasi)return b.scoreLokasi-a.scoreLokasi;
      if(b.scoreNominal!==a.scoreNominal)return b.scoreNominal-a.scoreNominal;
      if(b.scoreBank!==a.scoreBank)return b.scoreBank-a.scoreBank;
      return a.selisih-b.selisih;
    });
    return list;
  }

  /*
   * ==========================================================
   * TAHAP 1 — KUMPULKAN SEMUA PASANGAN KANDIDAT (REKAP × MUTASI)
   * ==========================================================
   * Sebelumnya setiap REKAP dicocokkan satu per satu mengikuti
   * urutan barisnya di sheet, lalu langsung "mengambil" mutasi
   * dengan skor terbaik yang tersisa. Ini berbahaya: REKAP yang
   * diproses lebih dulu bisa mencuri baris MUTASI milik REKAP
   * lain hanya karena kebetulan sedikit mirip (skor rendah),
   * padahal pemilik aslinya — yang diproses belakangan — punya
   * skor jauh lebih kuat untuk baris MUTASI yang sama.
   *
   * Supaya urutan baris di sheet TIDAK PERNAH memengaruhi hasil,
   * semua pasangan (rekap, mutasi) yang punya skor nama > 0
   * dikumpulkan dulu ke satu daftar tunggal, lalu diurutkan dari
   * yang paling meyakinkan ke seluruh dataset (bukan per REKAP).
   * Pasangan ditetapkan mengikuti urutan itu (tahap 2), sehingga
   * kecocokan terkuat SELALU dapat giliran pertama, siapa pun
   * yang kebetulan berada lebih dulu di sheet.
   */

  const kandidatPerRekap=[];
  const semuaKandidat=[];

  for(let i=0;i<dataRekap.length;i++){
    const r=dataRekap[i];
    const namaRekap=String(r.nama||'').trim();
    const nominalRekap=Number(r.diterima||0);

    kandidatPerRekap[i]=[];
    if(!namaRekap||nominalRekap<=0)continue;

    /*
     * Dipracompute SEKALI per REKAP, dipakai ulang untuk semua baris
     * MUTASI di bawah — bukan dihitung ulang di dalam loop j (dulu
     * skorNama_/skorLokasi_ menormalisasi & mentokenisasi ulang nama
     * dan lokasi REKAP yang SAMA untuk SETIAP baris MUTASI). Untuk
     * dataset besar (REKAP x MUTASI ribuan pasangan) ini adalah sumber
     * utama lambatnya proses sampai kena "Melebihi jumlah eksekusi
     * maksimum" dari Google Apps Script — hasil skornya identik,
     * hanya dihitung jauh lebih sedikit kali.
     */
    const namaRekapNorm=norm_(namaRekap);
    const namaRekapTokens=tokens_(namaRekapNorm);
    const lokasiRekapTokens=tokenLokasi_(r.lokasi||'');
    const lokasiRekapNorm=normLokasi_(r.lokasi||'');

    for(let j=0;j<mutasiPrepared.length;j++){
      const m=mutasiPrepared[j];

      const scoreNama=skorNama_(namaRekapNorm,namaRekapTokens,m);
      if(scoreNama<=0)continue;

      const scoreLokasi=skorLokasi_(lokasiRekapTokens,m._lokasiTokensV86,m._lokasiTokensSetV86,lokasiRekapNorm,m._lokasiNormV86);
      const scoreNominal=skorNominal_(nominalRekap,Number(m.nominal||0));
      const scoreBank=skorBankMatchV81_(r.bank||'',m.bank||'');
      const selisih=Math.abs(nominalRekap-Number(m.nominal||0));

      // Bank hanya faktor tambahan. Jika salah satu sumber tidak punya bank,
      // score bank dibuat netral sehingga tidak menghukum kandidat.
      const bankFactor=(r.bank&&m.bank)?scoreBank:0.5;

      const gabungan=
        (scoreNama*0.45)+
        (scoreLokasi*0.30)+
        (scoreNominal*0.20)+
        (bankFactor*0.05);

      const namaUtuh=
        m._namaNormV86===namaRekapNorm ||
        m._namaNormV86.indexOf(namaRekapNorm)!==-1;

      /*
       * LAYAK DIPASANGKAN — penjagaan supaya REKAP tidak dipaksa
       * dipasangkan ke kandidat yang lemah di DUA sisi sekaligus.
       *
       * Tanpa ini: kalau lokasi REKAP sama sekali tidak nyambung
       * dengan lokasi di teks mutasi (mis. REKAP "PT KIDO MULIA"
       * vs mutasi "BKK KLS I" / "RSJS MGL" / "HOTEL ATRIA" — bukan
       * cuma singkatan, tapi lokasi/perusahaan yang BENAR-BENAR
       * berbeda, scoreLokasi=0) DAN nama cuma nyambung lewat satu
       * suku kata umum (mis. cuma "HASAN"/"EKO"/"AHMAD" yang sama,
       * scoreNama rendah), kandidat lemah begini tetap jadi "yang
       * terbaik yang tersedia" kalau tidak ada kandidat lain sama
       * sekali — lalu terpaksa dipasangkan, MENCURI baris mutasi itu
       * dari REKAP lain yang mungkin benar-benar pemiliknya.
       *
       * Kandidat baru dianggap layak kalau salah satu sisi punya
       * bukti kuat: lokasi nyambung wajar (>= ambang SESUAI), ATAU
       * nama sudah sangat meyakinkan (>= ambang SESUAI) walau lokasi
       * di data REKAP-nya kebetulan tidak tertulis lengkap/konsisten.
       * Kandidat yang GAGAL dua-duanya tidak pernah ditetapkan
       * sebagai pasangan (tahap 2) — REKAP-nya jatuh ke "MUTASI
       * TIDAK DITEMUKAN" alih-alih dipaksakan ke pasangan yang salah.
       */
      const layakDipasangkan=
        scoreLokasi>=CONFIG.MIN_SCORE_LOKASI_SESUAI ||
        scoreNama>=CONFIG.MIN_SCORE_NAMA_SESUAI;

      const entry={
        rekapIndex:i,index:j,mutasi:m,scoreNama:scoreNama,scoreLokasi:scoreLokasi,
        scoreNominal:scoreNominal,scoreBank:scoreBank,
        gabungan:gabungan,selisih:selisih,namaUtuh:namaUtuh,
        layakDipasangkan:layakDipasangkan
      };

      kandidatPerRekap[i].push(entry);
      semuaKandidat.push(entry);
    }
  }

  /*
   * ==========================================================
   * TAHAP 2 — TETAPKAN PASANGAN SECARA GLOBAL
   * ==========================================================
   * Iterasi dari pasangan paling meyakinkan (gabungan tertinggi)
   * ke yang paling lemah. Sebuah pasangan hanya ditetapkan jika
   * REKAP-nya belum dapat pasangan DAN MUTASI-nya belum dipakai.
   * Kalau pilihan terbaik seorang REKAP sudah "diambil" pasangan
   * lain yang skornya lebih tinggi, REKAP itu otomatis jatuh ke
   * kandidat terbaik berikutnya yang masih tersedia — bukan
   * langsung dianggap tidak ditemukan.
   */

  urutkanKandidat_(semuaKandidat);

  const rekapSudahDapat={};
  const pasanganTerpilih={};

  semuaKandidat.forEach(function(entry){
    if(!entry.layakDipasangkan)return;
    if(rekapSudahDapat[entry.rekapIndex])return;
    if(sudahDigunakan[entry.index])return;

    rekapSudahDapat[entry.rekapIndex]=true;
    sudahDigunakan[entry.index]=true;
    pasanganTerpilih[entry.rekapIndex]=entry;
  });

  /*
   * ==========================================================
   * TAHAP 3 — SUSUN HASIL, TETAP MENGIKUTI URUTAN REKAP ASLI
   * ==========================================================
   */

  for(let i=0;i<dataRekap.length;i++){
    const r=dataRekap[i];
    const namaRekap=String(r.nama||'').trim();
    const nominalRekap=Number(r.diterima||0);

    if(!namaRekap||nominalRekap<=0)continue;

    const kandidat=urutkanKandidat_(kandidatPerRekap[i]);
    const best=pasanganTerpilih[i];

    if(!best){
      hasil.push({
        pic:r.pic,lokasi:r.lokasi,nama:r.nama,namaMutasi:'',
        diterima:r.diterima,nominalMutasi:'',selisih:-nominalRekap,
        bank:'',tanggal:'',sumber:'',scoreNama:0,scoreLokasi:0,
        statusNama:'🔴 TIDAK DITEMUKAN',statusNominal:'🔴 TIDAK DITEMUKAN',
        statusLokasi:'🔴 TIDAK DITEMUKAN',statusAkhir:'🔴 MUTASI TIDAK DITEMUKAN',
        acuanDuplikat:''
      });
      continue;
    }

    const m=best.mutasi;

    const scoreNama=best.scoreNama;
    const scoreLokasi=best.scoreLokasi;
    const scoreNominal=best.scoreNominal;

    const statusNama=scoreNama>=CONFIG.MIN_SCORE_NAMA_SESUAI
      ? (scoreNama<0.98?'🟡 NAMA TERPOTONG / SEBAGIAN':'🟢 SESUAI')
      : (scoreNama>=CONFIG.MIN_SCORE_NAMA_PERLU_CEK?'🟡 NAMA PERLU CEK':'🔴 NAMA TIDAK SESUAI');

    // ==========================================================
    // STATUS NOMINAL — TOLERANSI MAKSIMAL Rp0,50
    // ==========================================================
    // Jangan menggunakan scoreNominal untuk status akhir nominal,
    // karena scoreNominal adalah skor kandidat relatif.
    // Contoh selisih Rp0,2 bisa mendapat score 0,95 dan sebelumnya
    // salah ditandai TIDAK SESUAI karena syaratnya scoreNominal >= 1.
    const nominalRekapStatus = Number(r.diterima || 0);
    const nominalMutasiStatus = Number(m.nominal || 0);
    const selisihNominalStatus = Math.abs(
      nominalMutasiStatus - nominalRekapStatus
    );

    const nominalSesuaiToleransi =
      nominalRekapStatus > 0 &&
      nominalMutasiStatus > 0 &&
      selisihNominalStatus <= 0.5;

    const statusNominal = nominalSesuaiToleransi
      ? '🟢 SESUAI'
      : '🔴 TIDAK SESUAI';

    const statusLokasi=scoreLokasi>=CONFIG.MIN_SCORE_LOKASI_SESUAI
      ?'🟢 SESUAI'
      :(scoreLokasi>0?'🟡 PERLU CEK':'🔴 TIDAK DITEMUKAN');

    let statusAkhir;
    if(scoreNama>=CONFIG.MIN_SCORE_NAMA_SESUAI &&
       scoreLokasi>=CONFIG.MIN_SCORE_LOKASI_SESUAI &&
       nominalSesuaiToleransi){
      statusAkhir='🟢 SESUAI';
    }else if(scoreNama>=CONFIG.MIN_SCORE_NAMA_SESUAI &&
             scoreLokasi>=CONFIG.MIN_SCORE_LOKASI_SESUAI){
      statusAkhir='🟡 NAMA & LOKASI SESUAI • NOMINAL PERLU CEK';
    }else if(scoreNama>=CONFIG.MIN_SCORE_NAMA_SESUAI &&
             nominalSesuaiToleransi){
      statusAkhir='🟡 NAMA & NOMINAL SESUAI • LOKASI PERLU CEK';
    }else if(scoreLokasi>=CONFIG.MIN_SCORE_LOKASI_SESUAI &&
             nominalSesuaiToleransi){
      statusAkhir='🟡 NOMINAL & LOKASI SESUAI • NAMA PERLU CEK';
    }else if(scoreNama>=CONFIG.MIN_SCORE_NAMA_PERLU_CEK){
      statusAkhir='🟡 NAMA PERLU CEK';
    }else if(nominalSesuaiToleransi){
      statusAkhir='🟡 NOMINAL SESUAI • NAMA/LOKASI PERLU CEK';
    }else{
      statusAkhir='🔴 KANDIDAT LEMAH • PERLU CEK';
    }

    // Kandidat kedua yang sangat dekat hanya ditandai jika kandidat kedua
    // juga memiliki bukti nama/lokasi yang layak. Ini menghindari status
    // transfer ganda palsu hanya karena banyak mutasi dengan nominal mirip.
    //
    // `best` (hasil tahap 2, global) tidak selalu sama dengan kandidat[0]
    // (urutan terbaik versi REKAP ini sendiri) — bisa saja pilihan utama
    // REKAP ini sudah diambil pasangan lain yang skornya lebih tinggi.
    // Karena itu "kandidat kedua" dicari sebagai kandidat lokal TERBAIK
    // yang BUKAN `best`, bukan sekadar kandidat[1].
    let second=null;
    for(let z=0;z<kandidat.length;z++){
      if(kandidat[z]!==best){second=kandidat[z];break;}
    }

    /*
     * Kalau pemenang sudah punya nama SANGAT KUAT (nama utuh ditemukan
     * apa adanya DI TEKS MUTASI, ATAU skor token nyaris sempurna — ini
     * sengaja tidak cuma mengandalkan namaUtuh, karena namaUtuh gagal
     * mengenali nama REKAP yang disingkat, mis. REKAP "M. Abdul Rachman"
     * vs teks mutasi "MUHAMAD ABDUL RACHMAN": token "ABDUL"+"RACHMAN"
     * cocok sempurna [scoreNama~1] walau "M " bukan substring harfiah
     * dari "MUHAMAD "), kandidat kedua yang cuma kebetulan berbagi SATU
     * token nama umum (mis. nama depan yang sama-sama dipakai banyak
     * pegawai, "MUHAMMAD"/"MUHAMAD", di lokasi+nominal bulk yang sama)
     * BUKAN alasan yang cukup untuk meragukan pemenang yang sudah jelas
     * benar. Ini sering terjadi di transfer massal satu lokasi dengan
     * banyak nominal seragam — tanpa penjagaan ini, hampir semua baris
     * di lokasi itu salah ditandai "POTENSI TRANSFER GANDA" walau
     * nama/lokasi/nominalnya sendiri sudah SESUAI semua. Peringatan ini
     * tetap muncul kalau kandidat kedua SAMA-SAMA punya bukti nama
     * sekuat itu (ambiguitas nyata, mis. transfer yang benar-benar
     * terkirim dua kali untuk nama yang identik).
     */
    const NAMA_SANGAT_KUAT=0.98;
    const namaSangatKuat_=function(k){return k.namaUtuh || k.scoreNama>=NAMA_SANGAT_KUAT;};
    const keduanyaSamaKuat = !second || !namaSangatKuat_(best) || namaSangatKuat_(second);

    if(second && keduanyaSamaKuat &&
       Math.abs(best.gabungan-second.gabungan)<=0.08 &&
       second.scoreNama>=CONFIG.MIN_SCORE_NAMA_PERLU_CEK &&
       second.scoreLokasi>=CONFIG.MIN_SCORE_LOKASI_SESUAI){
      statusAkhir='🟠 KANDIDAT MIRIP / POTENSI TRANSFER GANDA';
    }

    const acuan=kandidat.length>1
      ?kandidat.slice(0,5).map(function(k){return 'MUTASI!A'+k.mutasi.row+':G'+k.mutasi.row;}).join(' ↔ ')
      :'';

    hasil.push({
      pic:r.pic,
      lokasi:r.lokasi,
      nama:r.nama,
      namaMutasi:m._namaTampilanV86,
      diterima:r.diterima,
      nominalMutasi:m.nominal,
      selisih:Number(m.nominal||0)-Number(r.diterima||0),
      bank:m.bank,
      tanggal:m.tanggal,
      sumber:m.sumber,
      scoreNama:scoreNama,
      scoreLokasi:scoreLokasi,
      statusNama:statusNama,
      statusNominal:statusNominal,
      statusLokasi:statusLokasi,
      statusAkhir:statusAkhir,
      acuanDuplikat:acuan
    });
  }

  tandaiDoubleTransfer(hasil,dataRekap,dataMutasi);

  // Baris MUTASI (nomor baris sheet) yang berhasil dipasangkan ke REKAP
  // mana pun, dipakai oleh auditSelisihRekonsiliasi() untuk menemukan
  // mutasi yang TIDAK PERNAH cocok ke rekap siapa pun (kandidat anomali).
  const mutasiTerpakai={};
  Object.keys(pasanganTerpilih).forEach(function(key){
    const row=pasanganTerpilih[key].mutasi.row;
    if(row!=null)mutasiTerpakai[row]=true;
  });

  return {hasil:hasil,mutasiTerpakai:mutasiTerpakai};
}

function buatLokasiMutasiTeks_V82_(m){
  let s=normalisasiNamaMatch_([m.sumber||'',m.keterangan||''].join(' '));
  s=s.replace(/\bMUTASI\b|\bGAJI\b|\bTRANSFER\b|\bINHOUSE\b|\bBULK\b|\bSUCCESS\b|\bIDR\b/g,' ')
    .replace(/\bJULI\b|\bAGUSTUS\b|\bSEPTEMBER\b|\bOKTOBER\b|\bNOVEMBER\b|\bDESEMBER\b|\bJANUARI\b|\bFEBRUARI\b|\bMARET\b|\bAPRIL\b|\bMEI\b|\bJUNI\b/g,' ')
    .replace(/\b\d{1,4}\b/g,' ').replace(/\s+/g,' ').trim();
  return {norm:s,tokens:tokenMatch_(s)};
}

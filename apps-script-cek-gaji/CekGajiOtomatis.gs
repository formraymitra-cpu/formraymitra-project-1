/***************************************************************
 * =============================================================
 *              CEK GAJI OTOMATIS - VERSI FIX
 *              STRICT LOCATION MATCH
 * =============================================================
 *
 * STRUKTUR SHEET TUJUAN
 *
 * BARIS 4 = HEADER
 * BARIS 5 dst = DATA
 *
 * Kolom tujuan dikenali berdasarkan NAMA HEADER,
 * bukan berdasarkan posisi kolom.
 *
 * HEADER YANG DIGUNAKAN:
 * - NO
 * - NAMA LOKASI
 * - SHEET
 * - PIC GAJI
 * - NAMA REKAP GAJI
 * - LINK GAJI PIC
 * - KOLOM GAJI
 * - KOLOM DITERIMA KARYAWAN
 * - GAJI
 * - DITERIMA KARYAWAN
 * - BPJS KES
 * - BPJS TK
 * - PAYROLL
 * - NOMINAL MUTASI
 *
 * =============================================================
 */


/* ============================================================
 * 1. KONFIGURASI UTAMA
 * ============================================================
 */

const CONFIG_CEK_GAJI = {

  // Header berada di baris 4
  HEADER_ROW: 4,

  // Data dimulai dari baris 5
  DATA_START_ROW: 5,

  // Jumlah lokasi per batch
  BATCH_SIZE: 50,

  // Berapa baris maksimal setelah anchor untuk mencari header tabel
  MAX_HEADER_SCAN_ROWS: 15,

  // Berapa baris maksimal pencarian TOTAL setelah header
  MAX_TOTAL_SCAN_ROWS: 1000,

  /*
   * ==========================================================
   * TAMBAHKAN PIC BARU DI SINI
   * ==========================================================
   *
   * Contoh:
   *
   * "MAWAR": "https://docs.google.com/spreadsheets/d/XXXXX/edit"
   *
   * Jangan hapus PIC yang sudah ada.
   */

  PIC_SOURCES: {

    "KALIMANTAN":
      "https://docs.google.com/spreadsheets/d/1r-sxVRFryCf6sAAfLksb_G0tbOSmBdnP45yGSygngfU/edit?usp=sharing",

    "ADI":
      "https://docs.google.com/spreadsheets/d/1sPeprEuyU8ekl7vBRsYwiaXokKkhpp6229knzs4JCks/edit?gid=1210472119#gid=1210472119",

    "ELA":
      "https://docs.google.com/spreadsheets/d/1vBM53ojnUiHN7K9rGGw_S9K7scRL63nVwpIMhhIe2fg/edit?gid=344193525#gid=344193525",

    "PAK TOHAR":
      "https://docs.google.com/spreadsheets/d/1WhuiQ3bJuOZHLwh7VH6e_X65nD0U1SoLODy9tT3pIH8/edit?gid=1974373710#gid=1974373710",

    "ZAHRA":
      "https://docs.google.com/spreadsheets/d/1dWMRC2asgRzCc3RkNUPmAbIA0n_AGK0w8Y_RMFNfYRk/edit?gid=49983279#gid=49983279",

    "KEDU":
      "https://docs.google.com/spreadsheets/d/1ilYu9iw1zNtvzzraTBsB7OcLSbl_6t6uRh2xdDq_F1I/edit?gid=1748293989#gid=1748293989"

    /*
     * CONTOH PIC BARU:
     *
     * "MAWAR":
     *   "https://docs.google.com/spreadsheets/d/ID_FILE/edit",
     */

  }
};


/* ============================================================
 * 1B. KONFIGURASI NOMINAL MUTASI
 *
 * NOMINAL MUTASI diambil dari spreadsheet "Salinan REKONSILIASI
 * GAJI [BULAN] [TAHUN]", sheet "NOMINAL LOKASI" (sheet ini sudah
 * berisi total per lokasi hasil rekap dari sheet MUTASI: kolom
 * NAMA LOKASI + TOTAL GAJI TERTRANSFER). Nilainya dijumlahkan lagi
 * di sini untuk lokasi-lokasi yang "sejenis" dengan NAMA LOKASI
 * pada sheet tujuan (mis. "BAPENDA PENGECEKAN" di NOMINAL LOKASI
 * dianggap sejenis dengan "BAPENDA PROV JATENG" di sheet tujuan).
 *
 * Sheet mentah "MUTASI" sendiri hanya berisi transaksi bank per
 * baris (tanpa kolom NAMA LOKASI terpisah), jadi tidak dipakai
 * langsung -- tapi tetap dicoba sebagai fallback lewat
 * cariBlokRincianMutasi_ kalau suatu saat "NOMINAL LOKASI" tidak ada.
 * ============================================================
 */

const CONFIG_MUTASI = {

  // Nama sheet sumber data mutasi di spreadsheet REKONSILIASI.
  SHEET_NAME: "NOMINAL LOKASI",

  // Kata-kata "noise" yang dibuang dari NAMA LOKASI di sheet MUTASI
  // sebelum dicocokkan dengan NAMA LOKASI di sheet tujuan.
  NOISE_WORDS: ["PENGECEKAN", "PTSP", "KERJA", "ADMIN"],

  // Panjang minimum (setelah normalisasi) supaya sebuah lokasi
  // boleh dicocokkan. Mencegah kata pendek generik salah nempel.
  MIN_MATCH_LENGTH: 4,

  /*
   * ==========================================================
   * TAMBAHKAN LINK REKONSILIASI BULAN LAIN DI SINI
   * ==========================================================
   *
   * Key HARUS sama dengan nama sheet bulan tujuan
   * (JUNI, JULI, AGUSTUS, dst).
   */

  SOURCES: {

    "AGUSTUS":
      "https://docs.google.com/spreadsheets/d/1_hhYXplrh5Qxzm1TnoW1MfJ3uJKm1Yi1a9267eqyqUU/edit?gid=2140615147#gid=2140615147"

    /*
     * CONTOH BULAN BARU:
     *
     * "SEPTEMBER":
     *   "https://docs.google.com/spreadsheets/d/ID_FILE/edit",
     */

  }
};


/* ============================================================
 * 2. MENU
 * ============================================================
 */

function onOpen() {

  const ui = SpreadsheetApp.getUi();

  ui.createMenu("💰 CEK GAJI")
    .addItem("▶ Jalankan Batch Tertentu", "menuRunBatchTertentu")
    .addItem("▶ Jalankan Semua Batch", "menuRunSemuaBatch")
    .addItem("▶ Jalankan Batch Berikutnya", "menuRunBatchBerikutnya")
    .addSeparator()
    .addItem("📊 Cek Progress", "menuCekProgress")
    .addItem("🔄 Reset Progress Sheet", "menuResetProgress")
    .addSeparator()
    .addItem("💵 Isi Nominal Mutasi (Sheet Aktif)", "menuIsiNominalMutasi")
    .addItem("🧪 Test Nominal Mutasi (Baris Aktif)", "testNominalMutasiAktif")
    .addItem("🔎 Debug Sheet MUTASI", "debugSheetMutasi")
    .addSeparator()
    .addItem("⚙️ Tampilkan Daftar PIC", "menuTampilkanPIC")
    .addToUi();

}


/* ============================================================
 * 3. MENU - BATCH TERTENTU
 * ============================================================
 */

function menuRunBatchTertentu() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const sheet = ss.getActiveSheet();

  const sheetName = sheet.getName();

  /*
   * Pastikan sheet bukan sheet sistem.
   */
  if (!isMonthSheet_(sheetName)) {

    ui.alert(
      "CEK GAJI",
      "Sheet aktif adalah \"" + sheetName +
      "\".\n\n" +
      "Silakan buka sheet bulan seperti JUNI, JULI, AGUSTUS, dst.",
      ui.ButtonSet.OK
    );

    return;
  }

  const totalLocations = getTotalLocationRows_(sheet);

  if (totalLocations <= 0) {

    ui.alert(
      "CEK GAJI",
      "Tidak ditemukan data lokasi pada sheet " + sheetName + ".",
      ui.ButtonSet.OK
    );

    return;
  }

  const batchSize = CONFIG_CEK_GAJI.BATCH_SIZE;

  const totalBatches = Math.ceil(totalLocations / batchSize);

  const promptText =
    "Sheet: " + sheetName + "\n\n" +
    "Total lokasi: " + totalLocations + "\n" +
    "Ukuran batch: " + batchSize + "\n" +
    "Jumlah batch: " + totalBatches + "\n\n" +

    "PEMBAGIAN BATCH:\n\n" +

    buatDaftarBatch_(totalLocations, batchSize) +

    "\nMasukkan nomor batch yang ingin dijalankan.\n\n" +
    "Contoh: 5";

  const response = ui.prompt(
    "🎯 RUNNING BATCH TERTENTU",
    promptText,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const batchNumber = Number(
    response.getResponseText().trim()
  );

  if (!Number.isInteger(batchNumber) ||
      batchNumber < 1 ||
      batchNumber > totalBatches) {

    ui.alert(
      "CEK GAJI",
      "Nomor batch tidak valid.\n\n" +
      "Batch yang tersedia: 1 sampai " + totalBatches,
      ui.ButtonSet.OK
    );

    return;
  }

  const startIndex =
    (batchNumber - 1) * batchSize;

  const endIndex =
    Math.min(
      startIndex + batchSize - 1,
      totalLocations - 1
    );

  const startRow =
    CONFIG_CEK_GAJI.DATA_START_ROW + startIndex;

  const endRow =
    CONFIG_CEK_GAJI.DATA_START_ROW + endIndex;

  const confirm = ui.alert(
    "⚡ KONFIRMASI RUNNING",
    "Sheet: " + sheetName + "\n\n" +
    "Batch: " + batchNumber + " dari " + totalBatches + "\n" +
    "Data: " + (startIndex + 1) +
    " sampai " + (endIndex + 1) + "\n" +
    "Baris sheet: " + startRow +
    " sampai " + endRow + "\n\n" +
    "Lanjutkan?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  prosesBatchCekGaji_(
    sheet,
    batchNumber,
    totalBatches,
    startIndex,
    endIndex
  );

}


/* ============================================================
 * 4. MENU - SEMUA BATCH
 * ============================================================
 */

function menuRunSemuaBatch() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const sheet = ss.getActiveSheet();

  const sheetName = sheet.getName();

  if (!isMonthSheet_(sheetName)) {

    ui.alert(
      "CEK GAJI",
      "Sheet aktif adalah \"" + sheetName +
      "\".\n\n" +
      "Silakan pilih sheet bulan seperti JUNI, JULI, AGUSTUS, dst.",
      ui.ButtonSet.OK
    );

    return;
  }

  const totalLocations = getTotalLocationRows_(sheet);

  if (totalLocations <= 0) {

    ui.alert(
      "CEK GAJI",
      "Tidak ditemukan data lokasi.",
      ui.ButtonSet.OK
    );

    return;
  }

  const batchSize = CONFIG_CEK_GAJI.BATCH_SIZE;

  const totalBatches =
    Math.ceil(totalLocations / batchSize);

  const confirm = ui.alert(
    "🚀 RUNNING SEMUA BATCH",
    "Sheet: " + sheetName + "\n\n" +
    "Total lokasi: " + totalLocations + "\n" +
    "Ukuran batch: " + batchSize + "\n" +
    "Jumlah batch: " + totalBatches + "\n\n" +
    "Pembagian:\n\n" +
    buatDaftarBatch_(totalLocations, batchSize) +
    "\n\n" +
    "Semua batch akan dijalankan.",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  for (let batch = 1; batch <= totalBatches; batch++) {

    const startIndex =
      (batch - 1) * batchSize;

    const endIndex =
      Math.min(
        startIndex + batchSize - 1,
        totalLocations - 1
      );

    prosesBatchCekGaji_(
      sheet,
      batch,
      totalBatches,
      startIndex,
      endIndex
    );

  }

  ui.alert(
    "✅ SELESAI",
    "Semua batch pada sheet " +
    sheetName +
    " sudah selesai diproses.",
    ui.ButtonSet.OK
  );

}


/* ============================================================
 * 5. MENU - BATCH BERIKUTNYA
 * ============================================================
 */

function menuRunBatchBerikutnya() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const sheet = ss.getActiveSheet();

  const sheetName = sheet.getName();

  if (!isMonthSheet_(sheetName)) {

    ui.alert(
      "CEK GAJI",
      "Silakan buka sheet bulan terlebih dahulu.",
      ui.ButtonSet.OK
    );

    return;
  }

  const totalLocations =
    getTotalLocationRows_(sheet);

  const batchSize =
    CONFIG_CEK_GAJI.BATCH_SIZE;

  const totalBatches =
    Math.ceil(totalLocations / batchSize);

  const properties =
    PropertiesService.getDocumentProperties();

  const key =
    "CEK_GAJI_LAST_BATCH_" +
    sheetName;

  let lastBatch =
    Number(properties.getProperty(key) || 0);

  let nextBatch =
    lastBatch + 1;

  if (nextBatch > totalBatches) {

    ui.alert(
      "CEK GAJI",
      "Semua batch pada sheet " +
      sheetName +
      " sudah pernah dijalankan.\n\n" +
      "Batch terakhir: " +
      lastBatch +
      " dari " +
      totalBatches,
      ui.ButtonSet.OK
    );

    return;
  }

  const startIndex =
    (nextBatch - 1) * batchSize;

  const endIndex =
    Math.min(
      startIndex + batchSize - 1,
      totalLocations - 1
    );

  const confirm = ui.alert(
    "▶ BATCH BERIKUTNYA",
    "Sheet: " + sheetName + "\n\n" +
    "Batch: " + nextBatch +
    " dari " + totalBatches + "\n" +
    "Data: " + (startIndex + 1) +
    " sampai " + (endIndex + 1) +
    "\n\nLanjutkan?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  prosesBatchCekGaji_(
    sheet,
    nextBatch,
    totalBatches,
    startIndex,
    endIndex
  );

}


/* ============================================================
 * 6. PROSES SATU BATCH
 * ============================================================
 */

function prosesBatchCekGaji_(
  sheet,
  batchNumber,
  totalBatches,
  startIndex,
  endIndex
) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetName = sheet.getName();

  const totalLocations =
    getTotalLocationRows_(sheet);

  const dataStartRow =
    CONFIG_CEK_GAJI.DATA_START_ROW;

  const actualStartRow =
    dataStartRow + startIndex;

  const actualEndRow =
    dataStartRow + endIndex;

  const numRows =
    actualEndRow - actualStartRow + 1;

  /*
   * Baca seluruh data batch.
   */
  const lastColumn =
    sheet.getLastColumn();

  const values =
    sheet
      .getRange(
        actualStartRow,
        1,
        numRows,
        lastColumn
      )
      .getDisplayValues();

  /*
   * Cari kolom berdasarkan header.
   */
  const headerMap =
    getDestinationHeaderMap_(sheet);

  /*
   * Validasi header penting.
   */
  const requiredHeaders = [
    "NAMA LOKASI",
    "PIC GAJI",
    "NAMA REKAP GAJI",
    "LINK GAJI PIC"
  ];

  for (const header of requiredHeaders) {

    if (!headerMap[normalizeHeader_(header)]) {

      throw new Error(
        'Header "' +
        header +
        '" tidak ditemukan pada baris ' +
        CONFIG_CEK_GAJI.HEADER_ROW +
        "."
      );

    }

  }

  /*
   * Progress counter.
   */
  let sukses = 0;
  let gagal = 0;
  let manualDipertahankan = 0;

  /*
   * Cache spreadsheet PIC.
   *
   * Supaya satu PIC tidak dibuka berulang-ulang
   * untuk setiap lokasi.
   */
  const sourceCache = {};

  for (let i = 0; i < values.length; i++) {

    const rowNumber =
      actualStartRow + i;

    const row =
      values[i];

    const location =
      getCellByHeader_(
        row,
        headerMap,
        "NAMA LOKASI"
      );

    const pic =
      getCellByHeader_(
        row,
        headerMap,
        "PIC GAJI"
      );

    const namaRekap =
      getCellByHeader_(
        row,
        headerMap,
        "NAMA REKAP GAJI"
      );

    const linkCell =
      getRawCellValue_(
        sheet,
        rowNumber,
        headerMap[normalizeHeader_("LINK GAJI PIC")]
      );

    /*
     * Skip baris kosong.
     */
    if (!location && !namaRekap) {
      continue;
    }

    /*
     * Jika data utama kosong, jangan diproses.
     */
    if (!namaRekap) {

      tulisError_(sheet, rowNumber, headerMap,
        "NAMA REKAP GAJI KOSONG");

      gagal++;
      continue;
    }

    /*
     * ========================================================
     * CARI LINK PIC
     * ========================================================
     */

    let sourceUrl =
      getUrlFromCell_(linkCell);

    /*
     * Jika link di kolom F kosong,
     * ambil dari daftar PIC.
     */
    if (!sourceUrl) {

      sourceUrl =
        getPicSourceUrl_(pic);

    }

    if (!sourceUrl) {

      tulisError_(
        sheet,
        rowNumber,
        headerMap,
        "LINK PIC TIDAK DITEMUKAN: " + pic
      );

      gagal++;
      continue;
    }

    /*
     * ========================================================
     * BUKA SPREADSHEET SUMBER
     * ========================================================
     */

    let sourceSS;

    try {

      const sourceId =
        extractSpreadsheetId_(sourceUrl);

      if (!sourceId) {

        throw new Error(
          "ID Spreadsheet tidak ditemukan."
        );

      }

      if (!sourceCache[sourceId]) {

        sourceCache[sourceId] =
          SpreadsheetApp.openById(sourceId);

      }

      sourceSS =
        sourceCache[sourceId];

    } catch (err) {

      tulisError_(
        sheet,
        rowNumber,
        headerMap,
        "GAGAL BUKA SUMBER: " + err.message
      );

      gagal++;
      continue;
    }

    /*
     * ========================================================
     * CARI SHEET BULAN
     * ========================================================
     */

    const sourceSheet =
      findMonthSheet_(
        sourceSS,
        sheetName
      );

    if (!sourceSheet) {

      tulisError_(
        sheet,
        rowNumber,
        headerMap,
        "SHEET BULAN TIDAK DITEMUKAN: " +
        sheetName
      );

      gagal++;
      continue;
    }

    /*
     * ========================================================
     * CARI BLOK LOKASI SECARA STRICT
     * ========================================================
     */

    const result =
      cariDataLokasiStrict_(
        sourceSheet,
        namaRekap
      );

    if (!result.success) {

      /*
       * PENTING:
       *
       * Jangan hapus data manual jika sumber
       * tidak tersedia / tidak ditemukan.
       */
      tulisError_(
        sheet,
        rowNumber,
        headerMap,
        result.error
      );

      manualDipertahankan++;

      continue;
    }

    /*
     * ========================================================
     * TULIS HASIL
     * ========================================================
     */

    let adaData = false;

    /*
     * GAJI
     */
    if (result.data.GAJI !== null) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "GAJI",
        result.data.GAJI
      );

      adaData = true;
    }

    /*
     * DITERIMA KARYAWAN
     */
    if (result.data.DITERIMA_KARYAWAN !== null) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "DITERIMA KARYAWAN",
        result.data.DITERIMA_KARYAWAN
      );

      adaData = true;
    }

    /*
     * BPJS KES
     */
    if (result.data.BPJS_KES !== null) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "BPJS KES",
        result.data.BPJS_KES
      );

      adaData = true;
    }

    /*
     * BPJS TK
     */
    if (result.data.BPJS_TK !== null) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "BPJS TK",
        result.data.BPJS_TK
      );

      adaData = true;
    }

    /*
     * PAYROLL
     */
    if (result.data.PAYROLL !== null) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "PAYROLL",
        result.data.PAYROLL
      );

      adaData = true;
    }

    /*
     * Kolom sumber/header jika tersedia.
     */
    if (result.columnInfo.GAJI) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "KOLOM GAJI",
        result.columnInfo.GAJI
      );

    }

    if (result.columnInfo.DITERIMA_KARYAWAN) {

      setDestinationValue_(
        sheet,
        rowNumber,
        headerMap,
        "KOLOM DITERIMA KARYAWAN",
        result.columnInfo.DITERIMA_KARYAWAN
      );

    }

    /*
     * Bersihkan error jika berhasil.
     */
    if (adaData) {

      clearError_(
        sheet,
        rowNumber,
        headerMap
      );

      sukses++;

    } else {

      tulisError_(
        sheet,
        rowNumber,
        headerMap,
        "DATA TOTAL TIDAK DITEMUKAN"
      );

      gagal++;
    }

    /*
     * Simpan progress tiap lokasi.
     */
    PropertiesService
      .getDocumentProperties()
      .setProperty(
        "CEK_GAJI_LAST_BATCH_" + sheetName,
        String(batchNumber)
      );

  }

  /*
   * Simpan progress batch.
   */
  PropertiesService
    .getDocumentProperties()
    .setProperty(
      "CEK_GAJI_LAST_BATCH_" + sheetName,
      String(batchNumber)
    );

  /*
   * Flush.
   */
  SpreadsheetApp.flush();

  /*
   * Tampilkan hasil.
   */
  SpreadsheetApp.getUi().alert(
    "✅ BATCH SELESAI",
    "Sheet: " + sheetName + "\n\n" +
    "Batch: " + batchNumber +
    " dari " + totalBatches + "\n" +
    "Data: " + (startIndex + 1) +
    " sampai " + (endIndex + 1) + "\n\n" +
    "Berhasil: " + sukses + "\n" +
    "Gagal: " + gagal + "\n" +
    "Data manual dipertahankan: " +
    manualDipertahankan,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

}


/* ============================================================
 * 7. MESIN UTAMA:
 *    CARI LOKASI SECARA STRICT
 * ============================================================
 */

function cariDataLokasiStrict_(
  sourceSheet,
  namaRekapTujuan
) {

  const lastRow =
    sourceSheet.getLastRow();

  const lastColumn =
    sourceSheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {

    return {
      success: false,
      error: "SHEET SUMBER KOSONG"
    };

  }

  /*
   * Ambil seluruh display value.
   */
  const data =
    sourceSheet
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getDisplayValues();

  /*
   * ==========================================================
   * LANGKAH 1
   *
   * Cari anchor NAMA REKAP GAJI secara STRICT.
   * ==========================================================
   */

  const targetNorm =
    normalizeLocationName_(namaRekapTujuan);

  const anchorRows = [];

  for (let r = 0; r < lastRow; r++) {

    for (let c = 0; c < lastColumn; c++) {

      const cellNorm =
        normalizeLocationName_(
          data[r][c]
        );

      if (!cellNorm) continue;

      if (cellNorm === targetNorm) {

        anchorRows.push({
          row: r,
          col: c
        });

      }

    }

  }

  /*
   * Tidak ditemukan exact match.
   *
   * Jangan menggunakan blok lokasi lain.
   */
  if (anchorRows.length === 0) {

    return {
      success: false,
      error:
        "REKAP TIDAK DITEMUKAN SECARA EXACT: " +
        namaRekapTujuan
    };

  }

  /*
   * Jika lebih dari satu anchor identik,
   * kita pilih yang memiliki struktur tabel valid.
   */
  let validResult = null;

  for (const anchor of anchorRows) {

    const result =
      prosesBlokDariAnchor_(
        data,
        lastRow,
        lastColumn,
        anchor.row,
        anchor.col,
        targetNorm
      );

    if (result.success) {

      if (validResult === null) {

        validResult = result;

      } else {

        /*
         * Ada dua blok valid dengan nama sama.
         * Ini ambigu dan lebih aman tidak mengambil data.
         */
        return {
          success: false,
          error:
            "ANCHOR DUPLIKAT / AMBIGU: " +
            namaRekapTujuan
        };

      }

    }

  }

  if (!validResult) {

    return {
      success: false,
      error:
        "BLOK REKAP DITEMUKAN TETAPI TABEL TOTAL VALID TIDAK DITEMUKAN: " +
        namaRekapTujuan
    };

  }

  return validResult;

}


/* ============================================================
 * 8. PROSES BLOK DARI ANCHOR
 * ============================================================
 */

function prosesBlokDariAnchor_(
  data,
  lastRow,
  lastColumn,
  anchorRow,
  anchorCol,
  targetNorm
) {

  /*
   * ==========================================================
   * Cari batas blok:
   *
   * blok dimulai dari anchor
   * dan berakhir sebelum anchor "PERINCIAN GAJI"
   * berikutnya.
   * ==========================================================
   */

  let blockEnd =
    lastRow - 1;

  for (
    let r = anchorRow + 1;
    r < lastRow;
    r++
  ) {

    let foundNextAnchor = false;

    for (
      let c = 0;
      c < lastColumn;
      c++
    ) {

      const txt =
        normalizeLocationName_(
          data[r][c]
        );

      /*
       * Jangan anggap baris biasa sebagai anchor.
       *
       * Harus mengandung PERINCIAN + GAJI.
       */
      if (
        txt &&
        txt.indexOf("PERINCIAN") !== -1 &&
        txt.indexOf("GAJI") !== -1
      ) {

        /*
         * Pastikan bukan anchor yang sama.
         */
        if (
          txt !== targetNorm
        ) {

          blockEnd = r - 1;
          foundNextAnchor = true;
          break;

        }

      }

    }

    if (foundNextAnchor) {
      break;
    }

  }

  /*
   * ==========================================================
   * Cari HEADER TABEL
   * ==========================================================
   */

  let headerRow = -1;

  const headerScanEnd =
    Math.min(
      anchorRow +
      CONFIG_CEK_GAJI.MAX_HEADER_SCAN_ROWS,
      blockEnd
    );

  for (
    let r = anchorRow + 1;
    r <= headerScanEnd;
    r++
  ) {

    let hasNama = false;
    let hasGaji = false;

    for (
      let c = 0;
      c < lastColumn;
      c++
    ) {

      const txt =
        normalizeHeader_(
          data[r][c]
        );

      if (
        txt === "NAMA" ||
        txt.indexOf("NAMA") !== -1
      ) {

        hasNama = true;

      }

      if (
        txt === "GAJI"
      ) {

        hasGaji = true;

      }

    }

    /*
     * Header utama tabel biasanya memiliki NAMA + GAJI.
     */
    if (hasNama && hasGaji) {

      headerRow = r;
      break;

    }

  }

  if (headerRow === -1) {

    return {
      success: false,
      error: "HEADER TABEL TIDAK DITEMUKAN"
    };

  }

  /*
   * ==========================================================
   * Cari TOTAL / JUMLAH
   * ==========================================================
   */

  let totalCandidates = [];

  const totalScanEnd =
    Math.min(
      headerRow +
      CONFIG_CEK_GAJI.MAX_TOTAL_SCAN_ROWS,
      blockEnd
    );

  for (
    let r = headerRow + 1;
    r <= totalScanEnd;
    r++
  ) {

    let hasJumlah = false;
    let hasTotal = false;

    for (
      let c = 0;
      c < Math.min(lastColumn, 20);
      c++
    ) {

      const txt =
        normalizeHeader_(
          data[r][c]
        );

      if (
        txt === "JUMLAH" ||
        txt.indexOf("JUMLAH") !== -1
      ) {

        hasJumlah = true;

      }

      if (
        txt === "TOTAL" ||
        txt.indexOf("TOTAL") !== -1
      ) {

        hasTotal = true;

      }

    }

    if (hasJumlah || hasTotal) {

      totalCandidates.push({
        row: r,
        score:
          (hasJumlah ? 10 : 0) +
          (hasTotal ? 5 : 0)
      });

    }

  }

  if (totalCandidates.length === 0) {

    return {
      success: false,
      error: "BARIS JUMLAH/TOTAL TIDAK DITEMUKAN"
    };

  }

  /*
   * Sort:
   * JUMLAH lebih diutamakan daripada TOTAL.
   */
  totalCandidates.sort(
    function(a, b) {
      return b.score - a.score;
    }
  );

  /*
   * ==========================================================
   * Buat header map
   *
   * Karena header sumber dapat terdiri dari beberapa baris,
   * kita membaca beberapa baris header.
   * ==========================================================
   */

  const headerMap =
    buildSourceHeaderMap_(
      data,
      headerRow,
      lastColumn
    );

  /*
   * Minimal GAJI dan DITERIMA harus ditemukan.
   *
   * Jika tidak ada, blok dianggap invalid.
   */
  if (
    headerMap.GAJI === -1 &&
    headerMap.DITERIMA_KARYAWAN === -1
  ) {

    return {
      success: false,
      error:
        "KOLOM GAJI / DITERIMA KARYAWAN TIDAK DITEMUKAN"
    };

  }

  /*
   * ==========================================================
   * Pilih TOTAL ROW yang benar.
   *
   * Kita tidak asal mengambil TOTAL pertama.
   * Kita cek apakah baris tersebut memiliki angka
   * pada kolom GAJI / DITERIMA.
   * ==========================================================
   */

  let bestTotal = null;
  let bestScore = -999;

  for (const candidate of totalCandidates) {

    const r =
      candidate.row;

    let score =
      candidate.score;

    /*
     * Ada angka pada GAJI?
     */
    if (
      headerMap.GAJI !== -1 &&
      isNumericLike_(
        data[r][headerMap.GAJI]
      )
    ) {

      score += 20;

    }

    /*
     * Ada angka pada DITERIMA?
     */
    if (
      headerMap.DITERIMA_KARYAWAN !== -1 &&
      isNumericLike_(
        data[r][headerMap.DITERIMA_KARYAWAN]
      )
    ) {

      score += 20;

    }

    /*
     * Ada angka BPJS?
     */
    if (
      headerMap.BPJS_KES !== -1 &&
      isNumericLike_(
        data[r][headerMap.BPJS_KES]
      )
    ) {

      score += 5;

    }

    if (
      headerMap.BPJS_TK !== -1 &&
      isNumericLike_(
        data[r][headerMap.BPJS_TK]
      )
    ) {

      score += 5;

    }

    /*
     * Payroll.
     */
    if (
      headerMap.PAYROLL !== -1 &&
      isNumericLike_(
        data[r][headerMap.PAYROLL]
      )
    ) {

      score += 5;

    }

    if (score > bestScore) {

      bestScore = score;

      bestTotal = r;

    }

  }

  if (bestTotal === null) {

    return {
      success: false,
      error: "TOTAL VALID TIDAK DITEMUKAN"
    };

  }

  /*
   * ==========================================================
   * AMBIL DATA
   * ==========================================================
   */

  const result = {

    success: true,

    data: {

      GAJI:
        getNumericCell_(
          data,
          bestTotal,
          headerMap.GAJI
        ),

      DITERIMA_KARYAWAN:
        getNumericCell_(
          data,
          bestTotal,
          headerMap.DITERIMA_KARYAWAN
        ),

      BPJS_KES:
        getNumericCell_(
          data,
          bestTotal,
          headerMap.BPJS_KES
        ),

      BPJS_TK:
        getNumericCell_(
          data,
          bestTotal,
          headerMap.BPJS_TK
        ),

      PAYROLL:
        getNumericCell_(
          data,
          bestTotal,
          headerMap.PAYROLL
        )

    },

    columnInfo: {

      GAJI:
        headerMap.GAJI !== -1
          ? columnLetter_(headerMap.GAJI + 1)
          : "",

      DITERIMA_KARYAWAN:
        headerMap.DITERIMA_KARYAWAN !== -1
          ? columnLetter_(
              headerMap.DITERIMA_KARYAWAN + 1
            )
          : ""

    },

    sourceInfo: {

      anchorRow:
        anchorRow + 1,

      headerRow:
        headerRow + 1,

      totalRow:
        bestTotal + 1

    }

  };

  return result;

}


/* ============================================================
 * 9. BUILD HEADER MAP SUMBER
 * ============================================================
 */

function buildSourceHeaderMap_(
  data,
  headerRow,
  lastColumn
) {

  const map = {

    GAJI: -1,

    DITERIMA_KARYAWAN: -1,

    BPJS_KES: -1,

    BPJS_TK: -1,

    PAYROLL: -1

  };

  /*
   * Header dapat terdiri dari beberapa baris.
   *
   * Kita scan headerRow sampai +4.
   */
  const end =
    Math.min(
      headerRow + 4,
      data.length - 1
    );

  for (
    let c = 0;
    c < lastColumn;
    c++
  ) {

    let combined = "";

    for (
      let r = headerRow;
      r <= end;
      r++
    ) {

      const txt =
        normalizeHeader_(
          data[r][c]
        );

      if (txt) {

        combined += " " + txt;

      }

    }

    combined =
      combined.trim();

    /*
     * ========================================================
     * DITERIMA KARYAWAN
     * ========================================================
     */

    if (
      map.DITERIMA_KARYAWAN === -1 &&
      (
        combined.indexOf(
          "DITERIMAKARYAWAN"
        ) !== -1 ||
        (
          combined.indexOf("DITERIMA") !== -1 &&
          combined.indexOf("KARYAWAN") !== -1
        )
      )
    ) {

      map.DITERIMA_KARYAWAN = c;

      continue;
    }

    /*
     * ========================================================
     * BPJS KES
     * ========================================================
     */

    if (
      map.BPJS_KES === -1 &&
      (
        combined.indexOf("BPJSKES") !== -1 ||
        combined.indexOf("BPJSKESEHATAN") !== -1
      )
    ) {

      map.BPJS_KES = c;

      continue;
    }

    /*
     * ========================================================
     * BPJS TK
     * ========================================================
     */

    if (
      map.BPJS_TK === -1 &&
      (
        combined.indexOf("BPJSTK") !== -1 ||
        combined.indexOf("BPJSTENAGAKERJA") !== -1
      )
    ) {

      map.BPJS_TK = c;

      continue;
    }

    /*
     * ========================================================
     * PAYROLL
     * ========================================================
     */

    if (
      map.PAYROLL === -1 &&
      combined.indexOf("PAYROLL") !== -1
    ) {

      map.PAYROLL = c;

      continue;
    }

    /*
     * ========================================================
     * GAJI
     *
     * Harus exact GAJI sebagai token.
     * Jangan menggunakan "NAMA REKAP GAJI".
     * ========================================================
     */

    if (
      map.GAJI === -1 &&
      containsWord_(combined, "GAJI") &&
      combined.indexOf("DITERIMA") === -1 &&
      combined.indexOf("NAMA") === -1
    ) {

      map.GAJI = c;

    }

  }

  return map;

}


/* ============================================================
 * 10. CARI SHEET BULAN
 * ============================================================
 */

function findMonthSheet_(
  spreadsheet,
  monthName
) {

  const target =
    normalizeMonth_(
      monthName
    );

  const sheets =
    spreadsheet.getSheets();

  for (const sh of sheets) {

    if (
      normalizeMonth_(
        sh.getName()
      ) === target
    ) {

      return sh;

    }

  }

  return null;

}


/* ============================================================
 * 11. HEADER TUJUAN
 * ============================================================
 */

function getDestinationHeaderMap_(sheet) {

  const headerRow =
    CONFIG_CEK_GAJI.HEADER_ROW;

  const lastColumn =
    sheet.getLastColumn();

  const headers =
    sheet
      .getRange(
        headerRow,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0];

  const map = {};

  for (
    let c = 0;
    c < headers.length;
    c++
  ) {

    const key =
      normalizeHeader_(
        headers[c]
      );

    if (key) {

      map[key] = c + 1;

    }

  }

  return map;

}


/* ============================================================
 * 12. GET VALUE DARI ROW BERDASARKAN HEADER
 * ============================================================
 */

function getCellByHeader_(
  row,
  headerMap,
  headerName
) {

  const key =
    normalizeHeader_(
      headerName
    );

  const col =
    headerMap[key];

  if (!col) {
    return "";
  }

  return row[col - 1] || "";

}


/* ============================================================
 * 13. RAW CELL
 * ============================================================
 */

function getRawCellValue_(
  sheet,
  row,
  column
) {

  if (!column) {
    return "";
  }

  return sheet
    .getRange(row, column)
    .getValue();

}


/* ============================================================
 * 14. URL DARI CELL
 * ============================================================
 */

function getUrlFromCell_(value) {

  if (!value) {
    return "";
  }

  /*
   * Jika value sudah URL.
   */
  if (
    typeof value === "string" &&
    value.indexOf("docs.google.com/spreadsheets") !== -1
  ) {

    return value;

  }

  return "";

}


/* ============================================================
 * 15. URL PIC
 * ============================================================
 */

function getPicSourceUrl_(pic) {

  const key =
    normalizePic_(pic);

  const sources =
    CONFIG_CEK_GAJI.PIC_SOURCES;

  for (const name in sources) {

    if (
      normalizePic_(name) === key
    ) {

      return sources[name];

    }

  }

  return "";

}


/* ============================================================
 * 16. EXTRACT SPREADSHEET ID
 * ============================================================
 */

function extractSpreadsheetId_(url) {

  if (!url) {
    return "";
  }

  const match =
    String(url).match(
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    );

  if (match) {

    return match[1];

  }

  return "";

}


/* ============================================================
 * 17. TULIS VALUE KE TUJUAN
 * ============================================================
 */

function setDestinationValue_(
  sheet,
  row,
  headerMap,
  headerName,
  value
) {

  const key =
    normalizeHeader_(
      headerName
    );

  const column =
    headerMap[key];

  if (!column) {
    return;
  }

  /*
   * Jangan tulis null.
   */
  if (value === null || value === "") {
    return;
  }

  sheet
    .getRange(row, column)
    .setValue(value);

}


/* ============================================================
 * 18. ERROR
 *
 * Jika kolom ERROR belum ada, fungsi tidak melakukan apa-apa.
 * ============================================================
 */

function tulisError_(
  sheet,
  row,
  headerMap,
  message
) {

  const key =
    normalizeHeader_("ERROR");

  const column =
    headerMap[key];

  if (!column) {
    return;
  }

  sheet
    .getRange(row, column)
    .setValue(message);

}


/* ============================================================
 * 19. CLEAR ERROR
 * ============================================================
 */

function clearError_(
  sheet,
  row,
  headerMap
) {

  const key =
    normalizeHeader_("ERROR");

  const column =
    headerMap[key];

  if (!column) {
    return;
  }

  sheet
    .getRange(row, column)
    .clearContent();

}


/* ============================================================
 * 20. NUMERIC CELL
 * ============================================================
 */

function getNumericCell_(
  data,
  row,
  col
) {

  if (
    col === -1 ||
    col === undefined ||
    col === null
  ) {

    return null;

  }

  const value =
    data[row][col];

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {

    return null;

  }

  return parseNumber_(value);

}


/* ============================================================
 * 21. PARSE ANGKA
 * ============================================================
 */

function parseNumber_(value) {

  if (
    typeof value === "number"
  ) {

    return value;

  }

  let text =
    String(value)
      .trim();

  if (!text) {
    return null;
  }

  /*
   * Hapus simbol mata uang.
   */
  text =
    text
      .replace(/Rp/gi, "")
      .replace(/\s/g, "");

  /*
   * Format Indonesia:
   * 41.410.481
   *
   * menjadi:
   * 41410481
   */
  if (
    text.indexOf(".") !== -1 &&
    text.indexOf(",") === -1
  ) {

    text =
      text.replace(/\./g, "");

  } else if (
    text.indexOf(".") !== -1 &&
    text.indexOf(",") !== -1
  ) {

    /*
     * Asumsikan format Indonesia:
     * 41.410.481,00
     */
    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");

  } else {

    text =
      text.replace(/,/g, "");

  }

  /*
   * Sisakan angka, minus, titik.
   */
  text =
    text.replace(
      /[^0-9.-]/g,
      ""
    );

  if (!text) {
    return null;
  }

  const number =
    Number(text);

  if (isNaN(number)) {
    return null;
  }

  return number;

}


/* ============================================================
 * 22. CEK NUMERIC
 * ============================================================
 */

function isNumericLike_(value) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {

    return false;

  }

  const parsed =
    parseNumber_(value);

  return (
    parsed !== null &&
    !isNaN(parsed)
  );

}


/* ============================================================
 * 23. NORMALIZE HEADER
 * ============================================================
 */

function normalizeHeader_(text) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }

  return String(text)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s/g, "");

}


/* ============================================================
 * 24. NORMALIZE NAMA REKAP
 *
 * Dibuat cukup ketat:
 * - uppercase
 * - hapus spasi
 * - hapus tanda baca
 *
 * Sehingga:
 *
 * ATR/BPN
 * ATR BPN
 * ATR-BPN
 *
 * tetap dianggap sama.
 *
 * Tetapi nama lokasi berbeda tidak akan dianggap sama.
 * ============================================================
 */

function normalizeLocationName_(text) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }

  return String(text)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");

}


/* ============================================================
 * 25. NORMALIZE PIC
 * ============================================================
 */

function normalizePic_(text) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }

  return String(text)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

}


/* ============================================================
 * 26. NORMALIZE MONTH
 * ============================================================
 */

function normalizeMonth_(text) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }

  return String(text)
    .toUpperCase()
    .trim();

}


/* ============================================================
 * 27. CONTAINS WORD
 * ============================================================
 */

function containsWord_(
  text,
  word
) {

  const normalizedText =
    " " +
    String(text)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim() +
    " ";

  const normalizedWord =
    " " +
    String(word)
      .toUpperCase()
      .trim() +
    " ";

  return normalizedText.indexOf(
    normalizedWord
  ) !== -1;

}


/* ============================================================
 * 28. TOTAL DATA LOKASI
 * ============================================================
 */

function getTotalLocationRows_(sheet) {

  const startRow =
    CONFIG_CEK_GAJI.DATA_START_ROW;

  const lastRow =
    sheet.getLastRow();

  if (lastRow < startRow) {
    return 0;
  }

  const lastColumn =
    sheet.getLastColumn();

  const values =
    sheet
      .getRange(
        startRow,
        1,
        lastRow - startRow + 1,
        lastColumn
      )
      .getDisplayValues();

  /*
   * Cari kolom NAMA LOKASI.
   */
  const headerMap =
    getDestinationHeaderMap_(sheet);

  const locationColumn =
    headerMap[
      normalizeHeader_("NAMA LOKASI")
    ];

  if (!locationColumn) {
    return 0;
  }

  let count = 0;

  for (const row of values) {

    const location =
      row[locationColumn - 1];

    if (
      location &&
      String(location).trim() !== ""
    ) {

      count++;

    }

  }

  return count;

}


/* ============================================================
 * 29. DAFTAR BATCH DI POPUP
 * ============================================================
 */

function buatDaftarBatch_(
  totalLocations,
  batchSize
) {

  const totalBatches =
    Math.ceil(
      totalLocations / batchSize
    );

  let text = "";

  for (
    let batch = 1;
    batch <= totalBatches;
    batch++
  ) {

    const start =
      (batch - 1) *
      batchSize + 1;

    const end =
      Math.min(
        batch * batchSize,
        totalLocations
      );

    text +=
      "Batch " +
      batch +
      ": data " +
      start +
      " - " +
      end +
      "\n";

  }

  return text.trim();

}


/* ============================================================
 * 30. COLUMN LETTER
 * ============================================================
 */

function columnLetter_(columnNumber) {

  let temp =
    columnNumber;

  let letter = "";

  while (temp > 0) {

    const remainder =
      (temp - 1) % 26;

    letter =
      String.fromCharCode(
        65 + remainder
      ) + letter;

    temp =
      Math.floor(
        (temp - 1) / 26
      );

  }

  return letter;

}


/* ============================================================
 * 31. MENU - CEK PROGRESS
 * ============================================================
 */

function menuCekProgress() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getActiveSheet();

  const sheetName =
    sheet.getName();

  const totalLocations =
    getTotalLocationRows_(sheet);

  const batchSize =
    CONFIG_CEK_GAJI.BATCH_SIZE;

  const totalBatches =
    Math.ceil(
      totalLocations / batchSize
    );

  const properties =
    PropertiesService.getDocumentProperties();

  const key =
    "CEK_GAJI_LAST_BATCH_" +
    sheetName;

  const lastBatch =
    Number(
      properties.getProperty(key) || 0
    );

  let lastData = 0;

  if (lastBatch > 0) {

    lastData =
      Math.min(
        lastBatch * batchSize,
        totalLocations
      );

  }

  SpreadsheetApp.getUi().alert(
    "📊 PROGRESS CEK GAJI",
    "Sheet: " + sheetName + "\n\n" +
    "Total lokasi: " + totalLocations + "\n" +
    "Ukuran batch: " + batchSize + "\n" +
    "Total batch: " + totalBatches + "\n\n" +
    "Batch terakhir dijalankan: " +
    lastBatch + "\n" +
    "Data terakhir diproses: " +
    lastData + "\n\n" +
    "Batch berikutnya: " +
    (lastBatch + 1),
    SpreadsheetApp.getUi().ButtonSet.OK
  );

}


/* ============================================================
 * 32. RESET PROGRESS
 * ============================================================
 */

function menuResetProgress() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getActiveSheet();

  const sheetName =
    sheet.getName();

  const ui =
    SpreadsheetApp.getUi();

  const confirm =
    ui.alert(
      "🔄 RESET PROGRESS",
      "Reset progress untuk sheet " +
      sheetName +
      "?\n\n" +
      "Data GAJI, BPJS, PAYROLL dan DITERIMA " +
      "tidak akan dihapus.\n\n" +
      "Yang direset hanya catatan batch.",
      ui.ButtonSet.YES_NO
    );

  if (
    confirm !== ui.Button.YES
  ) {

    return;

  }

  PropertiesService
    .getDocumentProperties()
    .deleteProperty(
      "CEK_GAJI_LAST_BATCH_" +
      sheetName
    );

  ui.alert(
    "✅ RESET BERHASIL",
    "Progress batch sheet " +
    sheetName +
    " sudah direset.",
    ui.ButtonSet.OK
  );

}


/* ============================================================
 * 33. TAMPILKAN PIC
 * ============================================================
 */

function menuTampilkanPIC() {

  const sources =
    CONFIG_CEK_GAJI.PIC_SOURCES;

  let text =
    "DAFTAR PIC GAJI:\n\n";

  let no = 1;

  for (const pic in sources) {

    text +=
      no +
      ". " +
      pic +
      "\n";

    no++;

  }

  text +=
    "\nUntuk menambah PIC baru,\n" +
    "edit bagian CONFIG_CEK_GAJI > PIC_SOURCES.";

  SpreadsheetApp.getUi().alert(
    "⚙️ DAFTAR PIC",
    text,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

}


/* ============================================================
 * 34. VALIDASI SHEET BULAN
 * ============================================================
 */

function isMonthSheet_(name) {

  const months = [

    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER"

  ];

  return months.indexOf(
    String(name)
      .toUpperCase()
      .trim()
  ) !== -1;

}


/* ============================================================
 * 35. TEST SATU LOKASI
 *
 * Fungsi ini sangat berguna sebelum menjalankan 250+ lokasi.
 *
 * Cara menjalankan:
 * Apps Script > pilih:
 *
 * testLokasiAktif
 *
 * Fungsi akan mengambil lokasi dari baris aktif
 * dan menampilkan hasil yang ditemukan.
 * ============================================================
 */

function testLokasiAktif() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getActiveSheet();

  const row =
    sheet.getActiveRange().getRow();

  if (
    row < CONFIG_CEK_GAJI.DATA_START_ROW
  ) {

    SpreadsheetApp.getUi().alert(
      "TEST",
      "Pilih salah satu baris data lokasi terlebih dahulu.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return;

  }

  const headerMap =
    getDestinationHeaderMap_(sheet);

  const location =
    sheet.getRange(
      row,
      headerMap[
        normalizeHeader_("NAMA LOKASI")
      ]
    ).getDisplayValue();

  const pic =
    sheet.getRange(
      row,
      headerMap[
        normalizeHeader_("PIC GAJI")
      ]
    ).getDisplayValue();

  const namaRekap =
    sheet.getRange(
      row,
      headerMap[
        normalizeHeader_("NAMA REKAP GAJI")
      ]
    ).getDisplayValue();

  const sourceUrl =
    getPicSourceUrl_(pic);

  if (!sourceUrl) {

    SpreadsheetApp.getUi().alert(
      "TEST GAGAL",
      "PIC tidak ditemukan:\n" + pic,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return;

  }

  const sourceId =
    extractSpreadsheetId_(sourceUrl);

  const sourceSS =
    SpreadsheetApp.openById(sourceId);

  const sourceSheet =
    findMonthSheet_(
      sourceSS,
      sheet.getName()
    );

  if (!sourceSheet) {

    SpreadsheetApp.getUi().alert(
      "TEST GAGAL",
      "Sheet bulan " +
      sheet.getName() +
      " tidak ditemukan di sumber PIC " +
      pic,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return;

  }

  const result =
    cariDataLokasiStrict_(
      sourceSheet,
      namaRekap
    );

  if (!result.success) {

    SpreadsheetApp.getUi().alert(
      "❌ TEST GAGAL",
      "Lokasi: " + location + "\n\n" +
      "PIC: " + pic + "\n\n" +
      "NAMA REKAP:\n" +
      namaRekap + "\n\n" +
      "HASIL:\n" +
      result.error,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    return;

  }

  const d =
    result.data;

  SpreadsheetApp.getUi().alert(
    "✅ TEST BERHASIL",
    "Lokasi: " + location + "\n\n" +
    "PIC: " + pic + "\n\n" +
    "NAMA REKAP:\n" +
    namaRekap + "\n\n" +

    "GAJI: " +
    formatNumberForDisplay_(d.GAJI) + "\n" +

    "DITERIMA KARYAWAN: " +
    formatNumberForDisplay_(
      d.DITERIMA_KARYAWAN
    ) + "\n" +

    "BPJS KES: " +
    formatNumberForDisplay_(d.BPJS_KES) + "\n" +

    "BPJS TK: " +
    formatNumberForDisplay_(d.BPJS_TK) + "\n" +

    "PAYROLL: " +
    formatNumberForDisplay_(d.PAYROLL) + "\n\n" +

    "SUMBER:\n" +
    "Anchor row: " +
    result.sourceInfo.anchorRow + "\n" +
    "Header row: " +
    result.sourceInfo.headerRow + "\n" +
    "Total row: " +
    result.sourceInfo.totalRow,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

}


/* ============================================================
 * 36. FORMAT NUMBER TEST
 * ============================================================
 */

function formatNumberForDisplay_(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "-";

  }

  return Number(value)
    .toLocaleString(
      "id-ID"
    );

}


/* ============================================================
 * 37. MENU - ISI NOMINAL MUTASI
 *
 * Mengisi kolom "NOMINAL MUTASI" pada sheet bulan aktif,
 * diambil dari spreadsheet REKONSILIASI (sheet MUTASI) bulan
 * yang sama, dengan menjumlahkan semua baris mutasi yang
 * lokasinya sejenis dengan NAMA LOKASI di sheet tujuan.
 * ============================================================
 */

function menuIsiNominalMutasi() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const ui =
    SpreadsheetApp.getUi();

  const sheet =
    ss.getActiveSheet();

  const sheetName =
    sheet.getName();

  if (!isMonthSheet_(sheetName)) {

    ui.alert(
      "CEK GAJI",
      "Sheet aktif adalah \"" + sheetName +
      "\".\n\n" +
      "Silakan buka sheet bulan seperti JUNI, JULI, AGUSTUS, dst.",
      ui.ButtonSet.OK
    );

    return;
  }

  const confirm =
    ui.alert(
      "💵 ISI NOMINAL MUTASI",
      "Sheet: " + sheetName + "\n\n" +
      "Data akan diambil dari sheet \"" +
      CONFIG_MUTASI.SHEET_NAME +
      "\"\npada spreadsheet REKONSILIASI bulan " +
      sheetName + ",\n" +
      "dijumlahkan per lokasi, lalu ditulis ke kolom\n" +
      "\"NOMINAL MUTASI\".\n\n" +
      "Lanjutkan?",
      ui.ButtonSet.YES_NO
    );

  if (confirm !== ui.Button.YES) {
    return;
  }

  try {

    const hasil =
      jalankanIsiNominalMutasi_(sheet);

    ui.alert(
      "✅ NOMINAL MUTASI SELESAI",
      "Sheet: " + sheetName + "\n\n" +
      "Grup lokasi mutasi ditemukan: " +
      hasil.totalGrupMutasi + "\n\n" +
      "Terisi: " + hasil.terisi + "\n" +
      "Kosong / tidak ada mutasi: " + hasil.kosong + "\n" +
      "Ambigu (perlu cek manual): " + hasil.ambigu,
      ui.ButtonSet.OK
    );

  } catch (err) {

    ui.alert(
      "❌ GAGAL",
      err.message,
      ui.ButtonSet.OK
    );

  }

}


/* ============================================================
 * 38. PROSES ISI NOMINAL MUTASI
 *
 * Alur:
 * 1. Buka spreadsheet REKONSILIASI sesuai bulan sheet tujuan.
 * 2. Jumlahkan NOMINAL mutasi per lokasi dari sheet MUTASI.
 * 3. Cocokkan tiap NAMA LOKASI tujuan dengan grup lokasi mutasi
 *    (boleh banyak grup mutasi untuk 1 lokasi tujuan -> dijumlah).
 * 4. Jika satu grup mutasi cocok dengan LEBIH DARI SATU lokasi
 *    tujuan, dianggap ambigu dan TIDAK ditulis (supaya tidak
 *    menghitung ganda nominal yang sama).
 * ============================================================
 */

function jalankanIsiNominalMutasi_(sheet) {

  const sheetName =
    sheet.getName();

  const sourceUrl =
    getMutasiSourceUrl_(sheetName);

  if (!sourceUrl) {

    throw new Error(
      'Link REKONSILIASI untuk bulan "' +
      sheetName +
      '" belum diatur di CONFIG_MUTASI.SOURCES.'
    );

  }

  const sourceId =
    extractSpreadsheetId_(sourceUrl);

  if (!sourceId) {

    throw new Error(
      "ID Spreadsheet REKONSILIASI tidak ditemukan dari link."
    );

  }

  const sourceSS =
    SpreadsheetApp.openById(sourceId);

  const mutasiSheet =
    cariSheetMutasi_(sourceSS);

  if (!mutasiSheet) {

    throw new Error(
      'Sheet "' +
      CONFIG_MUTASI.SHEET_NAME +
      '" tidak ditemukan pada spreadsheet REKONSILIASI.'
    );

  }

  const mutasiTotals =
    buildMutasiLocationTotals_(mutasiSheet);

  if (mutasiTotals.length === 0) {

    throw new Error(
      'Tidak ada data yang bisa dibaca dari sheet "' +
      CONFIG_MUTASI.SHEET_NAME + '".'
    );

  }

  const mutasiKeys =
    mutasiTotals.map(function(item) {
      return buatKunciLokasiMutasi_(item.rawLocation);
    });

  const headerMap =
    getDestinationHeaderMap_(sheet);

  const locationColumn =
    headerMap[normalizeHeader_("NAMA LOKASI")];

  const nominalMutasiKey =
    normalizeHeader_("NOMINAL MUTASI");

  if (!locationColumn) {

    throw new Error(
      'Header "NAMA LOKASI" tidak ditemukan pada baris ' +
      CONFIG_CEK_GAJI.HEADER_ROW + "."
    );

  }

  if (!headerMap[nominalMutasiKey]) {

    throw new Error(
      'Header "NOMINAL MUTASI" tidak ditemukan pada baris ' +
      CONFIG_CEK_GAJI.HEADER_ROW + "."
    );

  }

  const startRow =
    CONFIG_CEK_GAJI.DATA_START_ROW;

  const lastRow =
    sheet.getLastRow();

  if (lastRow < startRow) {

    throw new Error("Tidak ada data lokasi pada sheet ini.");

  }

  const numRows =
    lastRow - startRow + 1;

  const locations =
    sheet
      .getRange(startRow, locationColumn, numRows, 1)
      .getDisplayValues();

  /*
   * ==========================================================
   * COCOKKAN (dua tahap: exact dulu, baru containment).
   * Lihat cocokkanSemuaLokasiMutasi_ untuk detail alasannya.
   * ==========================================================
   */

  const targets =
    locations.map(function(row) {

      const v = row[0];

      return (v && String(v).trim() !== "")
        ? normalizeLocationName_(v)
        : "";

    });

  const cocok =
    cocokkanSemuaLokasiMutasi_(targets, mutasiKeys);

  let terisi = 0;
  let kosong = 0;
  let ambigu = 0;

  for (let i = 0; i < numRows; i++) {

    const rowNumber =
      startRow + i;

    const nominalCell =
      sheet.getRange(rowNumber, headerMap[nominalMutasiKey]);

    if (cocok.ambiguous[i]) {

      nominalCell.clearContent();

      tulisError_(
        sheet,
        rowNumber,
        headerMap,
        "NOMINAL MUTASI AMBIGU, CEK MANUAL"
      );

      ambigu++;
      continue;

    }

    const found =
      cocok.assigned[i];

    if (!found || found.length === 0) {

      nominalCell.clearContent();
      kosong++;
      continue;

    }

    let total = 0;

    for (const m of found) {
      total += mutasiTotals[m].total;
    }

    if (total > 0) {

      nominalCell.setValue(total);
      clearError_(sheet, rowNumber, headerMap);
      terisi++;

    } else {

      nominalCell.clearContent();
      kosong++;

    }

  }

  SpreadsheetApp.flush();

  return {
    terisi: terisi,
    kosong: kosong,
    ambigu: ambigu,
    totalGrupMutasi: mutasiTotals.length
  };

}


/* ============================================================
 * 38B. COCOKKAN SEMUA LOKASI MUTASI (DUA TAHAP)
 *
 * TAHAP 1 - EXACT: kalau kunci grup mutasi PERSIS SAMA dengan
 * kunci satu lokasi tujuan (dan cuma satu lokasi tujuan itu),
 * langsung dipasangkan. Ini penting supaya nama pendek seperti
 * "BPTIK PROV JATENG" tidak "merebut" grup mutasi milik
 * "BPTIK PROV JATENG CAKRA" hanya karena sama-sama mengandung
 * kata itu sebagai substring.
 *
 * TAHAP 2 - CONTAINMENT: baru untuk lokasi tujuan & grup mutasi
 * yang BELUM terpasang di tahap 1, dicocokkan lagi dengan
 * substring (containment) seperti sebelumnya. Ambigu (dipakai
 * lebih dari satu lokasi tujuan) dihitung HANYA di antara sisa
 * ini, bukan dari keseluruhan.
 *
 * targets    : array kunci lokasi tujuan (hasil normalizeLocationName_,
 *              "" untuk baris yang lokasinya kosong).
 * mutasiKeys : array kunci grup mutasi (hasil buatKunciLokasiMutasi_).
 *
 * Return: { assigned: [...], ambiguous: [...] } -- keduanya
 * sepanjang targets. assigned[i] adalah array index mutasiKeys
 * yang harus dijumlah untuk baris ke-i (atau null kalau tidak ada
 * yang cocok). ambiguous[i] = true kalau baris ke-i sengaja tidak
 * diisi karena ambigu.
 * ============================================================
 */

function cocokkanSemuaLokasiMutasi_(targets, mutasiKeys) {

  const n = targets.length;
  const m = mutasiKeys.length;

  const assigned = [];
  const ambiguous = [];

  for (let i = 0; i < n; i++) {
    assigned.push(null);
    ambiguous.push(false);
  }

  const consumed = [];

  for (let i = 0; i < m; i++) {
    consumed.push(false);
  }

  /*
   * ---- TAHAP 1: EXACT ----
   */

  const exactUsage = {};

  for (let d = 0; d < n; d++) {

    const target = targets[d];

    if (!target) continue;

    for (let mi = 0; mi < m; mi++) {

      const key = mutasiKeys[mi];

      if (key && key === target) {

        if (!exactUsage[mi]) {
          exactUsage[mi] = [];
        }

        exactUsage[mi].push(d);

      }

    }

  }

  for (const mi in exactUsage) {

    const dests = exactUsage[mi];

    /*
     * Kalau grup mutasi ini persis sama dengan lebih dari satu
     * lokasi tujuan (jarang -- berarti ada dua lokasi tujuan
     * dengan nama identik), jangan dipasangkan di tahap ini.
     * Biarkan jatuh ke tahap 2 supaya tetap terdeteksi ambigu.
     */
    if (dests.length !== 1) {
      continue;
    }

    const d = dests[0];

    if (!assigned[d]) {
      assigned[d] = [];
    }

    assigned[d].push(Number(mi));
    consumed[mi] = true;

  }

  /*
   * ---- TAHAP 2: CONTAINMENT, hanya untuk sisa ----
   */

  const remainingDest = [];

  for (let d = 0; d < n; d++) {

    if (assigned[d] === null && targets[d]) {
      remainingDest.push(d);
    }

  }

  const remainingMut = [];

  for (let mi = 0; mi < m; mi++) {

    if (!consumed[mi]) {
      remainingMut.push(mi);
    }

  }

  const usageCount = {};
  const foundPerDest = {};

  for (const d of remainingDest) {

    const target = targets[d];

    const found = [];

    for (const mi of remainingMut) {

      const key = mutasiKeys[mi];

      if (!key || key.length < CONFIG_MUTASI.MIN_MATCH_LENGTH) {
        continue;
      }

      if (
        target.indexOf(key) !== -1 ||
        key.indexOf(target) !== -1
      ) {

        found.push(mi);

      }

    }

    foundPerDest[d] = found;

    for (const mi of found) {
      usageCount[mi] = (usageCount[mi] || 0) + 1;
    }

  }

  for (const d of remainingDest) {

    const found = foundPerDest[d];

    if (!found || found.length === 0) {
      continue;
    }

    const adaAmbigu =
      found.some(function(mi) {
        return usageCount[mi] > 1;
      });

    if (adaAmbigu) {
      ambiguous[d] = true;
    } else {
      assigned[d] = found;
    }

  }

  return {
    assigned: assigned,
    ambiguous: ambiguous
  };

}


/* ============================================================
 * 39. BUILD TOTAL MUTASI PER LOKASI
 *
 * Mencoba dua strategi pada sheet MUTASI:
 *
 * 1) TABEL RINGKASAN yang sudah ada (header berisi
 *    "NAMA LOKASI" + kolom "TOTAL ..."), kalau tersedia.
 * 2) TABEL RINCIAN per transaksi (header "NAMA LOKASI" +
 *    "NOMINAL"), dijumlahkan manual per lokasi.
 * ============================================================
 */

function buildMutasiLocationTotals_(mutasiSheet) {

  const lastRow =
    mutasiSheet.getLastRow();

  const lastColumn =
    mutasiSheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    return [];
  }

  const data =
    mutasiSheet
      .getRange(1, 1, lastRow, lastColumn)
      .getDisplayValues();

  const summary =
    cariBlokRingkasanMutasi_(data, lastRow, lastColumn);

  if (summary && summary.length > 0) {
    return summary;
  }

  return cariBlokRincianMutasi_(data, lastRow, lastColumn);

}


/* ============================================================
 * 40. CARI BLOK RINGKASAN MUTASI
 *
 * Header yang dicari: NAMA LOKASI + kolom yang mengandung
 * kata TOTAL (mis. "TOTAL GAJI TERTRANSFER").
 * ============================================================
 */

function cariBlokRingkasanMutasi_(
  data,
  lastRow,
  lastColumn
) {

  for (let r = 0; r < lastRow; r++) {

    let colLokasi = -1;
    let colTotal = -1;

    for (let c = 0; c < lastColumn; c++) {

      const txt =
        normalizeHeader_(data[r][c]);

      if (
        colLokasi === -1 &&
        txt.indexOf("NAMALOKASI") !== -1
      ) {

        colLokasi = c;

      }

      if (
        colTotal === -1 &&
        txt.indexOf("TOTAL") !== -1
      ) {

        colTotal = c;

      }

    }

    if (colLokasi === -1 || colTotal === -1) {
      continue;
    }

    const result = [];

    for (let rr = r + 1; rr < lastRow; rr++) {

      const lokasi =
        data[rr][colLokasi];

      const totalRaw =
        data[rr][colTotal];

      if (!lokasi && !totalRaw) {
        break;
      }

      if (!lokasi) {
        continue;
      }

      const nilai =
        parseNumber_(totalRaw);

      if (nilai === null) {
        continue;
      }

      result.push({
        rawLocation: String(lokasi).trim(),
        total: nilai
      });

    }

    if (result.length > 0) {
      return result;
    }

  }

  return null;

}


/* ============================================================
 * 41. CARI BLOK RINCIAN MUTASI (FALLBACK)
 *
 * Header yang dicari: NAMA LOKASI + NOMINAL (kolom NOMINAL
 * harus persis "NOMINAL", supaya tidak salah ambil tabel
 * ringkasan yang kolomnya "TOTAL GAJI TERTRANSFER").
 * ============================================================
 */

function cariBlokRincianMutasi_(
  data,
  lastRow,
  lastColumn
) {

  for (let r = 0; r < lastRow; r++) {

    let colLokasi = -1;
    let colNominal = -1;

    for (let c = 0; c < lastColumn; c++) {

      const txt =
        normalizeHeader_(data[r][c]);

      if (
        colLokasi === -1 &&
        txt.indexOf("NAMALOKASI") !== -1
      ) {

        colLokasi = c;

      }

      if (
        colNominal === -1 &&
        txt === "NOMINAL"
      ) {

        colNominal = c;

      }

    }

    if (colLokasi === -1 || colNominal === -1) {
      continue;
    }

    const totals = {};
    const order = [];

    for (let rr = r + 1; rr < lastRow; rr++) {

      const lokasi =
        data[rr][colLokasi];

      const nominalRaw =
        data[rr][colNominal];

      if (!lokasi && !nominalRaw) {
        break;
      }

      if (!lokasi) {
        continue;
      }

      const nilai =
        parseNumber_(nominalRaw);

      if (nilai === null) {
        continue;
      }

      const key =
        String(lokasi).trim().toUpperCase();

      if (!totals[key]) {

        totals[key] = {
          rawLocation: String(lokasi).trim(),
          total: 0
        };

        order.push(key);

      }

      totals[key].total += nilai;

    }

    if (order.length > 0) {

      return order.map(function(k) {
        return totals[k];
      });

    }

  }

  return [];

}


/* ============================================================
 * 42. CARI SHEET MUTASI
 * ============================================================
 */

function cariSheetMutasi_(spreadsheet) {

  /*
   * Coba nama utama dulu ("NOMINAL LOKASI"), lalu fallback
   * ke sheet mentah "MUTASI" kalau tidak ada.
   */
  const candidateNames =
    [CONFIG_MUTASI.SHEET_NAME, "MUTASI"];

  const sheets =
    spreadsheet.getSheets();

  for (const nama of candidateNames) {

    const target =
      normalizeHeader_(nama);

    for (const sh of sheets) {

      if (normalizeHeader_(sh.getName()) === target) {
        return sh;
      }

    }

  }

  return null;

}


/* ============================================================
 * 43. URL SUMBER MUTASI PER BULAN
 * ============================================================
 */

function getMutasiSourceUrl_(monthName) {

  const key =
    normalizeMonth_(monthName);

  const sources =
    CONFIG_MUTASI.SOURCES;

  for (const name in sources) {

    if (normalizeMonth_(name) === key) {
      return sources[name];
    }

  }

  return "";

}


/* ============================================================
 * 44. STRIP KATA NOISE DARI NAMA LOKASI MUTASI
 *
 * Contoh:
 * "UPPD KAB. BLORA PENGECEKAN PTSP" -> "UPPD KAB BLORA"
 * "BAPENDA PENGECEKAN" -> "BAPENDA"
 * ============================================================
 */

function stripNoiseWords_(text) {

  if (!text) {
    return "";
  }

  let result =
    " " +
    String(text)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim() +
    " ";

  for (const noise of CONFIG_MUTASI.NOISE_WORDS) {

    result =
      result.split(" " + noise + " ").join(" ");

  }

  return result.trim();

}


/* ============================================================
 * 45. KUNCI LOKASI MUTASI (UNTUK PENCOCOKAN)
 * ============================================================
 */

function buatKunciLokasiMutasi_(text) {

  return normalizeLocationName_(
    stripNoiseWords_(text)
  );

}


/* ============================================================
 * 46. TEST NOMINAL MUTASI SATU LOKASI
 *
 * Cara pakai: pilih salah satu baris data lokasi pada sheet
 * bulan aktif, lalu jalankan lewat menu
 * "🧪 Test Nominal Mutasi (Baris Aktif)".
 * ============================================================
 */

function testNominalMutasiAktif() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const ui =
    SpreadsheetApp.getUi();

  const sheet =
    ss.getActiveSheet();

  const row =
    sheet.getActiveRange().getRow();

  if (row < CONFIG_CEK_GAJI.DATA_START_ROW) {

    ui.alert(
      "TEST",
      "Pilih salah satu baris data lokasi terlebih dahulu.",
      ui.ButtonSet.OK
    );

    return;

  }

  const sheetName =
    sheet.getName();

  if (!isMonthSheet_(sheetName)) {

    ui.alert(
      "TEST",
      "Sheet aktif bukan sheet bulan.",
      ui.ButtonSet.OK
    );

    return;

  }

  const headerMap =
    getDestinationHeaderMap_(sheet);

  const locationColumn =
    headerMap[normalizeHeader_("NAMA LOKASI")];

  const namaLokasi =
    sheet.getRange(row, locationColumn).getDisplayValue();

  try {

    const sourceUrl =
      getMutasiSourceUrl_(sheetName);

    if (!sourceUrl) {

      throw new Error(
        'Link REKONSILIASI untuk bulan "' +
        sheetName + '" belum diatur di CONFIG_MUTASI.SOURCES.'
      );

    }

    const sourceId =
      extractSpreadsheetId_(sourceUrl);

    const sourceSS =
      SpreadsheetApp.openById(sourceId);

    const mutasiSheet =
      cariSheetMutasi_(sourceSS);

    if (!mutasiSheet) {

      throw new Error(
        'Sheet "' + CONFIG_MUTASI.SHEET_NAME +
        '" tidak ditemukan.'
      );

    }

    const mutasiTotals =
      buildMutasiLocationTotals_(mutasiSheet);

    const target =
      normalizeLocationName_(namaLokasi);

    const found = [];

    for (const item of mutasiTotals) {

      const key =
        buatKunciLokasiMutasi_(item.rawLocation);

      if (!key || key.length < CONFIG_MUTASI.MIN_MATCH_LENGTH) {
        continue;
      }

      if (
        target.indexOf(key) !== -1 ||
        key.indexOf(target) !== -1
      ) {

        found.push(item);

      }

    }

    if (found.length === 0) {

      ui.alert(
        "🔍 TEST NOMINAL MUTASI",
        "Lokasi: " + namaLokasi + "\n\n" +
        "Tidak ada data mutasi yang cocok bulan ini.",
        ui.ButtonSet.OK
      );

      return;

    }

    let total = 0;
    let detail = "";

    for (const item of found) {

      total += item.total;

      detail +=
        "- " + item.rawLocation + ": " +
        formatNumberForDisplay_(item.total) + "\n";

    }

    ui.alert(
      "✅ TEST NOMINAL MUTASI",
      "Lokasi: " + namaLokasi + "\n\n" +
      "Grup mutasi yang cocok:\n" + detail + "\n" +
      "TOTAL: " + formatNumberForDisplay_(total),
      ui.ButtonSet.OK
    );

  } catch (err) {

    ui.alert(
      "❌ TEST GAGAL",
      err.message,
      ui.ButtonSet.OK
    );

  }

}


/* ============================================================
 * 47. DEBUG SHEET MUTASI
 *
 * Kalau "Isi Nominal Mutasi" gagal membaca data, jalankan menu
 * ini untuk melihat isi mentah sheet MUTASI (nama sheet, ukuran,
 * dan beberapa baris pertama) supaya bisa dicek kenapa header-nya
 * tidak terdeteksi oleh cariBlokRingkasanMutasi_ / cariBlokRincianMutasi_.
 * ============================================================
 */

function debugSheetMutasi() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const ui =
    SpreadsheetApp.getUi();

  const sheet =
    ss.getActiveSheet();

  const sheetName =
    sheet.getName();

  try {

    const sourceUrl =
      getMutasiSourceUrl_(sheetName);

    if (!sourceUrl) {

      throw new Error(
        'Link REKONSILIASI untuk bulan "' +
        sheetName + '" belum diatur di CONFIG_MUTASI.SOURCES.'
      );

    }

    const sourceId =
      extractSpreadsheetId_(sourceUrl);

    const sourceSS =
      SpreadsheetApp.openById(sourceId);

    const allSheetNames =
      sourceSS.getSheets().map(function(sh) {
        return sh.getName();
      }).join(", ");

    const mutasiSheet =
      cariSheetMutasi_(sourceSS);

    if (!mutasiSheet) {

      throw new Error(
        'Sheet "' + CONFIG_MUTASI.SHEET_NAME +
        '" tidak ditemukan.\n\nDaftar sheet yang ada:\n' +
        allSheetNames
      );

    }

    const lastRow =
      mutasiSheet.getLastRow();

    const lastColumn =
      mutasiSheet.getLastColumn();

    const previewRows =
      Math.min(20, lastRow);

    const previewCols =
      Math.min(10, lastColumn);

    let text =
      "Spreadsheet: " + sourceSS.getName() + "\n" +
      "Semua sheet: " + allSheetNames + "\n\n" +
      "Sheet MUTASI ditemukan: \"" + mutasiSheet.getName() + "\"\n" +
      "Ukuran: " + lastRow + " baris x " + lastColumn + " kolom\n\n" +
      "Isi " + previewRows + " baris pertama (maks " + previewCols + " kolom):\n\n";

    if (previewRows > 0 && previewCols > 0) {

      const data =
        mutasiSheet
          .getRange(1, 1, previewRows, previewCols)
          .getDisplayValues();

      for (let r = 0; r < data.length; r++) {

        text +=
          (r + 1) + ": " + data[r].join(" | ") + "\n";

      }

    } else {

      text += "(sheet kosong)";

    }

    ui.alert(
      "🔎 DEBUG SHEET MUTASI",
      text.substring(0, 4500),
      ui.ButtonSet.OK
    );

  } catch (err) {

    ui.alert(
      "❌ DEBUG GAGAL",
      err.message,
      ui.ButtonSet.OK
    );

  }

}

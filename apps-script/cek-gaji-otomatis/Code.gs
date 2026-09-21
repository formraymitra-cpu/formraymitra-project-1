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
 * - NOMINAL TERTRANSFER
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
    .addItem("🏦 Buat Kolom Nominal Tertransfer", "menuBuatKolomNominalTertransfer")
    .addItem("🔄 Update Kolom Nominal Tertransfer", "menuUpdateKolomNominalTertransfer")
    .addSeparator()
    .addItem("📊 Cek Progress", "menuCekProgress")
    .addItem("🔄 Reset Progress Sheet", "menuResetProgress")
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
 * =============================================================
 *   FITUR BARU: BUAT KOLOM NOMINAL TERTRANSFER
 * =============================================================
 *
 * Menu ini membuat (atau memperbarui) kolom "NOMINAL TERTRANSFER"
 * tepat di antara kolom PAYROLL dan KETERANGAN pada sheet bulan
 * yang sedang aktif, lalu mengisinya dengan mencocokkan NAMA LOKASI
 * terhadap tabel nominal transfer di spreadsheet lain.
 *
 * Pencocokan nama lokasi dibuat toleran terhadap dua kasus:
 *
 * 1. ALIAS - nama lokasi yang benar-benar berbeda antara kedua
 *    spreadsheet, contoh:
 *      "UPPD KOTA SEMARANG 1" (Cek Gaji) = "UPPD SAMSAT 1" (Nominal Transfer)
 *
 * 2. SINGKATAN - potongan kata yang disingkat di salah satu sisi,
 *    contoh:
 *      "KEJARI" = "KEJAKSAAN NEGERI"
 *
 * Lokasi yang tidak berhasil dicocokkan TIDAK ditimpa (data manual
 * yang sudah ada di kolom tidak akan dihapus).
 * ============================================================
 */


/* ============================================================
 * 37. KONFIGURASI NOMINAL TERTRANSFER
 * ============================================================
 */

const CONFIG_NOMINAL_TRANSFER = {

  // Nama header kolom baru.
  COLUMN_HEADER: "NOMINAL TERTRANSFER",

  // Kolom baru disisipkan tepat setelah header ini...
  AFTER_HEADER: "PAYROLL",

  // ...supaya otomatis berada sebelum header ini.
  BEFORE_HEADER: "KETERANGAN",

  // Berapa baris maksimal discan untuk mencari header tabel
  // "NAMA LOKASI" & "NOMINAL TERTRANSFER" di spreadsheet sumber.
  MAX_HEADER_SCAN_ROWS: 30,

  /*
   * ==========================================================
   * ALIAS NAMA LOKASI
   * ==========================================================
   *
   * Dipakai kalau nama lokasi di sheet CEK GAJI OTOMATIS
   * benar-benar berbeda dengan nama lokasi di sheet sumber
   * nominal transfer (bukan sekadar singkatan).
   *
   * Format:
   *   "NAMA DI CEK GAJI OTOMATIS": "NAMA DI SHEET NOMINAL TRANSFER"
   *
   * Jangan hapus alias yang sudah ada, tambahkan saja di bawah.
   */
  LOCATION_ALIASES: {

    "UPPD KOTA SEMARANG 1": "SAMSAT 1",
    "UPPD KOTA SEMARANG 2": "SAMSAT 2",
    "UPPD KOTA SEMARANG 3": "SAMSAT 3"

    /*
     * CONTOH ALIAS BARU:
     *
     * "NAMA DI CEK GAJI": "NAMA DI NOMINAL TRANSFER",
     */

  },

  /*
   * ==========================================================
   * SINGKATAN
   * ==========================================================
   *
   * Dipakai supaya singkatan dan kepanjangannya dianggap sama
   * di mana pun kata itu muncul di dalam nama lokasi.
   *
   * Format:
   *   "SINGKATAN": "KEPANJANGAN"
   */
  ABBREVIATIONS: {

    "KEJARI": "KEJAKSAAN NEGERI"

    /*
     * CONTOH SINGKATAN BARU:
     *
     * "POLRES": "KEPOLISIAN RESOR",
     */

  },

  /*
   * ==========================================================
   * KATA YANG DIABAIKAN
   * ==========================================================
   *
   * Kata-kata di sini akan dibuang dari nama lokasi sebelum
   * dicocokkan (di kedua sisi: sheet CEK GAJI OTOMATIS maupun
   * sheet Nominal Transfer).
   *
   * Dipakai untuk kata tambahan yang tidak berhubungan dengan
   * identitas lokasi itu sendiri, contoh: di sheet Nominal
   * Transfer semua nama lokasi punya akhiran "PENGECEKAN"
   * (mis. "SAMSAT 1 PENGECEKAN"), padahal di CEK GAJI OTOMATIS
   * kata itu tidak ada.
   *
   * Tambahkan kata baru tanpa menghapus yang sudah ada.
   */
  IGNORED_WORDS: [

    "PENGECEKAN"

    /*
     * CONTOH KATA BARU:
     *
     * "PTSL",
     */

  ]

};


/* ============================================================
 * 38. MENU - BUAT KOLOM NOMINAL TERTRANSFER
 * ============================================================
 */

function menuBuatKolomNominalTertransfer() {

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
      "NOMINAL TERTRANSFER",
      "Sheet aktif adalah \"" + sheetName +
      "\".\n\n" +
      "Silakan buka sheet bulan seperti JUNI, JULI, AGUSTUS, dst.",
      ui.ButtonSet.OK
    );

    return;
  }

  const properties =
    PropertiesService.getDocumentProperties();

  const propKeyLink =
    "NOMINAL_TRANSFER_LINK_" + sheetName;

  const propKeySheet =
    "NOMINAL_TRANSFER_SHEET_" + sheetName;

  const lastLink =
    properties.getProperty(propKeyLink) || "";

  const lastSourceSheetName =
    properties.getProperty(propKeySheet) || "";

  /*
   * ==========================================================
   * POPUP 1: LINK SPREADSHEET NOMINAL TRANSFER
   * ==========================================================
   */

  const linkPrompt = ui.prompt(
    "🏦 LANGKAH 1/2 - LINK SPREADSHEET",
    "Masukkan link Google Spreadsheet tempat data NOMINAL " +
    "TERTRANSFER berada.\n\n" +
    (
      lastLink
        ? "Kosongkan lalu klik OK untuk memakai link terakhir:\n" +
          lastLink + "\n\n"
        : ""
    ) +
    "Contoh:\n" +
    "https://docs.google.com/spreadsheets/d/XXXXX/edit",
    ui.ButtonSet.OK_CANCEL
  );

  if (linkPrompt.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  let sourceUrl =
    linkPrompt.getResponseText().trim();

  if (!sourceUrl) {
    sourceUrl = lastLink;
  }

  if (!sourceUrl) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Link spreadsheet tidak boleh kosong.",
      ui.ButtonSet.OK
    );

    return;
  }

  const sourceId =
    extractSpreadsheetId_(sourceUrl);

  if (!sourceId) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Link spreadsheet tidak valid:\n" + sourceUrl,
      ui.ButtonSet.OK
    );

    return;
  }

  let sourceSS;

  try {

    sourceSS =
      SpreadsheetApp.openById(sourceId);

  } catch (err) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Gagal membuka spreadsheet:\n" + err.message,
      ui.ButtonSet.OK
    );

    return;
  }

  /*
   * ==========================================================
   * POPUP 2: NAMA SHEET NOMINAL TRANSFER
   * ==========================================================
   */

  const sheetNames =
    sourceSS.getSheets().map(function (sh) {
      return sh.getName();
    });

  const sheetPrompt = ui.prompt(
    "🏦 LANGKAH 2/2 - NAMA SHEET",
    "Masukkan nama sheet di dalam spreadsheet tersebut yang " +
    "berisi data NOMINAL TERTRANSFER.\n\n" +
    (
      lastSourceSheetName
        ? "Kosongkan lalu klik OK untuk memakai sheet terakhir:\n" +
          lastSourceSheetName + "\n\n"
        : ""
    ) +
    "Sheet yang tersedia:\n" +
    sheetNames.join(", "),
    ui.ButtonSet.OK_CANCEL
  );

  if (sheetPrompt.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  let sourceSheetName =
    sheetPrompt.getResponseText().trim();

  if (!sourceSheetName) {
    sourceSheetName = lastSourceSheetName;
  }

  const sourceSheet =
    sourceSS.getSheetByName(sourceSheetName);

  if (!sourceSheet) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Sheet \"" + sourceSheetName +
      "\" tidak ditemukan.\n\n" +
      "Sheet yang tersedia:\n" +
      sheetNames.join(", "),
      ui.ButtonSet.OK
    );

    return;
  }

  const confirm = ui.alert(
    "⚡ KONFIRMASI",
    "Sheet tujuan: " + sheetName + "\n\n" +
    "Sumber nominal transfer:\n" +
    sourceUrl + "\n" +
    "Sheet: " + sourceSheetName + "\n\n" +
    "Kolom \"" + CONFIG_NOMINAL_TRANSFER.COLUMN_HEADER +
    "\" akan dibuat (atau diperbarui) di antara kolom " +
    CONFIG_NOMINAL_TRANSFER.AFTER_HEADER + " dan " +
    CONFIG_NOMINAL_TRANSFER.BEFORE_HEADER + ".\n\n" +
    "Lanjutkan?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  /*
   * Simpan pilihan supaya bisa dipakai lagi tanpa mengetik ulang.
   */
  properties.setProperty(propKeyLink, sourceUrl);
  properties.setProperty(propKeySheet, sourceSheetName);

  prosesKolomNominalTertransfer_(
    sheet,
    sourceSheet
  );

}


/* ============================================================
 * 39. MENU - UPDATE KOLOM NOMINAL TERTRANSFER
 *
 * Berbeda dari "Buat Kolom Nominal Tertransfer", menu ini tidak
 * menampilkan popup link/sheet lagi. Menu ini langsung memakai
 * link & nama sheet sumber yang terakhir disimpan untuk sheet
 * bulan yang aktif, lalu menjalankan ulang pencocokan supaya
 * kolom NOMINAL TERTRANSFER mengikuti update terbaru di
 * spreadsheet sumber.
 *
 * Kalau sheet bulan ini belum pernah disetup lewat menu "Buat
 * Kolom Nominal Tertransfer", pengguna diarahkan ke menu itu
 * dulu.
 * ============================================================
 */

function menuUpdateKolomNominalTertransfer() {

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
      "NOMINAL TERTRANSFER",
      "Sheet aktif adalah \"" + sheetName +
      "\".\n\n" +
      "Silakan buka sheet bulan seperti JUNI, JULI, AGUSTUS, dst.",
      ui.ButtonSet.OK
    );

    return;
  }

  const properties =
    PropertiesService.getDocumentProperties();

  const propKeyLink =
    "NOMINAL_TRANSFER_LINK_" + sheetName;

  const propKeySheet =
    "NOMINAL_TRANSFER_SHEET_" + sheetName;

  const sourceUrl =
    properties.getProperty(propKeyLink) || "";

  const sourceSheetName =
    properties.getProperty(propKeySheet) || "";

  if (!sourceUrl || !sourceSheetName) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Belum ada sumber nominal transfer yang tersimpan untuk " +
      "sheet " + sheetName + ".\n\n" +
      "Jalankan menu \"Buat Kolom Nominal Tertransfer\" terlebih " +
      "dahulu (link & nama sheet sumber hanya perlu diisi sekali).",
      ui.ButtonSet.OK
    );

    return;
  }

  const sourceId =
    extractSpreadsheetId_(sourceUrl);

  if (!sourceId) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Link spreadsheet yang tersimpan tidak valid:\n" +
      sourceUrl + "\n\n" +
      "Jalankan ulang menu \"Buat Kolom Nominal Tertransfer\" " +
      "untuk memasukkan link baru.",
      ui.ButtonSet.OK
    );

    return;
  }

  let sourceSS;

  try {

    sourceSS =
      SpreadsheetApp.openById(sourceId);

  } catch (err) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Gagal membuka spreadsheet sumber:\n" + err.message,
      ui.ButtonSet.OK
    );

    return;
  }

  const sourceSheet =
    sourceSS.getSheetByName(sourceSheetName);

  if (!sourceSheet) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Sheet \"" + sourceSheetName +
      "\" tidak ditemukan lagi di spreadsheet sumber.\n\n" +
      "Jalankan ulang menu \"Buat Kolom Nominal Tertransfer\" " +
      "untuk memilih sheet yang benar.",
      ui.ButtonSet.OK
    );

    return;
  }

  const confirm = ui.alert(
    "🔄 KONFIRMASI UPDATE",
    "Sheet tujuan: " + sheetName + "\n\n" +
    "Sumber nominal transfer (tersimpan sebelumnya):\n" +
    sourceUrl + "\n" +
    "Sheet: " + sourceSheetName + "\n\n" +
    "Kolom \"" + CONFIG_NOMINAL_TRANSFER.COLUMN_HEADER +
    "\" akan diperbarui mengikuti data terbaru di sumber " +
    "tersebut.\n\n" +
    "Lanjutkan?",
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  prosesKolomNominalTertransfer_(
    sheet,
    sourceSheet
  );

}


/* ============================================================
 * 40. PROSES KOLOM NOMINAL TERTRANSFER
 * ============================================================
 */

function prosesKolomNominalTertransfer_(
  destSheet,
  sourceSheet
) {

  const ui =
    SpreadsheetApp.getUi();

  /*
   * ==========================================================
   * SIAPKAN KOLOM TUJUAN
   * ==========================================================
   */

  let columnIndex;

  try {

    columnIndex =
      siapkanKolomNominalTertransfer_(destSheet);

  } catch (err) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      err.message,
      ui.ButtonSet.OK
    );

    return;
  }

  /*
   * ==========================================================
   * BANGUN LOOKUP DARI SHEET SUMBER
   * ==========================================================
   */

  const lookup =
    buildNominalTransferLookup_(sourceSheet);

  if (!lookup) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Header nama lokasi dan nominal transfer tidak ditemukan " +
      "di sheet \"" + sourceSheet.getName() + "\".",
      ui.ButtonSet.OK
    );

    return;
  }

  /*
   * ==========================================================
   * SIAPKAN DATA TUJUAN
   * ==========================================================
   */

  const headerMap =
    getDestinationHeaderMap_(destSheet);

  const locationColumn =
    headerMap[normalizeHeader_("NAMA LOKASI")];

  if (!locationColumn) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      'Header "NAMA LOKASI" tidak ditemukan di sheet tujuan.',
      ui.ButtonSet.OK
    );

    return;
  }

  const dataStartRow =
    CONFIG_CEK_GAJI.DATA_START_ROW;

  const lastRow =
    destSheet.getLastRow();

  if (lastRow < dataStartRow) {

    ui.alert(
      "NOMINAL TERTRANSFER",
      "Tidak ditemukan data lokasi pada sheet " +
      destSheet.getName() + ".",
      ui.ButtonSet.OK
    );

    return;
  }

  const numRows =
    lastRow - dataStartRow + 1;

  const namaLokasiValues =
    destSheet
      .getRange(dataStartRow, locationColumn, numRows, 1)
      .getDisplayValues();

  const aliasMap =
    buildNormalizedAliasMap_();

  /*
   * ==========================================================
   * TAHAP 1: EXACT MATCH (+ ALIAS)
   *
   * PENTING:
   *
   * Lokasi yang tidak ditemukan TIDAK ditulis / ditimpa,
   * supaya data manual yang sudah ada tetap aman. Hanya
   * exact/alias match yang boleh langsung menulis nilai.
   * ==========================================================
   */

  let sukses = 0;

  const usedSourceKeys = new Set();

  const destEntriesBelumKetemu = [];

  for (let i = 0; i < namaLokasiValues.length; i++) {

    const rowNumber =
      dataStartRow + i;

    const location =
      namaLokasiValues[i][0];

    if (!location || String(location).trim() === "") {
      continue;
    }

    const key =
      canonicalLocationKey_(location);

    const finalKey =
      aliasMap[key] || key;

    const nominal =
      lookup.byKey[finalKey];

    if (nominal === undefined) {

      destEntriesBelumKetemu.push({
        rowNumber: rowNumber,
        name: String(location).trim(),
        tokens: canonicalTokens_(location)
      });

      continue;
    }

    destSheet
      .getRange(rowNumber, columnIndex)
      .setValue(nominal);

    usedSourceKeys.add(finalKey);

    sukses++;

  }

  SpreadsheetApp.flush();

  /*
   * ==========================================================
   * TAHAP 2: CARI KANDIDAT UNTUK KONFIRMASI MANUAL
   *
   * Hanya entri sumber yang BELUM kepakai di tahap 1 dan yang
   * "terindikasi" mirip (skor di atas ambang) dengan salah satu
   * lokasi tujuan yang masih kosong yang akan ditawarkan lewat
   * popup. Entri sumber yang sama sekali tidak mirip dengan
   * lokasi manapun tetap dianggap "tidak ditemukan" tanpa
   * ditawarkan (supaya popup tidak penuh data yang tidak
   * berhubungan).
   * ==========================================================
   */

  const sourceEntriesBelumKepakai =
    lookup.entries.filter(function (entry) {
      return !usedSourceKeys.has(entry.key);
    });

  const confirmList =
    cariKandidatLokasiMirip_(
      sourceEntriesBelumKepakai,
      destEntriesBelumKetemu,
      5
    );

  const tidakDitemukan =
    destEntriesBelumKetemu.length;

  if (confirmList.length === 0) {

    let message =
      "Sheet: " + destSheet.getName() + "\n\n" +
      "Berhasil dicocokkan: " + sukses + "\n" +
      "Tidak ditemukan: " + tidakDitemukan;

    if (tidakDitemukan > 0) {

      message +=
        "\n\nLokasi yang tidak ditemukan (tidak ditimpa):\n" +
        destEntriesBelumKetemu
          .slice(0, 20)
          .map(function (d) { return d.name; })
          .join("\n");

      if (tidakDitemukan > 20) {

        message +=
          "\n... dan " +
          (tidakDitemukan - 20) +
          " lainnya.";

      }

    }

    ui.alert(
      "✅ NOMINAL TERTRANSFER SELESAI",
      message,
      ui.ButtonSet.OK
    );

    return;
  }

  /*
   * ==========================================================
   * TAHAP 3: TAMPILKAN POPUP KONFIRMASI
   *
   * Ada entri sumber yang "terindikasi" tapi belum yakin cocok
   * ke lokasi tujuan mana. Tampilkan lewat dialog supaya
   * pengguna yang memutuskan, bukan sistem yang menebak.
   * ==========================================================
   */

  const ringkasan =
    "Sheet: " + destSheet.getName() + "<br>" +
    "Berhasil dicocokkan otomatis: " + sukses + "<br>" +
    "Perlu dikonfirmasi manual: " + confirmList.length + "<br>" +
    "Sisanya (" +
    (tidakDitemukan - confirmList.length) +
    ") tidak ditemukan sama sekali dan dilewati.";

  tampilkanKonfirmasiLokasi_(
    destSheet.getName(),
    ringkasan,
    confirmList,
    destEntriesBelumKetemu.map(function (d) {
      return { rowNumber: d.rowNumber, name: d.name };
    })
  );

}


/* ============================================================
 * 41. SIAPKAN KOLOM NOMINAL TERTRANSFER DI SHEET TUJUAN
 *
 * Kolom disisipkan tepat setelah PAYROLL (yang secara alami
 * berarti sebelum KETERANGAN). Jika kolom sudah pernah dibuat
 * sebelumnya, fungsi ini tidak menyisipkan kolom baru lagi,
 * cukup memakai kolom yang sudah ada supaya tidak dobel.
 * ============================================================
 */

function siapkanKolomNominalTertransfer_(destSheet) {

  const headerRow =
    CONFIG_CEK_GAJI.HEADER_ROW;

  const headerMap =
    getDestinationHeaderMap_(destSheet);

  const columnHeaderKey =
    normalizeHeader_(
      CONFIG_NOMINAL_TRANSFER.COLUMN_HEADER
    );

  const existingColumn =
    headerMap[columnHeaderKey];

  if (existingColumn) {
    return existingColumn;
  }

  const afterColumn =
    headerMap[
      normalizeHeader_(
        CONFIG_NOMINAL_TRANSFER.AFTER_HEADER
      )
    ];

  if (!afterColumn) {

    throw new Error(
      'Header "' +
      CONFIG_NOMINAL_TRANSFER.AFTER_HEADER +
      '" tidak ditemukan pada baris ' +
      headerRow +
      ", kolom NOMINAL TERTRANSFER tidak bisa dibuat."
    );

  }

  destSheet.insertColumnAfter(afterColumn);

  const newColumn =
    afterColumn + 1;

  destSheet
    .getRange(headerRow, newColumn)
    .setValue(
      CONFIG_NOMINAL_TRANSFER.COLUMN_HEADER
    );

  return newColumn;

}


/* ============================================================
 * 42. BANGUN LOOKUP NOMINAL TERTRANSFER DARI SHEET SUMBER
 *
 * Sheet sumber diasumsikan berbentuk tabel datar (satu baris
 * per lokasi), bukan blok per lokasi seperti rekap gaji PIC.
 * Header tabel dicari otomatis berdasarkan nama kolom yang
 * mengandung kata LOKASI/NAMA dan NOMINAL/TRANSFER.
 *
 * Mengembalikan:
 *   {
 *     byKey: { canonicalKey: nominal, ... },
 *     entries: [ { name, key, tokens, nominal }, ... ]
 *   }
 *
 * "entries" dipakai untuk fuzzy matching (lihat
 * cariKandidatLokasiMirip_) pada lokasi yang tidak ketemu
 * lewat pencocokan exact/alias.
 * ============================================================
 */

function buildNominalTransferLookup_(sourceSheet) {

  const lastRow =
    sourceSheet.getLastRow();

  const lastColumn =
    sourceSheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    return null;
  }

  const scanEnd =
    Math.min(
      CONFIG_NOMINAL_TRANSFER.MAX_HEADER_SCAN_ROWS,
      lastRow
    );

  const headerArea =
    sourceSheet
      .getRange(1, 1, scanEnd, lastColumn)
      .getDisplayValues();

  let headerRowIndex = -1;
  let nameCol = -1;
  let nominalCol = -1;

  for (let r = 0; r < headerArea.length; r++) {

    let rowNameCol = -1;
    let rowNominalCol = -1;
    let rowNominalScore = -1;

    for (let c = 0; c < lastColumn; c++) {

      const txt =
        normalizeHeader_(
          headerArea[r][c]
        );

      if (!txt) continue;

      if (
        rowNameCol === -1 &&
        (
          txt.indexOf("LOKASI") !== -1 ||
          txt === "NAMA"
        )
      ) {

        rowNameCol = c;

      }

      const isNominal =
        txt.indexOf("NOMINAL") !== -1 ||
        txt.indexOf("TRANSFER") !== -1;

      if (isNominal) {

        const score =
          (txt.indexOf("NOMINAL") !== -1 ? 10 : 0) +
          (txt.indexOf("TRANSFER") !== -1 ? 10 : 0);

        if (score > rowNominalScore) {

          rowNominalScore = score;
          rowNominalCol = c;

        }

      }

    }

    if (rowNameCol !== -1 && rowNominalCol !== -1) {

      headerRowIndex = r;
      nameCol = rowNameCol;
      nominalCol = rowNominalCol;
      break;

    }

  }

  if (headerRowIndex === -1) {
    return null;
  }

  const dataStartRow =
    headerRowIndex + 2;

  const numRows =
    lastRow - dataStartRow + 1;

  if (numRows <= 0) {
    return { byKey: {}, entries: [] };
  }

  const data =
    sourceSheet
      .getRange(dataStartRow, 1, numRows, lastColumn)
      .getDisplayValues();

  const byKey = {};
  const entries = [];

  for (let r = 0; r < data.length; r++) {

    const name =
      data[r][nameCol];

    if (!name || String(name).trim() === "") {
      continue;
    }

    const nominal =
      parseNumber_(
        data[r][nominalCol]
      );

    if (nominal === null) {
      continue;
    }

    const key =
      canonicalLocationKey_(name);

    byKey[key] = nominal;

    entries.push({
      name: String(name).trim(),
      key: key,
      tokens: canonicalTokens_(name),
      nominal: nominal
    });

  }

  return {
    byKey: byKey,
    entries: entries
  };

}


/* ============================================================
 * 43. CANONICAL LOCATION KEY
 *
 * Menggabungkan ekspansi singkatan, pembuangan kata yang
 * diabaikan, lalu normalisasi nama lokasi. Sehingga:
 *
 * - "KEJARI SEMARANG" = "KEJAKSAAN NEGERI SEMARANG" (singkatan)
 * - "SAMSAT 1 PENGECEKAN" = "SAMSAT 1" (kata diabaikan)
 *
 * menghasilkan key yang sama.
 * ============================================================
 */

function canonicalLocationKey_(text) {

  return normalizeLocationName_(
    removeIgnoredWords_(
      expandAbbreviations_(text)
    )
  );

}


/* ============================================================
 * 44. CANONICAL LOCATION TOKENS
 *
 * Sama seperti canonicalLocationKey_(), tapi hasilnya berupa
 * array kata (bukan digabung tanpa spasi). Dipakai untuk
 * fuzzy matching di cariKandidatLokasiMirip_(), supaya lokasi
 * yang mirip tapi tidak identik tetap bisa "terindikasi".
 * ============================================================
 */

function canonicalTokens_(text) {

  const cleaned =
    removeIgnoredWords_(
      expandAbbreviations_(text)
    );

  return cleaned
    .split(/[^A-Z0-9]+/)
    .filter(function (token) {
      return token.length > 0;
    });

}


/* ============================================================
 * 45. EXPAND ABBREVIATIONS
 *
 * Mengganti setiap singkatan (sebagai kata utuh) dengan
 * kepanjangannya, berdasarkan CONFIG_NOMINAL_TRANSFER.ABBREVIATIONS.
 * ============================================================
 */

function expandAbbreviations_(text) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }

  let result =
    " " + String(text).toUpperCase() + " ";

  const abbreviations =
    CONFIG_NOMINAL_TRANSFER.ABBREVIATIONS;

  for (const singkatan in abbreviations) {

    const kepanjangan =
      abbreviations[singkatan];

    const pattern =
      new RegExp(
        "\\b" + escapeRegExp_(singkatan) + "\\b",
        "g"
      );

    result =
      result.replace(pattern, kepanjangan);

  }

  return result.trim();

}


/* ============================================================
 * 46. REMOVE IGNORED WORDS
 *
 * Membuang setiap kata (sebagai kata utuh) yang terdaftar di
 * CONFIG_NOMINAL_TRANSFER.IGNORED_WORDS, misalnya "PENGECEKAN"
 * yang menempel di semua nama lokasi pada sheet sumber tapi
 * tidak ada di NAMA LOKASI tujuan.
 * ============================================================
 */

function removeIgnoredWords_(text) {

  if (
    text === null ||
    text === undefined
  ) {

    return "";

  }

  let result =
    " " + String(text).toUpperCase() + " ";

  const ignoredWords =
    CONFIG_NOMINAL_TRANSFER.IGNORED_WORDS || [];

  for (const word of ignoredWords) {

    const pattern =
      new RegExp(
        "\\b" + escapeRegExp_(word) + "\\b",
        "g"
      );

    result =
      result.replace(pattern, " ");

  }

  return result.trim();

}


/* ============================================================
 * 47. ESCAPE REGEXP & ALIAS MAP BUILDER
 * ============================================================
 */

function escapeRegExp_(text) {

  return String(text).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

}

function buildNormalizedAliasMap_() {

  const map = {};

  /*
   * Gabungkan alias tetap dari CONFIG_NOMINAL_TRANSFER dengan
   * alias tambahan yang pernah disimpan lewat popup konfirmasi
   * (lihat getExtraAliases_ / addExtraAlias_). Alias tambahan
   * tidak menimpa alias tetap kalau kuncinya sama.
   */
  const aliases =
    Object.assign(
      {},
      CONFIG_NOMINAL_TRANSFER.LOCATION_ALIASES,
      getExtraAliases_()
    );

  for (const from in aliases) {

    map[canonicalLocationKey_(from)] =
      canonicalLocationKey_(aliases[from]);

  }

  return map;

}


/* ============================================================
 * 48. PENYIMPANAN ALIAS TAMBAHAN
 *
 * Alias yang dikonfirmasi manual oleh pengguna lewat popup
 * "Konfirmasi Lokasi" disimpan di sini (Document Properties,
 * berlaku untuk semua sheet bulan pada spreadsheet ini) supaya
 * tidak perlu dikonfirmasi ulang di bulan-bulan berikutnya.
 * ============================================================
 */

function getExtraAliases_() {

  const raw =
    PropertiesService
      .getDocumentProperties()
      .getProperty("NOMINAL_TRANSFER_EXTRA_ALIASES");

  if (!raw) {
    return {};
  }

  try {

    const parsed =
      JSON.parse(raw);

    return (parsed && typeof parsed === "object") ? parsed : {};

  } catch (err) {

    return {};

  }

}

function addExtraAlias_(destName, sourceName) {

  if (!destName || !sourceName) {
    return;
  }

  const properties =
    PropertiesService.getDocumentProperties();

  const extra =
    getExtraAliases_();

  extra[destName] = sourceName;

  properties.setProperty(
    "NOMINAL_TRANSFER_EXTRA_ALIASES",
    JSON.stringify(extra)
  );

}


/* ============================================================
 * 49. SKOR KEMIRIPAN LOKASI (FUZZY MATCH)
 *
 * Dipakai HANYA untuk menyarankan kandidat di popup konfirmasi,
 * TIDAK PERNAH dipakai untuk langsung menulis nilai (itu tetap
 * exklusif untuk exact match + alias, sesuai prinsip STRICT
 * di file ini). Skor dihitung dari proporsi kata bermakna
 * (>= 3 huruf/angka) yang sama, relatif terhadap sisi yang
 * kata-nya lebih sedikit, supaya nama yang lebih pendek tapi
 * "termuat penuh" di nama yang lebih panjang tetap dapat skor
 * tinggi walau ada kata tambahan yang tidak dikenal.
 * ============================================================
 */

function tokenSimilarityScore_(tokensA, tokensB) {

  const significantA =
    tokensA.filter(function (t) { return t.length >= 3; });

  const significantB =
    tokensB.filter(function (t) { return t.length >= 3; });

  if (!significantA.length || !significantB.length) {
    return 0;
  }

  const setB =
    new Set(significantB);

  let common = 0;

  significantA.forEach(function (t) {
    if (setB.has(t)) common++;
  });

  const smaller =
    Math.min(significantA.length, significantB.length);

  return smaller === 0 ? 0 : common / smaller;

}


/* ============================================================
 * 50. CARI KANDIDAT LOKASI MIRIP
 *
 * Untuk tiap entri sumber yang belum kepakai di exact pass,
 * cari baris NAMA LOKASI tujuan yang paling mirip (di antara
 * baris tujuan yang juga belum terisi). Entri sumber yang sama
 * sekali tidak mirip dengan lokasi tujuan mana pun (skor di
 * bawah ambang) dilewati begitu saja -- tidak dimasukkan ke
 * daftar konfirmasi, supaya popup tidak penuh data yang memang
 * tidak berhubungan.
 * ============================================================
 */

function cariKandidatLokasiMirip_(
  sourceEntries,
  destEntries,
  maxKandidatPerBaris
) {

  const AMBANG_SKOR = 0.5;

  const confirmList = [];

  for (const src of sourceEntries) {

    const skorList = [];

    for (const dest of destEntries) {

      const skor =
        tokenSimilarityScore_(
          src.tokens,
          dest.tokens
        );

      if (skor >= AMBANG_SKOR) {

        skorList.push({
          rowNumber: dest.rowNumber,
          name: dest.name,
          score: skor
        });

      }

    }

    if (skorList.length === 0) {
      continue;
    }

    skorList.sort(function (a, b) {
      return b.score - a.score;
    });

    confirmList.push({
      sourceName: src.name,
      sourceKey: src.key,
      nominal: src.nominal,
      candidates: skorList.slice(0, maxKandidatPerBaris)
    });

  }

  return confirmList;

}


/* ============================================================
 * 51. TAMPILKAN POPUP KONFIRMASI LOKASI
 *
 * Membuka dialog modal (HtmlService) berisi daftar lokasi
 * sumber yang "terindikasi" tapi belum yakin cocok ke lokasi
 * tujuan mana. Pengguna memilih lokasi tujuan yang sesuai dari
 * dropdown (berisi seluruh lokasi tujuan yang masih kosong),
 * lalu klik simpan. Penulisan nilai yang sesungguhnya terjadi
 * di applyNominalTransferKonfirmasi_(), dipanggil oleh dialog
 * lewat google.script.run.
 * ============================================================
 */

function tampilkanKonfirmasiLokasi_(
  sheetName,
  ringkasan,
  confirmList,
  destOptions
) {

  const template =
    HtmlService.createTemplateFromFile(
      "KonfirmasiLokasi"
    );

  template.sheetName = sheetName;
  template.ringkasanHtml = ringkasan;
  template.confirmListJson = JSON.stringify(confirmList);
  template.destOptionsJson = JSON.stringify(destOptions);

  const output =
    template
      .evaluate()
      .setWidth(760)
      .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(
    output,
    "🔎 Konfirmasi Lokasi Nominal Transfer"
  );

}


/* ============================================================
 * 52. TERAPKAN HASIL KONFIRMASI (dipanggil dari dialog)
 *
 * payloadJson berbentuk:
 *   {
 *     sheetName: "SEPTEMBER",
 *     picks: [
 *       {
 *         destRowNumber: 12,
 *         destName: "UPPD KAB BLORA",
 *         sourceName: "UPPD KAB. BLORA PENGECEKAN PTSL",
 *         nominal: 34922000,
 *         saveAlias: true
 *       },
 *       ...
 *     ]
 *   }
 *
 * Baris dengan destRowNumber kosong (pengguna memilih
 * "Lewati") tidak diproses.
 * ============================================================
 */

function applyNominalTransferKonfirmasi_(payloadJson) {

  const payload =
    JSON.parse(payloadJson);

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const destSheet =
    ss.getSheetByName(payload.sheetName);

  if (!destSheet) {

    throw new Error(
      "Sheet \"" + payload.sheetName + "\" tidak ditemukan."
    );

  }

  const headerMap =
    getDestinationHeaderMap_(destSheet);

  const columnIndex =
    headerMap[
      normalizeHeader_(
        CONFIG_NOMINAL_TRANSFER.COLUMN_HEADER
      )
    ];

  if (!columnIndex) {

    throw new Error(
      "Kolom \"" +
      CONFIG_NOMINAL_TRANSFER.COLUMN_HEADER +
      "\" tidak ditemukan di sheet \"" +
      payload.sheetName + "\"."
    );

  }

  let applied = 0;

  (payload.picks || []).forEach(function (pick) {

    if (!pick.destRowNumber) {
      return;
    }

    destSheet
      .getRange(Number(pick.destRowNumber), columnIndex)
      .setValue(pick.nominal);

    applied++;

    if (pick.saveAlias && pick.destName && pick.sourceName) {

      addExtraAlias_(
        pick.destName,
        pick.sourceName
      );

    }

  });

  SpreadsheetApp.flush();

  return { applied: applied };

}

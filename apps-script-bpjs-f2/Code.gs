/**
 * Import PDF Formulir 2a (F2) BPJS Ketenagakerjaan langsung ke sheet lokasi
 * yang sesuai di spreadsheet rekap bulanan.
 *
 * Cara pasang: lihat README.md di folder ini.
 */

var MENU_SHEET_NAME = 'MENU';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Import F2')
    .addItem('Import PDF F2...', 'showImportDialog')
    .addToUi();
}

function showImportDialog() {
  var html = HtmlService.createHtmlOutputFromFile('ImportDialog')
    .setWidth(720)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import PDF F2 BPJS Ketenagakerjaan');
}

/** Dipanggil dari dialog: daftar nama sheet lokasi (semua sheet selain MENU). */
function listLocationSheets() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var names = [];
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name.trim().toUpperCase() !== MENU_SHEET_NAME) {
      names.push(name);
    }
  }
  return names;
}

function norm_(s) {
  return String(s == null ? '' : s).trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Cari baris header ("NO | NAMA | NOMOR KETENAGAKERJAAN | ... | JKK | JKM | JHT | JP | JKP ... | JHT | JP")
 * di 15 baris pertama sheet, lalu petakan nama kolom logis -> nomor kolom (1-based).
 * JHT dan JP masing-masing muncul 2x di header: yang pertama = total (Pemberi Kerja + Tenaga Kerja),
 * yang kedua = porsi Tenaga Kerja (karyawan) saja.
 */
function findHeaderMap_(sheet) {
  var maxRow = Math.min(15, sheet.getLastRow());
  var maxCol = sheet.getLastColumn();
  if (maxRow < 1 || maxCol < 1) return null;
  var values = sheet.getRange(1, 1, maxRow, maxCol).getValues();

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var hasNama = false;
    var hasNoKtk = false;
    for (var c = 0; c < row.length; c++) {
      var v = norm_(row[c]);
      if (v === 'NAMA') hasNama = true;
      if (v === 'NOMOR KETENAGAKERJAAN') hasNoKtk = true;
    }
    if (!hasNama || !hasNoKtk) continue;

    var map = { headerRow: r + 1 };
    for (var c2 = 0; c2 < row.length; c2++) {
      var v2 = norm_(row[c2]);
      var col = c2 + 1;
      if (v2 === 'NO' && map.no === undefined) map.no = col;
      else if (v2 === 'NAMA' && map.nama === undefined) map.nama = col;
      else if (v2 === 'NOMOR KETENAGAKERJAAN' && map.noKtk === undefined) map.noKtk = col;
      else if (v2 === 'JKK' && map.jkk === undefined) map.jkk = col;
      else if (v2 === 'JKM' && map.jkm === undefined) map.jkm = col;
      else if (v2 === 'JHT' && map.jhtTotal === undefined) map.jhtTotal = col;
      else if (v2 === 'JHT' && map.jhtTotal !== undefined && map.jhtKaryawan === undefined) map.jhtKaryawan = col;
      else if (v2 === 'JP' && map.jpTotal === undefined) map.jpTotal = col;
      else if (v2 === 'JP' && map.jpTotal !== undefined && map.jpKaryawan === undefined) map.jpKaryawan = col;
      else if (v2 === 'JKP' && map.jkp === undefined) map.jkp = col;
    }
    return map;
  }
  return null;
}

/** Cari rentang baris data (setelah header) sampai sebelum baris kosong / baris "JUMLAH...". */
function findDataRange_(sheet, map) {
  var lastRow = sheet.getLastRow();
  var start = map.headerRow + 1;
  var end = start - 1; // belum ada baris data
  for (var r = start; r <= lastRow; r++) {
    var namaVal = map.nama ? sheet.getRange(r, map.nama).getValue() : '';
    var noVal = map.no ? sheet.getRange(r, map.no).getValue() : '';
    var namaNorm = norm_(namaVal);
    if (namaNorm === '' && String(noVal).trim() === '') break;
    if (namaNorm.indexOf('JUMLAH') === 0) break;
    end = r;
  }
  return { start: start, end: end };
}

/**
 * Proses hasil parsing PDF (dari sisi client, pakai pdf.js) dan tulis ke sheet lokasi terpilih.
 * payload: { sheetName: string, employees: [{nomorReferensi, nik, nama, jkk, jkm,
 *            jhtPK, jhtTK, jpPK, jpTK, jkpPK, jkpPemerintah}] }
 */
function importToSheet(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(payload.sheetName);
  if (!sheet) {
    throw new Error('Sheet "' + payload.sheetName + '" tidak ditemukan.');
  }

  var map = findHeaderMap_(sheet);
  if (!map || !map.nama || !map.noKtk) {
    throw new Error('Header kolom NAMA / NOMOR KETENAGAKERJAAN tidak ditemukan di sheet "' + payload.sheetName + '". Periksa struktur sheet.');
  }

  var range = findDataRange_(sheet, map);

  // index NOMOR KETENAGAKERJAAN yang sudah ada -> nomor baris
  var existingByKtk = {};
  if (range.end >= range.start) {
    var existingVals = sheet.getRange(range.start, map.noKtk, range.end - range.start + 1, 1).getValues();
    for (var i = 0; i < existingVals.length; i++) {
      var key = String(existingVals[i][0]).trim();
      if (key !== '') existingByKtk[key] = range.start + i;
    }
  }

  var updated = 0, added = 0;
  var lastDataRow = range.end;
  // baris contoh untuk disalin formula/formatnya (mis. IURAN TK CLIENT/KARYAWAN/TOTAL)
  // ke baris baru yang ditambahkan, supaya rumus tetap jalan tanpa disentuh manual.
  var templateRow = range.end >= range.start ? range.end : null;
  var lastCol = sheet.getLastColumn();

  payload.employees.forEach(function (emp) {
    var key = String(emp.nomorReferensi).trim();
    var jhtTotal = round2_(num_(emp.jhtPK) + num_(emp.jhtTK));
    var jpTotal = round2_(num_(emp.jpPK) + num_(emp.jpTK));
    var jkpTotal = round2_(num_(emp.jkpPK) + num_(emp.jkpPemerintah));

    var targetRow;
    if (existingByKtk[key]) {
      targetRow = existingByKtk[key];
      updated++;
    } else {
      if (lastDataRow >= map.headerRow + 1) {
        sheet.insertRowAfter(lastDataRow);
      } else {
        sheet.insertRowAfter(map.headerRow);
      }
      lastDataRow++;
      targetRow = lastDataRow;
      if (templateRow) {
        sheet.getRange(templateRow, 1, 1, lastCol).copyTo(sheet.getRange(targetRow, 1, 1, lastCol));
      }
      if (map.no) sheet.getRange(targetRow, map.no).setValue(targetRow - map.headerRow);
      added++;
    }

    if (map.nama) sheet.getRange(targetRow, map.nama).setValue(emp.nama);
    if (map.noKtk) sheet.getRange(targetRow, map.noKtk).setValue(emp.nomorReferensi);
    if (map.jkk) sheet.getRange(targetRow, map.jkk).setValue(num_(emp.jkk));
    if (map.jkm) sheet.getRange(targetRow, map.jkm).setValue(num_(emp.jkm));
    if (map.jhtTotal) sheet.getRange(targetRow, map.jhtTotal).setValue(jhtTotal);
    if (map.jpTotal) sheet.getRange(targetRow, map.jpTotal).setValue(jpTotal);
    if (map.jkp) sheet.getRange(targetRow, map.jkp).setValue(jkpTotal);
    if (map.jhtKaryawan) sheet.getRange(targetRow, map.jhtKaryawan).setValue(num_(emp.jhtTK));
    if (map.jpKaryawan) sheet.getRange(targetRow, map.jpKaryawan).setValue(num_(emp.jpTK));
  });

  return { updated: updated, added: added, total: payload.employees.length };
}

function num_(v) {
  var n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function round2_(n) {
  return Math.round(n * 100) / 100;
}

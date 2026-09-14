/**
 * SATU FILE SAJA — semua script (menu "MENU OTOMATIS" lama + converter F2 +
 * HAPUS F2 + sidebar-nya) digabung jadi satu file ini. Cukup timpa seluruh
 * isi `Code.gs` di spreadsheet kamu dengan isi file ini, TIDAK PERLU bikin
 * file .gs atau .html tambahan lagi.
 *
 * PENTING: fitur "Convert dari PDF" butuh Advanced Service "Drive API"
 * diaktifkan dulu di Services (ikon "+" di sidebar kiri editor Apps
 * Script) — v2 maupun v3 sama-sama didukung, kode di bawah mendeteksi
 * otomatis. Lihat README.md untuk langkahnya. Tanpa itu, tombol "Convert
 * dari PDF" akan error; cara tempel teks manual tetap jalan tanpa setup
 * tambahan.
 *
 * Menu yang muncul di spreadsheet setelah dipasang:
 *   - "📌 MENU OTOMATIS" -> Buat/Refresh Menu, No Fill Semua Sheet (lama)
 *   - "F2 BPJS" -> Convert Tagihan F2 ke Sheet Ini..., HAPUS F2 (baru)
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("📌 MENU OTOMATIS")
    .addItem("Buat / Refresh Menu", "buatMenu")
    .addSeparator()
    .addItem("🧹 No Fill Semua Sheet", "hapusSemuaWarnaFill")
    .addToUi();

  // >>> tambahan untuk converter F2 (lihat F2Converter.gs) <<<
  ui.createMenu("F2 BPJS")
    .addItem("Convert Tagihan F2 ke Sheet Ini...", "showF2Sidebar")
    .addSeparator()
    .addItem("HAPUS F2", "hapusSemuaF2")
    .addToUi();
}


function buatMenu() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const menuName = "MENU";

  // Hapus MENU jika sudah ada
  let menuSheet = ss.getSheetByName(menuName);
  if (menuSheet) {
    ss.deleteSheet(menuSheet);
  }

  // =========================
  // FITUR BARU: URUTKAN SHEET SESUAI ABJAD
  // =========================
  urutkanSheetAbjad(ss, menuName);

  // Buat MENU di paling depan
  menuSheet = ss.insertSheet(menuName, 0);

  // Header
  menuSheet.getRange("A1").setValue("NOMOR");
  menuSheet.getRange("B1").setValue("NAMA LOKASI");
  menuSheet.getRange("C1").setValue("CEK KESESUAIAN");

  menuSheet.getRange("A1:C1")
    .setFontWeight("bold")
    .setBackground("#d9ead3")
    .setHorizontalAlignment("center");

  const sheets = ss.getSheets();

  let nomor = 1;
  let row = 2;

  // Isi daftar sheet + link
  sheets.forEach(sheet => {
    const nama = sheet.getName();

    if (nama !== menuName) {

      // Nomor
      menuSheet.getRange(row, 1).setValue(nomor);

      // Link sheet
      const link = SpreadsheetApp.newRichTextValue()
        .setText(nama)
        .setLinkUrl(`#gid=${sheet.getSheetId()}`)
        .build();

      menuSheet.getRange(row, 2).setRichTextValue(link);

      // =========================
      // FITUR BARU: CEK KESESUAIAN BERDASARKAN WARNA TAB
      // =========================
      const warnaTab = sheet.getTabColor();

      let status = "BELUM DI CEK";

      if (warnaTab) {
        const warna = warnaTab.toLowerCase();

        // HIJAU = SESUAI
        if (
          warna === "#00ff00" ||
          warna === "#34a853" ||
          warna === "#0f9d58"
        ) {
          status = "SESUAI";
        }

        // MERAH = BELUM SESUAI
        else if (
          warna === "#ff0000" ||
          warna === "#ea4335" ||
          warna === "#d93025"
        ) {
          status = "BELUM SESUAI";
        }
      }

      menuSheet.getRange(row, 3).setValue(status);

      // Warna status TANPA BOLD
      if (status === "SESUAI") {
        menuSheet.getRange(row, 3)
          .setBackground("#b6d7a8")
          .setFontWeight("normal");
      }

      if (status === "BELUM SESUAI") {
        menuSheet.getRange(row, 3)
          .setBackground("#f4cccc")
          .setFontWeight("normal");
      }

      if (status === "BELUM DI CEK") {
        menuSheet.getRange(row, 3)
          .setBackground("#eeeeee")
          .setFontWeight("normal");
      }

      nomor++;
      row++;
    }
  });

  // Rapikan tampilan
  menuSheet.autoResizeColumns(1, 3);

  menuSheet.getRange(1, 1, row - 1, 3)
    .setBorder(true, true, true, true, true, true);

  // Rata tengah kolom nomor & status
  menuSheet.getRange(2, 1, row - 2, 1)
    .setHorizontalAlignment("center");

  menuSheet.getRange(2, 3, row - 2, 1)
    .setHorizontalAlignment("center");

  // Tambahkan tombol kembali ke semua sheet
  tambahTombolKembali(ss, menuSheet);
}


// =========================
// FUNGSI BARU: URUTKAN SHEET SESUAI ABJAD
// =========================
function urutkanSheetAbjad(ss, menuName) {

  const sheets = ss.getSheets();

  // Ambil semua sheet selain MENU
  const sheetData = sheets
    .filter(sheet => sheet.getName() !== menuName)
    .map(sheet => ({
      name: sheet.getName(),
      sheet: sheet
    }));

  // Urutkan A-Z
  sheetData.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  // Pindahkan sheet sesuai urutan
  sheetData.forEach((obj, index) => {
    ss.setActiveSheet(obj.sheet);
    ss.moveActiveSheet(index + 1);
  });
}


// Fungsi untuk menambahkan tombol kembali ke MENU
function tambahTombolKembali(ss, menuSheet) {
  const sheets = ss.getSheets();
  const menuId = menuSheet.getSheetId();

  sheets.forEach(sheet => {
    if (sheet.getName() !== "MENU") {

      // Tombol kecil di D1
      sheet.getRange("D1").setRichTextValue(
        SpreadsheetApp.newRichTextValue()
          .setText("⬅ MENU")
          .setLinkUrl(`#gid=${menuId}`)
          .build()
      );

      sheet.getRange("D1")
        .setFontWeight("bold")
        .setBackground("#f4cccc")
        .setHorizontalAlignment("center");

      // Tulisan utama di A3
      sheet.getRange("A3").setRichTextValue(
        SpreadsheetApp.newRichTextValue()
          .setText("KEMBALI KE MENU")
          .setLinkUrl(`#gid=${menuId}`)
          .build()
      );

      sheet.getRange("A3")
        .setFontWeight("bold")
        .setFontColor("#0000FF");
    }
  });
}
// =========================
// HAPUS SEMUA WARNA TAB SHEET
// =========================
function hapusSemuaWarnaFill() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const ui = SpreadsheetApp.getUi();

  const jawab = ui.alert(
    "Konfirmasi",
    "Yakin ingin menghapus semua warna tab sheet?",
    ui.ButtonSet.YES_NO
  );

  if (jawab != ui.Button.YES) return;

  sheets.forEach(sheet => {
    sheet.setTabColor(null);   // Menghilangkan warna tab sheet
  });

  ui.alert("✅ Semua warna tab sheet berhasil dihapus.");
}


var F2_AMOUNT_RE = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
var F2_DATE_RE = /\b\d{2}-\d{2}-\d{4}\b/g;
var F2_NIK_RE = /\b\d{16}\b/;

function showF2Sidebar() {
  var sheetName = SpreadsheetApp.getActiveSheet().getName();
  var html = HtmlService.createHtmlOutput(F2_SIDEBAR_HTML)
    .setTitle('Convert F2 -> "' + sheetName + '"');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getActiveSheetName() {
  return SpreadsheetApp.getActiveSheet().getName();
}

/**
 * Entry point dipanggil dari sidebar (google.script.run.processF2Text(text))
 * untuk cara tempel teks manual. Selalu bekerja di sheet yang aktif ketika
 * sidebar dibuka.
 */
function processF2Text(rawText) {
  var sheet = SpreadsheetApp.getActiveSheet();
  return applyF2TextToSheet(sheet, rawText);
}

/**
 * Entry point dipanggil dari sidebar (google.script.run.processF2Pdf(...))
 * untuk cara upload file PDF F2 langsung. base64Data = isi file (tanpa
 * prefix "data:...;base64,", sudah dipotong di sisi client).
 */
function processF2Pdf(base64Data, fileName, mimeType) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var text;
  try {
    text = extractTextFromPdf(base64Data, fileName, mimeType);
  } catch (e) {
    return {
      ok: false,
      message:
        'Gagal membaca teks dari PDF (' + e.message + '). Pastikan Advanced ' +
        'Service "Drive API" sudah diaktifkan di Services (lihat README), ' +
        'lalu coba lagi. Kalau tetap gagal, pakai cara tempel teks manual ' +
        'di bawah.',
      warnings: []
    };
  }

  var result = applyF2TextToSheet(sheet, text);
  if (!result.ok && (!result.warnings || result.warnings.length === 0)) {
    // tambahkan potongan teks hasil ekstraksi supaya gampang didiagnosis
    // kalau ternyata parser tidak menemukan baris tenaga kerja sama sekali
    result.message +=
      ' (Cuplikan teks hasil baca PDF: "' + text.substring(0, 200).replace(/\s+/g, ' ').trim() + '...")';
  }
  return result;
}

/**
 * Logika bersama: parse teks F2 (dari mana pun asalnya) lalu terapkan ke
 * sheet yang aktif. Dipakai oleh processF2Text (paste manual) dan
 * processF2Pdf (upload file).
 */
function applyF2TextToSheet(sheet, rawText) {
  var parsed = parseF2Text(rawText);

  if (parsed.records.length === 0) {
    return {
      ok: false,
      message:
        'Tidak ada baris tenaga kerja yang terbaca. ' +
        'Pastikan sumbernya tabel "RINCIAN IURAN TENAGA KERJA" dari Formulir 2a PU (termasuk NIK 16 digit tiap baris).',
      warnings: parsed.warnings
    };
  }

  var map = findHeaderMap(sheet);
  if (!map) {
    return {
      ok: false,
      message:
        'Header rekap (baris dengan kolom NAMA & STATUS) tidak ditemukan di sheet "' +
        sheet.getName() +
        '". Cek apakah struktur tabel di tab ini sesuai template.',
      warnings: parsed.warnings
    };
  }
  if (!map.nama || !map.total) {
    return {
      ok: false,
      message:
        'Kolom wajib (NAMA dan/atau TOTAL) tidak ditemukan di header sheet "' +
        sheet.getName() +
        '".',
      warnings: parsed.warnings
    };
  }

  var result = applyRecordsToSheet(sheet, map, parsed.records);
  result.warnings = parsed.warnings.concat(result.warnings);
  result.ok = true;
  result.sheetName = sheet.getName();
  return result;
}

/**
 * Ekstrak teks dari file PDF lewat trik konversi Drive API: upload PDF
 * sebagai file sementara, minta Drive convert+OCR ke Google Docs (OCR aman
 * dipakai juga untuk PDF yang sudah berbasis teks, hanya jadi fallback kalau
 * ada bagian berupa gambar), baca teksnya lewat DocumentApp, lalu hapus file
 * sementara itu lagi. Butuh Advanced Service "Drive API" aktif di project
 * ini (v2 maupun v3 sama-sama didukung, kode di bawah mendeteksi otomatis)
 * -- lihat README untuk cara mengaktifkannya.
 */
function extractTextFromPdf(base64Data, fileName, mimeType) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType || 'application/pdf',
    fileName || 'F2.pdf'
  );
  var tempName = 'TEMP_F2_CONVERT_' + new Date().getTime();
  var ocrOptions = { ocr: true, ocrLanguage: 'id' };

  var fileId;
  if (Drive.Files && typeof Drive.Files.create === 'function') {
    // Advanced Drive Service v3 ("name" untuk judul file, Files.create untuk upload)
    var fileMetadataV3 = { name: tempName, mimeType: MimeType.GOOGLE_DOCS };
    fileId = Drive.Files.create(fileMetadataV3, blob, ocrOptions).id;
  } else if (Drive.Files && typeof Drive.Files.insert === 'function') {
    // Advanced Drive Service v2 ("title" untuk judul file, Files.insert untuk upload)
    var resourceV2 = { title: tempName, mimeType: MimeType.GOOGLE_DOCS };
    fileId = Drive.Files.insert(resourceV2, blob, ocrOptions).id;
  } else {
    throw new Error(
      'Advanced Service "Drive API" belum aktif/tidak terbaca. Aktifkan lewat ' +
        'Services (ikon "+" di sidebar kiri editor Apps Script).'
    );
  }

  try {
    var doc = DocumentApp.openById(fileId);
    return doc.getBody().getText();
  } finally {
    if (Drive.Files && typeof Drive.Files.remove === 'function') {
      Drive.Files.remove(fileId); // v2, dan sebagian binding v3 tetap pakai nama ini
    } else if (Drive.Files && typeof Drive.Files['delete'] === 'function') {
      Drive.Files['delete'](fileId); // v3
    }
  }
}

/* ----------------------------- PARSER ----------------------------- */

/**
 * Parse teks tagihan F2 (hasil copy-paste tabel "RINCIAN IURAN TENAGA KERJA").
 * Setiap baris tenaga kerja diharapkan memuat, berurutan:
 *   No | Nomor Referensi | NIK(16 digit) | [Nomor Pegawai] | Nama | Tgl Lahir(dd-mm-yyyy)
 *   | Tgl Kepesertaan(dd-mm-yyyy) | 11 angka nominal (Upah, Rapel, Jkk, JKM,
 *   JHT-PemberiKerja, JHT-TenagaKerja, JP-PemberiKerja, JP-TenagaKerja,
 *   JKP-PemberiKerja, JKP-Pemerintah, Total Iuran)
 * Delimiter kolom bebas (tab atau spasi >=1), karena hasil copy dari browser/PDF
 * bervariasi.
 */
function parseF2Text(rawText) {
  var records = [];
  var warnings = [];
  var lines = (rawText || '').split(/\r?\n/);

  lines.forEach(function (line, idx) {
    var trimmed = line.trim();
    if (!trimmed) return;

    var nikMatch = trimmed.match(F2_NIK_RE);
    if (!nikMatch) return; // baris header/footer/kosong, lewati diam-diam

    var nikIndex = trimmed.indexOf(nikMatch[0]);
    var before = trimmed.substring(0, nikIndex).trim();
    var beforeTokens = before.split(/\s+/).filter(Boolean);
    if (beforeTokens.length === 0) {
      warnings.push('Baris ' + (idx + 1) + ': tidak ada nomor referensi sebelum NIK, dilewati.');
      return;
    }
    var referensi = beforeTokens[beforeTokens.length - 1].replace(/\D/g, '');

    var after = trimmed.substring(nikIndex + nikMatch[0].length);
    var dates = after.match(F2_DATE_RE) || [];
    if (dates.length < 2) {
      warnings.push('Baris ' + (idx + 1) + ': tanggal lahir/kepesertaan tidak lengkap, dilewati.');
      return;
    }
    var firstDateIdx = after.indexOf(dates[0]);
    var secondDateIdx = after.indexOf(dates[1], firstDateIdx + dates[0].length);

    var namePart = after.substring(0, firstDateIdx).trim();
    var nameTokens = namePart.split(/\s+/).filter(Boolean);
    if (nameTokens.length > 1 && /^\d+$/.test(nameTokens[0])) {
      // token pertama murni angka -> kemungkinan "Nomor Pegawai", pisahkan dari nama
      nameTokens.shift();
    }
    var nama = nameTokens.join(' ').trim();
    if (!nama) {
      warnings.push('Baris ' + (idx + 1) + ': nama tenaga kerja kosong, dilewati.');
      return;
    }

    var numsText = after.substring(secondDateIdx + dates[1].length);
    var numMatches = numsText.match(F2_AMOUNT_RE) || [];
    if (numMatches.length < 11) {
      warnings.push(
        'Baris ' + (idx + 1) + ' ("' + nama + '"): hanya ' + numMatches.length +
        ' dari 11 nominal ditemukan, dilewati.'
      );
      return;
    }
    var nums = numMatches.slice(numMatches.length - 11).map(function (s) {
      return parseFloat(s.replace(/,/g, ''));
    });

    records.push({
      referensi: referensi,
      nama: nama,
      upah: nums[0],
      rapel: nums[1],
      jkk: nums[2],
      jkm: nums[3],
      jhtPK: nums[4],
      jhtTK: nums[5],
      jpPK: nums[6],
      jpTK: nums[7],
      jkpPK: nums[8],
      jkpPemerintah: nums[9],
      total: nums[10]
    });
  });

  return { records: records, warnings: warnings };
}

/* ------------------------- HEADER DETECTION ------------------------- */

/**
 * Cari baris header rekap (baris yang mengandung kolom NAMA dan STATUS) di antara
 * 15 baris pertama, lalu petakan posisi kolom yang relevan.
 * JHT dan JP masing-masing muncul 2x di template (grup "Pemberi Kerja/Client" lalu
 * grup "Tenaga Kerja/Karyawan") -> kemunculan pertama = company, kedua = employee.
 */
function findHeaderMap(sheet) {
  var lastRow = Math.min(sheet.getLastRow(), 15);
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return null;
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();

  for (var r = 0; r < data.length; r++) {
    var row = data[r].map(function (v) {
      return (v || '').toString().trim().toUpperCase();
    });
    if (row.indexOf('NAMA') === -1 || row.indexOf('STATUS') === -1) continue;

    var map = { row: r + 1 };
    var jhtSeen = 0;
    var jpSeen = 0;
    for (var c = 0; c < row.length; c++) {
      var label = row[c];
      if (!label) continue;
      if (label === 'NO' && map.no === undefined) map.no = c + 1;
      else if (label === 'NAMA' && map.nama === undefined) map.nama = c + 1;
      else if (label.indexOf('NOMOR KETENAGAK') === 0) map.referensi = c + 1;
      else if (label === 'IURAN TK CLIENT') map.tkClient = c + 1;
      else if (label === 'IURAN TK KARYAWAN') map.tkKaryawan = c + 1;
      else if (label === 'TOTAL') map.total = c + 1;
      else if (label === 'STATUS') map.status = c + 1;
      else if (label === 'JKK') map.jkk = c + 1;
      else if (label === 'JKM') map.jkm = c + 1;
      else if (label === 'JKP') map.jkp = c + 1;
      else if (label === 'JHT') {
        jhtSeen++;
        if (jhtSeen === 1) map.jhtCompany = c + 1;
        else map.jhtEmployee = c + 1;
      } else if (label === 'JP') {
        jpSeen++;
        if (jpSeen === 1) map.jpCompany = c + 1;
        else map.jpEmployee = c + 1;
      }
    }
    return map;
  }
  return null;
}

/* --------------------------- WRITE TO SHEET --------------------------- */

/**
 * Deteksi blok baris data tenaga kerja di bawah header rekap: dari
 * map.row+1 sampai baris pertama yang kolom NAMA-nya kosong. Kalau baris
 * kosong itu punya nilai di kolom TOTAL (baris SUM "Jumlah Seluruhnya"),
 * baris itu ditandai sebagai footerRow.
 */
function getDataRows(sheet, map) {
  var lastRow = sheet.getLastRow();
  var startDataRow = map.row + 1;

  var dataRows = [];
  var footerRow = null;
  for (var r = startDataRow; r <= lastRow; r++) {
    var namaVal = sheet.getRange(r, map.nama).getValue();
    if (namaVal === '' || namaVal === null) {
      var totalVal = map.total ? sheet.getRange(r, map.total).getValue() : '';
      if (totalVal !== '' && totalVal !== null) footerRow = r; // baris total/jumlah
      break;
    }
    var referensiVal = map.referensi ? sheet.getRange(r, map.referensi).getValue() : '';
    dataRows.push({
      row: r,
      nama: namaVal.toString().trim(),
      referensi: (referensiVal || '').toString().replace(/\D/g, '')
    });
  }
  if (footerRow === null) {
    footerRow = dataRows.length ? dataRows[dataRows.length - 1].row + 1 : startDataRow;
  }

  return { startDataRow: startDataRow, dataRows: dataRows, footerRow: footerRow };
}

function applyRecordsToSheet(sheet, map, records) {
  var lastCol = sheet.getLastColumn();
  var info = getDataRows(sheet, map);
  var startDataRow = info.startDataRow;
  var dataRows = info.dataRows;
  var footerRow = info.footerRow;

  var updated = 0;
  var added = 0;
  var log = [];
  var calcWarnings = [];

  records.forEach(function (rec) {
    var refDigits = rec.referensi;
    var match = dataRows.filter(function (d) {
      return refDigits && d.referensi && d.referensi === refDigits;
    })[0];
    if (!match) {
      match = dataRows.filter(function (d) {
        return d.nama.toUpperCase() === rec.nama.toUpperCase();
      })[0];
    }

    var tkClient = round2(rec.jkk + rec.jkm + rec.jhtPK + rec.jpPK + rec.jkpPK);
    var tkKaryawan = round2(rec.jhtTK + rec.jpTK);
    var totalIuran = round2(tkClient + tkKaryawan);
    if (Math.abs(totalIuran - rec.total) > 1) {
      calcWarnings.push(
        rec.nama + ': total hasil hitung (' + totalIuran + ') beda dengan Total Iuran di F2 (' +
        rec.total + '), cek ulang datanya.'
      );
    }

    var targetRow;
    if (match) {
      targetRow = match.row;
      updated++;
      log.push('Update: ' + rec.nama + ' (baris ' + targetRow + ')');
    } else {
      sheet.insertRowBefore(footerRow);
      if (footerRow > startDataRow) {
        sheet
          .getRange(footerRow - 1, 1, 1, lastCol)
          .copyTo(sheet.getRange(footerRow, 1, 1, lastCol), { formatOnly: true });
      }
      targetRow = footerRow;
      footerRow++;
      dataRows.push({ row: targetRow, nama: rec.nama, referensi: refDigits });
      added++;
      log.push('Tambah baris baru: ' + rec.nama + ' (baris ' + targetRow + ')');
      if (map.no) {
        var prevNo = targetRow > startDataRow ? sheet.getRange(targetRow - 1, map.no).getValue() : 0;
        sheet.getRange(targetRow, map.no).setValue((parseInt(prevNo, 10) || 0) + 1);
      }
      if (map.status) sheet.getRange(targetRow, map.status).setValue('AKTIF');
    }

    sheet.getRange(targetRow, map.nama).setValue(rec.nama);
    if (map.referensi) sheet.getRange(targetRow, map.referensi).setValue(refDigits);
    if (map.tkClient) sheet.getRange(targetRow, map.tkClient).setValue(tkClient);
    if (map.tkKaryawan) sheet.getRange(targetRow, map.tkKaryawan).setValue(tkKaryawan);
    if (map.total) sheet.getRange(targetRow, map.total).setValue(totalIuran);
    if (map.jkk) sheet.getRange(targetRow, map.jkk).setValue(rec.jkk);
    if (map.jkm) sheet.getRange(targetRow, map.jkm).setValue(rec.jkm);
    if (map.jhtCompany) sheet.getRange(targetRow, map.jhtCompany).setValue(rec.jhtPK);
    if (map.jpCompany) sheet.getRange(targetRow, map.jpCompany).setValue(rec.jpPK);
    if (map.jkp) sheet.getRange(targetRow, map.jkp).setValue(rec.jkpPK);
    if (map.jhtEmployee) sheet.getRange(targetRow, map.jhtEmployee).setValue(rec.jhtTK);
    if (map.jpEmployee) sheet.getRange(targetRow, map.jpEmployee).setValue(rec.jpTK);
  });

  return { updated: updated, added: added, log: log, warnings: calcWarnings };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ------------------------------ HAPUS F2 ------------------------------ */

/**
 * Cari sel lampiran F2 di bagian atas sheet (baris 1-10): sel yang berisi
 * link ke file Google Drive (lewat rich-text link atau formula
 * =HYPERLINK(...)), atau sel yang teksnya diawali ikon 📎 (pola lampiran F2
 * di template ini, mis. "📎 ATR BPN PALANGKARAYA..." di bawah label
 * "KLIK F2 /RINCIAN DISINI"). Mengembalikan jumlah sel yang dikosongkan.
 *
 * Hanya mengosongkan ISI SEL (teks + link-nya) supaya siap ditempel link
 * lampiran bulan berjalan. File PDF aslinya di Google Drive TIDAK disentuh
 * / TIDAK dihapus.
 */
function findAndClearF2AttachmentLinks(sheet) {
  var scanRows = Math.min(sheet.getLastRow(), 10);
  var lastCol = sheet.getLastColumn();
  if (scanRows < 1 || lastCol < 1) return 0;

  var range = sheet.getRange(1, 1, scanRows, lastCol);
  var richTextValues = range.getRichTextValues();
  var formulas = range.getFormulas();
  var values = range.getValues();
  var driveLinkRe = /drive\.google\.com|docs\.google\.com/i;
  var cleared = 0;

  for (var r = 0; r < scanRows; r++) {
    for (var c = 0; c < lastCol; c++) {
      var isAttachmentLink = false;

      var rtv = richTextValues[r][c];
      var linkUrl = rtv ? rtv.getLinkUrl() : null;
      if (linkUrl && driveLinkRe.test(linkUrl)) isAttachmentLink = true;

      var formula = formulas[r][c] || '';
      if (!isAttachmentLink && /HYPERLINK\s*\(/i.test(formula) && driveLinkRe.test(formula)) {
        isAttachmentLink = true;
      }

      var textVal = (values[r][c] || '').toString().trim();
      if (!isAttachmentLink && textVal.indexOf('📎') === 0) {
        // teks diawali ikon 📎 (paperclip)
        isAttachmentLink = true;
      }

      if (isAttachmentLink) {
        sheet.getRange(r + 1, c + 1).clearContent();
        cleared++;
      }
    }
  }
  return cleared;
}

/**
 * Kosongkan link lampiran PDF F2 bulan sebelumnya di SEMUA tab rekap
 * (dipanggil dari menu "F2 BPJS" -> "HAPUS F2"). Dipakai di awal bulan baru
 * supaya link lampiran lama tidak ketuker, sebelum ditempel link/lampiran F2
 * bulan berjalan.
 *
 * File PDF aslinya di Google Drive TIDAK dihapus/ditrash — hanya link di
 * selnya yang dikosongkan. Data tenaga kerja di tabel rekap (baris NAMA,
 * nominal, dst) TIDAK disentuh sama sekali oleh fungsi ini.
 * Sheet "MENU" (dari script "MENU OTOMATIS") dilewati.
 */
function hapusSemuaF2() {
  var ui = SpreadsheetApp.getUi();
  var jawab = ui.alert(
    'Konfirmasi HAPUS F2',
    'Yakin ingin mengosongkan link lampiran PDF F2 bulan sebelumnya (sel ber-ikon 📎) ' +
      'di SEMUA tab? File PDF aslinya TETAP ada di Google Drive, cuma link di selnya ' +
      'yang dikosongkan. Data tabel rekap tidak disentuh.',
    ui.ButtonSet.YES_NO
  );
  if (jawab !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var totalCleared = 0;
  var sheetsAffected = 0;

  sheets.forEach(function (sheet) {
    if (sheet.getName() === 'MENU') return;
    var cleared = findAndClearF2AttachmentLinks(sheet);
    if (cleared > 0) {
      totalCleared += cleared;
      sheetsAffected++;
    }
  });

  ui.alert(
    'HAPUS F2 selesai',
    'Selesai: ' + totalCleared + ' link lampiran F2 dikosongkan di ' + sheetsAffected + ' tab.',
    ui.ButtonSet.OK
  );
}

/**
 * DIAGNOSTIK — bukan dipanggil dari menu. Kalau HAPUS F2 tidak berhasil
 * mengosongkan sel lampiran (mis. isinya "smart chip" Drive, bukan hyperlink
 * teks biasa), jalankan fungsi ini manual dari editor Apps Script (pilih
 * "debugF2AttachmentCell" di dropdown fungsi di toolbar, lalu klik Run),
 * lalu buka View -> Logs (atau Executions) dan salin hasilnya. Itu akan
 * menunjukkan persis apa isi sel-sel di baris 1-10 tab yang sedang aktif:
 * value mentah, formula, link di level sel, link di level "run" (sebagian
 * teks), dan apakah sel itu bagian dari cell merge.
 */
function debugF2AttachmentCell() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var scanRows = Math.min(sheet.getLastRow(), 10);
  var lastCol = sheet.getLastColumn();
  var range = sheet.getRange(1, 1, scanRows, lastCol);
  var richTextValues = range.getRichTextValues();
  var formulas = range.getFormulas();
  var values = range.getValues();
  var mergedRanges = range.getMergedRanges();

  Logger.log(
    'Sheet: "' + sheet.getName() + '" | scanRows=' + scanRows + ' lastCol=' + lastCol
  );
  Logger.log(
    'Merged ranges di area ini: ' +
      (mergedRanges.length
        ? mergedRanges.map(function (r) { return r.getA1Notation(); }).join(', ')
        : '(tidak ada)')
  );

  for (var r = 0; r < scanRows; r++) {
    for (var c = 0; c < lastCol; c++) {
      var v = values[r][c];
      if (v === '' || v === null) continue;

      var a1 = sheet.getRange(r + 1, c + 1).getA1Notation();
      var rtv = richTextValues[r][c];
      var cellLinkUrl = rtv ? rtv.getLinkUrl() : null;
      var runLinkUrls = [];
      if (rtv) {
        rtv.getRuns().forEach(function (run) {
          var u = run.getLinkUrl();
          if (u) runLinkUrls.push(u);
        });
      }

      Logger.log(
        a1 +
          ' | value=' + JSON.stringify(v) +
          ' | formula=' + JSON.stringify(formulas[r][c]) +
          ' | cellLinkUrl=' + cellLinkUrl +
          ' | runLinkUrls=' + JSON.stringify(runLinkUrls)
      );
    }
  }
}

/* ============================================================
 * HTML SIDEBAR "CONVERT TAGIHAN F2" (dipakai oleh showF2Sidebar())
 * String literal di bawah ini di-escape supaya isinya identik dengan
 * F2Sidebar.html aslinya (termasuk urutan escape \n di JS client-side-nya)
 * ============================================================ */
var F2_SIDEBAR_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <base target="_top" />
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: #202124;
        margin: 0;
        padding: 12px;
      }
      h4 {
        margin: 0 0 4px;
      }
      p.hint {
        color: #5f6368;
        margin: 0 0 10px;
        line-height: 1.4;
      }
      input[type="file"] {
        width: 100%;
        box-sizing: border-box;
        font-size: 12px;
        margin-bottom: 8px;
      }
      textarea {
        width: 100%;
        height: 180px;
        box-sizing: border-box;
        font-family: monospace;
        font-size: 11px;
        padding: 6px;
      }
      button {
        margin-top: 4px;
        background: #1a73e8;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      button:disabled {
        background: #9aa0a6;
        cursor: default;
      }
      .status {
        margin-top: 12px;
        white-space: pre-wrap;
        line-height: 1.5;
      }
      .ok { color: #188038; }
      .err { color: #c5221f; }
      .warn { color: #b06000; }
      .sheetname {
        font-weight: bold;
      }
      hr {
        margin: 18px 0;
        border: none;
        border-top: 1px solid #dadce0;
      }
      details summary {
        cursor: pointer;
        color: #1a73e8;
        font-size: 12px;
        margin-bottom: 8px;
      }
    </style>
  </head>
  <body>
    <h4>Convert Tagihan F2</h4>
    <p class="hint">
      Target sheet: <span class="sheetname" id="sheetName">...</span>
    </p>

    <p class="hint">
      Pilih file PDF Formulir 2a PU (tagihan F2), lalu klik Convert. Baris
      yang nomor referensi/namanya sudah ada di rekap akan diperbarui, yang
      belum ada akan ditambahkan otomatis.
    </p>
    <input type="file" id="pdfFile" accept="application/pdf" />
    <br />
    <button id="goPdf">Convert dari PDF</button>
    <div class="status" id="statusPdf"></div>

    <hr />

    <details>
      <summary>Cara alternatif: tempel teks manual (kalau convert PDF gagal)</summary>
      <p class="hint">
        Salin (select lalu copy) tabel "RINCIAN IURAN TENAGA KERJA" dari
        Formulir 2a PU, tempel di bawah, lalu klik Proses.
      </p>
      <textarea id="raw" placeholder="Tempel teks tabel F2 di sini..."></textarea>
      <br />
      <button id="goText">Proses Teks</button>
      <div class="status" id="statusText"></div>
    </details>

    <script>
      google.script.run
        .withSuccessHandler(function (name) {
          document.getElementById('sheetName').textContent = name;
        })
        .getActiveSheetName();

      function renderResult(res, statusEl) {
        if (!res.ok) {
          statusEl.innerHTML = '<span class="err">' + res.message + '</span>';
          if (res.warnings && res.warnings.length) {
            statusEl.innerHTML += '\\n\\n' + res.warnings.join('\\n');
          }
          return;
        }
        var lines = [];
        lines.push(
          '<span class="ok">Selesai: ' + res.updated + ' baris diperbarui, ' +
            res.added + ' baris baru ditambahkan.</span>'
        );
        if (res.log && res.log.length) {
          lines.push(res.log.join('\\n'));
        }
        if (res.warnings && res.warnings.length) {
          lines.push('<span class="warn">Perhatian:\\n' + res.warnings.join('\\n') + '</span>');
        }
        statusEl.innerHTML = lines.join('\\n\\n');
      }

      // ---- Convert dari file PDF ----
      document.getElementById('goPdf').addEventListener('click', function () {
        var btn = this;
        var statusEl = document.getElementById('statusPdf');
        var fileInput = document.getElementById('pdfFile');
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
          statusEl.innerHTML = '<span class="err">Pilih file PDF F2 dulu.</span>';
          return;
        }

        btn.disabled = true;
        statusEl.textContent = 'Membaca file...';

        var reader = new FileReader();
        reader.onload = function (e) {
          var base64 = e.target.result.split(',')[1];
          statusEl.textContent = 'Mengonversi PDF & memproses...';
          google.script.run
            .withSuccessHandler(function (res) {
              btn.disabled = false;
              renderResult(res, statusEl);
            })
            .withFailureHandler(function (err) {
              btn.disabled = false;
              statusEl.innerHTML = '<span class="err">Error: ' + err.message + '</span>';
            })
            .processF2Pdf(base64, file.name, file.type || 'application/pdf');
        };
        reader.onerror = function () {
          btn.disabled = false;
          statusEl.innerHTML = '<span class="err">Gagal membaca file di browser.</span>';
        };
        reader.readAsDataURL(file);
      });

      // ---- Proses teks manual (fallback) ----
      document.getElementById('goText').addEventListener('click', function () {
        var btn = this;
        var statusEl = document.getElementById('statusText');
        var text = document.getElementById('raw').value;
        if (!text.trim()) {
          statusEl.innerHTML = '<span class="err">Tempel dulu teks tagihan F2-nya.</span>';
          return;
        }
        btn.disabled = true;
        statusEl.textContent = 'Memproses...';
        google.script.run
          .withSuccessHandler(function (res) {
            btn.disabled = false;
            renderResult(res, statusEl);
          })
          .withFailureHandler(function (err) {
            btn.disabled = false;
            statusEl.innerHTML = '<span class="err">Error: ' + err.message + '</span>';
          })
          .processF2Text(text);
      });
    </script>
  </body>
</html>
`;

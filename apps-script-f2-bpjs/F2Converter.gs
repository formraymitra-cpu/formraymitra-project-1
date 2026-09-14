/**
 * Convert Tagihan F2 BPJS Ketenagakerjaan -> Rekap Sheet
 * ---------------------------------------------------------
 * File TERPISAH di project Apps Script yang sama dengan Code.gs kamu (yang
 * sudah punya menu "📌 MENU OTOMATIS"). SENGAJA TIDAK mendefinisikan
 * onOpen() di sini, karena Apps Script cuma menjalankan satu onOpen() per
 * project -- kalau ada dua, salah satunya diam-diam tidak jalan. Tambahkan
 * menu "F2 BPJS" ke dalam onOpen() yang SUDAH ADA di Code.gs, lihat
 * README.md di folder ini untuk potongan kodenya.
 *
 * Menu-nya (setelah digabung) otomatis tersedia di SEMUA tab/sheet dalam
 * spreadsheet itu. Setiap tab dibaca/ditulis berdasarkan sheet yang sedang
 * aktif saat menu dijalankan.
 *
 * Cara pakai (Convert Tagihan F2):
 *  1. Buka tab rekap yang mau diisi (mis. "ATR BPN PALANGKARAYA").
 *  2. Menu "F2 BPJS" -> "Convert Tagihan F2 ke Sheet Ini...".
 *  3. Salin (select + copy) tabel "RINCIAN IURAN TENAGA KERJA" dari Formulir 2a PU,
 *     tempel ke kotak teks di sidebar, klik "Proses".
 *  4. Baris yang nomor referensinya (atau namanya) sudah ada di rekap akan di-UPDATE,
 *     baris yang belum ada akan DITAMBAHKAN otomatis sebelum baris total.
 *
 * Cara pakai (HAPUS F2):
 *  Menu "F2 BPJS" -> "HAPUS F2" mengosongkan link lampiran PDF F2 bulan
 *  sebelumnya (sel ber-ikon 📎) di SEMUA tab sekaligus, supaya siap ditempel
 *  link lampiran bulan berjalan. File PDF aslinya di Google Drive tidak
 *  dihapus, dan data tabel rekap sama sekali tidak disentuh.
 */

var F2_AMOUNT_RE = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
var F2_DATE_RE = /\b\d{2}-\d{2}-\d{4}\b/g;
var F2_NIK_RE = /\b\d{16}\b/;

function showF2Sidebar() {
  var sheetName = SpreadsheetApp.getActiveSheet().getName();
  var html = HtmlService.createHtmlOutputFromFile('F2Sidebar')
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
        'Service "Drive API" (versi v2) sudah diaktifkan di Services (lihat ' +
        'README), lalu coba lagi. Kalau tetap gagal, pakai cara tempel teks ' +
        'manual di bawah.',
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
 * sementara itu lagi. Butuh Advanced Service "Drive API" (v2) aktif di
 * project ini -- lihat README untuk cara mengaktifkannya.
 */
function extractTextFromPdf(base64Data, fileName, mimeType) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType || 'application/pdf',
    fileName || 'F2.pdf'
  );

  var resource = {
    title: 'TEMP_F2_CONVERT_' + new Date().getTime(),
    mimeType: MimeType.GOOGLE_DOCS
  };
  var file = Drive.Files.insert(resource, blob, { ocr: true, ocrLanguage: 'id' });

  try {
    var doc = DocumentApp.openById(file.id);
    return doc.getBody().getText();
  } finally {
    Drive.Files.remove(file.id);
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

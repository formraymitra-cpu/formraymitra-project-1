/**
 * Gabungan:
 *  1) Menu "📌 MENU OTOMATIS" (skrip lama: buat/refresh MENU, no-fill semua sheet,
 *     hapus link PDF & teks H2:I2) — tidak diubah logikanya.
 *  2) Menu "Import F2" (skrip baru): import PDF Formulir 2a BPJS Ketenagakerjaan
 *     langsung ke sheet lokasi yang sesuai.
 *
 * Cara pasang: lihat README.md di folder ini.
 */

var MENU_SHEET_NAME = 'MENU';

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('📌 MENU OTOMATIS')
    .addItem('Buat / Refresh Menu', 'buatMenu')
    .addSeparator()
    .addItem('🧹 No Fill Semua Sheet', 'hapusSemuaWarnaFill')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('🗑️ Hapus Data H:I')
        .addItem('Hapus Link PDF & Teks H2:I2', 'hapusPDFdanTeks')
    )
    .addToUi();

  ui.createMenu('Import F2')
    .addItem('Import PDF F2...', 'showImportDialog')
    .addToUi();
}


// =====================================================
// BUAT / REFRESH MENU  (skrip lama, tidak diubah)
// =====================================================
function buatMenu() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const menuName = "MENU";

  let menuSheet = ss.getSheetByName(menuName);

  if (menuSheet) {
    ss.deleteSheet(menuSheet);
  }

  urutkanSheetAbjad(ss, menuName);

  menuSheet = ss.insertSheet(menuName, 0);

  menuSheet.getRange("A1").setValue("NOMOR");
  menuSheet.getRange("B1").setValue("NAMA LOKASI");
  menuSheet.getRange("C1").setValue("CEK KESESUAIAN");
  menuSheet.getRange("D1").setValue("JUMLAH ANGGOTA");
  menuSheet.getRange("E1").setValue("TOTAL TAGIHAN");
  menuSheet.getRange("F1").setValue("JUMLAH PROGRAM");
  menuSheet.getRange("G1").setValue("JENIS PROGRAM");

  menuSheet.getRange("A1:G1")
    .setFontWeight("bold")
    .setBackground("#d9ead3")
    .setHorizontalAlignment("center");

  const sheets = ss.getSheets();

  let nomor = 1;
  let row = 2;

  sheets.forEach(sheet => {

    const nama = sheet.getName();

    if (nama !== menuName) {

      menuSheet.getRange(row, 1).setValue(nomor);

      const link = SpreadsheetApp.newRichTextValue()
        .setText(nama)
        .setLinkUrl(`#gid=${sheet.getSheetId()}`)
        .build();

      menuSheet.getRange(row, 2).setRichTextValue(link);

      const warnaTab = sheet.getTabColor();

      let status = "BELUM DI CEK";

      if (warnaTab) {

        const warna = warnaTab.toLowerCase();

        if (
          warna === "#00ff00" ||
          warna === "#34a853" ||
          warna === "#0f9d58"
        ) {
          status = "SESUAI";
        }

        else if (
          warna === "#ff0000" ||
          warna === "#ea4335" ||
          warna === "#d93025"
        ) {
          status = "BELUM SESUAI";
        }
      }

      menuSheet.getRange(row, 3).setValue(status);

      if (status === "SESUAI") {

        menuSheet.getRange(row, 3)
          .setBackground("#b6d7a8")
          .setFontWeight("normal");

      } else if (status === "BELUM SESUAI") {

        menuSheet.getRange(row, 3)
          .setBackground("#f4cccc")
          .setFontWeight("normal");

      } else {

        menuSheet.getRange(row, 3)
          .setBackground("#eeeeee")
          .setFontWeight("normal");
      }

      const stats = getLocationStats_(sheet);
      menuSheet.getRange(row, 4).setValue(stats.anggota);
      menuSheet.getRange(row, 5).setValue(stats.totalTagihan).setNumberFormat("#,##0.00");
      menuSheet.getRange(row, 6).setValue(stats.jumlahProgram);
      menuSheet.getRange(row, 7).setValue(stats.jenisProgram);

      nomor++;
      row++;
    }
  });

  menuSheet.autoResizeColumns(1, 7);

  menuSheet.getRange(1, 1, row - 1, 7)
    .setBorder(true, true, true, true, true, true);

  if (row > 2) {

    menuSheet.getRange(2, 1, row - 2, 1)
      .setHorizontalAlignment("center");

    menuSheet.getRange(2, 3, row - 2, 1)
      .setHorizontalAlignment("center");

    menuSheet.getRange(2, 4, row - 2, 1)
      .setHorizontalAlignment("center");

    menuSheet.getRange(2, 6, row - 2, 1)
      .setHorizontalAlignment("center");
  }

  tambahTombolKembali(ss, menuSheet);
}


// =====================================================
// URUTKAN SHEET SESUAI ABJAD  (skrip lama, tidak diubah)
// =====================================================
function urutkanSheetAbjad(ss, menuName) {

  const sheets = ss.getSheets();

  const sheetData = sheets
    .filter(sheet => sheet.getName() !== menuName)
    .map(sheet => ({
      name: sheet.getName(),
      sheet: sheet
    }));

  sheetData.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  sheetData.forEach((obj, index) => {

    ss.setActiveSheet(obj.sheet);
    ss.moveActiveSheet(index + 1);

  });
}


// =====================================================
// TAMBAHKAN TOMBOL KEMBALI KE MENU  (skrip lama, tidak diubah)
// =====================================================
function tambahTombolKembali(ss, menuSheet) {

  const sheets = ss.getSheets();
  const menuId = menuSheet.getSheetId();

  sheets.forEach(sheet => {

    if (sheet.getName() !== "MENU") {

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


// =====================================================
// HAPUS SEMUA WARNA TAB SHEET  (skrip lama, tidak diubah)
// =====================================================
function hapusSemuaWarnaFill() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const ui = SpreadsheetApp.getUi();

  const jawab = ui.alert(
    "Konfirmasi",
    "Yakin ingin menghapus semua warna tab sheet?",
    ui.ButtonSet.YES_NO
  );

  if (jawab !== ui.Button.YES) {
    return;
  }

  sheets.forEach(sheet => {
    sheet.setTabColor(null);
  });

  ui.alert(
    "✅ Selesai",
    "Semua warna tab sheet berhasil dihapus.",
    ui.ButtonSet.OK
  );
}


// =====================================================
// HAPUS LINK PDF & TEKS H2:I2  (skrip lama, tidak diubah)
// =====================================================
function hapusPDFdanTeks() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const ui = SpreadsheetApp.getUi();

  const jawab = ui.alert(
    "⚠️ Konfirmasi",
    "Hapus teks dan link PDF H2:I2 pada SEMUA SHEET?\n\n" +
    "Hanya H2 dan I2 yang akan dikosongkan.\n" +
    "Data pada baris 3 ke bawah TIDAK akan dihapus.",
    ui.ButtonSet.YES_NO
  );

  if (jawab !== ui.Button.YES) {
    return;
  }

  let jumlahSheet = 0;

  sheets.forEach(sheet => {

    if (sheet.getName() === "MENU") {
      return;
    }

    sheet.getRange("H2:I2").clearContent();

    jumlahSheet++;
  });

  ui.alert(
    "✅ Selesai",
    "Link PDF dan teks pada H2:I2 berhasil dihapus.\n\n" +
    "Jumlah sheet yang diproses: " + jumlahSheet + "\n\n" +
    "Data lainnya tidak dihapus.",
    ui.ButtonSet.OK
  );
}


// =====================================================
// IMPORT PDF F2 → SHEET LOKASI
// =====================================================

function showImportDialog() {
  var html = HtmlService.createHtmlOutputFromFile('ImportDialog')
    .setWidth(720)
    .setHeight(680);
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

function colLetter_(col) {
  var letter = '';
  while (col > 0) {
    var rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Cari baris header ("NO | NAMA | NOMOR KETENAGAKERJAAN | IURAN TK CLIENT | IURAN TK
 * KARYAWAN | TOTAL | STATUS | KETERANGAN | JPG SIPP / REKAP TK | JKK | JKM | JHT | JP |
 * JKP | | JHT | JP") di 15 baris pertama sheet, lalu petakan nama kolom logis -> nomor
 * kolom (1-based). JHT dan JP masing-masing muncul 2x di header: yang pertama = porsi
 * Pemberi Kerja (ikut IURAN TK CLIENT), yang kedua = porsi Tenaga Kerja/karyawan
 * (ikut IURAN TK KARYAWAN).
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
      else if (v2 === 'IURAN TK CLIENT' && map.iuranClient === undefined) map.iuranClient = col;
      else if (v2 === 'IURAN TK KARYAWAN' && map.iuranKaryawan === undefined) map.iuranKaryawan = col;
      else if (v2 === 'TOTAL' && map.total === undefined) map.total = col;
      else if (v2 === 'STATUS' && map.status === undefined) map.status = col;
      else if (v2 === 'KETERANGAN' && map.keterangan === undefined) map.keterangan = col;
      else if (v2.indexOf('JPG SIPP') === 0 && map.jpgSipp === undefined) map.jpgSipp = col;
      else if (v2 === 'JKK' && map.jkk === undefined) map.jkk = col;
      else if (v2 === 'JKM' && map.jkm === undefined) map.jkm = col;
      // JHT dan JP masing-masing muncul 2x di header SIPP: yang pertama = porsi
      // Pemberi Kerja (masuk IURAN TK CLIENT), yang kedua = porsi Tenaga Kerja
      // (masuk IURAN TK KARYAWAN). Tidak dijumlahkan satu sama lain.
      else if (v2 === 'JHT' && map.jhtPK === undefined) map.jhtPK = col;
      else if (v2 === 'JHT' && map.jhtPK !== undefined && map.jhtTK === undefined) map.jhtTK = col;
      else if (v2 === 'JP' && map.jpPK === undefined) map.jpPK = col;
      else if (v2 === 'JP' && map.jpPK !== undefined && map.jpTK === undefined) map.jpTK = col;
      else if (v2 === 'JKP' && map.jkp === undefined) map.jkp = col;
    }
    return map;
  }
  return null;
}

var TOTAL_LABEL = 'TOTAL';

/**
 * Cari rentang baris data (setelah header) sampai sebelum baris kosong atau baris
 * penanda TOTAL yang sudah ada. Berhenti persis di batas data yang ada — tidak pernah
 * masuk ke baris kosong/area manual di bawahnya.
 *
 * Beberapa sheet lama sudah punya baris TOTAL bikinan manual/proses sebelumnya:
 * NO & NAMA-nya kosong, tapi kolom TOTAL atau JKK sudah keisi angka. Baris seperti
 * itu juga dianggap baris TOTAL (supaya tidak dibuatkan baris TOTAL baru yang
 * dobel) — beda dengan baris kosong asli (NO, NAMA, TOTAL, JKK semuanya kosong)
 * yang berarti benar-benar akhir data / awal area manual.
 */
function findDataRange_(sheet, map) {
  var lastRow = sheet.getLastRow();
  var start = map.headerRow + 1;
  var end = start - 1; // belum ada baris data
  var totalRow = null;
  for (var r = start; r <= lastRow; r++) {
    var namaVal = map.nama ? sheet.getRange(r, map.nama).getValue() : '';
    var noVal = map.no ? sheet.getRange(r, map.no).getValue() : '';
    var namaNorm = norm_(namaVal);
    var noBlank = String(noVal).trim() === '';

    if (namaNorm === TOTAL_LABEL) { totalRow = r; break; }

    if (namaNorm === '' && noBlank) {
      var hasTotalValue = (map.total && String(sheet.getRange(r, map.total).getValue()).trim() !== '') ||
                           (map.jkk && String(sheet.getRange(r, map.jkk).getValue()).trim() !== '');
      if (hasTotalValue) totalRow = r;
      break;
    }
    end = r;
  }
  return { start: start, end: end, totalRow: totalRow };
}

/**
 * Ringkasan 1 sheet lokasi untuk sheet MENU: jumlah anggota (banyak baris
 * karyawan), total tagihan, jumlah & jenis program BPJS yang aktif (JKK-JKP).
 * Dihitung langsung dari baris-baris karyawannya (dijumlahkan sendiri), BUKAN
 * dari baris TOTAL — supaya lokasi yang anggotanya cuma 1 orang dan belum
 * punya baris TOTAL manual tetap kehitung benar, bukan 0.
 */
function getLocationStats_(sheet) {
  var map = findHeaderMap_(sheet);
  if (!map) {
    return { anggota: 0, totalTagihan: 0, jumlahProgram: 0, jenisProgram: '-' };
  }

  var range = findDataRange_(sheet, map);
  var anggota = range.end >= range.start ? (range.end - range.start + 1) : 0;

  var totalTagihan = 0;
  var aktif = [];

  if (anggota > 0) {
    var numRows = anggota;
    if (map.total) {
      sheet.getRange(range.start, map.total, numRows, 1).getValues().forEach(function (r) {
        totalTagihan += num_(r[0]);
      });
    }

    var programCols = [
      { key: 'JKK', col: map.jkk },
      { key: 'JKM', col: map.jkm },
      { key: 'JHT', col: map.jhtPK },
      { key: 'JP', col: map.jpPK },
      { key: 'JKP', col: map.jkp }
    ];
    programCols.forEach(function (p) {
      if (!p.col) return;
      var sum = 0;
      sheet.getRange(range.start, p.col, numRows, 1).getValues().forEach(function (r) {
        sum += num_(r[0]);
      });
      if (sum !== 0) aktif.push(p.key);
    });
  }

  return {
    anggota: anggota,
    totalTagihan: round2_(totalTagihan),
    jumlahProgram: aktif.length,
    jenisProgram: joinProgramNames_(aktif)
  };
}

function joinProgramNames_(names) {
  if (names.length === 0) return '-';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' dan ' + names[names.length - 1];
}

/** Rapikan format 1 baris data: no fill, tidak bold, NAMA rata kiri. KETERANGAN (H)
 * dan JPG SIPP / REKAP TK (I) juga di-no-fill (isinya tetap tidak disentuh — itu
 * area manual, cuma warnanya yang dirapikan). */
function styleDataRow_(sheet, row, map) {
  var cols = [
    map.no, map.nama, map.noKtk, map.iuranClient, map.iuranKaryawan, map.total, map.status,
    map.keterangan, map.jpgSipp,
    map.jkk, map.jkm, map.jhtPK, map.jpPK, map.jkp, map.jhtTK, map.jpTK
  ].filter(function (c) { return !!c; });
  cols.forEach(function (c) {
    sheet.getRange(row, c).setBackground(null).setFontWeight('normal');
  });
  if (map.nama) sheet.getRange(row, map.nama).setHorizontalAlignment('left');
}

/** Isi rumus IURAN TK CLIENT (D) = SUM(JKK:JKP), IURAN TK KARYAWAN (E) = SUM(JHT
 * karyawan:JP karyawan), TOTAL (F) = D + E, untuk satu baris karyawan. */
function setRowFormulas_(sheet, row, map) {
  if (map.iuranClient && map.jkk && map.jkp) {
    sheet.getRange(row, map.iuranClient).setFormula(
      '=SUM(' + colLetter_(map.jkk) + row + ':' + colLetter_(map.jkp) + row + ')'
    );
  }
  if (map.iuranKaryawan && map.jhtTK && map.jpTK) {
    sheet.getRange(row, map.iuranKaryawan).setFormula(
      '=SUM(' + colLetter_(map.jhtTK) + row + ':' + colLetter_(map.jpTK) + row + ')'
    );
  }
  if (map.total && map.iuranClient && map.iuranKaryawan) {
    sheet.getRange(row, map.total).setFormula(
      '=' + colLetter_(map.iuranClient) + row + '+' + colLetter_(map.iuranKaryawan) + row
    );
  }
}

/** Pastikan header gabungan "IURAN TK CLIENT" (J:N) dan "IURAN TK KARYAWAN" (P:Q)
 * di baris tepat di atas header kolom (mis. row 3 kalau header di row 4). */
function ensureGroupHeaders_(sheet, map) {
  var groupRow = map.headerRow - 1;
  if (groupRow < 1) return;
  if (map.jkk && map.jkp && map.jkp >= map.jkk) {
    var r1 = sheet.getRange(groupRow, map.jkk, 1, map.jkp - map.jkk + 1);
    r1.merge();
    r1.setValue('IURAN TK CLIENT').setFontWeight('bold').setHorizontalAlignment('center');
  }
  if (map.jhtTK && map.jpTK && map.jpTK >= map.jhtTK) {
    var r2 = sheet.getRange(groupRow, map.jhtTK, 1, map.jpTK - map.jhtTK + 1);
    r2.merge();
    r2.setValue('IURAN TK KARYAWAN').setFontWeight('bold').setHorizontalAlignment('center');
  }
}

/** Pastikan baris TOTAL ada tepat setelah baris data terakhir (insert kalau belum ada,
 * pakai lagi kalau sudah ada) lalu isi SUM untuk kolom JKK..JP-karyawan dan TOTAL (F). */
function ensureTotalRow_(sheet, map, range, lastDataRow) {
  var totalRow;
  if (range.totalRow) {
    totalRow = range.totalRow;
  } else if (lastDataRow >= map.headerRow + 1) {
    sheet.insertRowAfter(lastDataRow);
    totalRow = lastDataRow + 1;
  } else {
    sheet.insertRowAfter(map.headerRow);
    totalRow = map.headerRow + 1;
  }

  if (map.nama) {
    sheet.getRange(totalRow, map.nama).setValue(TOTAL_LABEL)
      .setFontWeight('bold').setBackground(null).setHorizontalAlignment('left');
  }

  var dataStart = map.headerRow + 1;
  var dataEnd = Math.max(lastDataRow, dataStart - 1);
  if (dataEnd >= dataStart) {
    // Kolom O (pembatas merah, tidak ada headernya) sengaja dilewati — bukan data.
    var sumCols = [map.jkk, map.jkm, map.jhtPK, map.jpPK, map.jkp, map.jhtTK, map.jpTK, map.total]
      .filter(function (c) { return !!c; });
    sumCols.forEach(function (c) {
      sheet.getRange(totalRow, c).setFormula(
        '=SUM(' + colLetter_(c) + dataStart + ':' + colLetter_(c) + dataEnd + ')'
      ).setBackground(null).setFontWeight('bold');
    });
  }
  return totalRow;
}

/** Simpan PDF F2 asli ke Drive (folder "PDF F2 Sumber/<bulan>-<tahun>" di sebelah
 * spreadsheet, satu subfolder per periode supaya PDF dari bulan-bulan berbeda tidak
 * campur jadi satu folder besar) dan pasang linknya di H2:I2 (merge), diberi nama
 * "<sheet> <bulan>-<tahun 2 digit>.pdf". H2:I2 dipakai literal (sama seperti
 * konvensi hapusPDFdanTeks() yang sudah ada). */
function attachSourcePdf_(ss, sheet, pdfBase64, periode) {
  var yy = periode && periode.year ? String(periode.year).slice(-2) : '';
  var label = periode && periode.month && yy
    ? (sheet.getName() + ' ' + periode.month + '-' + yy + '.pdf')
    : (sheet.getName() + '.pdf');

  var bytes = Utilities.base64Decode(pdfBase64);
  var blob = Utilities.newBlob(bytes, 'application/pdf', label);
  var folder = getOrCreatePdfFolder_(ss, periode);
  var file = folder.createFile(blob);
  file.setName(label);

  var range = sheet.getRange('H2:I2');
  range.merge();
  var rich = SpreadsheetApp.newRichTextValue().setText(label).setLinkUrl(file.getUrl()).build();
  range.setRichTextValue(rich);
}

function getOrCreateSubfolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

function getOrCreatePdfFolder_(ss, periode) {
  var parents = DriveApp.getFileById(ss.getId()).getParents();
  var parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var root = getOrCreateSubfolder_(parentFolder, 'PDF F2 Sumber');
  if (periode && periode.month && periode.year) {
    return getOrCreateSubfolder_(root, periode.month + '-' + periode.year);
  }
  return root;
}

/**
 * Proses hasil parsing PDF (dari sisi client, pakai pdf.js) dan tulis ke sheet lokasi
 * terpilih. payload: { sheetName, periode: {month, year}, pdfBase64, employees: [
 * {nomorReferensi, nik, nama, jkk, jkm, jhtPK, jhtTK, jpPK, jpTK, jkpPK, jkpPemerintah}
 * ] }
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

  ensureGroupHeaders_(sheet, map);

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
  var totalRow = range.totalRow;

  payload.employees.forEach(function (emp) {
    var key = String(emp.nomorReferensi).trim();

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
      if (totalRow) totalRow++; // baris TOTAL (dan area manual di bawahnya) ikut turun
      if (map.no) sheet.getRange(targetRow, map.no).setValue(targetRow - map.headerRow);
      added++;
    }

    if (map.nama) sheet.getRange(targetRow, map.nama).setValue(emp.nama);
    // format teks (bukan number) supaya nomor KTK yang diawali "0" tidak hilang digitnya
    if (map.noKtk) sheet.getRange(targetRow, map.noKtk).setNumberFormat('@').setValue(emp.nomorReferensi);
    if (map.status) sheet.getRange(targetRow, map.status).setValue('AKTIF');
    if (map.jkk) sheet.getRange(targetRow, map.jkk).setValue(num_(emp.jkk));
    if (map.jkm) sheet.getRange(targetRow, map.jkm).setValue(num_(emp.jkm));
    // JHT & JP: Pemberi Kerja dan Tenaga Kerja masing-masing kolom sendiri, TIDAK
    // dijumlahkan — sesuai pembagian aslinya di tabel SIPP/F2.
    if (map.jhtPK) sheet.getRange(targetRow, map.jhtPK).setValue(num_(emp.jhtPK));
    if (map.jpPK) sheet.getRange(targetRow, map.jpPK).setValue(num_(emp.jpPK));
    if (map.jkp) sheet.getRange(targetRow, map.jkp).setValue(round2_(num_(emp.jkpPK) + num_(emp.jkpPemerintah)));
    if (map.jhtTK) sheet.getRange(targetRow, map.jhtTK).setValue(num_(emp.jhtTK));
    if (map.jpTK) sheet.getRange(targetRow, map.jpTK).setValue(num_(emp.jpTK));

    setRowFormulas_(sheet, targetRow, map);
    styleDataRow_(sheet, targetRow, map);
  });

  range.totalRow = totalRow;
  ensureTotalRow_(sheet, map, range, lastDataRow);

  if (payload.pdfBase64) {
    attachSourcePdf_(ss, sheet, payload.pdfBase64, payload.periode);
  }

  return { updated: updated, added: added, total: payload.employees.length };
}

function num_(v) {
  var n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function round2_(n) {
  return Math.round(n * 100) / 100;
}

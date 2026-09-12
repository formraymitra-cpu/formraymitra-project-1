/**
 * Monitor Laporan Bulanan — dashboard live yang membaca langsung dari
 * spreadsheet "CEKLIS LAPORAN BULANAN" setiap kali dibuka/di-refresh.
 *
 * Cara pakai: lihat README.md di folder ini.
 */

var MONTHS_ID = [
  { num: 1,  name: 'JANUARI',   short: 'Jan', aliases: ['JANUARI', 'JAN'] },
  { num: 2,  name: 'FEBRUARI',  short: 'Feb', aliases: ['FEBRUARI', 'FEB'] },
  { num: 3,  name: 'MARET',     short: 'Mar', aliases: ['MARET', 'MAR'] },
  { num: 4,  name: 'APRIL',     short: 'Apr', aliases: ['APRIL', 'APR'] },
  { num: 5,  name: 'MEI',       short: 'Mei', aliases: ['MEI', 'MIE', 'MAY'] },
  { num: 6,  name: 'JUNI',      short: 'Jun', aliases: ['JUNI', 'JUN'] },
  { num: 7,  name: 'JULI',      short: 'Jul', aliases: ['JULI', 'JUL'] },
  { num: 8,  name: 'AGUSTUS',   short: 'Agu', aliases: ['AGUSTUS', 'AGU', 'AGT'] },
  { num: 9,  name: 'SEPTEMBER', short: 'Sep', aliases: ['SEPTEMBER', 'SEP', 'SEPT'] },
  { num: 10, name: 'OKTOBER',   short: 'Okt', aliases: ['OKTOBER', 'OKT', 'OCT'] },
  { num: 11, name: 'NOVEMBER',  short: 'Nov', aliases: ['NOVEMBER', 'NOV'] },
  { num: 12, name: 'DESEMBER',  short: 'Des', aliases: ['DESEMBER', 'DES', 'DEC'] }
];

/** Serve halaman dashboard. */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Monitor Laporan Bulanan')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Dipakai Index.html untuk menyisipkan Stylesheet.html / JavaScript.html. */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Dipanggil dari client (google.script.run). Membaca ULANG semua sheet
 * bulanan dari spreadsheet aktif — tidak ada cache, jadi selalu
 * mencerminkan data terbaru begitu ada input baru di spreadsheet.
 */
function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  var entries = [];
  sheets.forEach(function (sheet) {
    var match = matchMonthSheet_(sheet.getName());
    if (!match) return;

    var parsed = parseMonthlySheet_(sheet);
    if (!parsed) return; // nama cocok tapi struktur sheet tidak sesuai ceklist

    entries.push({ sheet: sheet, match: match, parsed: parsed });
  });

  // Sheet tanpa tahun di namanya (mis. "APRIL" dari arsip lama) dan tanpa
  // tanggal terbaca sama sekali di isinya tidak bisa ditebak tahunnya dari
  // dirinya sendiri. Daripada asal pakai tahun berjalan (yang bisa
  // bentrok/menimpa sheet lain yang kebetulan bertahun sama), pakai tahun
  // mayoritas dari sheet-sheet "tanpa tahun" lain yang tanggalnya kebaca.
  var bareYearCounts = {};
  entries.forEach(function (e) {
    if (!e.match.year && e.parsed.inferredYear) {
      bareYearCounts[e.parsed.inferredYear] = (bareYearCounts[e.parsed.inferredYear] || 0) + 1;
    }
  });
  var bareFallbackYear = null, bestCount = 0;
  Object.keys(bareYearCounts).forEach(function (y) {
    if (bareYearCounts[y] > bestCount) { bestCount = bareYearCounts[y]; bareFallbackYear = parseInt(y, 10); }
  });

  var months = {};
  entries.forEach(function (e) {
    var match = e.match, parsed = e.parsed;
    var year = match.year || parsed.inferredYear || bareFallbackYear || new Date().getFullYear();
    var label = titleCase_(match.monthName) + ' ' + year;

    // Jaga-jaga: kalau dua sheet berbeda tetap jatuh ke label yang sama,
    // jangan diam-diam saling menimpa — bedakan pakai nama sheet aslinya.
    if (months[label]) {
      label = label + ' (' + e.sheet.getName() + ')';
    }

    months[label] = {
      short: match.short,
      sortKey: year * 100 + match.monthNum,
      sheetName: e.sheet.getName(),
      total_client: parsed.total_client,
      laporan_done: parsed.laporan_done,
      laporan_pct: parsed.laporan_pct,
      absensi_done: parsed.absensi_done,
      absensi_pct: parsed.absensi_pct,
      checklist: parsed.checklist,
      daily_count: parsed.daily.length,
      daily: parsed.daily
    };
  });

  var monthOrder = Object.keys(months).sort(function (a, b) {
    return months[a].sortKey - months[b].sortKey;
  });

  return {
    months: months,
    monthOrder: monthOrder,
    generatedAt: new Date().toISOString(),
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl()
  };
}

/* ---------------------------------------------------------------------- */
/* Deteksi & parsing sheet bulanan                                        */
/* ---------------------------------------------------------------------- */

/**
 * Sheet dianggap "sheet bulan" kalau namanya PERSIS nama bulan Indonesia,
 * boleh diikuti tahun 4 digit (mis. "APRIL", "FEBRUARI 2026", "MIE 2026").
 * Sheet lain (rekap gabungan, sheet kerja, dsb) otomatis diabaikan.
 */
function matchMonthSheet_(sheetName) {
  var clean = sheetName.trim().toUpperCase();
  var m = clean.match(/^([A-Z]+)\s*(\d{4})?$/);
  if (!m) return null;
  var token = m[1];
  var year = m[2] ? parseInt(m[2], 10) : null;
  var found = null;
  for (var i = 0; i < MONTHS_ID.length; i++) {
    if (MONTHS_ID[i].aliases.indexOf(token) !== -1) { found = MONTHS_ID[i]; break; }
  }
  if (!found) return null;
  return { monthNum: found.num, monthName: found.name, short: found.short, year: year };
}

/**
 * Cari posisi kolom NO/NAMA/LAPORAN BULANAN/TANGGAL/KETERANGAN/ABSENSI dari
 * TEKS HEADER-nya, bukan dari nomor kolom tetap — karena beberapa sheet
 * bulanan (mis. JULI/AGUSTUS/SEPTEMBER 2026) punya 2 kolom tambahan
 * ("PIC", "NAMA GROUP WA") yang menggeser semua kolom setelahnya.
 */
function buildColumnMap_(values, headerRow, lastCol) {
  var hRow = values[headerRow - 1] || [];
  var texts = [];
  for (var c = 1; c <= lastCol; c++) {
    var v = hRow[c - 1];
    var norm = (typeof v === 'string') ? v.replace(/\n/g, ' ').trim().toUpperCase().replace(/\s+/g, ' ') : '';
    texts.push({ col: c, text: norm });
  }
  function findCol(pred, afterCol) {
    for (var i = 0; i < texts.length; i++) {
      if (texts[i].col <= (afterCol || 0)) continue;
      if (pred(texts[i].text)) return texts[i].col;
    }
    return null;
  }

  var colNo = findCol(function (t) { return t === 'NO'; }, 0) || 1;
  var colNama = findCol(function (t) { return t === 'NAMA'; }, 0) || (colNo + 1);
  var colLaporan = findCol(function (t) { return t.indexOf('LAPORAN BULANAN') !== -1; }, 0) || (colNama + 1);
  var colTglSelesai = findCol(function (t) { return t.indexOf('TANGGAL') !== -1; }, colLaporan) || (colLaporan + 1);
  var colKet = findCol(function (t) { return t.indexOf('KETERANGAN') !== -1; }, colLaporan);
  var colAbsensi = findCol(function (t) { return t.indexOf('ABSENSI') !== -1; }, colLaporan) || (colTglSelesai + 1);
  var colTglAbsensi = findCol(function (t) { return t.indexOf('TANGGAL') !== -1; }, colAbsensi) || (colAbsensi + 1);

  return { no: colNo, nama: colNama, laporan: colLaporan, tglSelesai: colTglSelesai, ket: colKet, absensi: colAbsensi, tglAbsensi: colTglAbsensi };
}

/**
 * Parse satu sheet bulanan menjadi { checklist[], daily[], total_client, ... }.
 * Struktur yang diharapkan (lihat sheet contoh "AGUSTUS 2026" dkk):
 *   Baris header (kolom berisi "NO"): NO | NAMA | [PIC | NAMA GROUP WA] | LAPORAN BULANAN | TANGGAL SELESAI | KETERANGAN | ABSENSI | TANGGAL KIRIM | ...
 *   Baris demi baris client sampai ketemu baris "REKAP LAPORAN HARIAN"
 *   Lalu header kedua yang memuat "TANGGAL", diikuti log harian:
 *   NO | TANGGAL | (kosong) | (kosong) | KETERANGAN* | ... | status(kol J) | catatan(kol K)
 *   (*kolom keterangan log harian bergeser-geser antar sheet, makanya dicek D/E/F)
 */
function parseMonthlySheet_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 8);
  if (lastRow < 2) return null;

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  function V(r, c) {
    var row = values[r - 1];
    return row ? row[c - 1] : undefined;
  }

  var headerRow = null;
  for (var r = 1; r <= Math.min(6, lastRow) && !headerRow; r++) {
    for (var c = 1; c <= 4; c++) {
      var v = V(r, c);
      if (typeof v === 'string' && v.trim().toUpperCase() === 'NO') { headerRow = r; break; }
    }
  }
  if (!headerRow) return null;

  var cols = buildColumnMap_(values, headerRow, lastCol);

  var checklist = [];
  var rekapRow = null;
  var yearCounts = {};
  var rr = headerRow + 1;
  while (rr <= lastRow) {
    var nama = V(rr, cols.nama);
    if (typeof nama === 'string' && nama.toUpperCase().indexOf('REKAP') !== -1) { rekapRow = rr; break; }
    if (nama === null || nama === undefined) { rr++; continue; }
    if (typeof nama === 'string' && !nama.trim()) { rr++; continue; } // baris kosong/cuma spasi, bukan client

    var no = V(rr, cols.no);
    var lap = V(rr, cols.laporan);
    var tglSelesai = V(rr, cols.tglSelesai);
    var ket = cols.ket ? V(rr, cols.ket) : null;
    var absen = V(rr, cols.absensi);
    var tglAbsen = cols.tglAbsensi ? V(rr, cols.tglAbsensi) : null;

    var y = null;
    if (tglSelesai instanceof Date) y = tglSelesai.getFullYear();
    else if (tglAbsen instanceof Date) y = tglAbsen.getFullYear();
    if (y) yearCounts[y] = (yearCounts[y] || 0) + 1;

    checklist.push({
      no: (typeof no === 'number') ? no : null,
      nama: String(nama).trim(),
      laporan: lap === true,
      tgl_selesai: fmtDateShort_(tglSelesai),
      keterangan: (typeof ket === 'string' && ket.trim()) ? ket.trim() : null,
      absensi: absen === true,
      tgl_absensi: fmtDateShort_(tglAbsen)
    });
    rr++;
  }

  if (!rekapRow) {
    for (var rr2 = 1; rr2 <= lastRow; rr2++) {
      var v0 = V(rr2, 1);
      if (typeof v0 === 'string' && v0.toUpperCase().indexOf('REKAP') !== -1) { rekapRow = rr2; break; }
    }
  }

  var daily = [];
  if (rekapRow) {
    var header2 = null;
    for (var hr = rekapRow; hr <= Math.min(rekapRow + 5, lastRow) && !header2; hr++) {
      for (var hc = 1; hc <= 8; hc++) {
        var hv = V(hr, hc);
        if (typeof hv === 'string' && hv.toUpperCase().indexOf('TANGGAL') !== -1) { header2 = hr; break; }
      }
    }
    var start = header2 ? header2 + 1 : rekapRow + 2;
    for (var dr = start; dr <= lastRow; dr++) {
      var tgl = V(dr, 2);
      var ketVal = null;
      for (var kc = 4; kc <= 6; kc++) {
        var kv = V(dr, kc);
        if (typeof kv === 'string' && kv.trim()) { ketVal = kv.trim(); break; }
      }
      var catatan = null;
      var v11 = V(dr, 11);
      if (typeof v11 === 'string' && v11.trim()) catatan = v11.trim();
      var status = null;
      var v10 = V(dr, 10);
      if (typeof v10 === 'string' && v10.trim()) status = v10.trim();

      if (!(tgl instanceof Date) && !ketVal) continue;
      daily.push({
        tanggal: fmtDateShort_(tgl),
        sortDate: (tgl instanceof Date) ? tgl.getTime() : 0,
        keterangan: ketVal,
        catatan: catatan,
        status: status
      });
    }
    daily.sort(function (a, b) { return a.sortDate - b.sortDate; });
  }

  var total = checklist.length;
  var laporanDone = checklist.filter(function (x) { return x.laporan; }).length;
  var absensiDone = checklist.filter(function (x) { return x.absensi; }).length;

  var inferredYear = null, best = 0;
  Object.keys(yearCounts).forEach(function (y) {
    if (yearCounts[y] > best) { best = yearCounts[y]; inferredYear = parseInt(y, 10); }
  });

  return {
    total_client: total,
    laporan_done: laporanDone,
    laporan_pct: total ? Math.round((laporanDone / total) * 1000) / 10 : 0,
    absensi_done: absensiDone,
    absensi_pct: total ? Math.round((absensiDone / total) * 1000) / 10 : 0,
    checklist: checklist,
    daily: daily,
    inferredYear: inferredYear
  };
}

/* ---------------------------------------------------------------------- */
/* Util kecil                                                             */
/* ---------------------------------------------------------------------- */

var MONTH_ABBR_ID_ = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function fmtDateShort_(d) {
  if (!(d instanceof Date)) return null;
  return d.getDate() + ' ' + MONTH_ABBR_ID_[d.getMonth()];
}

function titleCase_(word) {
  word = word.toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Jalankan manual dari editor (Run > debugDataset) untuk cek data tanpa buka web app. */
function debugDataset() {
  var data = getDashboardData();
  Logger.log(JSON.stringify(data, null, 2).slice(0, 8000));
  Logger.log('Sheet bulan terdeteksi: ' + data.monthOrder.join(', '));
}

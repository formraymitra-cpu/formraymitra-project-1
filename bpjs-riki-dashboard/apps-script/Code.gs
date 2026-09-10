/**
 * Dashboard Monitoring BPJS — Laporan Harian RIKI — versi live Apps Script.
 *
 * Port dari scripts/build_data.py. Baca langsung dari spreadsheet yang aktif
 * (script ini harus dibuat lewat Extensions > Apps Script DARI DALAM
 * spreadsheet sumber, supaya getActiveSpreadsheet() menunjuk ke sheet yang
 * benar) dan menghitung ulang dataset setiap kali dashboard dibuka — jadi
 * kalau isi spreadsheet berubah, dashboard otomatis ikut berubah tanpa perlu
 * proses build/deploy ulang.
 */

// Ganti/tambah tahun di sini kalau spreadsheet mulai punya sheet untuk tahun
// berikutnya (nama sheet bulan di file ini tidak menyertakan tahun).
var YEAR = 2026;

var MONTH_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
];

// (key, label, hasKesColumn) — pengecekanGaji & finalisasi hanya melacak TK.
var STAGE_DEFS = [
  { key: "rekapGaji", label: "REKAP U/ PENGGAJIAN", hasKes: true },
  { key: "rekapBayar", label: "REKAP PEMBAYARAN", hasKes: true },
  { key: "nominalBayar", label: "NOMINAL BAYAR", hasKes: true },
  { key: "pengecekanGaji", label: "PENGECEKAN REKAP GAJI", hasKes: false },
  { key: "finalisasi", label: "FINALISASI", hasKes: false },
  { key: "buktiBayar", label: "BUKTI BAYAR BPJS", hasKes: true },
];

function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}

function isoFromYMD(y, m, d) {
  return y + "-" + pad2(m) + "-" + pad2(d);
}

function isBlank(v) {
  return v === "" || v === null || v === undefined;
}

function cleanStr(v) {
  if (isBlank(v)) return null;
  var s = String(v).trim();
  return s ? s : null;
}

function boolOrNull(v) {
  return v === true ? true : v === false ? false : null;
}

/** Cari semua sheet yang namanya persis nama bulan Indonesia, urut Jan->Des. */
function discoverMonthSheets(ss) {
  var out = [];
  ss.getSheets().forEach(function (sheet) {
    var name = sheet.getName().trim().toUpperCase();
    var idx = MONTH_NAMES.indexOf(name);
    if (idx >= 0) {
      out.push({
        sheetName: sheet.getName(),
        monthNum: idx + 1,
        code: YEAR + "-" + pad2(idx + 1),
        label: name.charAt(0) + name.slice(1).toLowerCase() + " " + YEAR,
      });
    }
  });
  out.sort(function (a, b) {
    return a.monthNum - b.monthNum;
  });
  return out;
}

/**
 * Tanggal di bagian "LAPORAN HARIAN" tiap sheet bulan diketik sebagai teks
 * dd/mm; kalau tanggalnya <=12, Google Sheets/Excel kadang otomatis
 * mengonversinya jadi tanggal asli memakai urutan MM/DD (mis. "12/08" yang
 * dimaksud 12 Agustus bisa kebaca jadi 8 Desember). Karena bulan asli tidak
 * mungkin >12, ini hanya bisa terjadi (dan di data ini memang selalu berarti)
 * saat day<=12, jadi dibalik lagi di sini. Sheet1 (log konsolidasi) diketik
 * langsung sebagai tanggal asli dan TIDAK boleh dibalik.
 */
function parseLogDate(raw, fixMmddSwap) {
  if (Object.prototype.toString.call(raw) === "[object Date]" && !isNaN(raw.getTime())) {
    var storedDay = raw.getDate();
    var storedMonth = raw.getMonth() + 1;
    var year = raw.getFullYear();
    if (fixMmddSwap && storedDay <= 12) {
      return isoFromYMD(year, storedDay, storedMonth);
    }
    return isoFromYMD(year, storedMonth, storedDay);
  }
  if (typeof raw === "string") {
    var s = raw.trim();
    if (!s) return null;
    var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
    if (m) {
      var d = parseInt(m[1], 10);
      var mo = parseInt(m[2], 10);
      var y = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : YEAR;
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return isoFromYMD(y, mo, d);
    }
  }
  return null;
}

/**
 * Parse tabel "PROGRESS KERJA" satu sheet bulan. Mengembalikan { locations,
 * logStartRow } — logStartRow adalah baris pertama setelah baris TOTAL,
 * tempat bagian "LAPORAN HARIAN" dimulai.
 *
 * Kolom tetap sama di semua sheet bulan (kolom 1-18):
 *   1 NO | 2 kelompok KES (jarang diisi, berlaku turun sampai nilai baru) |
 *   3 LOKASI (nama entitas, selalu diisi) |
 *   4 rekapGaji.kes | 5 rekapGaji.tk |
 *   6 rekapBayar.kes | 7 rekapBayar.tk |
 *   8 (spacer/nominal KES dalam rupiah, bukan checklist) |
 *   9 nominalBayar.kes (checklist) |
 *   10 (spacer/nominal TK dalam rupiah) | 11 nominalBayar.tk (checklist) |
 *   12 pengecekanGaji.tk | 13 finalisasi.tk |
 *   14 buktiBayar.kes | 15 buktiBayar.tk |
 *   16 keterangan.kes | 17 keterangan.tk | 18 note
 */
function parseProgressSheet(sheet, monthCode) {
  var lastRow = sheet.getLastRow();
  var locations = [];
  if (lastRow < 5) return { locations: locations, logStartRow: lastRow + 1 };

  var values = sheet.getRange(5, 1, lastRow - 4, 18).getValues();
  var kelompokKes = null;
  var logStartRow = lastRow + 1;

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowNum = 5 + i;
    var a = row[0];
    var b = cleanStr(row[1]);
    var c = cleanStr(row[2]);

    if (typeof c === "string" && c.toUpperCase() === "TOTAL") {
      logStartRow = rowNum + 1;
      break;
    }
    if ((typeof a === "string" && a.toUpperCase() === "LAPORAN HARIAN") || (b && b.toUpperCase() === "LAPORAN HARIAN")) {
      logStartRow = rowNum;
      break;
    }
    if (isBlank(a) && !b && !c) continue;
    if (b) kelompokKes = b;
    if (!c) continue;

    var stages = {
      rekapGaji: { kes: boolOrNull(row[3]), tk: boolOrNull(row[4]) },
      rekapBayar: { kes: boolOrNull(row[5]), tk: boolOrNull(row[6]) },
      nominalBayar: { kes: boolOrNull(row[8]), tk: boolOrNull(row[10]) },
      pengecekanGaji: { tk: boolOrNull(row[11]) },
      finalisasi: { tk: boolOrNull(row[12]) },
      buktiBayar: { kes: boolOrNull(row[13]), tk: boolOrNull(row[14]) },
    };

    var cells = [];
    STAGE_DEFS.forEach(function (def) {
      if (def.hasKes) cells.push(stages[def.key].kes);
      cells.push(stages[def.key].tk);
    });
    var applicable = cells.filter(function (v) {
      return v !== null;
    });
    var status;
    if (applicable.length === 0) status = "no-data";
    else if (applicable.every(function (v) { return v === true; })) status = "selesai";
    else if (applicable.every(function (v) { return v === false; })) status = "belum";
    else status = "proses";
    var progressPct =
      applicable.length > 0
        ? Math.round((1000 * applicable.filter(function (v) { return v; }).length) / applicable.length) / 10
        : null;

    locations.push({
      month: monthCode,
      no: a,
      kelompokKes: kelompokKes,
      lokasi: c,
      stages: stages,
      keteranganKes: cleanStr(row[15]),
      keteranganTk: cleanStr(row[16]),
      note: cleanStr(row[17]),
      status: status,
      progressPct: progressPct,
    });
  }

  return { locations: locations, logStartRow: logStartRow };
}

/** Parse bagian "LAPORAN HARIAN" (TGL | KEGIATAN | KETERANGAN) di sheet bulan. */
function parseDailyLogSection(sheet, startRow, monthCode) {
  var lastRow = sheet.getLastRow();
  var entries = [];
  if (startRow > lastRow) return entries;

  var r = startRow;
  // lewati baris judul "LAPORAN HARIAN" & baris header "TGL | KEGIATAN | KETERANGAN"
  while (r <= lastRow) {
    var a = cleanStr(sheet.getRange(r, 1).getValue());
    r++;
    if (a && a.toUpperCase() === "TGL") break;
  }
  if (r > lastRow) return entries;

  var values = sheet.getRange(r, 1, lastRow - r + 1, 3).getValues();
  var currentDate = null;
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var parsed = parseLogDate(row[0], true);
    if (parsed) currentDate = parsed;
    var kegiatan = cleanStr(row[1]);
    if (kegiatan) {
      entries.push({
        date: currentDate,
        kegiatan: kegiatan,
        keterangan: cleanStr(row[2]),
        sourceMonth: monthCode,
      });
    }
  }
  return entries;
}

/** Sheet1: log konsolidasi NO | TANGGAL | KEGIATAN | KETERANGAN, urut mundur (terbaru dulu). */
function parseConsolidatedLog(ss) {
  var sheet = ss.getSheetByName("Sheet1");
  var entries = [];
  if (!sheet) return entries;
  var lastRow = sheet.getLastRow();
  if (lastRow < 4) return entries;

  var values = sheet.getRange(4, 2, lastRow - 3, 3).getValues();
  var currentDate = null;
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var parsed = parseLogDate(row[0], false);
    if (parsed) currentDate = parsed;
    var kegiatan = cleanStr(row[1]);
    if (kegiatan) {
      entries.push({
        date: currentDate,
        kegiatan: kegiatan,
        keterangan: cleanStr(row[2]),
        sourceMonth: null,
      });
    }
  }
  return entries;
}

/** Sheet3: REKAP NOMINAL YANG HARUS DIBAYARKAN — NO | LOKASI | KES | TK. */
function parsePayments(ss) {
  var sheet = ss.getSheetByName("Sheet3");
  var payments = [];
  if (!sheet) return payments;
  var lastRow = sheet.getLastRow();
  if (lastRow < 5) return payments;

  var values = sheet.getRange(5, 1, lastRow - 4, 4).getValues();
  values.forEach(function (row) {
    var lokasi = cleanStr(row[1]);
    if (!lokasi) return;
    var kes = row[2];
    var tk = row[3];
    var nominalKes = typeof kes === "number" ? kes : null;
    var nominalTk = typeof tk === "number" ? tk : null;
    payments.push({
      no: row[0],
      lokasi: lokasi,
      nominalKes: nominalKes,
      nominalKesNote: typeof kes === "string" ? cleanStr(kes) : null,
      nominalTk: nominalTk,
      total: (nominalKes || 0) + (nominalTk || 0),
    });
  });
  return payments;
}

function newStageCellCount() {
  return { selesai: 0, belum: 0, kosong: 0 };
}

function buildMonthSummary(monthMeta, locations) {
  var stageCounts = {};
  STAGE_DEFS.forEach(function (def) {
    stageCounts[def.key] = def.hasKes ? { kes: newStageCellCount(), tk: newStageCellCount() } : { tk: newStageCellCount() };
    var subs = def.hasKes ? ["kes", "tk"] : ["tk"];
    subs.forEach(function (sub) {
      var count = stageCounts[def.key][sub];
      locations.forEach(function (loc) {
        var v = loc.stages[def.key][sub];
        if (v === true) count.selesai++;
        else if (v === false) count.belum++;
        else count.kosong++;
      });
    });
  });

  var pctValues = locations
    .map(function (l) { return l.progressPct; })
    .filter(function (v) { return v !== null; });
  var overallPct = pctValues.length
    ? Math.round((10 * pctValues.reduce(function (a, b) { return a + b; }, 0)) / pctValues.length) / 10
    : null;

  function countStatus(st) {
    return locations.filter(function (l) { return l.status === st; }).length;
  }

  return {
    code: monthMeta.code,
    label: monthMeta.label,
    totalLokasi: locations.length,
    lokasiSelesai: countStatus("selesai"),
    lokasiProses: countStatus("proses"),
    lokasiBelum: countStatus("belum"),
    lokasiNoData: countStatus("no-data"),
    overallPct: overallPct,
    stages: stageCounts,
  };
}

function summarizeNotes(locations) {
  var byText = {};
  locations.forEach(function (loc) {
    [loc.note, loc.keteranganKes, loc.keteranganTk].forEach(function (text) {
      if (!text) return;
      var key = text.trim();
      if (!byText[key]) byText[key] = { text: key, count: 0, locations: [] };
      byText[key].count++;
      if (byText[key].locations.indexOf(loc.lokasi) === -1) byText[key].locations.push(loc.lokasi);
    });
  });
  var list = [];
  for (var k in byText) list.push(byText[k]);
  list.sort(function (a, b) { return b.count - a.count; });
  return list;
}

/** Bangun dataset lengkap, dibaca langsung dari spreadsheet aktif. */
function buildDataset() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var monthMetas = discoverMonthSheets(ss);

  var months = [];
  var allLocations = [];
  var allDailyLog = [];
  var seenLogKeys = {};

  monthMetas.forEach(function (meta) {
    var sheet = ss.getSheetByName(meta.sheetName);
    var parsed = parseProgressSheet(sheet, meta.code);
    var logEntries = parseDailyLogSection(sheet, parsed.logStartRow, meta.code);

    months.push(buildMonthSummary(meta, parsed.locations));
    allLocations = allLocations.concat(parsed.locations);
    logEntries.forEach(function (e) {
      var key = e.date + "|" + e.kegiatan;
      seenLogKeys[key] = true;
      allDailyLog.push(e);
    });
  });

  // Sisipkan log konsolidasi (Sheet1) untuk entri yang belum tercakup oleh
  // bagian "LAPORAN HARIAN" di sheet bulan manapun (mis. tanggal sebelum
  // sheet bulan pertama mulai dipakai).
  parseConsolidatedLog(ss).forEach(function (e) {
    var key = e.date + "|" + e.kegiatan;
    if (!seenLogKeys[key]) {
      seenLogKeys[key] = true;
      allDailyLog.push(e);
    }
  });

  allDailyLog = allDailyLog.filter(function (e) { return e.date; });
  allDailyLog.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  return {
    generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd HH:mm"),
    months: months,
    locations: allLocations,
    dailyLog: allDailyLog,
    payments: parsePayments(ss),
    notes: summarizeNotes(allLocations),
  };
}

/**
 * Sisipkan isi mentah file lain TANPA evaluasi scriptlet (aman untuk bundle JS
 * hasil minify yang mungkin kebetulan mengandung teks "<?" atau "?>").
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Entry point Web App. Render Index.html dengan dataset live disuntikkan. */
function doGet(e) {
  var dataset = buildDataset();
  var template = HtmlService.createTemplateFromFile("Index");
  template.datasetJson = JSON.stringify(dataset);
  return template
    .evaluate()
    .setTitle("Dashboard BPJS - Laporan Harian RIKI")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Untuk dipanggil manual dari editor kalau mau cek dataset di Logger tanpa buka web app. */
function debugDataset() {
  Logger.log(JSON.stringify(buildDataset(), null, 2));
}

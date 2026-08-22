/**
 * Dashboard Monitoring Laporan & Absensi — versi live Apps Script.
 *
 * Port dari scripts/build-data.py. Baca langsung dari spreadsheet yang aktif
 * (script ini harus dibuat lewat Extensions > Apps Script DARI DALAM
 * spreadsheet sumber, supaya getActiveSpreadsheet() menunjuk ke sheet yang
 * benar) dan menghitung ulang dataset setiap kali dashboard dibuka.
 */

var MONTHS_2026 = [
  { code: "2026-02", sheet: "FEBRUARI 2026", label: "Februari 2026", month: 2, days: 28 },
  { code: "2026-03", sheet: "MARET 2026", label: "Maret 2026", month: 3, days: 31 },
  { code: "2026-04", sheet: "APRIL 2026", label: "April 2026", month: 4, days: 30 },
  { code: "2026-05", sheet: "MIE 2026", label: "Mei 2026", month: 5, days: 31 },
  { code: "2026-06", sheet: "JUNI 2026", label: "Juni 2026", month: 6, days: 30 },
  { code: "2026-07", sheet: "JULI 2026", label: "Juli 2026", month: 7, days: 31 },
  { code: "2026-08", sheet: "AGUSTUS 2026", label: "Agustus 2026", month: 8, days: 31 },
];

var SUFFIXES = [" SATPAM", " CS & SAT", " CS"];

function baseKey(name) {
  if (!name) return null;
  var n = String(name).trim().toUpperCase().replace(/\s+/g, " ");
  for (var i = 0; i < SUFFIXES.length; i++) {
    var suf = SUFFIXES[i];
    if (n.slice(-suf.length) === suf) {
      n = n.slice(0, n.length - suf.length).trim();
      break;
    }
  }
  return n;
}

function norm(name) {
  if (!name) return null;
  return String(name).trim().toUpperCase().replace(/\s+/g, " ");
}

function isoDate(v) {
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd");
  }
  return null;
}

function cleanStr(v) {
  if (v === null || v === undefined) return null;
  var s = String(v).trim();
  return s ? s : null;
}

/** Sheet DATA: NO | NAMA | DATA(metode) | KETERANGAN -> metode per baseKey */
function parseMetode(ss) {
  var sheet = ss.getSheetByName("DATA");
  var out = {};
  if (!sheet) return out;
  var values = sheet.getRange(5, 3, Math.max(sheet.getLastRow() - 4, 0), 2).getValues();
  values.forEach(function (row) {
    var nama = row[0];
    var metode = row[1];
    if (!nama) return;
    out[baseKey(nama)] = cleanStr(metode);
  });
  return out;
}

function parseExcluded(ss) {
  var sheet = ss.getSheetByName("TIDAK MENGGUNAKAN ABSENSI & LAP");
  var out = [];
  if (!sheet) return out;
  var values = sheet.getRange(5, 3, Math.max(sheet.getLastRow() - 4, 0), 2).getValues();
  values.forEach(function (row) {
    var nama = row[0];
    var ket = row[1];
    if (!nama) return;
    out.push({ nama: String(nama).trim(), keterangan: cleanStr(ket) });
  });
  return out;
}

/** ALL CLAEN 2026: tipe client (LAMA/BARU) per baseKey */
function parseTipeClient(ss) {
  var sheet = ss.getSheetByName("ALL CLAEN 2026");
  var out = {};
  if (!sheet) return out;
  var values = sheet.getRange(4, 3, Math.max(sheet.getLastRow() - 3, 0), 2).getValues();
  values.forEach(function (row) {
    var nama = row[0];
    var t = row[1];
    if (!nama || (t !== "CLIENT LAMA" && t !== "CLIENT BARU")) return;
    out[baseKey(nama)] = t === "CLIENT LAMA" ? "LAMA" : "BARU";
  });
  return out;
}

function parseMonthSheet(ss, sheetName, hasPic) {
  var sheet = ss.getSheetByName(sheetName);
  var rows = [];
  if (!sheet) return rows;
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) return rows;
  var numCols = hasPic ? 10 : 7; // kolom B..K (hasPic) atau B..H
  var values = sheet.getRange(3, 2, lastRow - 2, numCols).getValues();

  values.forEach(function (row) {
    var nama = row[0];
    if (!nama || typeof nama !== "string" || !nama.trim()) return;
    if (nama.trim().toUpperCase() === "KETERANGAN" || nama.trim().toUpperCase() === "NO") return;

    var pic, wa, lap, lapTgl, lapKet, abs_, absTgl, absKet, catatan;
    if (hasPic) {
      // B=nama C=pic D=wa E=laporan F=tglSelesai G=ket H=absensi I=tglSelesai J=ket K=catatan
      pic = row[1];
      wa = row[2];
      lap = row[3];
      lapTgl = row[4];
      lapKet = row[5];
      abs_ = row[6];
      absTgl = row[7];
      absKet = row[8];
      catatan = row[9];
    } else {
      // B=nama C=laporan D=tglSelesai E=ket F=absensi G=tglSelesai H=ket
      pic = null;
      wa = null;
      lap = row[1];
      lapTgl = row[2];
      lapKet = row[3];
      abs_ = row[4];
      absTgl = row[5];
      absKet = row[6];
      catatan = null;
    }

    rows.push({
      nama: String(nama).trim(),
      pic: cleanStr(pic),
      namaGroupWA: cleanStr(wa),
      laporan: { selesai: lap === true, tanggalSelesai: isoDate(lapTgl), keterangan: cleanStr(lapKet) },
      absensi: { selesai: abs_ === true, tanggalSelesai: isoDate(absTgl), keterangan: cleanStr(absKet) },
      catatan: cleanStr(catatan),
    });
  });
  return rows;
}

function monthStatus(rec, isClosed) {
  var lapOk = rec.laporan.selesai;
  var absOk = rec.absensi.selesai;
  if (lapOk && absOk) return "selesai";
  if (isClosed) return "overdue";
  return "proses";
}

/** Bangun dataset lengkap. asOfDateStr opsional, format YYYY-MM-DD (default: hari ini). */
function buildDataset(asOfDateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var asOfDate = asOfDateStr ? new Date(asOfDateStr + "T00:00:00") : new Date();
  asOfDate.setHours(0, 0, 0, 0);

  var metodeByKey = parseMetode(ss);
  var excluded = parseExcluded(ss);
  var tipeByKey = parseTipeClient(ss);

  var monthsOut = [];
  var monthlyRows = {};

  MONTHS_2026.forEach(function (m) {
    var hasPic = m.sheet === "JULI 2026" || m.sheet === "AGUSTUS 2026";
    var rows = parseMonthSheet(ss, m.sheet, hasPic);
    monthlyRows[m.code] = rows;

    var monthEnd = new Date(2026, m.month - 1, m.days);
    monthEnd.setHours(0, 0, 0, 0);
    var isClosed = asOfDate.getTime() > monthEnd.getTime();

    var total = rows.length;
    var lapDone = rows.filter(function (r) { return r.laporan.selesai; }).length;
    var absDone = rows.filter(function (r) { return r.absensi.selesai; }).length;
    var bothDone = rows.filter(function (r) { return r.laporan.selesai && r.absensi.selesai; }).length;
    var overdueCount = isClosed
      ? rows.filter(function (r) { return !(r.laporan.selesai && r.absensi.selesai); }).length
      : 0;

    monthsOut.push({
      code: m.code,
      label: m.label,
      isClosed: isClosed,
      totalLokasi: total,
      laporanSelesai: lapDone,
      laporanPct: total ? Math.round((lapDone / total) * 10000) / 10000 : null,
      absensiSelesai: absDone,
      absensiPct: total ? Math.round((absDone / total) * 10000) / 10000 : null,
      keduanyaSelesai: bothDone,
      overdueCount: overdueCount,
    });
  });

  var currentCode = monthsOut[monthsOut.length - 1].code;
  var currentRows = monthlyRows[currentCode];
  var priorCode = monthsOut[monthsOut.length - 2].code;
  var priorPicByKey = {};
  monthlyRows[priorCode].forEach(function (r) {
    if (r.pic) priorPicByKey[norm(r.nama)] = r.pic;
  });

  var currentMeta = MONTHS_2026[MONTHS_2026.length - 1];
  var currentMonthEnd = new Date(2026, currentMeta.month - 1, currentMeta.days);
  currentMonthEnd.setHours(0, 0, 0, 0);
  var isCurrentClosed = asOfDate.getTime() > currentMonthEnd.getTime();

  var locations = currentRows.map(function (r) {
    var key = baseKey(r.nama);
    var pic = r.pic || priorPicByKey[norm(r.nama)] || null;
    var status = monthStatus(r, isCurrentClosed);
    var hariTelat = null;
    if (status === "overdue") {
      hariTelat = Math.round((asOfDate.getTime() - currentMonthEnd.getTime()) / 86400000);
    }
    return {
      nama: r.nama,
      baseKey: key,
      tipeClient: tipeByKey[key] || null,
      metode: metodeByKey[key] || null,
      pic: pic,
      laporan: r.laporan,
      absensi: r.absensi,
      catatan: r.catatan,
      status: status,
      hariTelat: hariTelat,
    };
  });

  // heatmap: roster bulan berjalan x semua bulan, join via baseKey
  var seenBase = {};
  locations.forEach(function (l) {
    seenBase[l.baseKey] = true;
  });
  var bases = Object.keys(seenBase).sort();

  var riskWeight = { overdue: 3, proses: 1, selesai: 0, "no-data": 0 };
  var heatmap = bases.map(function (base) {
    var cells = monthsOut.map(function (m) {
      var rows = monthlyRows[m.code];
      var matches;
      if (m.code === "2026-07" || m.code === "2026-08") {
        matches = rows.filter(function (r) { return baseKey(r.nama) === base; });
      } else {
        matches = rows.filter(function (r) { return norm(r.nama) === base; });
      }
      if (matches.length === 0) return { month: m.code, status: "no-data" };
      var lapOk = matches.every(function (x) { return x.laporan.selesai; });
      var absOk = matches.every(function (x) { return x.absensi.selesai; });
      var st;
      if (lapOk && absOk) st = "selesai";
      else if (m.isClosed) st = "overdue";
      else st = "proses";
      return { month: m.code, status: st };
    });
    return { baseKey: base, cells: cells };
  });
  heatmap.sort(function (a, b) {
    var wa = a.cells.reduce(function (s, c) { return s + (riskWeight[c.status] || 0); }, 0);
    var wb = b.cells.reduce(function (s, c) { return s + (riskWeight[c.status] || 0); }, 0);
    return wb - wa;
  });

  // leaderboard PIC: basis bulan closed terakhir yang punya kolom PIC (Juli 2026)
  var juliRows = monthlyRows["2026-07"] || [];
  var picStats = {};
  juliRows.forEach(function (r) {
    if (!r.pic) return;
    var st = monthStatus(r, true);
    if (!picStats[r.pic]) picStats[r.pic] = { pic: r.pic, lokasiDitangani: 0, selesai: 0, overdue: 0 };
    picStats[r.pic].lokasiDitangani += 1;
    if (st === "selesai") picStats[r.pic].selesai += 1;
    else picStats[r.pic].overdue += 1;
  });

  var currentByPic = {};
  locations.forEach(function (l) {
    if (!l.pic) return;
    if (!currentByPic[l.pic]) {
      currentByPic[l.pic] = { lokasiSaatIni: 0, selesaiSaatIni: 0, prosesSaatIni: 0, overdueSaatIni: 0 };
    }
    currentByPic[l.pic].lokasiSaatIni += 1;
    var field = l.status === "selesai" ? "selesaiSaatIni" : l.status === "proses" ? "prosesSaatIni" : "overdueSaatIni";
    currentByPic[l.pic][field] += 1;
  });

  var leaderboard = Object.keys(picStats).map(function (pic) {
    var p = picStats[pic];
    var pct = p.lokasiDitangani ? Math.round((p.selesai / p.lokasiDitangani) * 100) : 0;
    var cur = currentByPic[pic] || { lokasiSaatIni: 0, selesaiSaatIni: 0, prosesSaatIni: 0, overdueSaatIni: 0 };
    return {
      pic: p.pic,
      lokasiDitangani: p.lokasiDitangani,
      selesai: p.selesai,
      overdue: p.overdue,
      pctTepatWaktu: pct,
      basisBulan: "2026-07",
      lokasiSaatIni: cur.lokasiSaatIni,
      selesaiSaatIni: cur.selesaiSaatIni,
      prosesSaatIni: cur.prosesSaatIni,
      overdueSaatIni: cur.overdueSaatIni,
    };
  });
  leaderboard.sort(function (a, b) { return b.pctTepatWaktu - a.pctTepatWaktu; });

  var picFilled = locations.filter(function (l) { return l.pic; }).length;
  var picCoveragePct = locations.length ? Math.round((picFilled / locations.length) * 100) : 0;

  var tipeCounts = { LAMA: 0, BARU: 0, TIDAK_DIKETAHUI: 0 };
  locations.forEach(function (l) {
    tipeCounts[l.tipeClient || "TIDAK_DIKETAHUI"] += 1;
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: ss.getName(),
    asOfDate: Utilities.formatDate(asOfDate, Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd"),
    currentMonth: currentCode,
    months: monthsOut,
    totalLokasiAktif: locations.length,
    totalLokasiDikecualikan: excluded.length,
    tipeCounts: tipeCounts,
    picCoveragePct: picCoveragePct,
    locations: locations,
    excludedLocations: excluded,
    heatmap: heatmap,
    leaderboard: leaderboard,
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
    .setTitle("Dashboard Monitoring Laporan & Absensi")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Untuk dipanggil manual dari editor kalau mau cek dataset di Logger tanpa buka web app. */
function debugDataset() {
  Logger.log(JSON.stringify(buildDataset(), null, 2));
}

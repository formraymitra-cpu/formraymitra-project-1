/**
 * Dashboard Monitoring Pekerjaan Harian — Dini Saffanah. Versi live Apps Script.
 *
 * Port dari scripts/build-data.py. Baca langsung dari spreadsheet yang aktif
 * (script ini harus dibuat lewat Extensions > Apps Script DARI DALAM
 * spreadsheet "JURNAL HARIAN DINI SAFFANAH 2026", supaya
 * getActiveSpreadsheet() menunjuk ke sheet yang benar) dan menghitung ulang
 * dataset setiap kali dashboard dibuka — jadi menambah bulan baru (sheet baru
 * MARET, APRIL, ... dst) otomatis muncul tanpa perlu ubah script ini.
 *
 * Setiap sheet bulan harus mengikuti format hasil merge.py:
 *   baris 1  : judul (merged)
 *   baris 3  : header TANGGAL | HARI | JAM MASUK | JAM PULANG | NO |
 *              DAILY WORK PLAN | CEKLIST | TIME SCHEDULE | KETERANGAN
 *   baris 4+ : data, berhenti di baris pertama yang TANGGAL-nya kosong
 * Sheet dengan nama "<BULAN> FOTO" (galeri screenshot) dilewati saat
 * membaca tugas, tapi dipindai terpisah untuk menghitung JUMLAH FOTO per
 * tanggal langsung dari teks header galerinya (lihat buildFotoCountMap) —
 * jadi kolom "JUMLAH FOTO" di sheet data harian TIDAK dipakai lagi, tambah
 * foto baru ke sheet galeri otomatis kehitung tanpa isi apa pun secara
 * manual di sheet data.
 */

var MONTH_LABEL_ID = {
  1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
  7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember",
};

var MONTH_NAMES_UPPER = {};
var MONTH_NUM_UPPER = {};
Object.keys(MONTH_LABEL_ID).forEach(function (k) {
  MONTH_NAMES_UPPER[MONTH_LABEL_ID[k].toUpperCase()] = true;
  MONTH_NUM_UPPER[MONTH_LABEL_ID[k].toUpperCase()] = parseInt(k, 10);
});

var PLACEHOLDER_TASK = "(TIDAK ADA DATA)";

/**
 * ID spreadsheet "MONITORING INVOICE DINI" (submenu Invoice di dashboard).
 * Buka spreadsheet invoice-nya di Google Sheets, copy ID dari URL-nya
 * (bagian antara /d/ dan /edit), lalu isi di sini. Kalau dikosongkan,
 * submenu Invoice tetap muncul tapi menampilkan pesan "belum terhubung".
 */
var INVOICE_SPREADSHEET_ID = "";

function parseHHMM(s) {
  if (!s || typeof s !== "string" || s.indexOf(":") === -1) return null;
  var parts = s.split(":");
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

function isoDate(v) {
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd");
  }
  return null;
}

function cleanStr(v) {
  if (v === null || v === undefined || v === "") return null;
  var s = String(v).trim();
  return s ? s : null;
}

/**
 * Pindai semua sheet galeri "<BULAN> FOTO" dan hitung jumlah foto per tanggal
 * langsung dari teks header-nya ("DD/MM/YYYY (Hari) - N foto" di kolom A).
 * Dipakai sebagai sumber JUMLAH FOTO yang selalu sinkron dengan isi galeri —
 * TIDAK mengandalkan kolom "JUMLAH FOTO" di sheet data harian, supaya kalau
 * kamu tambah/hapus foto di sheet galeri, dashboard otomatis ikut berubah
 * tanpa perlu mengisi ulang kolom itu secara manual.
 */
function buildFotoCountMap(ss) {
  var map = {};
  ss.getSheets().forEach(function (sheet) {
    var name = sheet.getName().trim().toUpperCase();
    if (name.slice(-5) !== " FOTO") return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 1) return;
    var colA = sheet.getRange(1, 1, lastRow, 1).getValues();
    colA.forEach(function (row) {
      var v = row[0];
      if (typeof v !== "string") return;
      var m = v.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\b.*?(\d+)\s*foto/i);
      if (m) map[m[1]] = parseInt(m[2], 10);
    });
  });
  return map;
}

function fotoCountUntuk(fotoCountMap, tglIso) {
  var d = new Date(tglIso + "T00:00:00");
  var key = Utilities.formatDate(d, Session.getScriptTimeZone() || "Asia/Jakarta", "dd/MM/yyyy");
  return fotoCountMap[key] || 0;
}

/** Baca satu sheet bulan (header di baris 3, data mulai baris 4). */
function parseMonthSheet(sheet, fotoCountMap) {
  var tasks = [];
  var r = 4;
  var lastRow = sheet.getLastRow();
  while (r <= lastRow + 1) {
    var row = sheet.getRange(r, 1, 1, 9).getValues()[0];
    var tgl = row[0];
    var tglIso = isoDate(tgl);
    if (!tglIso) break;
    tasks.push({
      tanggal: tglIso,
      hari: cleanStr(row[1]),
      jamMasuk: cleanStr(row[2]),
      jamPulang: cleanStr(row[3]),
      no: row[4] === "" ? null : row[4],
      tugas: cleanStr(row[5]),
      selesai: row[6] === true,
      jadwal: cleanStr(row[7]),
      keterangan: cleanStr(row[8]),
      jumlahFoto: fotoCountUntuk(fotoCountMap, tglIso),
    });
    r += 1;
  }
  return tasks;
}

function buildDays(allTasks) {
  var byDate = {};
  var order = [];
  allTasks.forEach(function (t) {
    if (!byDate[t.tanggal]) {
      byDate[t.tanggal] = [];
      order.push(t.tanggal);
    }
    byDate[t.tanggal].push(t);
  });

  var days = order.map(function (tgl) {
    var items = byDate[tgl];
    var realItems = items.filter(function (t) {
      return t.tugas && t.tugas.toUpperCase() !== PLACEHOLDER_TASK;
    });
    var total = realItems.length;
    var selesai = realItems.filter(function (t) {
      return t.selesai;
    }).length;
    var jamMasukH = parseHHMM(items[0].jamMasuk);
    var jamPulangH = parseHHMM(items[0].jamPulang);
    var durasi = null;
    if (jamMasukH !== null && jamPulangH !== null && jamPulangH >= jamMasukH) {
      durasi = Math.round((jamPulangH - jamMasukH) * 100) / 100;
    }
    return {
      tanggal: tgl,
      hari: items[0].hari,
      jamMasuk: items[0].jamMasuk,
      jamPulang: items[0].jamPulang,
      jamKerjaJam: durasi,
      totalTugas: total,
      selesai: selesai,
      pctSelesai: total ? Math.round((selesai / total) * 10000) / 10000 : null,
      jumlahFoto: items[0].jumlahFoto || 0,
    };
  });

  days.sort(function (a, b) {
    return a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : 0;
  });
  return days;
}

function buildMonths(days) {
  var byMonth = {};
  var order = [];
  days.forEach(function (d) {
    var code = d.tanggal.slice(0, 7);
    if (!byMonth[code]) {
      byMonth[code] = [];
      order.push(code);
    }
    byMonth[code].push(d);
  });
  order.sort();

  return order.map(function (code) {
    var items = byMonth[code];
    var monthNum = parseInt(code.slice(5, 7), 10);
    var year = code.slice(0, 4);
    var totalTugas = items.reduce(function (s, d) { return s + d.totalTugas; }, 0);
    var selesai = items.reduce(function (s, d) { return s + d.selesai; }, 0);
    var jamList = items.map(function (d) { return d.jamKerjaJam; }).filter(function (v) { return v !== null; });
    var totalFoto = items.reduce(function (s, d) { return s + d.jumlahFoto; }, 0);
    return {
      code: code,
      label: MONTH_LABEL_ID[monthNum] + " " + year,
      hariTercatat: items.length,
      totalTugas: totalTugas,
      selesai: selesai,
      pctSelesai: totalTugas ? Math.round((selesai / totalTugas) * 10000) / 10000 : null,
      rataJamKerja: jamList.length ? Math.round((jamList.reduce(function (s, v) { return s + v; }, 0) / jamList.length) * 100) / 100 : null,
      totalFoto: totalFoto,
    };
  });
}

/**
 * Baca sheet "MONITORING TAGIHAN" dari spreadsheet invoice: satu lokasi bisa
 * punya beberapa baris tagihan bulanan (baris pertama berisi NO/LOKASI/NO SP,
 * baris lanjutan cuma BULAN TAGIHAN dst). Baris teks bernomor ("1. ...") di
 * bagian bawah sheet ditangkap sebagai catatan terpisah.
 */
function parseTagihanSheet(sheet) {
  var tagihan = [];
  var notes = [];
  if (!sheet) return { tagihan: tagihan, notes: notes };

  var lastRow = sheet.getLastRow();
  var current = null;
  var blankStreak = 0;
  for (var r = 5; r <= lastRow; r++) {
    var row = sheet.getRange(r, 1, 1, 9).getValues()[0];
    var no = row[0], lokasi = row[1], noSp = row[2], tglSp = row[3];
    var termin = row[4], bulan = row[5], nominal = row[6], ket = row[7], status = row[8];

    var isNote = typeof noSp === "string" && /^\d+\./.test(noSp) && !lokasi && !bulan;
    if (isNote) {
      notes.push(noSp);
      blankStreak = 0;
      continue;
    }

    var isBlank = !no && !lokasi && !noSp && !bulan && !nominal;
    if (isBlank) {
      blankStreak += 1;
      if (blankStreak > 30) break;
      continue;
    }
    blankStreak = 0;

    if (lokasi) {
      current = {
        no: no || null,
        lokasi: cleanStr(lokasi),
        noSp: cleanStr(noSp),
        tanggalSp: isoDate(tglSp),
        jumlahTermin: termin || null,
        perBulan: [],
      };
      tagihan.push(current);
      if (bulan) current.perBulan.push(tagihanBulanEntry(bulan, nominal, ket, status));
    } else if (bulan && current) {
      current.perBulan.push(tagihanBulanEntry(bulan, nominal, ket, status));
    }
  }

  tagihan.forEach(function (t) {
    var total = 0, selesai = 0;
    t.perBulan.forEach(function (b) {
      if (b.nominal) total += b.nominal;
      if (b.status && b.status.toUpperCase() === "SELESAI") selesai += 1;
    });
    t.totalNominal = total;
    t.totalBulan = t.perBulan.length;
    t.selesai = selesai;
    t.status = t.totalBulan === 0 ? "belum" : selesai === t.totalBulan ? "selesai" : selesai > 0 ? "proses" : "belum";
  });

  return { tagihan: tagihan, notes: notes };
}

function tagihanBulanEntry(bulan, nominal, ket, status) {
  return { bulan: cleanStr(bulan), nominal: nominal || null, keterangan: cleanStr(ket), status: cleanStr(status) };
}

/**
 * Baca satu sheet bulan kelengkapan dokumen invoice (mis. "JULI 2026"):
 * header di baris 4 (kolom D..R = 15 jenis dokumen), data lokasi mulai
 * baris 5 sampai baris pertama yang LOKASI-nya kosong.
 */
function parseDokumenSheet(sheet, code, label) {
  var header = sheet.getRange(4, 1, 1, 19).getValues()[0];
  var jenisDokumen = header.slice(3, 18).filter(function (h) { return h; });

  var lokasiList = [];
  var lastRow = sheet.getLastRow();
  for (var r = 5; r <= lastRow; r++) {
    var row = sheet.getRange(r, 1, 1, 19).getValues()[0];
    var lokasi = row[1];
    if (!lokasi) break;
    var dokumen = {};
    var lengkap = 0;
    for (var i = 0; i < jenisDokumen.length; i++) {
      var val = row[3 + i] === true;
      dokumen[jenisDokumen[i]] = val;
      if (val) lengkap += 1;
    }
    lokasiList.push({
      lokasi: cleanStr(lokasi),
      dokumen: dokumen,
      tanggalKirim: isoDate(row[18]),
      totalDokumen: jenisDokumen.length,
      dokumenLengkap: lengkap,
      pctLengkap: jenisDokumen.length ? Math.round((lengkap / jenisDokumen.length) * 10000) / 10000 : null,
    });
  }

  var pctList = lokasiList.map(function (l) { return l.pctLengkap; }).filter(function (v) { return v !== null; });
  return {
    code: code,
    label: label,
    jenisDokumen: jenisDokumen,
    lokasi: lokasiList,
    pctRataRata: pctList.length ? Math.round((pctList.reduce(function (s, v) { return s + v; }, 0) / pctList.length) * 10000) / 10000 : null,
  };
}

function emptyInvoiceDataset() {
  return {
    generatedAt: new Date().toISOString(),
    sourceFile: null,
    tersedia: false,
    tagihan: [],
    totalLokasiTagihan: 0,
    totalNominalKeseluruhan: 0,
    totalNominalBelumSelesai: 0,
    dokumenBulanan: [],
    catatan: [],
  };
}

/**
 * Bangun dataset submenu Invoice dari spreadsheet TERPISAH "MONITORING
 * INVOICE DINI" (diidentifikasi lewat INVOICE_SPREADSHEET_ID di atas —
 * bukan spreadsheet jurnal harian yang menjadi rumah script ini).
 */
function buildInvoiceDataset() {
  if (!INVOICE_SPREADSHEET_ID) return emptyInvoiceDataset();

  var ss;
  try {
    ss = SpreadsheetApp.openById(INVOICE_SPREADSHEET_ID);
  } catch (e) {
    return emptyInvoiceDataset();
  }

  var tagihanResult = parseTagihanSheet(ss.getSheetByName("MONITORING TAGIHAN"));

  var dokumenBulanan = [];
  ss.getSheets().forEach(function (sheet) {
    var m = sheet.getName().trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (!m) return;
    var monthNum = MONTH_NUM_UPPER[m[1].toUpperCase()];
    if (!monthNum) return;
    var mm = monthNum < 10 ? "0" + monthNum : String(monthNum);
    dokumenBulanan.push(parseDokumenSheet(sheet, m[2] + "-" + mm, MONTH_LABEL_ID[monthNum] + " " + m[2]));
  });
  dokumenBulanan.sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });

  var totalNominal = 0;
  var totalBelum = 0;
  tagihanResult.tagihan.forEach(function (t) {
    totalNominal += t.totalNominal;
    t.perBulan.forEach(function (b) {
      if (b.nominal && (!b.status || b.status.toUpperCase() !== "SELESAI")) totalBelum += b.nominal;
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: ss.getName(),
    tersedia: true,
    tagihan: tagihanResult.tagihan,
    totalLokasiTagihan: tagihanResult.tagihan.length,
    totalNominalKeseluruhan: totalNominal,
    totalNominalBelumSelesai: totalBelum,
    dokumenBulanan: dokumenBulanan,
    catatan: tagihanResult.notes,
  };
}

/** Bangun dataset lengkap dari semua sheet bulan yang ada di spreadsheet aktif. */
function buildDataset() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var fotoCountMap = buildFotoCountMap(ss);

  var allTasks = [];
  sheets.forEach(function (sheet) {
    var name = sheet.getName().trim().toUpperCase();
    if (name.slice(-5) === " FOTO") return;
    if (!MONTH_NAMES_UPPER[name]) return;
    allTasks = allTasks.concat(parseMonthSheet(sheet, fotoCountMap));
  });

  var realTasks = allTasks.filter(function (t) {
    return t.tugas && t.tugas.toUpperCase() !== PLACEHOLDER_TASK;
  });
  var days = buildDays(allTasks);
  var months = buildMonths(days);

  var totalTugas = realTasks.length;
  var totalSelesai = realTasks.filter(function (t) { return t.selesai; }).length;
  var jamList = days.map(function (d) { return d.jamKerjaJam; }).filter(function (v) { return v !== null; });
  var totalFoto = days.reduce(function (s, d) { return s + d.jumlahFoto; }, 0);
  var tanggalList = days.map(function (d) { return d.tanggal; });

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: ss.getName(),
    months: months,
    days: days,
    tasks: realTasks,
    totalHariTercatat: days.length,
    totalTugas: totalTugas,
    totalSelesai: totalSelesai,
    pctSelesaiKeseluruhan: totalTugas ? Math.round((totalSelesai / totalTugas) * 10000) / 10000 : null,
    totalFoto: totalFoto,
    rataJamKerjaKeseluruhan: jamList.length ? Math.round((jamList.reduce(function (s, v) { return s + v; }, 0) / jamList.length) * 100) / 100 : null,
    rentangTanggal: {
      mulai: tanggalList.length ? tanggalList[0] : null,
      akhir: tanggalList.length ? tanggalList[tanggalList.length - 1] : null,
    },
    invoice: buildInvoiceDataset(),
  };
}

/**
 * Cari baris tanggal di sheet galeri "<BULAN> FOTO" dan kembalikan URL
 * spreadsheet yang langsung meloncat ke baris itu. Dipanggil on-demand dari
 * frontend (google.script.run) saat user klik satu baris di halaman
 * Dokumentasi, lalu dibuka di tab baru.
 *
 * Catatan: Apps Script (SpreadsheetApp) tidak punya API untuk mengambil isi
 * mentah (bytes) gambar yang ditempel mengambang di sheet ("over the grid
 * image") — OverGridImage tidak punya getBlob(). Makanya di sini kita hanya
 * cari lokasinya lalu antar user ke sana, bukan menampilkan gambarnya inline
 * di dashboard.
 *
 * Mengandalkan format sheet galeri hasil merge.py: header per tanggal berbunyi
 * persis "DD/MM/YYYY (Hari) - N foto" di kolom A.
 */
function getFotoLinkUntukTanggal(tanggalIso) {
  var d = new Date(tanggalIso + "T00:00:00");
  var monthLabel = MONTH_LABEL_ID[d.getMonth() + 1].toUpperCase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(monthLabel + " FOTO");
  if (!sheet) return null;

  var tanggalStr = Utilities.formatDate(d, Session.getScriptTimeZone() || "Asia/Jakarta", "dd/MM/yyyy");
  var lastRow = sheet.getLastRow();
  var colA = sheet.getRange(1, 1, lastRow, 1).getValues();
  var headerRow = -1;
  for (var r = 0; r < colA.length; r++) {
    var v = colA[r][0];
    if (typeof v === "string" && v.indexOf(tanggalStr) === 0) {
      headerRow = r + 1; // getRange di atas 1-indexed, r+1 = nomor baris asli
      break;
    }
  }
  if (headerRow === -1) return null;

  return ss.getUrl() + "#gid=" + sheet.getSheetId() + "&range=A" + headerRow;
}

/**
 * Menu kustom "Buka Dashboard" di spreadsheet. Jalan otomatis tiap kali
 * spreadsheet dibuka (simple trigger bawaan Apps Script).
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📊 Dashboard")
    .addItem("Buka Dashboard", "bukaDashboard")
    .addToUi();
}

/**
 * Ambil URL Web App yang sedang di-deploy, lalu buka di tab baru lewat
 * dialog kecil. ScriptApp.getService().getUrl() otomatis mengikuti URL
 * deployment aktif — tidak perlu di-hardcode atau diupdate manual tiap
 * kali deploy ulang.
 */
function bukaDashboard() {
  var url = ScriptApp.getService().getUrl();
  var ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert(
      "Dashboard belum di-deploy",
      "Deploy dulu lewat menu Deploy > New deployment > Web app di editor Apps Script, baru menu ini bisa dipakai.",
      ui.ButtonSet.OK
    );
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;text-align:center;padding:22px 16px;">' +
      '<p style="margin:0 0 16px;font-size:13px;color:#444;">Kalau tab baru tidak otomatis terbuka, klik tombol ini:</p>' +
      '<a href="' + url + '" target="_blank" ' +
      'style="display:inline-block;padding:11px 22px;background:#4f46e5;color:#fff;' +
      'text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px;">' +
      "📊 Buka Dashboard</a>" +
      "</div>" +
      "<script>window.open(" + JSON.stringify(url) + ', "_blank");</script>'
  )
    .setWidth(360)
    .setHeight(140);
  ui.showModalDialog(html, "Dashboard Monitoring Pekerjaan Harian");
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
    .setTitle("Dashboard Monitoring Pekerjaan Harian Dini Saffanah")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Untuk dipanggil manual dari editor kalau mau cek dataset di Logger tanpa buka web app. */
function debugDataset() {
  Logger.log(JSON.stringify(buildDataset(), null, 2));
}

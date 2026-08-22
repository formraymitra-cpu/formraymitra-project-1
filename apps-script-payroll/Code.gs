/**
 * Dashboard Rekonsiliasi Payroll — Apps Script STANDALONE (bukan bound ke
 * spreadsheet manapun). Sengaja dibuat terpisah supaya tidak bentrok dengan
 * script yang sudah berjalan di dalam spreadsheet REKAP GAJI SEMUA LOKASI
 * maupun REKONSILIASI REKAP GAJI DAN MUTASI (script ini hanya MEMBACA kedua
 * spreadsheet itu lewat SpreadsheetApp.openById(), tidak pernah menulis).
 *
 * Cara deploy: lihat README.md di folder ini.
 */

var CONFIG = {
  // ID spreadsheet "REKAP GAJI SEMUA LOKASI" — ini tetap sama tiap bulan
  // (sheet per-bulan ada di dalam satu file yang sama).
  REKAP_GAJI_ID: "1li_rexYui0rwmWLAq791X6zv9ObSaTTwe8iDtHyF4cM",

  // ID salah satu spreadsheet "REKONSILIASI REKAP GAJI DAN MUTASI" yang
  // PERNAH ada (contoh: punya bulan Agustus 2026). Dipakai HANYA sebagai
  // titik awal untuk menemukan folder Drive tempat file-file bulanan itu
  // disimpan — dicari sekali lalu di-cache. Tiap bulan file barunya dicari
  // otomatis di folder yang sama, tidak perlu update ID ini lagi.
  REKONSILIASI_SEED_ID: "1OzwuAfKeBC9zzReebiGnBpZFPg03wdyvWkr3haNiPrc",

  // (Opsional) ID spreadsheet sumber dashboard "Monitoring Laporan &
  // Absensi" (CEKLIS LAPORAN BULANAN). Isi supaya web app ini SEKALIGUS
  // menyajikan data absensi live. Kosongkan untuk skip — halaman Absensi di
  // dashboard tetap tampil tapi pakai data terakhir yang di-build (statis).
  ABSENSI_SHEET_ID: "",
};

var TOLERANSI_RUPIAH = 5;

var MONTH_ID = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
];

// ---------- helper umum ----------

function cleanStr_(v) {
  if (v === null || v === undefined) return null;
  var s = String(v).trim();
  return s ? s : null;
}

function num_(v) {
  if (v === null || v === undefined || v === "") return null;
  var f = Number(v);
  return isNaN(f) ? null : f;
}

function isoDate_(v) {
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd");
  }
  return null;
}

function round2_(v) {
  return Math.round(v * 100) / 100;
}

function normLokasi_(name) {
  if (!name) return "";
  var s = String(name).toUpperCase().split(".").join("");
  s = s.replace(/\bPENGECEKAN\b/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// ---------- menemukan file REKONSILIASI bulan berjalan ----------

/**
 * Cari file REKONSILIASI REKAP GAJI DAN MUTASI untuk bulan+tahun tertentu di
 * folder Drive yang sama dengan REKONSILIASI_SEED_ID, cocokkan nama file yang
 * mengandung nama bulan (Indonesia) dan tahun tsb. Kalau tidak ketemu, pakai
 * seed sebagai fallback (supaya dashboard tetap tampil, walau mungkin data
 * bulan sebelumnya) dan tandai peringatan lewat field `resolvedBy`.
 */
function resolveRekonsiliasiId_(bulan, tahun) {
  var result = { id: CONFIG.REKONSILIASI_SEED_ID, resolvedBy: "seed (fallback)" };
  try {
    var seedFile = DriveApp.getFileById(CONFIG.REKONSILIASI_SEED_ID);
    var parents = seedFile.getParents();
    if (!parents.hasNext()) return result;
    var folder = parents.next();
    var needleBulan = (bulan || "").toUpperCase();
    var needleTahun = tahun || "";
    var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName().toUpperCase();
      if (needleBulan && name.indexOf(needleBulan) !== -1 && (!needleTahun || name.indexOf(needleTahun) !== -1)) {
        return { id: f.getId(), resolvedBy: "folder-search: " + f.getName() };
      }
    }
  } catch (err) {
    result.resolvedBy = "seed (folder search gagal: " + err.message + ")";
  }
  return result;
}

// ---------- parsing REKONSILIASI ----------

function parsePeriode_(ss) {
  var sheet = ss.getSheetByName("PERIODE_GAJI");
  if (!sheet) return { nama: null, mulai: null, selesai: null, bulan: null, tahun: null };
  var rows = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 5).getValues();
  var aktif = null;
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (cleanStr_(rows[i][4]) === "AKTIF") { aktif = rows[i]; break; }
    aktif = rows[i]; // fallback: baris terakhir yang ada
  }
  if (!aktif) return { nama: null, mulai: null, selesai: null, bulan: null, tahun: null };
  var nama = cleanStr_(aktif[1]) || "";
  var parts = nama.split(/\s+/);
  var bulan = null, tahun = null;
  for (var j = 0; j < parts.length; j++) {
    if (MONTH_ID.indexOf(parts[j]) !== -1) bulan = parts[j];
    if (/^\d{4}$/.test(parts[j])) tahun = parts[j];
  }
  return { nama: nama, mulai: isoDate_(aktif[2]), selesai: isoDate_(aktif[3]), bulan: bulan, tahun: tahun };
}

function parseSumberMutasi_(ss) {
  var sheet = ss.getSheetByName("SUMBER_MUTASI");
  var out = [];
  if (!sheet) return out;
  var rows = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 7).getValues();
  rows.forEach(function (r) {
    if (!r[0]) return;
    out.push({
      pic: cleanStr_(r[1]) || "",
      namaFile: cleanStr_(r[2]) || "",
      tanggalImport: isoDate_(r[4]),
      status: cleanStr_(r[6]) || "",
    });
  });
  return out;
}

function parseHasilPengecekan_(ss) {
  var sheet = ss.getSheetByName("HASIL_PENGECEKAN");
  var byLokasi = {};
  if (!sheet) return byLokasi;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return byLokasi;
  var rows = sheet.getRange(2, 1, lastRow - 1, 21).getValues();
  rows.forEach(function (r) {
    if (!r[0]) return;
    var lokasiRaw = cleanStr_(r[2]);
    if (!lokasiRaw) return;
    var acuan = cleanStr_(r[17]);
    var jumlahRef = acuan ? (acuan.split("↔").length) : 0;
    var member = {
      namaRekap: cleanStr_(r[3]) || "",
      namaMutasi: cleanStr_(r[4]),
      nominalRekap: num_(r[5]),
      nominalMutasi: num_(r[6]),
      selisih: num_(r[7]),
      bank: cleanStr_(r[8]),
      tanggalMutasi: isoDate_(r[9]),
      statusAkhir: cleanStr_(r[16]),
      transferGanda: jumlahRef >= 2,
      jumlahRefGanda: jumlahRef,
    };
    if (!byLokasi[lokasiRaw]) byLokasi[lokasiRaw] = [];
    byLokasi[lokasiRaw].push(member);
  });
  return byLokasi;
}

// ---------- parsing REKAP GAJI SEMUA LOKASI ----------

function parseRekapLokasi_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  var rows = [];
  if (!sheet) return rows;
  var lastRow = sheet.getLastRow();
  if (lastRow < 5) return rows;
  var values = sheet.getRange(5, 1, lastRow - 4, 18).getValues();
  values.forEach(function (r) {
    var nama = cleanStr_(r[1]);
    if (!nama) return;
    rows.push({
      nama: nama,
      pic: cleanStr_(r[3]),
      namaRekapGaji: cleanStr_(r[4]),
      linkGajiPic: cleanStr_(r[5]),
      bank: cleanStr_(r[9]),
      rab: num_(r[10]),
      gaji: num_(r[11]),
      diterimaKaryawan: num_(r[12]),
      bpjsKes: num_(r[13]),
      bpjsTk: num_(r[14]),
      payroll: num_(r[15]),
      statusKomponen: cleanStr_(r[17]),
    });
  });
  return rows;
}

function parseManualMapping_(wb) {
  var out = {};
  var sheet = wb.getSheetByName("MAPPING_LOKASI");
  if (!sheet) return out;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return out;
  var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  rows.forEach(function (r) {
    var a = cleanStr_(r[0]), b = cleanStr_(r[1]);
    if (a && b) out[a] = b;
  });
  return out;
}

function monthlyTotals_(wb) {
  var out = [];
  var sheets = wb.getSheets();
  sheets.forEach(function (s) {
    var name = s.getName().toUpperCase();
    if (MONTH_ID.indexOf(name) === -1) return;
    var rows = parseRekapLokasi_(wb, s.getName());
    var agg = {
      code: s.getName(), label: s.getName().substring(0, 1) + s.getName().substring(1).toLowerCase(),
      totalRab: 0, totalGaji: 0, totalDiterimaKaryawan: 0, totalBpjsKes: 0, totalBpjsTk: 0, totalPayroll: 0,
      lokasiTerisi: 0, totalLokasi: rows.length,
    };
    rows.forEach(function (r) {
      agg.totalRab += r.rab || 0;
      agg.totalGaji += r.gaji || 0;
      agg.totalDiterimaKaryawan += r.diterimaKaryawan || 0;
      agg.totalBpjsKes += r.bpjsKes || 0;
      agg.totalBpjsTk += r.bpjsTk || 0;
      agg.totalPayroll += r.payroll || 0;
      if (r.gaji !== null) agg.lokasiTerisi += 1;
    });
    out.push(agg);
  });
  out.sort(function (a, b) { return MONTH_ID.indexOf(a.code.toUpperCase()) - MONTH_ID.indexOf(b.code.toUpperCase()); });
  return out;
}

// ---------- matching lokasi (sama persis dengan scripts/build-payroll-data.py) ----------

function matchLokasi_(rekapNama, hasilByLokasi, hasilNormIndex, manualMap) {
  if (manualMap[rekapNama] && hasilByLokasi[manualMap[rekapNama]]) {
    return { raw: manualMap[rekapNama], confidence: "manual", kandidat: [] };
  }
  var key = normLokasi_(rekapNama);
  var exact = hasilNormIndex[key];
  if (exact && exact.length === 1) return { raw: exact[0], confidence: "auto", kandidat: [] };

  var candidates = [];
  for (var raw in hasilByLokasi) {
    var nk = normLokasi_(raw);
    if (!nk || !key) continue;
    if (key.indexOf(nk) !== -1 || nk.indexOf(key) !== -1) candidates.push(raw);
  }
  if (candidates.length === 1) return { raw: candidates[0], confidence: "auto", kandidat: [] };
  if (candidates.length > 1) return { raw: null, confidence: "ambigu", kandidat: candidates.sort() };
  return { raw: null, confidence: "belum-ada", kandidat: [] };
}

function buildLocations_(rekapRows, hasilByLokasi, manualMap) {
  var hasilNormIndex = {};
  for (var raw in hasilByLokasi) {
    var nk = normLokasi_(raw);
    if (!hasilNormIndex[nk]) hasilNormIndex[nk] = [];
    hasilNormIndex[nk].push(raw);
  }

  var rawMatches = rekapRows.map(function (row) {
    return { row: row, match: matchLokasi_(row.nama, hasilByLokasi, hasilNormIndex, manualMap) };
  });

  // Satu lokasi rekonsiliasi yang ke-klaim >1 baris REKAP (di luar mapping
  // manual) berarti tidak unik -> turunkan ke "ambigu" supaya tidak dobel-
  // hitung data karyawannya di lebih dari satu lokasi.
  var owners = {};
  rawMatches.forEach(function (rm) {
    if (rm.match.raw && rm.match.confidence !== "manual") {
      if (!owners[rm.match.raw]) owners[rm.match.raw] = [];
      owners[rm.match.raw].push(rm.row.nama);
    }
  });

  return rawMatches.map(function (rm) {
    var row = rm.row, match = rm.match;
    if (match.raw && owners[match.raw] && owners[match.raw].length > 1 && match.confidence !== "manual") {
      var pesaing = owners[match.raw].filter(function (n) { return n !== row.nama; }).sort();
      match = { raw: null, confidence: "ambigu", kandidat: [match.raw + " (juga diklaim oleh: " + pesaing.join(", ") + ")"] };
    }

    var anggota = (match.raw && hasilByLokasi[match.raw]) || [];
    var jumlahAnggota = anggota.length;
    var jumlahSudah = anggota.filter(function (a) { return a.nominalMutasi !== null; }).length;
    var nominalSeharusnya = anggota.reduce(function (s, a) { return s + (a.nominalRekap || 0); }, 0);
    var nominalTertransfer = anggota.reduce(function (s, a) { return s + (a.nominalMutasi || 0); }, 0);
    var komponen = (row.diterimaKaryawan || 0) + (row.bpjsKes || 0) + (row.bpjsTk || 0) + (row.payroll || 0);

    var statusRole1, selisihRole1;
    if (jumlahAnggota === 0) {
      statusRole1 = "tanpa-data"; selisihRole1 = null;
    } else if (jumlahSudah < jumlahAnggota) {
      statusRole1 = "proses"; selisihRole1 = round2_(komponen - nominalTertransfer);
    } else {
      selisihRole1 = round2_(komponen - nominalTertransfer);
      statusRole1 = Math.abs(selisihRole1) <= TOLERANSI_RUPIAH ? "sesuai" : "selisih";
    }

    var statusRole2, selisihRole2;
    if (row.rab === null || row.gaji === null) {
      statusRole2 = "rab-kosong"; selisihRole2 = null;
    } else {
      selisihRole2 = round2_(row.gaji - row.rab);
      statusRole2 = Math.abs(selisihRole2) <= TOLERANSI_RUPIAH ? "sesuai" : "selisih";
    }

    return {
      nama: row.nama, pic: row.pic, namaRekapGaji: row.namaRekapGaji, linkGajiPic: row.linkGajiPic,
      bank: row.bank, rab: row.rab, gaji: row.gaji, diterimaKaryawan: row.diterimaKaryawan,
      bpjsKes: row.bpjsKes, bpjsTk: row.bpjsTk, payroll: row.payroll, statusKomponen: row.statusKomponen,
      lokasiRekonsiliasi: match.raw, matchConfidence: match.confidence, kandidatAmbigu: match.kandidat,
      jumlahAnggota: jumlahAnggota, jumlahSudahTertransfer: jumlahSudah,
      nominalSeharusnya: round2_(nominalSeharusnya), nominalTertransfer: round2_(nominalTertransfer),
      statusRole1: statusRole1, selisihRole1: selisihRole1, statusRole2: statusRole2, selisihRole2: selisihRole2,
      anggota: anggota,
    };
  });
}

function buildNotices_(locations) {
  var notices = [];
  var nid = 0;
  function add(kategori, severity, lokasi, nama, nominal, ket) {
    nid += 1;
    notices.push({ id: "N" + ("0000" + nid).slice(-4), kategori: kategori, severity: severity, lokasi: lokasi, namaKaryawan: nama, nominalDampak: nominal, keterangan: ket });
  }
  var fmt = function (n) { return "Rp " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); };

  locations.forEach(function (loc) {
    loc.anggota.forEach(function (m) {
      if (m.transferGanda) {
        add("double-transfer", "tinggi", loc.nama, m.namaRekap, m.nominalMutasi,
          m.jumlahRefGanda + " baris mutasi bank cocok dengan nama ini — cek kemungkinan transfer ganda.");
      }
      if (m.nominalMutasi !== null && m.selisih !== null && Math.abs(m.selisih) > TOLERANSI_RUPIAH) {
        if (m.selisih > 0) {
          add("transfer-kurang", "tinggi", loc.nama, m.namaRekap, m.selisih,
            "Nominal rekap " + fmt(m.nominalRekap) + " vs mutasi " + fmt(m.nominalMutasi) + " — transfer kurang " + fmt(m.selisih) + ".");
        } else {
          add("transfer-lebih", "tinggi", loc.nama, m.namaRekap, Math.abs(m.selisih),
            "Nominal rekap " + fmt(m.nominalRekap) + " vs mutasi " + fmt(m.nominalMutasi) + " — transfer lebih " + fmt(Math.abs(m.selisih)) + ".");
        }
      }
      if (m.statusAkhir && m.statusAkhir.indexOf("PERLU CEK") !== -1) {
        add("nama-lokasi-perlu-cek", "sedang", loc.nama, m.namaRekap, m.nominalRekap, "Status pencocokan: " + m.statusAkhir + ".");
      }
    });

    if (loc.jumlahAnggota > 0 && loc.jumlahSudahTertransfer < loc.jumlahAnggota) {
      var belum = loc.jumlahAnggota - loc.jumlahSudahTertransfer;
      add("belum-transfer", "sedang", loc.nama, null, null,
        belum + " dari " + loc.jumlahAnggota + " karyawan belum ditemukan padanan mutasinya (belum tertransfer / belum ter-import).");
    }
    if (loc.matchConfidence === "belum-ada" && loc.diterimaKaryawan) {
      add("lokasi-tidak-ketemu", "sedang", loc.nama, null, null,
        "Lokasi ini belum ditemukan di data rekonsiliasi (HASIL_PENGECEKAN) — rekonsiliasi mungkin belum dimulai, atau nama lokasi berbeda antar spreadsheet.");
    }
    if (loc.statusRole2 === "selisih") {
      add("gaji-vs-rab", "sedang", loc.nama, null, Math.abs(loc.selisihRole2),
        "GAJI (" + fmt(loc.gaji) + ") tidak sama dengan RAB (" + fmt(loc.rab) + ") — cek apakah karena perubahan jumlah anggota (resign/belum ada pengganti) atau kesalahan input.");
    }
  });

  var order = { tinggi: 0, sedang: 1 };
  notices.sort(function (a, b) { return order[a.severity] - order[b.severity] || (a.kategori < b.kategori ? -1 : 1); });
  return notices;
}

function buildKpi_(locations, hasilByLokasi) {
  var totalGajiTertransfer = 0;
  for (var lok in hasilByLokasi) {
    hasilByLokasi[lok].forEach(function (m) { totalGajiTertransfer += m.nominalMutasi || 0; });
  }
  var totalRab = 0, totalGaji = 0, totalDiterima = 0, totalBpjsKes = 0, totalBpjsTk = 0, totalPayroll = 0, rabTerisi = 0;
  var kewajibanRekon = 0, kewajibanBelum = 0, selisihRole2Total = 0;
  locations.forEach(function (l) {
    totalRab += l.rab || 0;
    totalGaji += l.gaji || 0;
    totalDiterima += l.diterimaKaryawan || 0;
    totalBpjsKes += l.bpjsKes || 0;
    totalBpjsTk += l.bpjsTk || 0;
    totalPayroll += l.payroll || 0;
    if (l.rab !== null) { rabTerisi += 1; selisihRole2Total += (l.gaji || 0) - l.rab; }
    var komponen = (l.diterimaKaryawan || 0) + (l.bpjsKes || 0) + (l.bpjsTk || 0) + (l.payroll || 0);
    if (l.jumlahAnggota > 0) kewajibanRekon += komponen; else kewajibanBelum += komponen;
  });

  return {
    totalRab: round2_(totalRab), totalGaji: round2_(totalGaji), totalDiterimaKaryawan: round2_(totalDiterima),
    totalBpjsKes: round2_(totalBpjsKes), totalBpjsTk: round2_(totalBpjsTk), totalPayroll: round2_(totalPayroll),
    totalGajiTertransfer: round2_(totalGajiTertransfer),
    kewajibanTerekonsiliasi: round2_(kewajibanRekon), kewajibanBelumRekonsiliasi: round2_(kewajibanBelum),
    selisihRole1: round2_(kewajibanRekon - totalGajiTertransfer),
    selisihRole2: round2_(selisihRole2Total),
    lokasiRabTerisi: rabTerisi,
  };
}

/** Bangun dataset payroll lengkap. */
function buildPayrollDataset() {
  var rekonInfo = null;
  var periodePreview = null;
  // Perlu tahu bulan/tahun aktif SEBELUM tahu file mana yang dipakai -> baca
  // dulu dari seed, lalu re-resolve kalau ternyata ada file lain yang lebih cocok.
  var seedWb = SpreadsheetApp.openById(CONFIG.REKONSILIASI_SEED_ID);
  periodePreview = parsePeriode_(seedWb);
  rekonInfo = resolveRekonsiliasiId_(periodePreview.bulan, periodePreview.tahun);

  var wbRekon = rekonInfo.id === CONFIG.REKONSILIASI_SEED_ID ? seedWb : SpreadsheetApp.openById(rekonInfo.id);
  var periode = parsePeriode_(wbRekon);
  var hasilByLokasi = parseHasilPengecekan_(wbRekon);
  var picImports = parseSumberMutasi_(wbRekon);

  var wbRekap = SpreadsheetApp.openById(CONFIG.REKAP_GAJI_ID);
  var sheetName = periode.bulan;
  if (!sheetName || !wbRekap.getSheetByName(sheetName)) {
    var sheets = wbRekap.getSheets();
    sheetName = sheets[sheets.length - 1].getName();
  }
  var rekapRows = parseRekapLokasi_(wbRekap, sheetName);
  var manualMap = parseManualMapping_(wbRekap);

  var locations = buildLocations_(rekapRows, hasilByLokasi, manualMap);
  var notices = buildNotices_(locations);
  var kpi = buildKpi_(locations, hasilByLokasi);
  var totals = monthlyTotals_(wbRekap);

  var lokasiSudahDicek = locations.filter(function (l) { return l.statusKomponen !== null; }).length;
  var lokasiSesuai = locations.filter(function (l) { return l.statusKomponen === "SESUAI"; }).length;
  var lokasiTidakSesuai = locations.filter(function (l) { return l.statusKomponen === "TIDAK SESUAI"; }).length;
  var lokasiBelumRekon = locations.filter(function (l) { return l.matchConfidence === "belum-ada"; }).length;

  return {
    generatedAt: new Date().toISOString(),
    periode: periode.nama, periodeLabel: periode.nama,
    periodeMulai: periode.mulai, periodeSelesai: periode.selesai,
    asOfDate: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Jakarta", "yyyy-MM-dd"),
    kpi: kpi,
    totalLokasi: locations.length, lokasiSudahDicek: lokasiSudahDicek, lokasiSesuai: lokasiSesuai,
    lokasiTidakSesuai: lokasiTidakSesuai, lokasiBelumAdaRekonsiliasi: lokasiBelumRekon,
    picImports: picImports, locations: locations, notices: notices, monthlyTotals: totals,
    _debug: { rekonsiliasiFileId: rekonInfo.id, resolvedBy: rekonInfo.resolvedBy, sheetBulan: sheetName },
  };
}

/**
 * Dataset absensi (opsional) — hanya jalan kalau CONFIG.ABSENSI_SHEET_ID
 * diisi. Logikanya sama persis dengan apps-script/Code.gs yang sudah ada,
 * tinggal buka spreadsheetnya lewat ID (bukan getActiveSpreadsheet) karena
 * project ini standalone.
 */
function buildAbsensiDataset() {
  if (!CONFIG.ABSENSI_SHEET_ID) return null;
  // Lihat apps-script/Code.gs (dashboard Monitoring Laporan & Absensi) untuk
  // implementasi lengkap buildDataset() — salin isinya ke sini dan ganti
  // `SpreadsheetApp.getActiveSpreadsheet()` menjadi
  // `SpreadsheetApp.openById(CONFIG.ABSENSI_SHEET_ID)` kalau ingin
  // menyajikan data absensi live juga dari web app ini.
  return null;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  var payrollDataset = buildPayrollDataset();
  var absensiDataset = buildAbsensiDataset();
  var template = HtmlService.createTemplateFromFile("Index");
  template.payrollDataJson = JSON.stringify(payrollDataset);
  template.absensiDataJson = absensiDataset ? JSON.stringify(absensiDataset) : "null";
  return template
    .evaluate()
    .setTitle("Dashboard Rekonsiliasi Payroll")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Jalankan manual dari editor untuk cek dataset di Logger tanpa buka web app. */
function debugPayrollDataset() {
  Logger.log(JSON.stringify(buildPayrollDataset(), null, 2));
}

/**
 * DASHBOARD REKAP KERJA KHANIFA
 * ------------------------------------------------------------
 * Script ini dijalankan langsung dari dalam Google Sheet
 * "LAPORAN HARIAN KHANIFA". Setiap sheet bulan (JULI, AGUSTUS, dst)
 * dibaca otomatis selama formatnya mengikuti header baku:
 *   TANGGAL | JAM | NO | DAILY WORKING PLAN | STATUS | KETERANGAN
 *
 * Cara pakai: lihat README.md di folder ini.
 */

// ---------------------------------------------------------------
// Menu & entry point
// ---------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Dashboard')
    .addItem('Buka Dashboard', 'showDashboard')
    .addToUi();
}

function showDashboard() {
  var tmpl = HtmlService.createTemplateFromFile('Index');
  tmpl.dataJson = toSafeJson(buildDashboardData());
  var html = tmpl.evaluate().setWidth(1300).setHeight(880);
  SpreadsheetApp.getUi().showModalDialog(html, 'Rekap Kerja Khanifa');
}

// Opsional: deploy sebagai Web App (Deploy > New deployment > Web app)
// untuk mendapat link penuh satu halaman, bukan popup.
function doGet() {
  var tmpl = HtmlService.createTemplateFromFile('Index');
  tmpl.dataJson = toSafeJson(buildDashboardData());
  return tmpl.evaluate()
    .setTitle('Rekap Kerja Khanifa')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Escape "<" so a "</script>" can never appear inside the injected
// JSON and break out of the <script> block early.
function toSafeJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------
// Data builder — dipanggil ulang setiap dashboard dibuka, jadi
// selalu mengikuti isi sheet yang terbaru.
// ---------------------------------------------------------------

function buildDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  var days = [];
  var monthsOrder = [];
  var monthStats = {}; // name -> {days, tasks, lokasi}
  var categories = { KESEHATAN: 0, KETENAGAKERJAAN: 0, LAINNYA: 0 };
  var totalTasks = 0, totalLokasi = 0;
  var statusTracked = 0, statusDone = 0;
  var maxTasksDay = null, maxLokasiDay = null;

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var monthDays = parseMonthSheet(sheet);
    if (!monthDays || monthDays.length === 0) continue;

    var monthName = sheet.getName();
    monthsOrder.push(monthName);
    monthStats[monthName] = { name: monthName, days: 0, tasks: 0, lokasi: 0 };

    for (var d = 0; d < monthDays.length; d++) {
      var day = monthDays[d];
      days.push(day);

      monthStats[monthName].days += 1;
      monthStats[monthName].tasks += day.n_tasks;
      monthStats[monthName].lokasi += day.lokasi;

      totalTasks += day.n_tasks;
      totalLokasi += day.lokasi;

      if (day.has_status) {
        statusTracked += day.n_tasks;
        statusDone += day.n_done;
      }

      for (var t = 0; t < day.tasks.length; t++) {
        categories[day.tasks[t].cat] += 1;
      }

      if (!maxTasksDay || day.n_tasks > maxTasksDay.n_tasks) {
        maxTasksDay = { date: day.date, n_tasks: day.n_tasks };
      }
      if (!maxLokasiDay || day.lokasi > maxLokasiDay.lokasi) {
        maxLokasiDay = { date: day.date, lokasi: day.lokasi };
      }
    }
  }

  var months = monthsOrder.map(function (name) { return monthStats[name]; });

  var summary = {
    months: months,
    total_days: days.length,
    total_tasks: totalTasks,
    total_lokasi: totalLokasi,
    status_tracked: statusTracked,
    status_done: statusDone,
    status_untracked: totalTasks - statusTracked,
    categories: categories,
    max_tasks_day: maxTasksDay ? maxTasksDay.date : null,
    max_lokasi_day: maxLokasiDay ? maxLokasiDay.date : null
  };

  return { summary: summary, days: days };
}

/**
 * Membaca satu sheet bulan. Mengembalikan null bila sheet ini
 * bukan sheet jurnal (tidak ada header TANGGAL di kolom A).
 */
function parseMonthSheet(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  var headerRow = -1;
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][0] || '').trim().toUpperCase() === 'TANGGAL') {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) return null;

  var monthName = sheet.getName();
  var order = [];
  var byDate = {};
  var currentDate = null, currentTime = null;

  for (var r = headerRow + 1; r < values.length; r++) {
    var row = values[r];
    var dateCell = String(row[0] || '').trim();
    var timeCell = String(row[1] || '').trim();
    var noCell = String(row[2] || '').trim();
    var taskCell = String(row[3] || '').trim();
    var statusCell = String(row[4] || '').trim();
    var ketCell = String(row[5] || '').trim();

    if (dateCell) { currentDate = dateCell; currentTime = timeCell; }
    if (!currentDate) continue;
    if (!noCell && !taskCell && !statusCell && !ketCell) continue; // baris kosong / akhir tabel

    if (!byDate[currentDate]) {
      byDate[currentDate] = {
        date: currentDate,
        month: monthName,
        day: parseDayNumber(currentDate),
        time: currentTime,
        n_tasks: 0,
        lokasi: 0,
        has_status: false,
        n_done: 0,
        tasks: []
      };
      order.push(currentDate);
    }
    var dayObj = byDate[currentDate];

    var combined = (statusCell + ' ' + ketCell).toUpperCase();
    var locMatch = combined.match(/(\d+)\s*LOKASI/);
    var lokasi = locMatch ? parseInt(locMatch[1], 10) : 0;
    var done = statusCell.indexOf('√') !== -1 || combined.indexOf('SELESAI') !== -1;
    var cat = categorizeTask(taskCell.toUpperCase());

    if (statusCell) dayObj.has_status = true;

    dayObj.tasks.push({
      no: noCell, task: taskCell, status: statusCell, ket: ketCell,
      cat: cat, lokasi: lokasi, done: done
    });
    dayObj.n_tasks += 1;
    dayObj.lokasi += lokasi;
    if (done) dayObj.n_done += 1;
  }

  return order.map(function (d) { return byDate[d]; });
}

function parseDayNumber(dateStr) {
  var m = String(dateStr).match(/^(\d{1,2})/);
  return m ? parseInt(m[1], 10) : 0;
}

function categorizeTask(taskUpper) {
  if (taskUpper.indexOf('KESEHATAN') !== -1) return 'KESEHATAN';
  if (taskUpper.indexOf('KETENAGAKERJAAN') !== -1 || taskUpper.indexOf('NAKER') !== -1 || /\bTK\b/.test(taskUpper)) return 'KETENAGAKERJAAN';
  return 'LAINNYA';
}

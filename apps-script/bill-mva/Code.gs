//====================================================
// Label penanda awal record. Beberapa dokumen sumber pakai "MVA Number",
// yang lain pakai "Virtual Account" — terima keduanya supaya format
// sumber yang berbeda-beda tetap ke-split dengan benar.
//====================================================
var LABEL_PATTERN = "(?:MVA\\s+Number|Virtual\\s+Account)";

// Batas aman durasi 1x klik "Lanjutkan Proses" (limit Apps Script ~6 menit).
// Berhenti otomatis sebelum kena "Exceeded maximum execution time", supaya
// posisi terakhir selalu sempat tersimpan dengan benar.
var MAX_RUNTIME_MS = 4.5 * 60 * 1000;


function onOpen() {

  DocumentApp.getUi()
    .createMenu("📄 BILL MVA")
    .addItem("⚙️ Input Link Proyek", "inputLinkProject")
    .addSeparator()
    .addItem("🔎 Cek Posisi Terakhir", "cekPosisiTerakhir")
    .addItem("▶ Lanjutkan Proses", "buatBillPerMVA")
    .addItem("🔄 Mulai Dari Awal", "resetBillPerMVA")
    .addToUi();

}


//====================================================
// RESET PROSES
//====================================================
function resetBillPerMVA() {

  const props = PropertiesService.getScriptProperties();

  props.deleteProperty("LAST_INDEX");
  props.deleteProperty("LAST_MVA");
  props.deleteProperty("LAST_NAMA");

  DocumentApp.getUi()
    .alert("Posisi proses berhasil direset ke file pertama.");

}


//====================================================
// CEK POSISI TERAKHIR
//====================================================
function cekPosisiTerakhir() {

  const ui = DocumentApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const SOURCE_DOC_ID = props.getProperty("SOURCE_DOC_ID");

  if (!SOURCE_DOC_ID) {

    ui.alert(
      "Silakan isi link proyek terlebih dahulu melalui menu\n\n📄 BILL MVA → ⚙️ Input Link Proyek"
    );

    return;

  }

  const blocks = getMvaBlocks(SOURCE_DOC_ID);

  const lastIndexProp = props.getProperty("LAST_INDEX");
  const lastIndex = Number(lastIndexProp || 0);
  const lastMva = props.getProperty("LAST_MVA") || "-";
  const lastNama = props.getProperty("LAST_NAMA") || "-";

  if (!lastIndexProp) {

    ui.alert(
      "Total data terdeteksi di dokumen sumber : " + blocks.length + "\n\n" +
      "Belum ada proses yang tersimpan (posisi masih di awal, atau semua file sudah pernah selesai dibuat sebelumnya)."
    );

    return;

  }

  ui.alert(
    "Total data terdeteksi : " + blocks.length + "\n" +
    "Sudah selesai sampai file ke- : " + lastIndex + "\n" +
    "Sisa belum diproses : " + (blocks.length - lastIndex) + "\n\n" +
    "Terakhir dibuat : file ke-" + lastIndex + " (MVA " + lastMva + " - " + lastNama + ")\n\n" +
    "Klik menu\n📄 BILL MVA → ▶ Lanjutkan Proses\nuntuk melanjutkan dari file ke-" + (lastIndex + 1) + "."
  );

}


//====================================================
// INPUT LINK PROYEK
//====================================================
function inputLinkProject() {

  const ui = DocumentApp.getUi();
  const props = PropertiesService.getScriptProperties();

  //----------------------------------------
  // Link Sumber
  //----------------------------------------
  const sumber = ui.prompt(
    "LINK DOKUMEN SUMBER",
    "Paste link Google Docs sumber",
    ui.ButtonSet.OK_CANCEL
  );

  if (sumber.getSelectedButton() != ui.Button.OK) return;

  //----------------------------------------
  // Link Template
  //----------------------------------------
  const template = ui.prompt(
    "LINK TEMPLATE",
    "Paste link Google Docs Template",
    ui.ButtonSet.OK_CANCEL
  );

  if (template.getSelectedButton() != ui.Button.OK) return;

  //----------------------------------------
  // Link Folder
  //----------------------------------------
  const folder = ui.prompt(
    "LINK FOLDER PENYIMPANAN",
    "Paste link Folder Google Drive",
    ui.ButtonSet.OK_CANCEL
  );

  if (folder.getSelectedButton() != ui.Button.OK) return;

  //----------------------------------------
  // Bulan Tagihan (dipakai untuk penamaan file)
  //----------------------------------------
  let bulanTagihan = "";

  while (true) {

    const bulanResp = ui.prompt(
      "BULAN TAGIHAN",
      "Masukkan bulan & tahun tagihan (format: MM YYYY)\nContoh: 08 2026",
      ui.ButtonSet.OK_CANCEL
    );

    if (bulanResp.getSelectedButton() != ui.Button.OK) return;

    bulanTagihan = bulanResp.getResponseText().trim();

    if (/^\d{2}\s\d{4}$/.test(bulanTagihan)) break;

    ui.alert("Format salah. Gunakan format: MM YYYY (contoh: 08 2026)");

  }

  props.setProperty(
    "SOURCE_DOC_ID",
    getIdFromUrl(sumber.getResponseText())
  );

  props.setProperty(
    "TEMPLATE_DOC_ID",
    getIdFromUrl(template.getResponseText())
  );

  props.setProperty(
    "OUTPUT_FOLDER_ID",
    getIdFromUrl(folder.getResponseText())
  );

  props.setProperty(
    "BILLING_MONTH",
    bulanTagihan
  );

  ui.alert("Link proyek berhasil disimpan.");

}


//====================================================
// AMBIL FILE ID DARI URL
//====================================================
function getIdFromUrl(url) {

  const match = url.match(/[-\w]{25,}/);

  if (!match) {
    throw new Error("Link tidak valid.");
  }

  return match[0];

}


//====================================================
// BACA & PECAH DOKUMEN SUMBER JADI BLOK PER MVA
//====================================================
function getMvaBlocks(sourceDocId) {

  const sourceDoc =
    DocumentApp.openById(sourceDocId);

  let text =
    sourceDoc
      .getBody()
      .getText()
      .replace(/\r/g, "");

  //--------------------------------
  // Normalisasi spasi/tab/non-breaking space.
  // Dokumen hasil copy-paste (dari Excel/PDF/email) sering menyisipkan
  // non-breaking space di antara kata (mis. "MVA Number"), sehingga
  // hanya kemunculan pertama yang persis cocok dengan "MVA Number" biasa
  // dan sisanya gagal ke-split -> semua record numpuk jadi 1 blok saja.
  //--------------------------------
  text = text.replace(/[^\S\n]+/g, " ");

  let blocks =
    text.split(new RegExp("(?=" + LABEL_PATTERN + ")", "gi"));

  blocks =
    blocks.filter(x => x.trim() != "");

  return blocks;

}


//====================================================
// PROSES PEMBUATAN FILE
//====================================================
function buatBillPerMVA() {

  const scriptStart = Date.now();

  const props =
    PropertiesService.getScriptProperties();

  const SOURCE_DOC_ID =
    props.getProperty("SOURCE_DOC_ID");

  const TEMPLATE_DOC_ID =
    props.getProperty("TEMPLATE_DOC_ID");

  const OUTPUT_FOLDER_ID =
    props.getProperty("OUTPUT_FOLDER_ID");

  const BILLING_MONTH =
    props.getProperty("BILLING_MONTH");

  if (
    !SOURCE_DOC_ID ||
    !TEMPLATE_DOC_ID ||
    !OUTPUT_FOLDER_ID ||
    !BILLING_MONTH
  ) {

    DocumentApp.getUi().alert(
      "Silakan isi link proyek terlebih dahulu melalui menu\n\n📄 BILL MVA → ⚙️ Input Link Proyek"
    );

    return;

  }

  const BATCH_SIZE = 50;

  let startIndex = Number(
    props.getProperty("LAST_INDEX") || 0
  );

  const blocks = getMvaBlocks(SOURCE_DOC_ID);

  Logger.log("Total blok data terdeteksi: " + blocks.length);

  if (startIndex === 0 && blocks.length <= 1) {

    DocumentApp.getUi().alert(
      "Hanya ditemukan " + blocks.length + " data 'MVA Number' / 'Virtual Account' di dokumen sumber.\n\n" +
      "Kemungkinan penyebab:\n" +
      "- Label di sebagian record beda dari 'MVA Number' / 'Virtual Account' (mis. typo/karakter tersembunyi)\n" +
      "- Data sebenarnya diletakkan di dalam tabel, bukan paragraf biasa\n\n" +
      "Buka Extensions > Apps Script > Executions untuk lihat log, lalu cek ulang format dokumen sumber."
    );

    if (blocks.length === 0) return;

  }

  const batchEnd =
    Math.min(
      startIndex + BATCH_SIZE,
      blocks.length
    );

  const outputFolder =
    DriveApp.getFolderById(
      OUTPUT_FOLDER_ID
    );

  // Index terakhir yang benar-benar sudah selesai dibuat di run ini.
  let lastCompletedIndex = startIndex - 1;

  // Kalau berhenti duluan karena mendekati batas waktu eksekusi.
  let stoppedByTimeLimit = false;

  for (
    let index = startIndex;
    index < batchEnd;
    index++
  ) {

    //--------------------------------
    // Berhenti dengan aman sebelum kena batas waktu Apps Script,
    // supaya posisi terakhir selalu tersimpan (tidak dobel saat lanjut).
    //--------------------------------
    if (Date.now() - scriptStart > MAX_RUNTIME_MS) {
      stoppedByTimeLimit = true;
      break;
    }

    let block = blocks[index];

    //--------------------------------
    // Ambil Data
    //--------------------------------
    let mva =
      (block.match(new RegExp(LABEL_PATTERN + "\\s*:?\\s*(\\d+)", "i")) || [, ""])[1];

    let namaMatch = block.match(/Name\s*:\s*(.*?)(?:\r?\n|Branch\s*:)/i);
let nama = namaMatch ? namaMatch[1].trim() : "";

let branchMatch = block.match(/Branch\s*:\s*(.+)/i);
let branch = branchMatch ? branchMatch[1].trim() : "";

    let refNo =
      (block.match(/Ref No\s*:\s*(.+)/i) || [, ""])[1];

    let total =
      (block.match(/TOTAL\s*:\s*(?:[A-Za-z]{2,5}\s*)?([\d.,]+)/i) || [, ""])[1];

    //--------------------------------
    // Billing Information
    //--------------------------------
    let billingInfo =
`Information:
VA Number : ${mva}
Name : ${nama}
Branch : ${branch}
Ref No : ${refNo}

Components:
TOTAL : ${total}

Total Amount: IDR ${total}`;

    //--------------------------------
    // Nama File
    //--------------------------------
    let nomorUrut =
      String(index + 1).padStart(3, "0");

    let namaFile =
      nomorUrut + " - " + BILLING_MONTH + " - MVA " + mva;

    //--------------------------------
    // Copy Template
    //--------------------------------
    let newFile =
      DriveApp
        .getFileById(TEMPLATE_DOC_ID)
        .makeCopy(
          namaFile,
          outputFolder
        );

    //--------------------------------
    // Buka Dokumen
    //--------------------------------
    let doc =
      DocumentApp.openById(
        newFile.getId()
      );

    let body = doc.getBody();

    //--------------------------------
    // Cari Tabel Pertama
    //--------------------------------
    let table = null;

    for (
      let i = 0;
      i < body.getNumChildren();
      i++
    ) {

      let el = body.getChild(i);

      if (
        el.getType() ==
        DocumentApp.ElementType.TABLE
      ) {

        table = el.asTable();
        break;

      }

    }

    if (!table) {

      Logger.log(
        "Tabel tidak ditemukan : " +
        namaFile
      );

      lastCompletedIndex = index;
      props.setProperty("LAST_INDEX", String(lastCompletedIndex + 1));

      continue;

    }

    while (table.getNumRows() < 2) {
      table.appendTableRow();
    }

    let row = table.getRow(1);

    while (row.getNumCells() < 8) {
      row.appendTableCell("");
    }
        //--------------------------------
    // Isi Data
    //--------------------------------
    row.getCell(0).setText(
      "23998 BPJS Kesehatan\nBadan Usaha"
    );

    row.getCell(1).setText(
      "MVA Number:\n" + mva
    );

    row.getCell(2).setText("-");

    row.getCell(3).setText("-");

    row.getCell(4).setText(
      billingInfo
    );

    row.getCell(5).setText(
      "IDR"
    );

    row.getCell(6).setText(
      "Payment"
    );

    row.getCell(7).setText(
      "Success"
    );

    row.setMinimumHeight(90);

    doc.saveAndClose();

    Logger.log(
      "Selesai : " +
      namaFile
    );

    //--------------------------------
    // Simpan posisi SETIAP file (bukan cuma di akhir batch), supaya
    // kalau tiba-tiba "Exceeded maximum execution time", file yang
    // sudah jadi tidak dibuat ulang lagi saat klik Lanjutkan Proses.
    //--------------------------------
    lastCompletedIndex = index;

    props.setProperty("LAST_INDEX", String(lastCompletedIndex + 1));
    props.setProperty("LAST_MVA", mva);
    props.setProperty("LAST_NAMA", nama);

  }

  const doneCount = lastCompletedIndex + 1;

  //--------------------------------
  // Semua File Selesai
  //--------------------------------
  if (doneCount >= blocks.length) {

    props.deleteProperty("LAST_INDEX");
    props.deleteProperty("LAST_MVA");
    props.deleteProperty("LAST_NAMA");

    DocumentApp.getUi()
      .alert(
        "SEMUA FILE BERHASIL DIBUAT.\nJumlah file : " +
        blocks.length
      );

  } else {

    DocumentApp.getUi()
      .alert(
        (stoppedByTimeLimit
          ? "Berhenti otomatis karena mendekati batas waktu eksekusi.\n\n"
          : "") +
        "Selesai sampai file ke-" + doneCount + " dari " + blocks.length +
        ".\n\nKlik menu\n📄 BILL MVA → ▶ Lanjutkan Proses\nuntuk melanjutkan dari file ke-" + (doneCount + 1) + "."
      );

  }

}

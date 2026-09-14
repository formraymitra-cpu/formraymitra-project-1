/**
 * INI CONTOH HASIL GABUNGAN — siap copy-paste langsung menggantikan seluruh
 * isi file `Code.gs` yang SUDAH ADA di spreadsheet "08. BPJS KETENAGAKERJAAN
 * ...". Isinya = script "📌 MENU OTOMATIS" yang lama, PERSIS seperti semula,
 * hanya `onOpen()` yang ditambah 4 baris untuk memunculkan menu "F2 BPJS".
 *
 * File `F2Converter.gs` dan `F2Sidebar.html` di folder yang sama tetap harus
 * dibuat terpisah seperti biasa (lihat README.md) — file ini HANYA untuk
 * `Code.gs`.
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

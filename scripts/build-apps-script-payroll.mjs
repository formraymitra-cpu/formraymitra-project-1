#!/usr/bin/env node
/**
 * Sama seperti scripts/build-apps-script.mjs, tapi untuk deployment
 * standalone Payroll (apps-script-payroll/). Bedanya: Index.html di sini
 * menyuntikkan window.__PAYROLL_DATA__ (wajib) dan window.__DASHBOARD_DATA__
 * (opsional, null kalau ABSENSI_SHEET_ID belum diisi di Code.gs), lalu
 * mengarahkan hash awal ke halaman Ringkasan Payroll.
 *
 * Jalankan setelah `npm run build`:
 *   npm run build && node scripts/build-apps-script-payroll.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const assetsDir = join(distDir, "assets");
const outDir = "apps-script-payroll";

if (!existsSync(distDir)) {
  console.error("dist/ tidak ditemukan — jalankan `npm run build` dulu.");
  process.exit(1);
}
if (!existsSync(outDir)) mkdirSync(outDir);

const files = readdirSync(assetsDir);
const jsFile = files.find((f) => f.endsWith(".js"));
const cssFile = files.find((f) => f.endsWith(".css"));
if (!jsFile || !cssFile) {
  console.error("Tidak menemukan bundle .js/.css di dist/assets — cek hasil build.");
  process.exit(1);
}

const js = readFileSync(join(assetsDir, jsFile), "utf-8");
const css = readFileSync(join(assetsDir, cssFile), "utf-8");

if (js.includes("</script")) {
  console.warn(
    "PERINGATAN: bundle JS mengandung teks '</script' — ini bisa memotong tag <script> di HTML. Cek manual sebelum deploy."
  );
}

writeFileSync(join(outDir, "Bundle.html"), `<script type="module">\n${js}\n</script>\n`, "utf-8");
writeFileSync(join(outDir, "Styles.html"), `<style>\n${css}\n</style>\n`, "utf-8");

const indexHtml = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <?!= include('Styles'); ?>
</head>
<body>
  <div id="root"></div>
  <script>
    window.__PAYROLL_DATA__ = <?!= payrollDataJson ?>;
    window.__DASHBOARD_DATA__ = <?!= absensiDataJson ?> || undefined;
    if (!location.hash || location.hash === "#/" || location.hash === "#/overview") {
      location.hash = "#/payroll/ringkasan";
    }
  </script>
  <?!= include('Bundle'); ?>
</body>
</html>
`;

writeFileSync(join(outDir, "Index.html"), indexHtml, "utf-8");

console.log(`wrote ${outDir}/Index.html, Bundle.html (${(js.length / 1024).toFixed(0)} KB), Styles.html (${(css.length / 1024).toFixed(0)} KB)`);

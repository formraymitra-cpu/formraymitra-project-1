#!/usr/bin/env node
/**
 * Inline hasil build Vite (dist/) jadi 2 file untuk Apps Script HTML Service:
 *   - apps-script/Bundle.html  bundle JS mentah, disisipkan TANPA evaluasi
 *                              scriptlet (aman dari kode ter-minify yang
 *                              kebetulan mengandung teks "<?" / "?>")
 *   - apps-script/Styles.html  CSS mentah, sama alasannya
 *
 * apps-script/Index.html sudah statis (tidak perlu digenerate ulang) — isinya
 * cuma skeleton kecil yang men-include Bundle & Styles serta menyuntikkan
 * datasetJson dari Code.gs.
 *
 * Jalankan setelah `npm run build`:
 *   npm run build && node scripts/build-apps-script.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const distDir = "dist";
const outDir = "apps-script";

if (!existsSync(distDir)) {
  console.error("dist/ tidak ditemukan — jalankan `npm run build` dulu.");
  process.exit(1);
}
if (!existsSync(outDir)) mkdirSync(outDir);

// Ambil path entry JS/CSS langsung dari dist/index.html (bukan asal file
// pertama di dist/assets) supaya benar meskipun Vite memecah dataset JSON
// fallback (src/data/dashboard-data.json, dipakai untuk npm run dev/preview
// statis) jadi chunk terpisah lewat dynamic import — chunk itu sengaja TIDAK
// ikut di-inline ke sini karena tidak pernah benar-benar diminta saat
// window.__DASHBOARD_DATA__ sudah disuntikkan Code.gs.
const indexHtml = readFileSync(join(distDir, "index.html"), "utf-8");
const jsMatch = indexHtml.match(/<script[^>]+src="([^"]+\.js)"/);
const cssMatch = indexHtml.match(/<link[^>]+href="([^"]+\.css)"/);
if (!jsMatch || !cssMatch) {
  console.error("Tidak menemukan referensi bundle .js/.css di dist/index.html — cek hasil build.");
  process.exit(1);
}

const js = readFileSync(join(distDir, "assets", basename(jsMatch[1])), "utf-8");
const css = readFileSync(join(distDir, "assets", basename(cssMatch[1])), "utf-8");

if (js.includes("</script")) {
  console.warn(
    "PERINGATAN: bundle JS mengandung teks '</script' — ini bisa memotong tag <script> di HTML. Cek manual sebelum deploy."
  );
}

writeFileSync(join(outDir, "Bundle.html"), `<script type="module">\n${js}\n</script>\n`, "utf-8");
writeFileSync(join(outDir, "Styles.html"), `<style>\n${css}\n</style>\n`, "utf-8");

console.log(`wrote apps-script/Bundle.html (${(js.length / 1024).toFixed(0)} KB), Styles.html (${(css.length / 1024).toFixed(0)} KB)`);
console.log("apps-script/Index.html & Code.gs tidak berubah — cukup tempel ulang Bundle.html & Styles.html ke editor Apps Script.");

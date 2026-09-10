interface GasScriptRun {
  withSuccessHandler: (fn: (result: unknown) => void) => GasScriptRun;
  withFailureHandler: (fn: (err: Error) => void) => GasScriptRun;
  getFotoLinkUntukTanggal: (tanggal: string) => void;
}

declare global {
  interface Window {
    google?: { script?: { run?: GasScriptRun } };
  }
}

export function isGasRuntime() {
  return typeof window !== "undefined" && !!window.google?.script?.run;
}

export function getFotoLinkUntukTanggal(tanggal: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const run = window.google?.script?.run;
    if (!run) {
      reject(new Error("Fitur lihat foto hanya jalan saat dashboard dibuka sebagai Apps Script Web App, bukan di preview lokal."));
      return;
    }
    run
      .withSuccessHandler((result) => resolve(result as string | null))
      .withFailureHandler((err: Error) => reject(err))
      .getFotoLinkUntukTanggal(tanggal);
  });
}

import { useDataset } from "../useDataset";
import { InfoCircle } from "../components/icons";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const RANK_COLOR = ["oklch(78% 0.09 85)", "oklch(83% 0.008 260)", "oklch(83% 0.008 260)"];

export default function Leaderboard() {
  const d = useDataset();
  const basisMonth = d.months.find((m) => m.code === d.leaderboard[0]?.basisBulan);
  const top3 = d.leaderboard.slice(0, 3);

  return (
    <div className="flex flex-col gap-5 px-6 py-8 sm:px-10 sm:pb-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mn text-2xl font-extrabold tracking-tight sm:text-[26px]">Kinerja PIC</h1>
          <p className="mt-1.5 text-sm text-ink-secondary">
            Ranking ketepatan waktu berdasarkan {basisMonth?.label ?? "bulan terakhir"} (bulan closed terakhir dengan
            data PIC)
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[oklch(80%_0.08_75)] border-l-4 border-l-warn bg-warn-tint px-5 py-3.5">
        <InfoCircle className="mt-0.5 flex-shrink-0 text-warn-text" size={18} />
        <div className="text-[13px] leading-relaxed text-ink-secondary">
          <span className="font-bold text-ink">Kelengkapan data PIC baru {d.picCoveragePct}%.</span> Lengkapi kolom
          PIC pada checklist bulanan agar leaderboard ini merepresentasikan seluruh tim &mdash; saat ini hanya{" "}
          {d.leaderboard.length} orang PIC yang tercatat.
        </div>
      </div>

      {d.leaderboard.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-ink-tertiary">
          Belum ada data PIC yang bisa dianalisis.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {top3.map((p, i) => (
              <div
                key={p.pic}
                className="flex flex-col gap-3.5 rounded-2xl border bg-surface p-6"
                style={{ borderColor: RANK_COLOR[i], borderWidth: i === 0 ? 1.5 : 1 }}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mn text-xl font-extrabold ${i === 0 ? "text-warn-text" : "text-ink-tertiary"}`}>
                    #{i + 1}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      p.overdue === 0 ? "bg-good-tint text-good-text" : "bg-warn-tint text-warn-text"
                    }`}
                  >
                    {p.overdue} overdue
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border-strong bg-accent-tint font-mn text-sm font-bold text-accent">
                    {initials(p.pic)}
                  </div>
                  <div>
                    <div className="font-mn text-[15px] font-bold">{p.pic}</div>
                    <div className="text-xs text-ink-tertiary">{p.lokasiDitangani} lokasi ditangani</div>
                  </div>
                </div>
                <div>
                  <span className="font-mn text-[30px] font-extrabold tracking-tight">{p.pctTepatWaktu}%</span>
                  <span className="ml-1 text-xs text-ink-tertiary">tepat waktu</span>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[56px_1.6fr_1fr_1fr_1fr_1.4fr] items-center gap-3.5 border-b border-border-strong px-5 py-3">
                  {["Rank", "PIC", `Lokasi (${basisMonth?.label ?? ""})`, "Tepat Waktu", "Overdue", "% Tepat Waktu"].map((h) => (
                    <span key={h} className="text-[10.5px] font-bold uppercase tracking-wide text-ink-tertiary">
                      {h}
                    </span>
                  ))}
                </div>
                {d.leaderboard.map((p, i) => (
                  <div
                    key={p.pic}
                    className="grid grid-cols-[56px_1.6fr_1fr_1fr_1fr_1.4fr] items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
                  >
                    <span className="font-mn text-[13px] font-bold text-ink-tertiary">{i + 1}</span>
                    <span className="flex items-center gap-2.5 text-[13.5px] font-semibold">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-tint font-mn text-[10.5px] font-bold text-accent">
                        {initials(p.pic)}
                      </span>
                      {p.pic}
                    </span>
                    <span className="text-[13px]">{p.lokasiDitangani}</span>
                    <span className="text-[13px]">
                      {p.selesai} / {p.lokasiDitangani}
                    </span>
                    <span className={`text-[13px] font-bold ${p.overdue === 0 ? "text-ink-tertiary" : "text-bad-text"}`}>
                      {p.overdue}
                    </span>
                    <span className="flex items-center gap-2.5">
                      <div className="h-[7px] max-w-[120px] flex-1 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${p.pctTepatWaktu}%`,
                            background:
                              p.pctTepatWaktu >= 75
                                ? "oklch(56% 0.15 148)"
                                : p.pctTepatWaktu >= 50
                                ? "oklch(68% 0.16 70)"
                                : "oklch(55% 0.19 25)",
                          }}
                        />
                      </div>
                      <span className="w-8 text-[12.5px] font-bold">{p.pctTepatWaktu}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 text-[13px] leading-relaxed text-ink-secondary">
            <span className="font-mn font-bold text-ink">Beban kerja bulan berjalan ({d.months.find((m) => m.code === d.currentMonth)?.label}):</span>{" "}
            angka di atas adalah track record dari {basisMonth?.label} (sudah closed, statusnya final). Untuk status
            lokasi yang sedang ditangani tiap PIC bulan ini, lihat kolom PIC di halaman Monitoring Harian.
          </div>
        </>
      )}
    </div>
  );
}

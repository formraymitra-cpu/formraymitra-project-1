import { useMemo } from "react";
import { useDataset } from "../useDataset";
import { KpiCard } from "../components/KpiCard";
import { RankedBarChart } from "../components/charts";
import { formatRupiah } from "../lib/format";

export default function PaymentRecap() {
  const dataset = useDataset();
  const payments = dataset.payments;

  const total = useMemo(() => payments.reduce((a, p) => a + p.total, 0), [payments]);
  const top10 = useMemo(
    () =>
      [...payments]
        .filter((p) => p.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map((p) => ({ label: p.lokasi, value: p.total })),
    [payments],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mn text-2xl font-extrabold text-ink">Rekap Nominal Pembayaran</h1>
        <p className="mt-1 text-sm text-ink-secondary">Nominal yang harus dibayarkan untuk lokasi "rumah baru" BPJS.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total Nominal Tagihan" value={formatRupiah(total)} />
        <KpiCard label="Jumlah Lokasi Baru" value={String(payments.length)} />
        <KpiCard label="Lokasi Belum Ada Nominal" value={String(payments.filter((p) => p.total === 0).length)} tone="warn" />
      </div>

      {top10.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-mn text-sm font-bold text-ink">Top 10 Nominal Terbesar</h2>
          <p className="mb-4 text-xs text-ink-secondary">Lokasi dengan tagihan BPJS tertinggi</p>
          <RankedBarChart data={top10} formatValue={formatRupiah} />
        </section>
      )}

      <section className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-alt text-left text-xs text-ink-tertiary">
              <th className="px-3 py-2 font-semibold">No</th>
              <th className="px-3 py-2 font-semibold">Lokasi</th>
              <th className="px-3 py-2 text-right font-semibold">Nominal KES</th>
              <th className="px-3 py-2 text-right font-semibold">Nominal TK</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.no} className="border-b border-border last:border-0 hover:bg-surface-alt/60">
                <td className="px-3 py-2 text-ink-tertiary">{p.no}</td>
                <td className="px-3 py-2 font-medium text-ink">{p.lokasi}</td>
                <td className="px-3 py-2 text-right text-ink-secondary">
                  {p.nominalKes !== null ? formatRupiah(p.nominalKes) : p.nominalKesNote ?? "-"}
                </td>
                <td className="px-3 py-2 text-right text-ink-secondary">{p.nominalTk !== null ? formatRupiah(p.nominalTk) : "-"}</td>
                <td className="px-3 py-2 text-right font-semibold text-ink">{formatRupiah(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

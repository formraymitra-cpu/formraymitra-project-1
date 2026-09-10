import { KES_COLOR, TK_COLOR } from "../lib/colors";

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-ink-secondary">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

const KES_TK_LEGEND = [
  { label: "BPJS Kesehatan (KES)", color: KES_COLOR },
  { label: "Ketenagakerjaan (TK)", color: TK_COLOR },
];

export function KesTkLegend() {
  return <Legend items={KES_TK_LEGEND} />;
}

interface StageBarDatum {
  label: string;
  kesPct: number | null;
  tkPct: number | null;
}

/** Horizontal grouped bars: % selesai per tahap, dipecah KES/TK. */
export function StageBarChart({ data }: { data: StageBarDatum[] }) {
  return (
    <div className="space-y-4">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 text-xs font-semibold text-ink-secondary">{d.label}</div>
          <div className="space-y-1">
            {d.kesPct !== null && <Bar pct={d.kesPct} color={KES_COLOR} tag="KES" />}
            {d.tkPct !== null && <Bar pct={d.tkPct} color={TK_COLOR} tag="TK" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function Bar({ pct, color, tag }: { pct: number; color: string; tag: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[11px] font-medium text-ink-tertiary">{tag}</span>
      <div className="h-3 flex-1 rounded-full bg-surface-alt" title={`${tag}: ${pct.toFixed(1)}%`}>
        <div
          className="h-3 rounded-full transition-[width]"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-[11px] font-semibold text-ink-secondary">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ segments, centerLabel }: { segments: DonutSegment[]; centerLabel?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--donut-track, #eceef2)" strokeWidth="14" />
        {segments.map((s) => {
          const frac = s.value / total;
          const dash = frac * C;
          const gap = C - dash;
          const circle = (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${s.value} (${(frac * 100).toFixed(1)}%)`}</title>
            </circle>
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {centerLabel && <div className="text-sm font-bold text-ink">{centerLabel}</div>}
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-secondary">{s.label}</span>
            <span className="font-semibold text-ink">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TrendPoint {
  label: string;
  value: number;
}

/** Line chart tren % penyelesaian antar bulan (0-100), single series. */
export function TrendLineChart({ points, color = KES_COLOR }: { points: TrendPoint[]; color?: string }) {
  const W = 560;
  const H = 180;
  const padX = 32;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const n = points.length;
  const x = (i: number) => padX + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const y = (v: number) => padY + (1 - v / 100) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const areaPath = `${linePath} L${x(n - 1)},${padY + innerH} L${x(0)},${padY + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tren persentase penyelesaian per bulan">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="#eceef2" strokeWidth="1" />
          <text x={4} y={y(g) + 3} fontSize="9" fill="#9aa1ad">
            {g}%
          </text>
        </g>
      ))}
      <path d={areaPath} fill={color} opacity="0.08" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill={color}>
            <title>{`${p.label}: ${p.value.toFixed(1)}%`}</title>
          </circle>
          <text x={x(i)} y={H - 2} fontSize="10" textAnchor="middle" fill="#6b7280">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface FunnelStep {
  label: string;
  count: number;
  total: number;
}

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.total), 1);
  return (
    <div className="space-y-2.5">
      {steps.map((s) => {
        const pct = s.total ? (s.count / s.total) * 100 : 0;
        const widthPct = (s.total / max) * 100;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-44 shrink-0 truncate text-xs font-medium text-ink-secondary" title={s.label}>
              {s.label}
            </div>
            <div className="h-6 flex-1 rounded-md bg-surface-alt">
              <div
                className="flex h-6 items-center justify-end rounded-md bg-accent px-2 text-[11px] font-semibold text-white"
                style={{ width: `${Math.max(widthPct, 8)}%` }}
                title={`${s.count} dari ${s.total} lokasi (${pct.toFixed(1)}%)`}
              >
                {s.count}
              </div>
            </div>
            <div className="w-14 shrink-0 text-right text-xs font-semibold text-ink-tertiary">
              {pct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RankedBarDatum {
  label: string;
  value: number;
}

export function RankedBarChart({
  data,
  formatValue,
  color = KES_COLOR,
}: {
  data: RankedBarDatum[];
  formatValue: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-48 shrink-0 truncate text-xs font-medium text-ink-secondary" title={d.label}>
            {d.label}
          </div>
          <div className="h-5 flex-1 rounded bg-surface-alt">
            <div
              className="h-5 rounded"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, background: color }}
              title={formatValue(d.value)}
            />
          </div>
          <div className="w-28 shrink-0 text-right text-xs font-semibold text-ink-secondary">
            {formatValue(d.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeeklyActivityChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 640;
  const H = 140;
  const padX = 8;
  const padY = 10;
  const barGap = 4;
  const barW = (W - padX * 2) / data.length - barGap;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Jumlah aktivitas per minggu">
      {data.map((d, i) => {
        const h = ((H - padY * 2) * d.value) / max;
        const bx = padX + i * (barW + barGap);
        const by = H - padY - h;
        return (
          <g key={d.label}>
            <rect x={bx} y={by} width={barW} height={h} rx="2" fill={KES_COLOR}>
              <title>{`${d.label}: ${d.value} aktivitas`}</title>
            </rect>
          </g>
        );
      })}
      <line x1={padX} x2={W - padX} y1={H - padY} y2={H - padY} stroke="#dfe3ea" />
    </svg>
  );
}

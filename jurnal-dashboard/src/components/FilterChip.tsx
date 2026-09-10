export default function FilterChip<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: T[] | string[];
  onChange: (v: T) => void;
}) {
  const active = value !== "Semua";
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-[13px] font-semibold ${
        active ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-secondary"
      }`}
    >
      <label className="cursor-pointer">
        {label}:{" "}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="cursor-pointer border-none bg-transparent font-semibold outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

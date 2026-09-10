type IconProps = { className?: string; size?: number };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ChevronDown({ className, size = 14 }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} width={size} height={size} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Search({ className, size = 16 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function Check({ className, size = 11 }: IconProps) {
  return (
    <svg {...base} strokeWidth={3} width={size} height={size} className={className}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function Clock({ className, size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function Camera({ className, size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

export function Download({ className, size = 15 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M12 4v12M7 12l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

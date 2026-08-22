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

export function ArrowRight({ className, size = 16 }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} width={size} height={size} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
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

export function Warning({ className, size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M12 3.5 2.5 20h19L12 3.5Z" />
      <path d="M12 9.5v5" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InfoCircle({ className, size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
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

export function Clock({ className, size = 11 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
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

/**
 * Maskot "Dino Rajin" — dino kuning ceria, ilustrasi orisinal (bukan reproduksi
 * gambar/karakter pihak lain), dipakai sebagai identitas visual dashboard.
 */
export default function DinoRajin({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className}>
      <ellipse cx="60" cy="108" rx="30" ry="6" fill="oklch(88% 0.01 260)" opacity={0.5} />

      {/* ekor */}
      <path d="M88 78 Q104 74 108 60 Q100 68 86 68 Z" fill="oklch(78% 0.15 95)" />

      {/* kaki */}
      <ellipse cx="44" cy="102" rx="10" ry="7" fill="oklch(78% 0.15 95)" />
      <ellipse cx="76" cy="102" rx="10" ry="7" fill="oklch(78% 0.15 95)" />

      {/* tangan */}
      <ellipse cx="26" cy="76" rx="8" ry="6" fill="oklch(82% 0.15 95)" transform="rotate(-20 26 76)" />
      <ellipse cx="94" cy="76" rx="8" ry="6" fill="oklch(82% 0.15 95)" transform="rotate(20 94 76)" />

      {/* badan */}
      <ellipse cx="60" cy="70" rx="38" ry="34" fill="oklch(82% 0.15 95)" />
      {/* perut putih */}
      <ellipse cx="60" cy="80" rx="20" ry="17" fill="oklch(99% 0 0)" />

      {/* tonjolan punggung */}
      <circle cx="42" cy="38" r="6" fill="oklch(78% 0.15 95)" />
      <circle cx="58" cy="30" r="7" fill="oklch(78% 0.15 95)" />
      <circle cx="76" cy="36" r="6" fill="oklch(78% 0.15 95)" />

      {/* kepala */}
      <circle cx="60" cy="46" r="30" fill="oklch(82% 0.15 95)" />

      {/* pipi blush */}
      <circle cx="38" cy="54" r="6" fill="oklch(80% 0.1 25)" opacity={0.55} />
      <circle cx="82" cy="54" r="6" fill="oklch(80% 0.1 25)" opacity={0.55} />

      {/* mata */}
      <circle cx="48" cy="44" r="6.5" fill="oklch(20% 0.01 260)" />
      <circle cx="72" cy="44" r="6.5" fill="oklch(20% 0.01 260)" />
      <circle cx="50" cy="41.5" r="2" fill="white" />
      <circle cx="74" cy="41.5" r="2" fill="white" />

      {/* senyum */}
      <path d="M50 56 Q60 64 70 56" stroke="oklch(35% 0.05 60)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

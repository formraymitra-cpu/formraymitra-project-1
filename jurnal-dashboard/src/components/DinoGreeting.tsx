import type { ReactNode } from "react";
import DinoRajin from "./DinoRajin";

export default function DinoGreeting({ message, size = 64 }: { message: ReactNode; size?: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-alt p-4">
      <DinoRajin size={size} className="flex-shrink-0" />
      <p className="text-[13.5px] leading-relaxed text-ink-secondary">
        <span className="font-mn font-extrabold text-ink">Halo, aku Dino Rajin! 🦕</span> {message}
      </p>
    </div>
  );
}

import { Check, Clock } from "./icons";

export default function StatusBadge({ selesai }: { selesai: boolean }) {
  return selesai ? (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-good-tint px-2.5 py-1 text-[11.5px] font-bold text-good-text">
      <Check />
      Selesai
    </span>
  ) : (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-warn-tint px-2.5 py-1 text-[11.5px] font-bold text-warn-text">
      <Clock />
      Belum
    </span>
  );
}

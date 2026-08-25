import { cn } from "@/lib/utils";

type PortraitProps = {
  initials: string;
  className?: string;
  paper?: boolean;
};

export function Portrait({ initials, className, paper = false }: PortraitProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-display tracking-[0.12em]",
        paper
          ? "border border-[#3a2418]/20 bg-[#cbb89a] text-[#2d2118]"
          : "border border-brass/20 bg-[#1b1612] text-brass/85",
        className
      )}
    >
      {initials}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WaxSealButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function WaxSealButton({
  children,
  className,
  disabled,
  type = "button",
  onClick,
}: WaxSealButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-brass/40 bg-burgundy px-8 py-3 font-display text-lg tracking-[0.22em] text-paper uppercase shadow-[0_12px_40px_rgb(0_0_0/45%)] transition-all duration-500",
        "hover:border-brass/70 hover:bg-[#6a2b38] hover:shadow-[0_0_32px_rgb(196_160_106/18%)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-brass/70 focus-visible:outline-none",
        className
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/12%),transparent_42%)]" />
      <span className="relative">{children}</span>
    </button>
  );
}

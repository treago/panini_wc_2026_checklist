import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Tone = "gold" | "blue" | "emerald" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  gold: "bg-wc-gold text-black",
  blue: "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  emerald:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

type Props = HTMLAttributes<HTMLDivElement> & { tone?: Tone };

export function Badge({
  tone = "neutral",
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-1.5 text-sm font-bold",
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

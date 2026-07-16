import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Props = HTMLAttributes<HTMLDivElement>;

export function Panel({ className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

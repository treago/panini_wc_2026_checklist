import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Option = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
};

export function Select({ options, className, ...rest }: Props) {
  return (
    <select
      className={cn(
        "focus:border-wc-red/50 focus:ring-wc-red/50 w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 transition focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
        className,
      )}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Joins conditional class names together, skipping falsy values.
 * Small local replacement for the classnames/clsx pattern used ad-hoc
 * (via arrays + .join(" ")) throughout the previous version of this app.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

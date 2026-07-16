// Resolves country codes to their English names via the built-in Intl API
// instead of shipping/maintaining a name table by hand.
//
// IMPORTANT: Intl.DisplayNames({ type: "region" }) resolves ISO 3166-1
// alpha-2 codes ("BR", "FR", "JP", ...). If this catalog's `country` field
// uses FIFA tri-codes (e.g. "BRA", "ARG", "ENG") instead of ISO alpha-2,
// add a small lookup table mapping those codes to ISO alpha-2 and normalize
// through it before calling regionNames.of(). Everything below is written
// so that swap is a one-line change inside `resolve()`.

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const nameCache = new Map<string, string>();

function resolve(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Resolves a country code (e.g. "BR") to its English display name
 * (e.g. "Brazil"). Falls back to the raw code if it can't be resolved.
 */
export function getCountryName(code?: string | null): string {
  if (!code) return "";
  const key = code.toUpperCase();
  const cached = nameCache.get(key);
  if (cached) return cached;

  const resolved = resolve(key);
  nameCache.set(key, resolved);
  return resolved;
}

export type CountryOption = { code: string; name: string };

/**
 * Builds a de-duplicated, alphabetically-sorted (by display name) list of
 * { code, name } pairs from a set of raw country codes. Used to populate
 * the country filter dropdown and the "group by country" view.
 */
export function getCountryOptions(
  codes: Iterable<string | undefined>,
): CountryOption[] {
  const unique = new Set<string>();
  for (const code of codes) {
    if (code) unique.add(code.toUpperCase());
  }
  return Array.from(unique)
    .map((code) => ({ code, name: getCountryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

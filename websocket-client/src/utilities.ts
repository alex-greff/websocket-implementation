// Source: https://stackoverflow.com/a/2140723
/**
 * Performs ASCII case-insensitive equality comparison between the two strings.
 * @param a 
 * @param b 
 * @returns 
 */
export function caseInsensitiveEquals(a: string, b: string) {
  return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
        : a === b;
}
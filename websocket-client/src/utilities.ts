// Source: https://stackoverflow.com/a/2140723
/**
 * Performs ASCII case-insensitive equality comparison between the two strings.
 * @param a String A
 * @param b String B
 * @returns Returns true iff a and b case insensitive equal each other.
 */
export function caseInsensitiveEquals(a: string, b: string): boolean {
  return typeof a === "string" && typeof b === "string"
    ? a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0
    : a === b;
}

/**
 * A simple function that always throws. Used as an indicator for a piece of
 * code that should never be reached.
 */
export function notReached(): never {
  throw new Error("Should not be reached");
}

// Source: https://stackoverflow.com/a/7820695
/**
 * Converts a boolean value to its integer representation.
 */
export function boolToInt(valBool: boolean): number {
  return +valBool;
}

// Source: https://www.samanthaming.com/tidbits/19-2-ways-to-convert-to-boolean/
/**
 * Converts an integer value to its boolean representation.
 */
export function intToBool(valInt: number): boolean {
  return Boolean(valInt);
}
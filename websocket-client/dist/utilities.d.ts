/**
 * Performs ASCII case-insensitive equality comparison between the two strings.
 * @param a String A
 * @param b String B
 * @returns Returns true iff a and b case insensitive equal each other.
 */
export declare function caseInsensitiveEquals(a: string, b: string): boolean;
/**
 * A simple function that always throws. Used as an indicator for a piece of
 * code that should never be reached.
 */
export declare function notReached(): never;
/**
 * Converts a boolean value to its integer representation.
 */
export declare function boolToInt(valBool: boolean): number;
/**
 * Converts an integer value to its boolean representation.
 */
export declare function intToBool(valInt: number): boolean;
/**
 * Gets the value of the byteNum'th byte in the given integer.
 * @param intVal The integer value to extract from.
 * @param byteNum The byte index number to extract.
 */
export declare function intGetByteAt(intVal: number, byteNum: number): number;
/**
 * Returns if the given value is "stringifiable"
 * (i.e. has the toString function).
 */
export declare function isStringifiable(value: any): boolean;
/**
 * Returns if the given value is a valid buffer.
 */
export declare function isBuffer(value: any): boolean;
/**
 * Prints the binary representation of the given decimal number.
 */
export declare function dec2bin(dec: number): string;

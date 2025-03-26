
/**
 * Type guard to check if a value is already a number
 * @param value - Any value to check
 * @returns true if the value is already a number type, false otherwise
 * @example
 * isNumber(123) // returns true
 * isNumber(-12.34) // returns true
 * isNumber("123") // returns false
 * isNumber(NaN) // returns false
 * isNumber(null) // returns false
 */
export function isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value can be converted to a valid number or is already a number
 * @param value - Any value to check
 * @returns true if the value can be converted to a valid number or is already a number, false otherwise
 * @example
 * isConvertibleToNumber("123") // returns true
 * isConvertibleToNumber(123) // returns true
 * isConvertibleToNumber("-12.34") // returns true
 * isConvertibleToNumber("abc") // returns false
 * isConvertibleToNumber(null) // returns false
 * isConvertibleToNumber(undefined) // returns false
 */
export function isConvertibleToNumber(value: any): value is number | string {
    if (isNumber(value)) return true;
    return !isNaN(Number(value));
}

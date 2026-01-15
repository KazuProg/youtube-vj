export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

/**
 * Normalizes a numeric value from string or number to number.
 * Handles percentage strings (e.g., "50%" -> 0.5) and regular numeric strings.
 *
 * @param value - String or number value to normalize
 * @returns Normalized number value
 */
export const normalizeNumericValue = (value: string | number): number => {
  if (typeof value === "number") {
    return value;
  }

  const str = String(value);

  if (str.includes("%")) {
    return Number.parseFloat(str.replace("%", "")) / 100;
  }

  return Number.parseFloat(str);
};

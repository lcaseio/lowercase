/**
 * Finds the duration between two date ISO strings in seconds.
 * If strings and undefined, does not subtract them.  Will also return undefined
 * if subtraction produces NaN.  Takes the absolute value of the final result
 * and converts to seconds.
 *
 * Used in quickly storing duration information in a RunIndex object.
 * @param startTime ISO date string
 * @param endTime ISO date string
 * @returns Duration in seconds or undefined
 */

export function getDuration(
  startTime: string | undefined,
  endTime: string | undefined,
): number | undefined {
  if (startTime === undefined || endTime === undefined) return;
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const duration = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(duration)) return;

  return Math.abs(duration) / 1000;
}

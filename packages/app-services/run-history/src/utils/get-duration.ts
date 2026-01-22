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

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

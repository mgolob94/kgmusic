import { addDaysIso, isoWeekday } from "./date";
import { holidayName } from "./holidays";

export const MAX_SERIES_DAYS = 800; // ~2 leti – zaščita pred napakami pri vnosu

/**
 * Vsi datumi tedenskega ponavljanja med startDate in endDate (vključno).
 * Prazniki se po želji preskočijo (ne ustvarijo se kot termini).
 */
export function seriesDates(opts: {
  weekday: number;
  startDate: string;
  endDate: string;
  skipHolidays: boolean;
}): { dates: string[]; skippedHolidays: { date: string; name: string }[] } {
  const { weekday, startDate, endDate, skipHolidays } = opts;
  const dates: string[] = [];
  const skippedHolidays: { date: string; name: string }[] = [];
  if (endDate < startDate) return { dates, skippedHolidays };

  const offset = (weekday - isoWeekday(startDate) + 7) % 7;
  let cur = addDaysIso(startDate, offset);
  while (cur <= endDate) {
    const h = skipHolidays ? holidayName(cur) : null;
    if (h) skippedHolidays.push({ date: cur, name: h });
    else dates.push(cur);
    cur = addDaysIso(cur, 7);
  }
  return { dates, skippedHolidays };
}

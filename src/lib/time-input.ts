/** »1530«, »15.30«, »15,30«, »9« → »15:30«, »15:30«, »15:30«, »09:00«. Neveljavnega vnosa ne spreminja. */
export function normalizeTime(raw: string): string {
  const t = raw.trim().replace(/[.,;\s]/g, ":");
  let h: string, m: string;
  if (/^\d{1,2}:\d{1,2}$/.test(t)) [h, m] = t.split(":");
  else if (/^\d{3,4}$/.test(t)) { h = t.slice(0, -2); m = t.slice(-2); }
  else if (/^\d{1,2}$/.test(t)) { h = t; m = "0"; }
  else return raw.trim();
  const hh = Number(h), mm = Number(m);
  if (hh > 23 || mm > 59) return raw.trim();
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

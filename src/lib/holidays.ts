import { addDaysIso } from "./date";

/** Velikonočna nedelja (anonimni gregorijanski algoritem). */
function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const cache = new Map<number, Map<string, string>>();

/** Državni prazniki (dela prosti dnevi) v Sloveniji za dano leto. */
export function slovenianHolidays(year: number): Map<string, string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const y = String(year);
  const e = easter(year);
  const map = new Map<string, string>([
    [`${y}-01-01`, "Novo leto"],
    [`${y}-01-02`, "Novo leto"],
    [`${y}-02-08`, "Prešernov dan"],
    [e, "Velika noč"],
    [addDaysIso(e, 1), "Velikonočni ponedeljek"],
    [`${y}-04-27`, "Dan upora proti okupatorju"],
    [`${y}-05-01`, "Praznik dela"],
    [`${y}-05-02`, "Praznik dela"],
    [addDaysIso(e, 49), "Binkošti"],
    [`${y}-06-25`, "Dan državnosti"],
    [`${y}-08-15`, "Marijino vnebovzetje"],
    [`${y}-10-31`, "Dan reformacije"],
    [`${y}-11-01`, "Dan spomina na mrtve"],
    [`${y}-12-25`, "Božič"],
    [`${y}-12-26`, "Dan samostojnosti in enotnosti"],
  ]);
  cache.set(year, map);
  return map;
}

export const holidayName = (iso: string) => slovenianHolidays(Number(iso.slice(0, 4))).get(iso) ?? null;

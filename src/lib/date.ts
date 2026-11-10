import {
  addDays,
  endOfMonth,
  format,
  getISODay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { sl } from "date-fns/locale";

/** Vsi datumi v aplikaciji so "lokalni" nizi YYYY-MM-DD in časi HH:MM (brez UTC → brez težav s poletnim časom). */
export const TZ = "Europe/Ljubljana";

const fmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Trenutni datum/čas v Ljubljani, neodvisno od časovnega pasu strežnika ali naprave. */
export function nowLjubljana(d: Date = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  const time = `${p.hour}:${p.minute}`;
  return { date, time, minutes: timeToMin(time) };
}

export const todayIso = () => nowLjubljana().date;

export const toDate = (iso: string) => parseISO(iso);
export const toIso = (d: Date) => format(d, "yyyy-MM-dd");
export const addDaysIso = (iso: string, n: number) => toIso(addDays(toDate(iso), n));
export const weekStartIso = (iso: string) => toIso(startOfWeek(toDate(iso), { weekStartsOn: 1 }));
export const monthStartIso = (iso: string) => toIso(startOfMonth(toDate(iso)));
export const monthEndIso = (iso: string) => toIso(endOfMonth(toDate(iso)));
export const isoWeekday = (iso: string) => getISODay(toDate(iso)); // 1 = pon … 7 = ned

export const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const endTime = (start: string, durationMin: number) => minToTime(timeToMin(start) + durationMin);

export const fmtDate = (iso: string) => format(toDate(iso), "dd. MM. yyyy");
export const fmtDayShort = (iso: string) => format(toDate(iso), "EEE, d. M.", { locale: sl });
export const fmtDayLong = (iso: string) => {
  const s = format(toDate(iso), "EEEE, d. MMMM", { locale: sl });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const fmtMonth = (iso: string) => {
  const s = format(toDate(iso), "LLLL yyyy", { locale: sl });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const WEEKDAYS = [
  { value: 1, label: "Ponedeljek", short: "Pon" },
  { value: 2, label: "Torek", short: "Tor" },
  { value: 3, label: "Sreda", short: "Sre" },
  { value: 4, label: "Četrtek", short: "Čet" },
  { value: 5, label: "Petek", short: "Pet" },
  { value: 6, label: "Sobota", short: "Sob" },
  { value: 7, label: "Nedelja", short: "Ned" },
] as const;

/** Privzeti obseg novega tedenskega termina glede na sezono (privzeto sept–jun). */
export function seasonDefaults(today: string, startMonth = 9, endMonth = 6) {
  const d = toDate(today);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  // Ali smo trenutno znotraj sezone? (sezona lahko prečka novo leto)
  const inSeason = startMonth > endMonth ? m >= startMonth || m <= endMonth : m >= startMonth && m <= endMonth;
  const endYear = startMonth > endMonth ? (m >= startMonth ? y + 1 : y) : y;
  const lastDay = (yy: number, mm: number) => toIso(endOfMonth(new Date(yy, mm - 1, 1)));
  if (inSeason) return { start: today, end: lastDay(endYear, endMonth) };
  const startYear = m < startMonth ? y : y + 1;
  const nextStart = `${m < startMonth ? y : startYear}-${String(startMonth).padStart(2, "0")}-01`;
  const eYear = startMonth > endMonth ? Number(nextStart.slice(0, 4)) + 1 : Number(nextStart.slice(0, 4));
  return { start: nextStart, end: lastDay(eYear, endMonth) };
}

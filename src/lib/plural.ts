/** Slovenska množina: 1 termin, 2 termina, 3–4 termini, 5+ terminov (velja tudi za 101, 102 …). */
export function plural(n: number, one: string, two: string, few: string, many: string) {
  const m = n % 100;
  if (m === 1) return one;
  if (m === 2) return two;
  if (m === 3 || m === 4) return few;
  return many;
}

export const terminov = (n: number) => `${n} ${plural(n, "termin", "termina", "termini", "terminov")}`;

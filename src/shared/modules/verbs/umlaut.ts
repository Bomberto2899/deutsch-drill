const UMLAUT: Record<string, string> = { au: 'äu', a: 'ä', o: 'ö', u: 'ü' };

/** Umlaut the last a/o/u/au: kam → käm, fuhr → führ, schloss → schlöss, lauf → läuf. */
export function umlautLast(s: string): string {
  return s.replace(/(au|[aou])(?=[^aou]*$)/, (m) => UMLAUT[m]);
}

/** Remove umlauts: fähr → fahr, läuf → lauf. */
export function removeUmlauts(s: string): string {
  return s.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
}

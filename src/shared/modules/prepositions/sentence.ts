/** Split "Wir gehen [ins] Kino." into the text around the blank and the blank's form ("ins"). */
export function splitBlank(text: string): { before: string; blank: string; after: string } {
  const m = text.match(/^([^[\]]*)\[([^[\]]+)\]([^[\]]*)$/);
  if (!m) throw new Error(`sentence needs exactly one [blank]: "${text}"`);
  return { before: m[1], blank: m[2].trim(), after: m[3] };
}

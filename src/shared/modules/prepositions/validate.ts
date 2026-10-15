import { splitBlank } from './sentence.ts';
import { CASES, type Case, type Preposition, type Sentence, type SentenceCase } from './types.ts';

const SENTENCE_CASES: SentenceCase[] = ['akkusativ', 'dativ', 'genitiv'];

/** Turn parsed TOML into a Preposition, throwing a readable error for anything malformed. */
export function toPreposition(id: string, data: Record<string, unknown>): Preposition {
  for (const key of ['preposition', 'meaning', 'case']) {
    if (typeof data[key] !== 'string' || !(data[key] as string).trim()) throw new Error(`missing or empty "${key}"`);
  }
  if (data.notes !== undefined && typeof data.notes !== 'string') throw new Error('"notes" must be a string');
  const fileCase = (data.case as string).trim() as Case;
  if (!CASES.includes(fileCase)) throw new Error(`"case" must be one of ${CASES.join(' | ')}, got "${fileCase}"`);
  const tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) throw new Error('"tags" must be a list of strings');

  const accept = data.accept ?? [];
  if (!Array.isArray(accept) || accept.some((t) => typeof t !== 'string')) throw new Error('"accept" must be a list of strings');

  const raw = data.sentences;
  if (!Array.isArray(raw) || !raw.length) throw new Error('needs at least one [[sentences]] entry');
  const sentences = raw.map((s: Record<string, unknown>, i): Sentence => {
    const where = `sentence ${i + 1}`;
    if (typeof s !== 'object' || typeof s.text !== 'string' || !s.text.trim()) throw new Error(`${where}: missing "text"`);
    try {
      splitBlank(s.text);
    } catch (e) {
      throw new Error(`${where}: ${(e as Error).message}`);
    }
    if (s.translation !== undefined && typeof s.translation !== 'string') throw new Error(`${where}: "translation" must be a string`);
    const c = s.case ?? (fileCase === 'wechsel' ? undefined : fileCase);
    if (c === undefined) throw new Error(`${where}: two-way preposition, so "case" (akkusativ or dativ) is required`);
    if (!SENTENCE_CASES.includes(c as SentenceCase)) {
      throw new Error(`${where}: "case" must be one of ${SENTENCE_CASES.join(' | ')}, got "${c}"`);
    }
    return { text: s.text.trim(), translation: (s.translation as string | undefined)?.trim() || undefined, case: c as SentenceCase };
  });

  return {
    id,
    preposition: (data.preposition as string).trim(),
    accept: (accept as string[]).map((a) => a.trim()).filter(Boolean),
    meaning: (data.meaning as string).trim(),
    case: fileCase,
    notes: (data.notes as string | undefined)?.trim() || undefined,
    tags: tags as string[],
    sentences,
  };
}

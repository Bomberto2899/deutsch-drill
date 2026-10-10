export interface CheckingConfig {
  case_sensitive: boolean;
  accept_ss_for_eszett: boolean;
}

export const DEFAULT_CHECKING: CheckingConfig = {
  case_sensitive: false,
  accept_ss_for_eszett: true,
};

function normalize(s: string, cfg: CheckingConfig): string {
  // Trailing punctuation is ignored, so "geh!" matches the Imperativ "geh".
  let out = s.trim().replace(/[!.]+$/, '').trim().replace(/\s+/g, ' ');
  if (!cfg.case_sensitive) out = out.toLowerCase();
  if (cfg.accept_ss_for_eszett) out = out.replace(/ß/g, 'ss');
  return out;
}

/**
 * True if `input` matches one of `answers`. A leading pronoun the user typed out of habit
 * ("ich gehe") is ignored when it is one of `pronouns`.
 */
export function isCorrect(input: string, answers: string[], cfg: CheckingConfig, pronouns: string[] = []): boolean {
  const candidates = [normalize(input, cfg)];
  const words = input.trim().split(/\s+/);
  if (words.length > 1 && pronouns.some((p) => p.toLowerCase() === words[0].toLowerCase())) {
    candidates.push(normalize(words.slice(1).join(' '), cfg));
  }
  return answers.some((a) => candidates.includes(normalize(a, cfg)));
}

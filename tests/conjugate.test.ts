import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import { conjugate } from '../src/shared/modules/verbs/conjugate.ts';
import { praesens } from '../src/shared/modules/verbs/tenses/praesens.ts';
import { praeteritum } from '../src/shared/modules/verbs/tenses/praeteritum.ts';
import { perfekt } from '../src/shared/modules/verbs/tenses/perfekt.ts';
import { tense } from '../src/shared/modules/verbs/tenses/index.ts';
import { toVerb } from '../src/shared/modules/verbs/validate.ts';
import { derivedTags } from '../src/shared/modules/verbs/tags.ts';
import { isCorrect, DEFAULT_CHECKING } from '../src/shared/answer.ts';
import type { TenseGroup, Verb } from '../src/shared/modules/verbs/types.ts';

const DIR = join(import.meta.dirname, '..', 'defaults', 'verbs');
const verbs = new Map<string, Verb>();
for (const f of readdirSync(DIR)) {
  const id = f.replace(/\.toml$/, '');
  const v = toVerb(id, parse(readFileSync(join(DIR, f), 'utf8')));
  verbs.set(v.infinitive, v);
}

// ich, du, er, wir, ihr, sie
const EXPECTED: Record<string, string> = {
  sein: 'bin bist ist sind seid sind',
  haben: 'habe hast hat haben habt haben',
  werden: 'werde wirst wird werden werdet werden',
  können: 'kann kannst kann können könnt können',
  müssen: 'muss musst muss müssen müsst müssen',
  dürfen: 'darf darfst darf dürfen dürft dürfen',
  wollen: 'will willst will wollen wollt wollen',
  mögen: 'mag magst mag mögen mögt mögen',
  wissen: 'weiß weißt weiß wissen wisst wissen',
  tun: 'tue tust tut tun tut tun',
  machen: 'mache machst macht machen macht machen',
  arbeiten: 'arbeite arbeitest arbeitet arbeiten arbeitet arbeiten',
  finden: 'finde findest findet finden findet finden',
  öffnen: 'öffne öffnest öffnet öffnen öffnet öffnen',
  atmen: 'atme atmest atmet atmen atmet atmen',
  lernen: 'lerne lernst lernt lernen lernt lernen',
  kommen: 'komme kommst kommt kommen kommt kommen',
  heißen: 'heiße heißt heißt heißen heißt heißen',
  reisen: 'reise reist reist reisen reist reisen',
  tanzen: 'tanze tanzt tanzt tanzen tanzt tanzen',
  sammeln: 'sammle sammelst sammelt sammeln sammelt sammeln',
  lächeln: 'lächle lächelst lächelt lächeln lächelt lächeln',
  wandern: 'wandere wanderst wandert wandern wandert wandern',
  feiern: 'feiere feierst feiert feiern feiert feiern',
  geben: 'gebe gibst gibt geben gebt geben',
  nehmen: 'nehme nimmst nimmt nehmen nehmt nehmen',
  sehen: 'sehe siehst sieht sehen seht sehen',
  lesen: 'lese liest liest lesen lest lesen',
  essen: 'esse isst isst essen esst essen',
  vergessen: 'vergesse vergisst vergisst vergessen vergesst vergessen',
  lassen: 'lasse lässt lässt lassen lasst lassen',
  fahren: 'fahre fährst fährt fahren fahrt fahren',
  waschen: 'wasche wäschst wäscht waschen wascht waschen',
  wachsen: 'wachse wächst wächst wachsen wachst wachsen',
  halten: 'halte hältst hält halten haltet halten',
  raten: 'rate rätst rät raten ratet raten',
  gelten: 'gelte giltst gilt gelten geltet gelten',
  treten: 'trete trittst tritt treten tretet treten',
  empfehlen: 'empfehle empfiehlst empfiehlt empfehlen empfehlt empfehlen',
  bitten: 'bitte bittest bittet bitten bittet bitten',
  sitzen: 'sitze sitzt sitzt sitzen sitzt sitzen',
  schließen: 'schließe schließt schließt schließen schließt schließen',
};

const SEPARABLE: Record<string, string> = {
  anfangen: 'fange an|fängst an|fängt an|fangen an|fangt an|fangen an',
  einladen: 'lade ein|lädst ein|lädt ein|laden ein|ladet ein|laden ein',
  fernsehen: 'sehe fern|siehst fern|sieht fern|sehen fern|seht fern|sehen fern',
  kennenlernen: 'lerne kennen|lernst kennen|lernt kennen|lernen kennen|lernt kennen|lernen kennen',
  aufstehen: 'stehe auf|stehst auf|steht auf|stehen auf|steht auf|stehen auf',
};

function table(inf: string): string[] {
  const v = verbs.get(inf);
  if (!v) throw new Error(`no verb file for ${inf}`);
  const c = conjugate(v, praesens);
  return praesens.persons.map((p) => c[p]![0]);
}

describe('Präsens', () => {
  for (const [inf, forms] of Object.entries(EXPECTED)) {
    it(inf, () => expect(table(inf)).toEqual(forms.split(' ')));
  }
  for (const [inf, forms] of Object.entries(SEPARABLE)) {
    it(inf, () => expect(table(inf)).toEqual(forms.split('|')));
  }
  it('conjugates every shipped verb', () => {
    for (const v of verbs.values()) {
      const c = conjugate(v, praesens);
      for (const p of praesens.persons) expect(c[p]?.[0], `${v.infinitive} ${p}`).toBeTruthy();
    }
  });
});

describe('derived tags', () => {
  it.each([
    ['machen', ['regular']],
    ['gehen', ['irregular']],
    ['bringen', ['mixed']],
    ['fahren', ['irregular', 'stem-change']],
    ['einkaufen', ['regular', 'separable']],
    ['anfangen', ['irregular', 'separable', 'stem-change']],
    ['arbeiten', ['regular']],
    ['sammeln', ['regular']],
    ['sollen', ['mixed', 'stem-change']],
  ])('%s', (inf, tags) => expect(derivedTags(verbs.get(inf)!)).toEqual(tags));
});

describe('answer checking', () => {
  const cfg = DEFAULT_CHECKING;
  it('ignores case', () => expect(isCorrect('Gehe', ['gehe'], cfg)).toBe(true));
  it('requires umlauts', () => expect(isCorrect('fahrst', ['fährst'], cfg)).toBe(false));
  it('accepts ss for ß', () => expect(isCorrect('weisst', ['weißt'], cfg)).toBe(true));
  it('rejects ss for ß when disabled', () =>
    expect(isCorrect('weisst', ['weißt'], { ...cfg, accept_ss_for_eszett: false })).toBe(false));
  it('strips a typed pronoun', () => expect(isCorrect('ich gehe', ['gehe'], cfg, ['ich'])).toBe(true));
  it('ignores a trailing !', () => expect(isCorrect('geh!', ['geh'], cfg)).toBe(true));
  it('collapses whitespace', () => expect(isCorrect('  fange   an ', ['fange an'], cfg)).toBe(true));
});

function tableFor(inf: string, tense: TenseGroup): string[] {
  const v = verbs.get(inf);
  if (!v) throw new Error(`no verb file for ${inf}`);
  const c = conjugate(v, tense);
  return tense.persons.map((p) => c[p]![0]);
}

// ich | du | er | wir | ihr | sie
const PRAETERITUM: Record<string, string> = {
  machen: 'machte|machtest|machte|machten|machtet|machten',
  arbeiten: 'arbeitete|arbeitetest|arbeitete|arbeiteten|arbeitetet|arbeiteten',
  sein: 'war|warst|war|waren|wart|waren',
  haben: 'hatte|hattest|hatte|hatten|hattet|hatten',
  werden: 'wurde|wurdest|wurde|wurden|wurdet|wurden',
  können: 'konnte|konntest|konnte|konnten|konntet|konnten',
  gehen: 'ging|gingst|ging|gingen|gingt|gingen',
  halten: 'hielt|hieltest|hielt|hielten|hieltet|hielten',
  finden: 'fand|fandest|fand|fanden|fandet|fanden',
  stehen: 'stand|standest|stand|standen|standet|standen',
  tun: 'tat|tatest|tat|taten|tatet|taten',
  lesen: 'las|lasest|las|lasen|last|lasen',
  essen: 'aß|aßest|aß|aßen|aßt|aßen',
  schließen: 'schloss|schlossest|schloss|schlossen|schlosst|schlossen',
  waschen: 'wusch|wuschst|wusch|wuschen|wuscht|wuschen',
  wachsen: 'wuchs|wuchsest|wuchs|wuchsen|wuchst|wuchsen',
  anfangen: 'fing an|fingst an|fing an|fingen an|fingt an|fingen an',
  einladen: 'lud ein|ludest ein|lud ein|luden ein|ludet ein|luden ein',
  einkaufen: 'kaufte ein|kauftest ein|kaufte ein|kauften ein|kauftet ein|kauften ein',
  bringen: 'brachte|brachtest|brachte|brachten|brachtet|brachten',
};

const PERFEKT: Record<string, string> = {
  gehen: 'bin gegangen|bist gegangen|ist gegangen|sind gegangen|seid gegangen|sind gegangen',
  machen: 'habe gemacht|hast gemacht|hat gemacht|haben gemacht|habt gemacht|haben gemacht',
  aufstehen: 'bin aufgestanden|bist aufgestanden|ist aufgestanden|sind aufgestanden|seid aufgestanden|sind aufgestanden',
  sein: 'bin gewesen|bist gewesen|ist gewesen|sind gewesen|seid gewesen|sind gewesen',
};

describe('Präteritum', () => {
  for (const [inf, forms] of Object.entries(PRAETERITUM)) {
    it(inf, () => expect(tableFor(inf, praeteritum)).toEqual(forms.split('|')));
  }
});

describe('Perfekt', () => {
  for (const [inf, forms] of Object.entries(PERFEKT)) {
    it(inf, () => expect(tableFor(inf, perfekt)).toEqual(forms.split('|')));
  }
  it('rejects a perfekt without hat/ist', () =>
    expect(() => toVerb('x', { infinitive: 'machen', third_person: 'macht', praeteritum: 'machte', perfekt: 'gemacht', meaning: 'x' })).toThrow(/hat <participle>/));
});

const IMPERATIV: Record<string, string> = {
  // du (all accepted, first is shown) ; ihr ; Sie ; wir
  machen: 'mach,mache;macht;machen Sie;machen wir',
  geben: 'gib;gebt;geben Sie;geben wir',
  lesen: 'lies;lest;lesen Sie;lesen wir',
  essen: 'iss;esst;essen Sie;essen wir',
  fahren: 'fahr,fahre;fahrt;fahren Sie;fahren wir',
  halten: 'halte,halt;haltet;halten Sie;halten wir',
  arbeiten: 'arbeite;arbeitet;arbeiten Sie;arbeiten wir',
  öffnen: 'öffne;öffnet;öffnen Sie;öffnen wir',
  sammeln: 'sammle;sammelt;sammeln Sie;sammeln wir',
  wandern: 'wandere,wandre;wandert;wandern Sie;wandern wir',
  tun: 'tu,tue;tut;tun Sie;tun wir',
  anfangen: 'fang an,fange an;fangt an;fangen Sie an;fangen wir an',
  mitnehmen: 'nimm mit;nehmt mit;nehmen Sie mit;nehmen wir mit',
  sein: 'sei;seid;seien Sie;seien wir',
  haben: 'hab,habe;habt;haben Sie;haben wir',
  werden: 'werde;werdet;werden Sie;werden wir',
};

describe('Imperativ', () => {
  const t = tense('imperativ')!;
  for (const [inf, spec] of Object.entries(IMPERATIV)) {
    it(inf, () => {
      const c = conjugate(verbs.get(inf)!, t);
      const [du, ihr, sie, wir] = spec.split(';');
      expect(c.du).toEqual(du.split(','));
      expect([c.ihr![0], c.sie![0], c.wir![0]]).toEqual([ihr, sie, wir]);
    });
  }
  it('modals and wissen have none', () => {
    for (const inf of ['können', 'müssen', 'wollen', 'wissen']) expect(conjugate(verbs.get(inf)!, t)).toEqual({});
  });
});

describe('Konjunktiv II', () => {
  const t = tense('konjunktiv2')!;
  const answers = (inf: string, p: 'ich' | 'du' | 'ihr') => conjugate(verbs.get(inf)!, t)[p];
  it('one-word only for sein/haben/werden, modals, wissen', () => {
    expect(answers('sein', 'ich')).toEqual(['wäre']);
    expect(answers('sein', 'du')).toEqual(['wärst', 'wärest']);
    expect(answers('haben', 'du')).toEqual(['hättest']);
    expect(answers('werden', 'ihr')).toEqual(['würdet']);
    expect(answers('können', 'ich')).toEqual(['könnte']);
    expect(answers('mögen', 'ich')).toEqual(['möchte']);
    expect(answers('sollen', 'ich')).toEqual(['sollte']);
    expect(answers('wissen', 'ich')).toEqual(['wüsste']);
  });
  it('würde-form first, one-word form accepted', () => {
    expect(answers('gehen', 'ich')).toEqual(['würde gehen', 'ginge']);
    expect(answers('fahren', 'du')).toEqual(['würdest fahren', 'führest']);
    expect(answers('schließen', 'ich')).toEqual(['würde schließen', 'schlösse']);
    expect(answers('anfangen', 'ich')).toEqual(['würde anfangen', 'finge an']);
    expect(answers('machen', 'ich')).toEqual(['würde machen', 'machte']);
    expect(answers('bringen', 'ich')).toEqual(['würde bringen', 'brächte']);
    expect(answers('helfen', 'ich')).toEqual(['würde helfen', 'hülfe', 'hälfe']);
  });
});

describe('compound tenses', () => {
  const row = (inf: string, id: string) => { const t = tense(id)!; const c = conjugate(verbs.get(inf)!, t); return t.persons.map((p) => c[p]!.join('|')); };
  it('Plusquamperfekt', () => {
    expect(row('gehen', 'plusquamperfekt')).toEqual(['war gegangen', 'warst gegangen', 'war gegangen', 'waren gegangen', 'wart gegangen', 'waren gegangen']);
    expect(row('anfangen', 'plusquamperfekt')[1]).toBe('hattest angefangen');
  });
  it('Futur I', () => {
    expect(row('anfangen', 'futur1')).toEqual(['werde anfangen', 'wirst anfangen', 'wird anfangen', 'werden anfangen', 'werdet anfangen', 'werden anfangen']);
  });
  it('Konjunktiv II Vergangenheit', () => {
    expect(row('gehen', 'konjunktiv2_past')).toEqual(['wäre gegangen', 'wärst gegangen|wärest gegangen', 'wäre gegangen', 'wären gegangen', 'wärt gegangen|wäret gegangen', 'wären gegangen']);
    expect(row('machen', 'konjunktiv2_past')[0]).toBe('hätte gemacht');
  });
});

describe('Konjunktiv I, Futur II, passive', () => {
  const row = (inf: string, id: string) => { const t = tense(id)!; const c = conjugate(verbs.get(inf)!, t); return t.persons.map((p) => (c[p] ?? []).join('|')); };
  it('Konjunktiv I', () => {
    expect(row('sein', 'konjunktiv1')).toEqual(['sei', 'seist|seiest', 'sei', 'seien', 'seiet', 'seien']);
    expect(row('haben', 'konjunktiv1')).toEqual(['habe', 'habest', 'habe', 'haben', 'habet', 'haben']);
    expect(row('können', 'konjunktiv1')[2]).toBe('könne');
    expect(row('anfangen', 'konjunktiv1')[1]).toBe('fangest an');
    expect(row('sammeln', 'konjunktiv1')[2]).toBe('sammle');
    expect(row('wandern', 'konjunktiv1')[2]).toBe('wandere|wandre');
  });
  it('Konjunktiv I Vergangenheit', () => {
    expect(row('gehen', 'konjunktiv1_past')[2]).toBe('sei gegangen');
    expect(row('machen', 'konjunktiv1_past')[1]).toBe('habest gemacht');
  });
  it('Futur II', () => {
    expect(row('gehen', 'futur2')[0]).toBe('werde gegangen sein');
    expect(row('anfangen', 'futur2')[2]).toBe('wird angefangen haben');
  });
  it('passive only for transitive verbs', () => {
    expect(row('anrufen', 'passiv_praesens')[2]).toBe('wird angerufen');
    expect(row('anrufen', 'passiv_perfekt')[5]).toBe('sind angerufen worden');
    expect(row('bauen', 'passiv_futur1')[2]).toBe('wird gebaut werden');
    expect(row('bauen', 'passiv_konjunktiv2_past')[2]).toBe('wäre gebaut worden');
    expect(row('bauen', 'zustandspassiv')[2]).toBe('ist gebaut');
    expect(conjugate(verbs.get('schlafen')!, tense('passiv_praesens')!)).toEqual({});
    expect(conjugate(verbs.get('gehen')!, tense('passiv_praesens')!)).toEqual({});
  });
  it('default persons: Konjunktiv I er, passive er + sie', async () => {
    const { DEFAULT_VERB_SETTINGS } = await import('../src/shared/modules/verbs/settings.ts');
    expect(DEFAULT_VERB_SETTINGS.tenses.konjunktiv1.persons).toEqual(['er']);
    expect(DEFAULT_VERB_SETTINGS.tenses.passiv_praesens.persons).toEqual(['er', 'sie']);
    expect(DEFAULT_VERB_SETTINGS.tenses.praeteritum.persons).toHaveLength(6);
  });
});

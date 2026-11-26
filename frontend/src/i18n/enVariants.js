// Английский для Великобритании и Канады. Словарь у них общий с основным английским (dict.en.js,
// американское написание), а отличия — в написании слов. Поэтому отдельного словаря нет:
// готовый английский перевод проходит через правила ниже.
//
//   Великобритания: colour, centre/metre/fibre, catalogue, -ise (organise, organisation), labelled, licence (сущ.),
//                   flat вместо apartment, number plate.
//   Канада:         colour, centre/metre/fibre, catalogue, labelled, licence (сущ.), но -ize остаётся, как в США
//                   (рекомендация Canadian Oxford Dictionary), apartment и licence plate — тоже канадские слова.

// пары «американское → британское/канадское»; слово ищется целиком, регистр первой буквы сохраняется
const COMMON = {
  color: 'colour', colors: 'colours', colored: 'coloured', colorful: 'colourful',
  favorite: 'favourite', favorites: 'favourites', behavior: 'behaviour', labor: 'labour', neighbor: 'neighbour',
  center: 'centre', centers: 'centres', theater: 'theatre', fiber: 'fibre', fibers: 'fibres', liter: 'litre', liters: 'litres',
  catalog: 'catalogue', catalogs: 'catalogues', dialog: 'dialogue',
  labeled: 'labelled', labeling: 'labelling', troweling: 'trowelling', traveled: 'travelled', modeling: 'modelling',
  canceled: 'cancelled', canceling: 'cancelling', leveled: 'levelled', leveling: 'levelling', fueling: 'fuelling',
  defense: 'defence', offense: 'offence', license: 'licence', gray: 'grey', enrollment: 'enrolment',
  // метры как единица — metres; «meter» как прибор (gas meter, water meter) пишется одинаково
  'square meter': 'square metre', 'square meters': 'square metres', 'cubic meter': 'cubic metre', 'cubic meters': 'cubic metres',
  'linear meter': 'linear metre', 'linear meters': 'linear metres', 'running meter': 'running metre', 'running meters': 'running metres',
};
const GB_ONLY = {
  aluminum: 'aluminium', tire: 'tyre', tires: 'tyres', curb: 'kerb', mold: 'mould', plow: 'plough',
  apartment: 'flat', apartments: 'flats', 'license plate': 'number plate', 'inter-apartment': 'inter-flat',
  analyze: 'analyse', analyzed: 'analysed', analyzing: 'analysing', analyzes: 'analyses', paralyze: 'paralyse',
};
const CA_ONLY = { 'license plate': 'licence plate' };

// -ize → -ise только для британского. Слова, где -ize не суффикс, не трогаем.
const KEEP_IZE = new Set(['size', 'sized', 'sizes', 'sizing', 'resize', 'resized', 'resizing', 'oversize', 'oversized', 'undersized', 'prize', 'prizes', 'seize', 'seized', 'capsize', 'downsize', 'citizen', 'citizens', 'maize', 'bizarre', 'baptize']);
function ise(word) {
  const low = word.toLowerCase();
  if (KEEP_IZE.has(low) || low.length < 6) return word;
  return word.replace(/iz(e|es|ed|ing|er|ers|ation|ations|ational)$/, 'is$1').replace(/IZ(E|ES|ED|ING|ATION)$/, 'IS$1');
}

function buildMap(extra) {
  const all = { ...COMMON, ...extra };
  // длинные сочетания раньше коротких: «license plate» раньше «license»
  const keys = Object.keys(all).sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${keys.map((k) => k.replace(/[-]/g, '\\-')).join('|')})\\b`, 'gi');
  return (s) => s.replace(re, (m) => {
    const out = all[m.toLowerCase()];
    if (out == null) return m;
    if (m === m.toUpperCase() && m !== m.toLowerCase()) return out.toUpperCase();
    return m[0] === m[0].toUpperCase() ? out[0].toUpperCase() + out.slice(1) : out;
  });
}
const gbMap = buildMap(GB_ONLY);
const caMap = buildMap(CA_ONLY);

export const RESPELL = {
  'en-GB': (s) => gbMap(s).replace(/\b[A-Za-z]{4,}(?:ize|izes|ized|izing|izer|izers|ization|izations|izational)\b/gi, ise),
  'en-CA': (s) => caMap(s),
};

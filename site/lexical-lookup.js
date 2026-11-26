import { wordToken } from "./grammar.js?v=20261126-lexical";
import { lexicalSpellings } from "./lexical-spellings.js?v=20261126-lexical";
import { reverseLookup } from "./reverse.js?v=20261126-lexical";

export const hasKanji = (text) => /[\p{Script=Han}々]/u.test(text);
const kana = (text) => text.replace(/[\u30a1-\u30f6]/g,
  (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

const generalReadings = new Map();
for (const [reading, forms] of Object.entries(lexicalSpellings.spellings)) {
  for (const form of forms) {
    for (const prefix of ["", ...lexicalSpellings.prefixes]) {
      const surface = prefix + form;
      const readings = generalReadings.get(surface) ?? new Set();
      readings.add(prefix + reading);
      generalReadings.set(surface, readings);
    }
  }
}

const godanClasses = {
  カ: "GodanK", ガ: "GodanG", サ: "GodanS", タ: "GodanT", ナ: "GodanN",
  バ: "GodanB", マ: "GodanM", ラ: "GodanR", ワ: "GodanW",
};

export function verbClass(type, reading) {
  if (type === "一段" || type?.startsWith("一段・")) {
    const vowel = [...reading].at(-2);
    if (vowel && "いきぎしじちぢにひびぴみり".includes(vowel)) return "IchidanUpper";
    if (vowel && "えけげせぜてでねへべぺめれ".includes(vowel)) return "IchidanLower";
  }
  if (type?.startsWith("サ変")) return "Suru";
  if (type?.startsWith("カ変")) return "Kuru";
  if (type?.startsWith("五段")) {
    if (type.includes("促音便ユク")) return "Iku";
    if (reading === "ある" && type.includes("ラ行特殊")) return "Aru";
    const row = type.match(/・(.)行/u)?.[1];
    return godanClasses[row];
  }
}

export async function lookupSpelling(surface, rules, lookup = reverseLookup, tokenize = wordToken) {
  const matches = new Map();
  const add = (reading, candidate) => {
    matches.set(candidate.strokes, { ...candidate, reading });
  };
  const searches = [...(generalReadings.get(surface) ?? [])].map(async (reading) => {
    const { all } = await lookup(reading, [], rules, { wordOnly: true });
    for (const candidate of all)
      if (candidate.segments[0]?.[2] === 3) add(reading, candidate);
  });
  if (!searches.length) {
    searches.push((async () => {
      const token = await tokenize(surface);
      if (token?.pos !== "動詞" || token.basic_form !== surface || !token.reading) return;
      const reading = kana(token.reading);
      const expected = verbClass(token.conjugated_type, reading);
      if (!expected) return;
      const { all } = await lookup(reading, [], rules, { wordOnly: true });
      for (const candidate of all) {
        if (candidate.verb_form === 5 &&
            (candidate.verb_class === expected ||
             (expected === "Iku" && candidate.verb_class === "GodanK") ||
             (expected === "Aru" && candidate.verb_class === "GodanR")))
          add(reading, candidate);
      }
    })());
  }
  await Promise.all(searches);
  return [...matches.values()].sort((a, b) => a.strokes.localeCompare(b.strokes));
}

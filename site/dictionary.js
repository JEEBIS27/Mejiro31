import { ruleId } from "./rules.js";
import { verbEndings } from "./verb-endings.js";
export const ruleNames = [
  "ユーザー辞書",
  "一般略語（全体）",
  "一般略語（左）",
  "一般略語（右）",
  "動詞",
];
export function dictionaryReading(rule) {
  return rule.kind === 4 && !rule.hidden
    ? rule.value + (verbEndings[rule.row] ?? "")
    : rule.value;
}
export function searchDictionary(builtins, overrides, query = "", kind = "") {
  const entries = new Map(
    builtins.map((rule) => [ruleId(rule), { ...rule, custom: false }]),
  );
  for (const rule of overrides)
    entries.set(ruleId(rule), { ...rule, custom: true });
  const normalize = (text) => text.normalize("NFKC").toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const exact = terms.length === 1 ? terms[0] : "";
  const rank = (rule) => exact
    ? normalize(dictionaryReading(rule)) === exact ? 0 :
      [rule.key, rule.value].some((value) => normalize(value) === exact) ? 1 : 2
    : 0;
  return [...entries.values()].filter(
    (rule) =>
      (kind === "" || rule.kind === Number(kind)) &&
      terms.every((term) =>
        normalize(
          `${ruleNames[rule.kind]} ${rule.key} ${rule.value} ${dictionaryReading(rule)} ${rule.row} ${rule.hidden ? "無効" : ""} ${rule.custom ? "ユーザー設定" : "標準"}`,
        ).includes(term),
      ),
  ).sort((a, b) => rank(a) - rank(b));
}

import { ruleId } from "./rules.js";
export const ruleNames = [
  "ユーザー辞書",
  "一般略語（全体）",
  "一般略語（左）",
  "一般略語（右）",
  "動詞",
];
export function searchDictionary(builtins, overrides, query = "", kind = "") {
  const entries = new Map(
    builtins.map((rule) => [ruleId(rule), { ...rule, custom: false }]),
  );
  for (const rule of overrides)
    entries.set(ruleId(rule), { ...rule, custom: true });
  const normalize = (text) => text.normalize("NFKC").toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return [...entries.values()].filter(
    (rule) =>
      (kind === "" || rule.kind === Number(kind)) &&
      terms.every((term) =>
        normalize(
          `${ruleNames[rule.kind]} ${rule.key} ${rule.value} ${rule.row} ${rule.hidden ? "無効" : ""} ${rule.custom ? "ユーザー設定" : "標準"}`,
        ).includes(term),
      ),
  );
}

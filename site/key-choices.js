import { keyName } from "./key-names.js?v=20261029-names2";
import { supportedCode } from "./model.js";
export function keyChoices(
  data,
  nameFor,
  { hold = false, steno = false } = {},
) {
  const aliases = new Map();
  for (const { name, value } of data.keycodes) {
    if (!aliases.has(value)) aliases.set(value, []);
    aliases.get(value).push(name);
  }
  return [...aliases]
    .filter(([code]) => {
      if (!supportedCode(code)) return false;
      const mod = code >= 0xe0 && code <= 0xe7;
      const layer = code >= 0x5220 && code <= 0x5225;
      if (hold) return code <= 1 || mod || layer;
      if (code >= 0x74c0 && code <= 0x74e9) return steno;
      return !mod && !layer;
    })
    .map(([value, names]) => {
      const human = keyName(value, names[0]);
      return {
        value,
        label: human.label,
        code: nameFor(value),
        search: `${human.label} ${human.search} ${names.join(" ")} ${nameFor(value)}`,
      };
    })
    .sort((a, b) => a.value - b.value);
}
const searchText = new WeakMap();
export function searchChoices(choices, query) {
  const normalize = (text) =>
    text.normalize("NFKC").toUpperCase().replace(/\s+/g, "");
  const terms = query.trim().split(/\s+/).filter(Boolean).map(normalize);
  return choices
    .filter((choice) =>
      terms.every((term) => {
        if (!searchText.has(choice))
          searchText.set(choice, normalize(choice.search));
        return searchText.get(choice).includes(term);
      }),
    )
    .sort((a, b) => {
      const rank = (c) =>
        (c.label.includes(" + ") ? 2 : 0) + (c.label.includes("ISO") ? 1 : 0);
      return rank(a) - rank(b);
    });
}

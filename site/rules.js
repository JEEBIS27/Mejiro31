// Mejiro Engine's fixed-size runtime rule format (native/mejiro.h).
export const RULE_CAPACITY = 24;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const patterns = [
  /^#?S?T?K?N?Y?I?A?U?n?t?k?-S?T?K?N?Y?I?A?U?n?t?k?\*?$/,
  /^S?T?K?N?Y?I?A?U?-S?T?K?N?Y?I?A?U?\*?$/,
  /^S?T?K?N?Y?I?A?U?$/,
  /^S?T?K?N?Y?I?A?U?$/,
  /^S?T?K?N?Y?I?A?U?-S?T?K?N?Y?I?A?U?$/,
];
const sendable = /^[\x20-\x7e\u3040-\u309f、。・※「」『』（）【】〈〉《》‖…←↓↑→～＊？！　]*$/u;
export const ruleId = ({ kind, key }) => `${kind}:${key}`;
export function validateRule(rule) {
  if (!rule || !Number.isInteger(rule.kind) || rule.kind < 0 || rule.kind > 4 ||
      typeof rule.key !== 'string' || !patterns[rule.kind].test(rule.key) ||
      (!rule.key && rule.kind !== 2) ||
      !Number.isInteger(rule.context) || rule.context < 0 || rule.context > 8 ||
      (rule.kind !== 1 && rule.context !== 0) ||
      typeof rule.hidden !== 'boolean' ||
      typeof rule.value !== 'string' || typeof rule.row !== 'string' ||
      (!rule.hidden && !rule.value && ![2, 3].includes(rule.kind)) ||
      !sendable.test(rule.value) ||
      (rule.kind === 4 ? !/^(sh|kh|[a-z]{1,2})$/.test(rule.row) : rule.row !== '') ||
      encoder.encode(rule.key).length > 32 || encoder.encode(rule.value).length > 96 ||
      encoder.encode(rule.row).length > 8)
    throw Error('辞書項目のキー・文字列・活用行が対応していません。');
  return rule;
}
export function validateRules(rules) {
  if (!Array.isArray(rules) || rules.length > RULE_CAPACITY)
    throw Error('辞書は24件まで登録できます。');
  const ids = new Set();
  for (const rule of rules) {
    validateRule(rule);
    const id = ruleId(rule);
    if (ids.has(id)) throw Error('同じ種類とキーの辞書項目が重複しています。');
    ids.add(id);
  }
  return rules;
}
export function encodeRule(rule) {
  validateRule(rule);
  const bytes = new Uint8Array(144);
  const key = encoder.encode(rule.key), value = encoder.encode(rule.value), row = encoder.encode(rule.row);
  bytes.set([rule.kind, rule.context, Number(rule.hidden), key.length, value.length, row.length]);
  bytes.set(key, 8);
  bytes.set(value, 40);
  bytes.set(row, 136);
  return bytes;
}
export function decodeRule(bytes) {
  if (bytes.length !== 144 || bytes[3] > 32 || bytes[4] > 96 || bytes[5] > 8)
    throw Error('本体の辞書データが壊れています。');
  const rule = {
    kind: bytes[0], context: bytes[1], hidden: !!bytes[2],
    key: decoder.decode(bytes.subarray(8, 8 + bytes[3])),
    value: decoder.decode(bytes.subarray(40, 40 + bytes[4])),
    row: decoder.decode(bytes.subarray(136, 136 + bytes[5])),
  };
  return validateRule(rule);
}

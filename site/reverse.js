import { encodeRule } from "./rules.js";

let enginePromise;
async function engine() {
  enginePromise ||= fetch("./engine/mejiro_native.wasm")
    .then((response) => {
      if (!response.ok) throw Error("逆引きエンジンを読み込めません。");
      return response.arrayBuffer();
    })
    .then((bytes) => WebAssembly.instantiate(bytes, {}))
    .then(({ instance }) => instance.exports);
  return enginePromise;
}

export async function reverseLookup(text, grammar = [], rules = []) {
  const wasm = await engine();
  const input = new TextEncoder().encode(text);
  if (!input.length || input.length > 512) return { all: [], basic_and_particle: [] };
  const ruleBytes = new Uint8Array(rules.length * 144);
  rules.forEach((rule, index) => ruleBytes.set(encodeRule(rule), index * 144));
  const grammarBytes = new Uint8Array(grammar.length * 38);
  const view = new DataView(grammarBytes.buffer);
  grammar.forEach(({ start, end, kind, lemma = "" }, index) => {
    const base = index * 38;
    const encoded = new TextEncoder().encode(lemma);
    if (encoded.length > 32) throw Error("文法情報の辞書形が長すぎます。");
    view.setUint16(base, start, true);
    view.setUint16(base + 2, end, true);
    view.setUint8(base + 4, kind);
    view.setUint8(base + 5, encoded.length);
    grammarBytes.set(encoded, base + 6);
  });
  const allocations = [];
  const allocate = (bytes) => {
    if (!bytes.length) return 0;
    const ptr = wasm.mejiro_reverse_alloc(bytes.length);
    if (!ptr) throw Error("逆引き用メモリを確保できません。");
    allocations.push([ptr, bytes.length]);
    new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
    return ptr;
  };
  try {
    const inputPtr = allocate(input);
    const grammarPtr = allocate(grammarBytes);
    const rulesPtr = allocate(ruleBytes);
    const outputCapacity = 32768;
    const outputPtr = wasm.mejiro_reverse_alloc(outputCapacity);
    if (!outputPtr) throw Error("逆引き用メモリを確保できません。");
    allocations.push([outputPtr, outputCapacity]);
    const size = wasm.mejiro_reverse_lookup(
      inputPtr, input.length, grammarPtr, grammar.length,
      rulesPtr, rules.length, outputPtr, outputCapacity,
    );
    if (size < 0) throw Error(`逆引きに失敗しました（${size}）。`);
    const body = new Uint8Array(wasm.memory.buffer, outputPtr, size);
    return JSON.parse(new TextDecoder().decode(body));
  } finally {
    for (const [ptr, capacity] of allocations) wasm.mejiro_reverse_free(ptr, capacity);
  }
}

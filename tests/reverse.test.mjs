import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { grammarSpans, spansFromTokens } from "../site/grammar.js";
import { reverseLookup } from "../site/reverse.js";

const wasm = readFileSync(new URL("../site/engine/mejiro_native.wasm", import.meta.url));
globalThis.fetch = async (url) => {
  if (!url.startsWith("./engine/mejiro_native.wasm")) throw Error(`Unexpected URL: ${url}`);
  return new Response(wasm, { status: 200 });
};

test("site grammar groups consecutive particles and a verb ending", () => {
  assert.deepEqual(spansFromTokens([
    { surface_form: "と", pos: "助詞" },
    { surface_form: "は", pos: "助詞" },
    { surface_form: "いっ", pos: "動詞", basic_form: "いう" },
    { surface_form: "て", pos: "助詞" },
    { surface_form: "も", pos: "助詞" },
  ]), [
    { start: 0, end: 2, kind: 1 },
    { start: 2, end: 5, kind: 2, lemma: "いう" },
    { start: 5, end: 6, kind: 1 },
  ]);
});

test("a stalled grammar worker times out and is terminated", async () => {
  const originalWorker = globalThis.Worker;
  let terminated = false;
  globalThis.Worker = class {
    postMessage() {}
    terminate() { terminated = true; }
  };
  try {
    await assert.rejects(grammarSpans("こんにちは", 10), /時間内に完了しませんでした/);
    assert.equal(terminated, true);
  } finally {
    globalThis.Worker = originalWorker;
  }
});

test("browser WebAssembly returns both routes and applies grammar", async () => {
  const grammar = [
    { start: 0, end: 2, kind: 1 },
    { start: 2, end: 5, kind: 2, lemma: "いう" },
    { start: 5, end: 6, kind: 1 },
  ];
  const result = await reverseLookup("とはいっても", grammar);
  assert.equal(result.all[0].strokes, "nt-t/I-SKntk/-tk");
  assert.ok(result.basic_and_particle.some((item) => item.strokes === "nt-t/Itk-TIA/-tk"));
  assert.ok(result.all.length <= 10 && result.basic_and_particle.length <= 10);
});

test("simple reverse lookup accepts empty grammar", async () => {
  const result = await reverseLookup("こんにちは", []);
  assert.ok(result.all.length > 0);
  assert.ok(result.basic_and_particle.length > 0);
  assert.equal(result.all[0].stroke_count, result.all[0].strokes.split("/").length);
});

test("edited rules are used by reverse lookup", async () => {
  const rule = { kind: 0, key: "KA-", value: "ねこ", row: "", context: 0, hidden: false };
  const result = await reverseLookup("ねこ", [], [rule]);
  assert.ok(result.all.some((item) => item.strokes === "KA-"));
  const masked = await reverseLookup("か", [], [rule]);
  assert.ok(!masked.all.some((item) => item.strokes === "KA-"));
});

test("dictionary-form verbs come before same-reading inflections", async () => {
  const result = await reverseLookup("かえる");
  assert.deepEqual(result.all.slice(0, 2).map(entry => entry.strokes), ["KA-IA*", "KA-SKIA*"]);
  assert.ok(result.all.some(entry => entry.verb_class === "GodanW" && entry.verb_form === 9));
});

test("written verbs select the matching conjugation rather than all homophones", async () => {
  const { lookupSpelling } = await import("../site/lexical-lookup.js");
  const cases = [
    ["変える", "一段", ["KA-SKIA*"]],
    ["帰る", "五段・ラ行", ["KA-IA*"]],
  ];
  for (const [spelling, type, expected] of cases) {
    const tokenize = async () => ({
      basic_form: spelling, reading: "カエル", conjugated_type: type, pos: "動詞",
    });
    const matches = await lookupSpelling(spelling, [], reverseLookup, tokenize);
    assert.deepEqual(matches.map(entry => entry.strokes), expected);
  }
});

test("general-abbreviation spelling restrictions distinguish 感じ and 漢字", async () => {
  const { lookupSpelling } = await import("../site/lexical-lookup.js");
  const tokenize = async () => ({ basic_form: "漢字", reading: "カンジ", pos: "名詞" });
  const matches = await lookupSpelling("感じ", [], reverseLookup, tokenize);
  assert.ok(matches.some(entry => entry.strokes === "K-SN"));
  assert.ok(matches.every(entry => entry.segments[0][2] === 3));
  assert.deepEqual(await lookupSpelling("漢字", [], reverseLookup, tokenize), []);
});

test("dictionary search prefers the complete dictionary-form reading", async () => {
  const { searchDictionary, dictionaryReading } = await import("../site/dictionary.js");
  const rows = JSON.parse(readFileSync(new URL("../site/dictionary.json", import.meta.url))).entries;
  const first = searchDictionary(rows, [], "かえる")[0];
  assert.equal(first.key, "KA-IA");
  assert.equal(dictionaryReading(first), "かえる");
});

test("kana lookup includes verbs derived by the engine and favors dictionary forms", async () => {
  const { lookupVerbReading } = await import("../site/lexical-lookup.js");
  assert.ok((await lookupVerbReading("いく", [])).some(candidate => candidate.strokes === "I-K*"));
  const kaeru = await lookupVerbReading("かえる", []);
  assert.deepEqual(kaeru.map(candidate => candidate.strokes), ["KA-IA*", "KA-SKIA*"]);
});

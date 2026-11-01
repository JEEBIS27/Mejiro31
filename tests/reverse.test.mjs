import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spansFromTokens } from "../site/grammar.js";
import { reverseLookup } from "../site/reverse.js";

const wasm = readFileSync(new URL("../site/engine/mejiro_native.wasm", import.meta.url));
globalThis.fetch = async (url) => {
  if (url !== "./engine/mejiro_native.wasm") throw Error(`Unexpected URL: ${url}`);
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

test("edited rules are used by reverse lookup", async () => {
  const rule = { kind: 0, key: "KA-", value: "ねこ", row: "", context: 0, hidden: false };
  const result = await reverseLookup("ねこ", [], [rule]);
  assert.ok(result.all.some((item) => item.strokes === "KA-"));
  const masked = await reverseLookup("か", [], [rule]);
  assert.ok(!masked.all.some((item) => item.strokes === "KA-"));
});

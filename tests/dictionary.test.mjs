import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchDictionary } from "../site/dictionary.js";
const { entries, engine } = JSON.parse(readFileSync(new URL("../site/dictionary.json", import.meta.url)));
const pins = JSON.parse(readFileSync(new URL("../firmware/sources.json", import.meta.url)));
test("built-in dictionary is complete, pinned and searchable by kind, stroke and text", () => {
  assert.equal(engine, pins.engine.ref);
  assert.equal(entries.length, 3502);
  assert.equal(new Set(entries.map(r => `${r.kind}:${r.key}`)).size, entries.length);
  assert.ok(searchDictionary(entries, [], "A-KNA", "4").some(r => r.value === "あが" && r.row === "r"));
  assert.ok(searchDictionary(entries, [], "この", "2").some(r => r.key === "K"));
  assert.ok(searchDictionary(entries, [], "KAU", "3").some(r => r.value === "こと"));
});
test("user settings override built-ins, include disabled entries, and restore on removal", () => {
  const original = entries.find(r => r.kind === 2 && r.key === "K");
  const override = { ...original, value: "テスト" };
  let result = searchDictionary(entries, [override], "K", "2").find(r => r.key === "K");
  assert.equal(result.value, "テスト");
  assert.equal(result.custom, true);
  assert.equal(searchDictionary(entries, [{ ...override, value: "", hidden: true }], "無効", "2")[0].hidden, true);
  assert.equal(searchDictionary(entries, [], "この", "2")[0].custom, false);
  const user = { kind: 0, key: "STK-", value: "こんにちは", row: "", context: 0, hidden: false };
  assert.equal(searchDictionary(entries, [user], "こんにちは", "0")[0].custom, true);
});

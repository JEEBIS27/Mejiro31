import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchDictionary } from "../site/dictionary.js";
const { entries, engine } = JSON.parse(readFileSync(new URL("../site/dictionary.json", import.meta.url)));
const pins = JSON.parse(readFileSync(new URL("../firmware/dictionary-source.json", import.meta.url)));
test("built-in dictionary is complete, pinned and searchable by kind, stroke and text", () => {
  assert.equal(engine, pins.ref);
  assert.equal(entries.length, 3742);
  assert.equal(new Set(entries.map(r => `${r.kind}:${r.key}`)).size, entries.length);
  assert.ok(searchDictionary(entries, [], "A-", "4").some(r => r.key === "A-" && r.value === "あ" && r.row === "ge"));
  assert.ok(searchDictionary(entries, [], "この", "2").some(r => r.key === "K"));
  assert.ok(searchDictionary(entries, [], "KAU", "3").some(r => r.value === "こと"));
  assert.ok(searchDictionary(entries, [], "ST-", "1").some(r => r.value === "から"));
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

test("verbs are searchable by dictionary form as well as stem and stroke", () => {
  const working = entries.find(r => r.kind === 4 && r.value === "はたら" && r.row === "k");
  assert.ok(working);
  assert.ok(searchDictionary(entries, [], "はたらく", "4").some(r => r.key === working.key));
  assert.ok(searchDictionary(entries, [], "はたら", "4").some(r => r.key === working.key));
  assert.ok(searchDictionary(entries, [], working.key, "4").some(r => r.key === working.key));
  const forms = [
    ["およ", "g", "およぐ"], ["お", "ki", "おきる"],
    ["た", "be", "たべる"], ["べんきょう", "sh", "べんきょうする"],
    ["もって", "kh", "もってくる"],
  ];
  for (const [value, row, form] of forms) {
    const rule = { ...working, key: "STK-", value, row };
    assert.equal(searchDictionary([], [rule], form, "4")[0]?.value, value);
  }
  const override = { ...working, value: "か", row: "k" };
  assert.ok(!searchDictionary([working], [override], "はたらく", "4").length);
  assert.equal(searchDictionary([working], [override], "かく", "4")[0]?.custom, true);
  assert.equal(searchDictionary([working], [{...working, hidden: true, value: ""}], "はたらく", "4").length, 0);
});

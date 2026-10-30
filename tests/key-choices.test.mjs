import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { keyChoices, searchChoices } from "../site/key-choices.js";
const data = JSON.parse(
  readFileSync(new URL("../site/data.json", import.meta.url)),
);
const nameFor = (value) => data.keycodes.find((k) => k.value === value).name;
test("Tap offers other letters and modified keys without duplicate aliases", () => {
  const choices = keyChoices(data, nameFor);
  for (const name of ["KC_A", "KC_Z", "LSFT(KC_Z)"])
    assert.ok(
      choices.some(
        (c) => c.value === data.keycodes.find((k) => k.name === name).value,
      ),
    );
  assert.equal(new Set(choices.map((c) => c.value)).size, choices.length);
  assert.ok(searchChoices(choices, "LSFT KC_Z").length);
  assert.equal(
    choices.some((c) => c.value === 0xe2),
    false,
  );
});
test("Hold offers only disable, transparent, simple modifiers and supported layers", () => {
  const choices = keyChoices(data, nameFor, { hold: true });
  assert.ok(choices.some((c) => c.value === 0xe2));
  assert.ok(choices.some((c) => c.value === 0x5222));
  assert.equal(
    choices.some((c) => c.search.includes("NONUS")),
    false,
  );
  assert.equal(
    choices.some((c) => c.value === 29),
    false,
  );
});
test("steno keys appear only in their valid context", () => {
  assert.equal(
    keyChoices(data, nameFor).some((c) => c.value === 0x74c0),
    false,
  );
  assert.ok(
    keyChoices(data, nameFor, { steno: true }).some((c) => c.value === 0x74c0),
  );
});

test("ordinary characters and English/Japanese names find exact firmware assignments", () => {
  const choices = keyChoices(data, nameFor);
  const hash = data.keycodes.find((k) => k.name === "LSFT(KC_3)").value;
  for (const query of ["#", "Hash", "シャープ", "＃"])
    assert.ok(searchChoices(choices, query).some((c) => c.value === hash));
  assert.equal(choices.find((c) => c.value === hash).label, "# (Hash)");
  for (const query of ["Enter", "エンター", "改行"])
    assert.ok(searchChoices(choices, query).some((c) => c.value === 40));
  assert.equal(choices.find((c) => c.value === 29).label, "Z");
  assert.ok(searchChoices(choices, "Ctrl Z").some((c) => c.value === 0x011d));
  assert.equal(choices.find((c) => c.value === hash).code, nameFor(hash));
});
test("Hold search uses familiar modifier and layer names", () => {
  const choices = keyChoices(data, nameFor, { hold: true });
  for (const query of ["Left Alt", "左Alt", "左オルト"])
    assert.ok(searchChoices(choices, query).some((c) => c.value === 0xe2));
  assert.ok(
    searchChoices(choices, "レイヤー 2").some((c) => c.value === 0x5222),
  );
});

test("every displayed choice can be found using its own name, including IME keys", () => {
  for (const options of [{}, { hold: true }, { steno: true }]) {
    const choices = keyChoices(data, nameFor, options);
    for (const choice of choices) {
      assert.ok(
        searchChoices(choices, choice.label).some(
          (c) => c.value === choice.value,
        ),
        choice.label,
      );
      assert.doesNotMatch(choice.label, /KC_|LCTL\(|LSFT\(|MO\(|QK_|MJI_|STN_/);
    }
  }
  const choices = keyChoices(data, nameFor);
  for (const q of ["英数", "英数（IME Off）", "IMEオフ", "えいすう"])
    assert.ok(
      searchChoices(choices, q).some((c) => c.value === 145),
      q,
    );
  const hashes = searchChoices(choices, "Hash");
  assert.equal(hashes[0].label, "# (Hash)");
  assert.ok(hashes.every((c) => !c.label.includes("KC_")));
});

test("internal code aliases remain searchable while all result labels stay human-readable", () => {
  const choices = keyChoices(data, nameFor);
  assert.ok(searchChoices(choices, "KC_").length);
  for (const [query, value] of [
    ["KC_LNG2", 145],
    ["KC_LANGUAGE_2", 145],
    ["KC_NUHS", 50],
    ["LSFT(KC_3)", 0x220],
  ]) {
    const found = searchChoices(choices, query);
    assert.ok(
      found.some((c) => c.value === value),
      query,
    );
    assert.ok(found.every((c) => !c.label.includes("KC_")));
  }
});

test("Hold includes modifier combinations and names each layer", () => {
  const choices = keyChoices(data, nameFor, { hold: true });
  const altCtrl = choices.find((c) => c.value === 0x0500);
  assert.equal(altCtrl.label, "Left Ctrl + Left Alt");
  assert.ok(searchChoices(choices, "Alt Ctrl").includes(altCtrl));
  assert.equal(
    choices.find((c) => c.value === 0x1f00).label,
    "Right Ctrl + Right Shift + Right Alt + Right Win / Command",
  );
  assert.equal(
    choices.find((c) => c.value === 0x5220).label,
    "Keyboard（Layer0）",
  );
  assert.equal(
    choices.find((c) => c.value === 0x5224).label,
    "Function（Layer4）",
  );
});

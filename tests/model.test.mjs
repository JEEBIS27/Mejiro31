import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  makeBackup,
  validateBackup,
  changes,
  clone,
  selectRelease,
  supportedCode,
  storageAddress,
  encodeKeymap,
  decodeKeymap,
} from "../site/model.js";
const data = JSON.parse(
  readFileSync(new URL("../site/data.json", import.meta.url)),
);
test("both complete profiles round-trip, including Hold and virtual cells", () => {
  for (const profile of ["jp", "en"]) {
    const backup = makeBackup(
      profile,
      { flags: 6, en: 1, jp: 16 },
      data.defaults[profile],
    );
    const restored = validateBackup(JSON.parse(JSON.stringify(backup)), data);
    assert.deepEqual(restored, backup);
    restored.keymap[0][0] = 5;
    assert.notEqual(restored.keymap[0][0], backup.keymap[0][0]);
  }
});
test("foreign firmware, malformed maps, settings and unsupported QMK functions are rejected", () => {
  const original = makeBackup(
    "jp",
    { flags: 6, en: 0, jp: 0 },
    data.defaults.jp,
  );
  for (const mutate of [
    (x) => (x.uid[0] = 0),
    (x) => (x.version = 99),
    (x) => x.keymap.pop(),
    (x) => x.keymap[0].pop(),
    (x) => (x.settings.en = 32),
    (x) => (x.settings.flags = -1),
    (x) => (x.keymap[0][0] = 0x5700),
    (x) => (x.keymap[0][0] = 1.5),
    (x) => (x.profile = "unknown"),
  ]) {
    const value = clone(original);
    mutate(value);
    assert.throws(() => validateBackup(value, data));
  }
});
test("the adapter action palette matches all shipped assignments", () => {
  for (const layers of Object.values(data.defaults))
    for (const layer of layers)
      for (const code of layer)
        assert.ok(supportedCode(code), `unsupported ${code.toString(16)}`);
  for (const k of data.keycodes.filter(
    (k) =>
      k.name.startsWith("MO(") ||
      k.name.startsWith("MJI_") ||
      k.name.startsWith("STN_"),
  ))
    assert.ok(supportedCode(k.value), k.name);
  assert.equal(supportedCode(0x5700), false);
  assert.equal(supportedCode(NaN), false);
});
test("physical and virtual positions are unique and map to the firmware matrix", () => {
  assert.equal(data.physical.length, 31);
  assert.equal(data.pairs.length, 22);
  const physical = new Set(data.physical.map((p) => p.row * 12 + p.col));
  const virtual = new Set(data.pairs.map((p) => p.logical));
  assert.equal(physical.size, 31);
  assert.equal(virtual.size, 22);
  for (const p of data.pairs) {
    assert.ok(physical.has(p.a) && physical.has(p.b));
    assert.ok(!physical.has(p.logical));
  }
  assert.equal(data.layouts.length, 18);
});
test("diffs preserve exact Tap/Hold layers and virtual coordinates", () => {
  const after = clone(data.defaults.jp);
  after[0][24] = 7;
  after[6][24] = 0xe1;
  assert.deepEqual(changes(data.defaults.jp, after), [
    { layer: 0, row: 2, col: 0, code: 7 },
    { layer: 6, row: 2, col: 0, code: 0xe1 },
  ]);
});
test("downloads use the newest full Vial release, never old firmware or a foreign host", () => {
  assert.equal(selectRelease([], "jp", "graphite"), null);
  const filename = "mejiro31_jp.uf2";
  const asset = {
    name: filename,
    size: 1000,
    browser_download_url: `https://github.com/JEEBIS27/Mejiro31/releases/download/vial-v1.0.0/${filename}`,
  };
  const release = { tag_name: "vial-v1.0.0", assets: [asset] };
  assert.equal(
    selectRelease(
      [{ tag_name: "v0.4.2", assets: [] }, release],
      "jp",
      "qwerty",
    ).filename,
    filename,
  );
  assert.equal(
    selectRelease(
      [{ tag_name: "vial-v2.0.0", assets: [] }, release],
      "jp",
      "qwerty",
    ),
    null,
  );
  assert.equal(
    selectRelease([{ ...release, prerelease: true }], "jp", "qwerty"),
    null,
  );
  assert.throws(() =>
    selectRelease(
      [
        {
          ...release,
          assets: [
            { ...asset, browser_download_url: "https://example.com/a.uf2" },
          ],
        },
      ],
      "jp",
      "qwerty",
    ),
  );
});

test("extra combos round-trip through separate storage without changing physical positions", () => {
  const map = clone(data.defaults.jp);
  map[4][53] = 0x29;
  map[9][50] = 0xe2;
  assert.deepEqual(storageAddress(4, 53), { layer: 12, row: 2, col: 5 });
  assert.deepEqual(storageAddress(9, 50), { layer: 13, row: 1, col: 8 });
  assert.deepEqual(storageAddress(0, 1), { layer: 0, row: 0, col: 1 });
  assert.deepEqual(decodeKeymap(encodeKeymap(map)), map);
});
test("legacy backups gain six unassigned combo slots without changing old assignments", () => {
  const old = makeBackup(
    "jp",
    { flags: 6, en: 1, jp: 0 },
    data.defaults.jp.map((l) => l.slice(0, 48)),
  );
  old.version = 1;
  const next = validateBackup(old, data);
  assert.equal(next.version, 3);
  assert.deepEqual(
    next.keymap.map((l) => l.slice(0, 48)),
    old.keymap,
  );
  assert.ok(
    next.keymap.every(
      (l) => l.length === 54 && l.slice(48).every((c) => c === 0),
    ),
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  boardKeys,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  labelFontSize,
} from "../site/board-layout.js";
const data = JSON.parse(
  readFileSync(new URL("../site/data.json", import.meta.url)),
);
const keys = boardKeys(data);
const at = (logical) => keys.find((key) => key.logical === logical);
const center = (key) => [key.x + key.width / 2, key.y + key.height / 2];

test("one board preserves all 31 physical and 26 firmware combo positions", () => {
  assert.equal(keys.length, 57);
  assert.equal(new Set(keys.map((key) => key.logical)).size, 57);
  assert.deepEqual(
    keys.filter((key) => key.kind === "combo").map((key) => key.logical),
    data.pairs.map((pair) => pair.logical),
  );
  for (const key of keys) {
    assert.ok(key.x >= 0 && key.y >= 0);
    assert.ok(key.x + key.width <= BOARD_WIDTH);
    assert.ok(key.y + key.height <= BOARD_HEIGHT);
  }
});

test("2u Space and Enter line up with their lower thumb keys", () => {
  for (const [logical, x] of [
    [28, 4],
    [30, 8],
  ]) {
    const key = at(logical);
    assert.equal(key.width, 2);
    assert.equal(key.x, x);
    assert.equal(key.y, 2.74);
    const lower = keys.filter(
      (k) => k.kind === "physical" && k.y === 3.74 && k.x >= x && k.x < x + 2,
    );
    assert.equal(lower.length, 2);
    assert.equal(lower[0].x, x);
    assert.equal(lower[1].x + lower[1].width, x + key.width);
  }
});

test("combo buttons occupy the gaps shown in the reference keyboard", () => {
  // A between Q/Z; Esc between R/T; Del between Y/U; @ between the IME keys.
  for (const [logical, expected] of [
    [24, [1.5, 1.24]],
    [38, [5, 0.3]],
    [44, [9, 0.3]],
    [46, [9, 4.595]],
  ]) {
    const actual = center(at(logical));
    actual.forEach((value, i) =>
      assert.ok(Math.abs(value - expected[i]) < 1e-10),
    );
  }
});

test("combo badges retain their height while horizontal badges use a narrower width", () => {
  for (const combo of keys.filter((k) => k.kind === "combo")) {
    assert.equal(combo.width, at(combo.a).y === at(combo.b).y ? 0.48 : 0.54);
    assert.equal(combo.height, 0.48);
    const a = at(combo.a),
      b = at(combo.b);
    if (a.y !== b.y) continue;
    assert.ok(combo.x < a.x + a.width && combo.x + combo.width > b.x);
    assert.ok(combo.y + combo.height > a.y && combo.y < a.y + a.height);
  }
});
test("labels scale gradually with their visual length and available key width", () => {
  assert.ok(labelFontSize("Win", at(12)) < labelFontSize("Q", at(1)));
  assert.ok(labelFontSize("Ctrl", at(41)) < labelFontSize("Win", at(12)));
  assert.ok(labelFontSize("Space", at(28)) > labelFontSize("Space", at(1)));
  assert.ok(labelFontSize("英数", at(42)) < labelFontSize("AB", at(42)));
});

test("Steno hides all combo buttons while other layers retain empty slots", () => {
  assert.equal(boardKeys(data, 5).length, 31);
  assert.ok(boardKeys(data, 5).every((key) => key.kind === "physical"));
  for (const layer of [0, 1, 2, 3, 4])
    assert.equal(
      boardKeys(data, layer).filter((k) => k.kind === "combo").length,
      26,
    );
  for (const [a, b] of [
    [0, 12],
    [0, 1],
    [12, 13],
    [40, 41],
    [22, 23],
    [10, 11],
  ])
    assert.ok(data.pairs.some((p) => p.a === a && p.b === b));
});

test("thumb combos sit on the shared edge of each 2u and 1u key", () => {
  for (const [logical, lower] of [[54,40],[55,41],[56,42],[57,43]]) {
    const combo = at(logical), key = at(lower);
    assert.equal(combo.x + combo.width/2, key.x + 0.5);
    assert.equal(combo.y + combo.height/2, key.y);
  }
});

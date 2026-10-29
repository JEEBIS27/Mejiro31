import test from "node:test";
import assert from "node:assert/strict";
import { inputEventLabel, intervalMs } from "../site/input-test.js";
test("input test labels ordinary text, whitespace, IME and modifier chords", () => {
  assert.equal(inputEventLabel({ key: "a" }), "a");
  assert.equal(inputEventLabel({ key: " ", shiftKey: true }), "Shift + Space");
  assert.equal(inputEventLabel({ key: "z", ctrlKey: true }), "Ctrl + z");
  assert.equal(inputEventLabel({ key: "Shift", shiftKey: true }), "Shift");
  assert.equal(inputEventLabel({ key: "Process", isComposing: true }), "IME");
});

test("input intervals stop at 999ms and reset for the first event", () => {
  assert.equal(intervalMs(null, 10000), 0);
  assert.equal(intervalMs(100, 112.4), 12);
  assert.equal(intervalMs(100, 1400), 999);
  assert.equal(intervalMs(100, 99), 0);
});

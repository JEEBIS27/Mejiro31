import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { selectBundledFirmware } from "../site/model.js";
const root = new URL("../site/firmware/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", root)));
test("all bundled variants select real UF2 files with matching checksums", () => {
  for (const profile of ["jp", "en"])
    for (const layout of ["qwerty"]) {
      const asset = selectBundledFirmware(manifest, profile, layout);
      assert.ok(asset);
      const bytes = readFileSync(new URL(asset.filename, root));
      assert.equal(bytes.length, asset.size);
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        asset.sha256,
      );
      assert.equal(bytes.readUInt32LE(28), 0xe48bff56);
    }
  assert.equal(manifest.assets.length, 2);
  assert.equal(selectBundledFirmware(manifest, "jp", "graphite"), null);
  assert.equal(selectBundledFirmware(manifest, "jp", "dvorak"), null);
  assert.equal(selectBundledFirmware(manifest, "jp", "../qwerty"), null);
});
test("invalid bundled metadata never becomes a download link", () => {
  const copy = structuredClone(manifest);
  copy.assets[0].sha256 = "invalid";
  const [, profile] = /mejiro31_(jp|en)\.uf2/.exec(copy.assets[0].filename);
  const layout = "qwerty";
  assert.throws(() => selectBundledFirmware(copy, profile, layout));
});

test("site standard Tap/Hold maps match the defaults inside each distributed UF2", () => {
  const data = JSON.parse(
    readFileSync(new URL("../site/data.json", import.meta.url)),
  );
  for (const profile of ["jp", "en"]) {
    const uf2 = readFileSync(
      new URL(`../site/firmware/mejiro31_${profile}.uf2`, import.meta.url),
    );
    const blocks = [];
    for (let offset = 0; offset < uf2.length; offset += 512)
      blocks.push({
        address: uf2.readUInt32LE(offset + 12),
        bytes: uf2.subarray(
          offset + 32,
          offset + 32 + uf2.readUInt32LE(offset + 16),
        ),
      });
    blocks.sort((a, b) => a.address - b.address);
    const start = blocks[0].address;
    const last = blocks.at(-1);
    const image = Buffer.alloc(last.address + last.bytes.length - start, 255);
    for (const block of blocks) block.bytes.copy(image, block.address - start);
    const expected = Buffer.alloc(12 * 48 * 2);
    data.defaults[profile].forEach((layer, l) =>
      layer
        .slice(0, 48)
        .forEach((code, i) => expected.writeUInt16LE(code, (l * 48 + i) * 2)),
    );
    assert.ok(
      image.includes(expected),
      `${profile}: regenerate site defaults when firmware defaults change`,
    );
  }
});

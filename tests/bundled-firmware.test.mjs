import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {selectBundledFirmware} from '../site/model.js';
const root=new URL('../site/firmware/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
test('all bundled variants select real UF2 files with matching checksums',()=>{
 for(const profile of ['jp','en']) for(const layout of ['qwerty']) {
  const asset=selectBundledFirmware(manifest,profile,layout);
  assert.ok(asset);
  const bytes=readFileSync(new URL(asset.filename,root));
  assert.equal(bytes.length,asset.size);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  assert.equal(bytes.readUInt32LE(28),0xe48bff56);
 }
 assert.equal(manifest.assets.length,2);
 assert.equal(selectBundledFirmware(manifest,'jp','graphite'),null);
 assert.equal(selectBundledFirmware(manifest,'jp','dvorak'),null);
 assert.equal(selectBundledFirmware(manifest,'jp','../qwerty'),null);
});
test('invalid bundled metadata never becomes a download link',()=>{
 const copy=structuredClone(manifest);copy.assets[0].sha256='invalid';
 const [,profile,layout]=/mejiro31_vial_(jp|en)_(.+)\.uf2/.exec(copy.assets[0].filename);
 assert.throws(()=>selectBundledFirmware(copy,profile,layout));
});

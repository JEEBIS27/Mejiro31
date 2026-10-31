import { validateRules } from "./rules.js";
export const ROWS = 4,
  COLS = 12,
  LAYERS = 12;
export const KEY_COUNT = 54,
  STORAGE_LAYERS = 14;
export const UID = [77, 51, 49, 87, 69, 66, 48, 49];
export const clone = (value) => structuredClone(value);
export const DEFAULT_TIMING = Object.freeze({
  combo: 150,
  continuation: 50,
  hold: 300,
});
export function validateTiming(timing) {
  if (
    !timing ||
    !Number.isInteger(timing.combo) ||
    timing.combo < 1 ||
    timing.combo > 1000 ||
    !Number.isInteger(timing.continuation) ||
    timing.continuation < 1 ||
    timing.continuation > 1000 ||
    !Number.isInteger(timing.hold) ||
    timing.hold <= timing.continuation ||
    timing.hold > 2000
  )
    throw Error(
      "判定時間はコンボ・連続入力が1〜1000ms、長押しが連続入力より長く2000ms以下になるよう指定してください。",
    );
  return timing;
}
export function validateSettings(settings, data) {
  if (settings?.timing !== undefined) validateTiming(settings.timing);
  if (
    !settings ||
    !Number.isInteger(settings.flags) ||
    settings.flags < 0 ||
    settings.flags > 7 ||
    (settings.firstUp !== undefined && typeof settings.firstUp !== "boolean") ||
    !["en", "jp"].every(
      (k) =>
        Number.isInteger(settings[k]) &&
        settings[k] >= 0 &&
        settings[k] < data.layouts.length,
    )
  )
    throw Error("設定値がこのファームウェアに対応していません。");
}
export function supportedCode(code) {
  if (!Number.isInteger(code) || code < 0 || code > 65535) return false;
  return (
    code <= 0xff ||
    (code >= 0x100 && code <= 0x1fff) ||
    (code >= 0x5220 && code <= 0x5225) ||
    code === 0x52a2 || // MO(0..5), OSM(LSFT)
    code === 0x7c00 ||
    (code >= 0x7e00 && code <= 0x7e06) || // boot, Mejiro
    (code >= 0x74c0 && code <= 0x74e9)
  ); // STN usages in the pinned firmware.
}
export function validateBackup(value, data) {
  if (
    !value ||
    value.format !== "mejiro31-web" ||
    ![1, 2, 3].includes(value.version) ||
    !Array.isArray(value.uid) ||
    value.uid.join() !== UID.join() ||
    !["jp", "en"].includes(value.profile)
  )
    throw Error("Mejiro31用の設定ファイルではありません。");
  validateSettings(value.settings, data);
  if (
    !Array.isArray(value.keymap) ||
    value.keymap.length !== LAYERS ||
    !value.keymap.every(
      (layer) =>
        Array.isArray(layer) &&
        layer.length === (value.version === 1 ? ROWS * COLS : KEY_COUNT) &&
        layer.every((code) => supportedCode(code)),
    )
  )
    throw Error("キーマップのサイズまたはキーコードが対応していません。");
  const result = clone(value);
  if (result.version === 1) {
    result.keymap = result.keymap.map((layer) => [
      ...layer,
      ...Array(6).fill(0),
    ]);
    result.version = 2;
  }
  if (result.version < 3) {
    result.settings.firstUp ??= true;
    result.rules = [];
    result.version = 3;
  }
  validateRules(result.rules);
  if (typeof result.settings.firstUp !== "boolean")
    throw Error("First upの設定値が不正です。");
  return result;
}
export function makeBackup(profile, settings, keymap, rules = []) {
  return {
    format: "mejiro31-web",
    version: 3,
    uid: UID,
    profile,
    settings: { ...clone(settings), firstUp: settings.firstUp ?? true },
    keymap: clone(keymap),
    rules: clone(validateRules(rules)),
  };
}
export function changes(before, after) {
  const result = [];
  for (let l = 0; l < LAYERS; l++)
    for (let i = 0; i < KEY_COUNT; i++)
      if (before[l][i] !== after[l][i])
        result.push({
          layer: l,
          row: Math.floor(i / COLS),
          col: i % COLS,
          code: after[l][i],
        });
  return result;
}
export function selectRelease(releases, profile, layout = "qwerty") {
  if (!["jp", "en"].includes(profile) || layout !== "qwerty") return null;
  if (!Array.isArray(releases))
    throw Error("リリース情報を取得できませんでした。");
  const filename = `mejiro31_${profile}.uf2`;
  // A latest release without the selected asset must never silently fall back
  // to an older binary. All variants are published together by our workflow.
  const release = releases.find(
    (r) => !r.draft && !r.prerelease && /^vial-v/.test(r.tag_name),
  );
  const asset = release?.assets?.find((a) => a.name === filename);
  if (!asset) return null;
  const expected = `https://github.com/JEEBIS27/Mejiro31/releases/download/${encodeURIComponent(release.tag_name)}/${filename}`;
  if (asset.browser_download_url !== expected)
    throw Error("ダウンロード先を確認できませんでした。");
  return { url: expected, filename, tag: release.tag_name, size: asset.size };
}

export function selectBundledFirmware(manifest, profile, layout = "qwerty") {
  if (
    !manifest ||
    manifest.format !== "mejiro31-firmware-v1" ||
    !Array.isArray(manifest.assets)
  )
    return null;
  if (!["jp", "en"].includes(profile) || layout !== "qwerty") return null;
  const filename = `mejiro31_${profile}.uf2`;
  const asset = manifest.assets.find((a) => a.filename === filename);
  if (!asset) return null;
  if (
    !/^[a-f0-9]{64}$/.test(asset.sha256) ||
    !Number.isInteger(asset.size) ||
    asset.size <= 0 ||
    asset.size % 512 !== 0
  )
    throw Error("同梱ファームウェアの情報が不正です。");
  return {
    ...asset,
    url: `./firmware/${filename}`,
    tag: "サイト同梱版",
    bundled: true,
  };
}

// Extra logical keys use two storage layers; the physical 4x12 matrix is unchanged.
export function storageAddress(layer, logical) {
  if (
    !Number.isInteger(layer) ||
    layer < 0 ||
    layer >= LAYERS ||
    !Number.isInteger(logical) ||
    logical < 0 ||
    logical >= KEY_COUNT
  )
    throw Error("不正なキー位置です。");
  if (logical < 48)
    return { layer, row: Math.floor(logical / COLS), col: logical % COLS };
  const index = (layer % 6) * 6 + logical - 48;
  return {
    layer: layer < 6 ? 12 : 13,
    row: Math.floor(index / COLS),
    col: index % COLS,
  };
}
export function encodeKeymap(keymap) {
  const bytes = new Uint8Array(STORAGE_LAYERS * ROWS * COLS * 2);
  for (let layer = 0; layer < LAYERS; layer++)
    for (let key = 0; key < KEY_COUNT; key++) {
      const a = storageAddress(layer, key),
        i = ((a.layer * ROWS + a.row) * COLS + a.col) * 2;
      bytes[i] = keymap[layer][key] >> 8;
      bytes[i + 1] = keymap[layer][key] & 255;
    }
  return bytes;
}
export function decodeKeymap(bytes) {
  if (bytes.length !== STORAGE_LAYERS * ROWS * COLS * 2)
    throw Error("保存領域のサイズが一致しません。");
  return Array.from({ length: LAYERS }, (_, layer) =>
    Array.from({ length: KEY_COUNT }, (_, key) => {
      const a = storageAddress(layer, key),
        i = ((a.layer * ROWS + a.row) * COLS + a.col) * 2;
      return bytes[i] * 256 + bytes[i + 1];
    }),
  );
}

import {
  UID,
  COLS,
  ROWS,
  STORAGE_LAYERS,
  storageAddress,
  decodeKeymap,
  validateSettings,
  changes,
} from "./model.js";
import { decodeRule, encodeRule, ruleId, validateRules, RULE_CAPACITY } from "./rules.js";
const SIGNATURE = Array.from("M31WEB01", (c) => c.charCodeAt(0));
const RULE_SIGNATURE = Array.from("M31RUL01", (c) => c.charCodeAt(0));
const fail = (message) => {
  throw Error(message);
};
export class MejiroHID {
  constructor(device, data) {
    this.device = device;
    this.data = data;
    this.queue = Promise.resolve();
    this.pending = null;
    this.closed = false;
    this.identified = false;
    this.onReport = (event) => {
      if (event.reportId !== 0 || !this.pending || event.data.byteLength !== 32)
        return;
      this.pending.resolve(
        new Uint8Array(event.data.buffer, event.data.byteOffset, 32).slice(),
      );
      this.pending = null;
    };
    device.addEventListener("inputreport", this.onReport);
  }
  async request(payload) {
    const operation = this.queue.then(async () => {
      if (this.closed || !this.device.opened)
        fail("接続が切れています。もう一度接続してください。");
      const bytes = new Uint8Array(32);
      bytes.set(payload);
      let timer;
      const answer = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          this.pending = null;
          this.closed = true;
          reject(
            Error(
              "キーボードが応答しません。再接続して設定を読み直してください。",
            ),
          );
        }, 2000);
        this.pending = { resolve, reject };
      });
      try {
        // Install the waiter before sending, so even a synchronous reply is kept.
        await this.device.sendReport(0, bytes);
        return await answer;
      } catch (error) {
        this.closed = true;
        this.pending?.reject(error);
        await answer.catch(() => {});
        throw error;
      } finally {
        clearTimeout(timer);
        this.pending = null;
      }
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
  async echo(payload) {
    const result = await this.request(payload);
    if (
      result[0] !== payload[0] ||
      payload.slice(1, 4).some((v, i) => result[i + 1] !== v)
    ) {
      this.closed = true;
      fail("応答が一致しません。再接続してください。");
    }
    return result;
  }
  async identify() {
    const id = await this.request([0xfe, 0]);
    const protocol = new DataView(id.buffer).getUint32(0, true);
    if (protocol !== 6 || UID.some((v, i) => id[4 + i] !== v))
      fail("このサイト用のMejiro31 Vialファームウェアを書き込んでください。");
    const version = await this.request([1]);
    if (version[0] !== 1 || ![9, 12].includes(version[1] * 256 + version[2]))
      fail("対応していないVIAプロトコルです。");
    const layers = await this.request([0x11]);
    if (layers[0] !== 0x11 || layers[1] !== STORAGE_LAYERS)
      fail(
        "コンボ拡張に対応した最新のMejiro31ファームウェアを書き込んでください（保存領域の構成が異なります）。",
      );
    const settings = await this.settings();
    this.identified = true;
    return settings;
  }
  async settings(next) {
    if (next) validateSettings(next, this.data);
    const expectedFirstUp = next?.firstUp ?? true;
    const result = await this.request([
      0xfa,
      1,
      next ? 1 : 0,
      0,
      ...SIGNATURE,
      ...(next ? [next.flags, next.en, next.jp] : []),
    ]);
    if (
      result[0] !== 0xfa ||
      result[1] !== 1 ||
      result[2] !== (next ? 1 : 0) ||
      SIGNATURE.some((v, i) => result[i + 4] !== v)
    )
      fail("専用設定プロトコルに対応していません。");
    if (result[3] !== 0)
      fail(
        [
          "",
          "キーボードのロックを解除してください。",
          "設定を適用できませんでした。",
          "キーボードの準備が完了していません。",
        ][result[3]] || "設定通信に失敗しました。",
      );
    if (
      result[15] > 1 ||
      result[16] !== STORAGE_LAYERS ||
      result[17] !== this.data.layouts.length
    )
      fail("サイトとファームウェアの設定定義が一致しません。");
    let settings = { flags: result[12], en: result[13], jp: result[14], firstUp: !!result[18] };
    if (next && settings.firstUp !== expectedFirstUp) {
      settings = { ...settings, firstUp: await this.setFirstUp(expectedFirstUp) };
    }
    validateSettings(settings, this.data);
    this.profile = result[15] ? "en" : "jp";
    return settings;
  }
  async setFirstUp(enabled) {
    if (typeof enabled !== "boolean") fail("First upの設定値が不正です。");
    const packet = [0xfa, 1, 2, 0, ...SIGNATURE];
    packet[18] = Number(enabled);
    const result = await this.request(packet);
    if (result[0] !== 0xfa || result[1] !== 1 || result[2] !== 2 ||
        SIGNATURE.some((v, i) => result[i + 4] !== v))
      fail("First up設定の応答が一致しません。");
    if (result[3] === 1) fail("キーボードのロックを解除してください。");
    if (result[3] !== 0 || result[18] !== Number(enabled))
      fail("First up設定を保存できませんでした。");
    return !!result[18];
  }
  async ruleRequest(op, { index = 0, chunk = 0, bytes = null, action = 0 } = {}) {
    const packet = new Uint8Array(32);
    packet.set([0xfa, 2, op, 0, ...RULE_SIGNATURE]);
    if (op === 1) { packet[12] = index; packet[13] = chunk; }
    if (op === 3) { packet[12] = chunk; packet.set(bytes, 16); }
    if (op === 4) packet[12] = action;
    const result = await this.request(packet);
    if (result[0] !== 0xfa || result[1] !== 2 || result[2] !== op ||
        RULE_SIGNATURE.some((v, i) => result[i + 4] !== v))
      fail("辞書通信に対応したファームウェアを書き込んでください。");
    if (result[3] !== 0)
      fail(["", "キーボードのロックを解除してください。", "辞書項目が不正です。", "キーボードの準備が完了していません。", "辞書は24件まで登録できます。", "辞書を本体に保存できませんでした。"][result[3]] || "辞書通信に失敗しました。");
    return result;
  }
  async readRules(progress = () => {}) {
    const info = await this.ruleRequest(0);
    if (info[13] !== RULE_CAPACITY || info[14] !== 1 || info[15] !== 32 || info[16] !== 96 || info[17] !== 8)
      fail("サイトとファームウェアの辞書形式が一致しません。");
    const rules = [];
    for (let index = 0; index < info[12]; index++) {
      const bytes = new Uint8Array(144);
      for (let chunk = 0; chunk < 9; chunk++) {
        const result = await this.ruleRequest(1, { index, chunk });
        bytes.set(result.subarray(16, 32), chunk * 16);
      }
      rules.push(decodeRule(bytes));
      progress((index + 1) / info[12]);
    }
    return validateRules(rules);
  }
  async writeRule(action, rule) {
    const bytes = encodeRule(rule);
    await this.ruleRequest(2);
    for (let chunk = 0; chunk < 9; chunk++)
      await this.ruleRequest(3, { chunk, bytes: bytes.subarray(chunk * 16, (chunk + 1) * 16) });
    await this.ruleRequest(4, { action });
  }
  async saveRules(before, after, progress = () => {}) {
    validateRules(before); validateRules(after);
    if (!(await this.unlockStatus())[0]) fail("キーボードのロックを解除してください。");
    const previous = new Map(before.map((rule) => [ruleId(rule), rule]));
    const desired = new Map(after.map((rule) => [ruleId(rule), rule]));
    const edits = [];
    for (const [id, rule] of previous) if (!desired.has(id)) edits.push([2, rule]);
    for (const [id, rule] of desired)
      if (!previous.has(id) || String(encodeRule(previous.get(id))) !== String(encodeRule(rule))) edits.push([rule.hidden ? 1 : 0, rule]);
    for (let i = 0; i < edits.length; i++) {
      await this.writeRule(...edits[i]);
      progress((i + 1) / edits.length);
    }
    const actual = await this.readRules();
    const order = (a, b) => ruleId(a).localeCompare(ruleId(b));
    if (JSON.stringify([...actual].sort(order).map((rule) => [...encodeRule(rule)])) !== JSON.stringify([...after].sort(order).map((rule) => [...encodeRule(rule)])))
      fail("辞書の保存結果が一致しません。再接続して確認してください。");
    return actual;
  }
  async readKeymap(progress = () => {}) {
    const bytes = new Uint8Array(STORAGE_LAYERS * ROWS * COLS * 2);
    for (let offset = 0; offset < bytes.length; offset += 28) {
      const size = Math.min(28, bytes.length - offset);
      const result = await this.echo([0x12, offset >> 8, offset & 255, size]);
      bytes.set(result.subarray(4, 4 + size), offset);
      progress(Math.min(1, (offset + size) / bytes.length));
    }
    return decodeKeymap(bytes);
  }
  async unlockStatus() {
    return this.request([0xfe, 5]);
  }
  async unlockStart() {
    await this.request([0xfe, 6]);
  }
  async unlockPoll() {
    return this.request([0xfe, 7]);
  }
  async lock() {
    await this.request([0xfe, 8]);
  }
  async save(before, after, settings, progress = () => {}) {
    if (!(await this.unlockStatus())[0])
      fail("キーボードのロックを解除してください。");
    const edits = changes(before, after);
    for (let i = 0; i < edits.length; i++) {
      const { code } = edits[i];
      const { layer, row, col } = storageAddress(
        edits[i].layer,
        edits[i].row * COLS + edits[i].col,
      );
      const result = await this.echo([
        5,
        layer,
        row,
        col,
        code >> 8,
        code & 255,
      ]);
      if (result[4] !== code >> 8 || result[5] !== (code & 255))
        fail("書き込みの応答が一致しません。");
      progress(edits.length ? ((i + 1) / edits.length) * 0.5 : 0.5);
    }
    const actualSettings = await this.settings(settings);
    const actual = await this.readKeymap((p) => progress(0.5 + p * 0.5));
    if (
      changes(after, actual).length ||
      ["flags", "en", "jp", "firstUp"].some((key) => actualSettings[key] !== (key === "firstUp" ? settings.firstUp ?? true : settings[key]))
    )
      fail(
        "保存結果が一致しません。設定をエクスポートし、再接続して確認してください。",
      );
    return { keymap: actual, settings: actualSettings };
  }
  async close() {
    this.closed = true;
    this.pending?.reject(Error("接続を終了しました。"));
    this.pending = null;
    this.device.removeEventListener("inputreport", this.onReport);
    if (this.device.opened) await this.device.close();
  }
}
export async function connectKeyboard(data) {
  if (!globalThis.navigator?.hid)
    fail(
      "接続にはデスクトップ版ChromeまたはEdgeなど、WebHID対応ブラウザーを使用してください。",
    );
  const [device] = await navigator.hid.requestDevice({
    filters: [
      { vendorId: 0x2784, productId: 1, usagePage: 0xff60, usage: 0x61 },
    ],
  });
  if (!device) return null;
  try {
    await device.open();
  } catch (error) {
    throw Error(
      "キーボードのUSB接続を開けませんでした。Vial・VIAなど他の設定アプリや接続中のタブを閉じ、抜き差しして再試行してください。Linuxではhidrawのudevアクセス権限も確認してください。UF2の互換性は接続を開いた後に判定します。" +
        `（${error.message}）`,
    );
  }
  const client = new MejiroHID(device, data);
  try {
    const settings = await client.identify();
    return { client, settings };
  } catch (error) {
    await client.close();
    throw error;
  }
}

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MejiroHID } from "../site/hid.js";
import { encodeRule, decodeRule } from "../site/rules.js";
import {
  UID,
  clone,
  encodeKeymap,
  storageAddress,
  STORAGE_LAYERS,
} from "../site/model.js";
const data = JSON.parse(
  readFileSync(new URL("../site/data.json", import.meta.url)),
);
class Device extends EventTarget {
  opened = true;
  locked = true;
  profile = 0;
  settings = { flags: 6, en: 0, jp: 0, firstUp: true };
  keymap = clone(data.defaults.jp);
  rules = [];
  ruleCapacity = 96;
  pendingRule = new Uint8Array(144);
  sent = [];
  corrupt = false;
  active = 0;
  peak = 0;
  async sendReport(id, input) {
    this.active++;
    this.peak = Math.max(this.peak, this.active);
    this.sent.push([...input]);
    assert.equal(id, 0);
    assert.equal(input.length, 32);
    const b = input.slice();
    if (b[0] === 0xfe && b[1] === 0) {
      b.fill(0);
      b[0] = 6;
      b.set(UID, 4);
    } else if (b[0] === 0xfe && b[1] === 5) {
      b.fill(0);
      b[0] = !this.locked;
    } else if (b[0] === 0xfe && b[1] === 8) {
      this.locked = true;
    } else if (b[0] === 1) {
      b[1] = 0;
      b[2] = 9;
    } else if (b[0] === 0x11) b[1] = STORAGE_LAYERS;
    else if (b[0] === 0xfa) {
      if (b[1] === 2) {
        if (b[2] === 0) b.set([this.rules.length, this.ruleCapacity, 1, 32, 96, 8], 12);
        else if (b[2] === 1) {
          const entry = this.rules[b[12]];
          if (!entry) b[3] = 2;
          else
            b.set(encodeRule(entry).subarray(b[13] * 16, b[13] * 16 + 16), 16);
        } else if (this.locked) b[3] = 1;
        else if (b[2] === 2) this.pendingRule.fill(0);
        else if (b[2] === 3)
          this.pendingRule.set(b.subarray(16, 32), b[12] * 16);
        else if (b[2] === 4) {
          const rule = decodeRule(this.pendingRule);
          this.rules = this.rules.filter(
            (r) => r.kind !== rule.kind || r.key !== rule.key,
          );
          if (b[12] !== 2)
            this.rules.push(
              b[12] === 1
                ? { ...rule, hidden: true, value: "", row: "", context: 0 }
                : rule,
            );
        }
      }
      if (b[1] === 1 && b[2] === 3 && this.timing) {
        if (this.locked) b[3] = 1;
        else
          this.timing = {
            combo: b[20] | (b[21] << 8),
            continuation: b[22] | (b[23] << 8),
            hold: b[24] | (b[25] << 8),
          };
      }
      if (b[1] === 1 && this.timing) {
        b[19] = 1;
        [this.timing.combo, this.timing.continuation, this.timing.hold].forEach(
          (value, i) => {
            b[20 + i * 2] = value & 255;
            b[21 + i * 2] = value >> 8;
          },
        );
      }
      if (b[1] === 1 && this.immediateSokuon !== undefined) {
        if (b[2] === 4) {
          assert.equal(b[26], 0);
          if (this.locked) b[3] = 1;
          else if (b[27] > 1) b[3] = 2;
          else if (!this.dropSokuonSave) this.immediateSokuon = !!b[27];
        }
        b[26] = 1;
        b[27] = b[2] === 4 && this.dropSokuonSave
          ? b[27]
          : Number(this.immediateSokuon);
      }
      if (b[1] === 1 && this.autoImeSwitch !== undefined) {
        if (b[2] === 5) {
          assert.equal(b[28], 0);
          if (this.locked) b[3] = 1;
          else if (b[29] > 1) b[3] = 2;
          else if (!this.dropImeSave) this.autoImeSwitch = !!b[29];
        }
        b[28] = 1;
        if (b[2] !== 5 || !this.dropImeSave) b[29] = Number(this.autoImeSwitch);
      }
      if (b[1] === 1 && this.outputOptions !== undefined) {
        if (b[2] === 6) {
          assert.equal(b[30], 0);
          if (this.locked) b[3] = 1;
          else if (b[31] > 7) b[3] = 2;
          else if (!this.dropOutputSave) this.outputOptions = b[31];
        }
        b[30] = 1;
        if (b[2] !== 6 || !this.dropOutputSave) b[31] = this.outputOptions;
      }
      if (b[1] === 1 && b[2] === 2) {
        if (this.locked) b[3] = 1;
        else this.settings.firstUp = !!b[18];
      }
      if (b[1] === 1 && b[2] === 1) {
        if (this.locked) b[3] = 1;
        else
          this.settings = {
            ...this.settings,
            flags: b[12],
            en: b[13],
            jp: b[14],
          };
      }
      if (b[1] === 1)
        b.set(
          [
            this.settings.flags,
            this.settings.en,
            this.settings.jp,
            this.profile,
            STORAGE_LAYERS,
            18,
            Number(this.settings.firstUp),
          ],
          12,
        );
    } else if (b[0] === 0x12) {
      const offset = b[1] * 256 + b[2];
      const all = encodeKeymap(this.keymap);
      b.set(all.slice(offset, offset + b[3]), 4);
      if (this.corrupt) b[4] ^= 1;
    } else if (b[0] === 5) {
      for (let l = 0; l < 12; l++)
        for (let i = 0; i < 58; i++) {
          const a = storageAddress(l, i);
          if (a.layer === b[1] && a.row === b[2] && a.col === b[3])
            this.keymap[l][i] = b[4] * 256 + b[5];
        }
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.active--;
    const event = new Event("inputreport");
    event.reportId = 0;
    event.data = new DataView(b.buffer);
    this.dispatchEvent(event);
  }
  async close() {
    this.opened = false;
  }
}
test("identify checks UID, layer count and dedicated settings before reading the map", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  assert.deepEqual(await client.identify(), {
    flags: 6,
    en: 0,
    jp: 0,
    firstUp: true,
  });
  assert.equal(client.profile, "jp");
  assert.deepEqual(await client.readKeymap(), data.defaults.jp);
  await client.close();
});
test("unrelated keyboards and firmware cannot pass the identity check", async () => {
  const device = new Device();
  const send = device.sendReport.bind(device);
  device.sendReport = async (id, bytes) => {
    if (bytes[0] === 0xfe && bytes[1] === 0) {
      const b = new Uint8Array(32);
      b[0] = 6;
      const e = new Event("inputreport");
      e.reportId = 0;
      e.data = new DataView(b.buffer);
      device.dispatchEvent(e);
    } else await send(id, bytes);
  };
  const client = new MejiroHID(device, data);
  await assert.rejects(client.identify(), /Vial/);
  await client.close();
});
test("commands are serialized even when callers issue concurrent reads", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  await Promise.all([
    client.settings(),
    client.readKeymap(),
    client.settings(),
  ]);
  assert.equal(device.peak, 1);
  await client.close();
});
test("locked save sends no writes; unlocked save verifies physical and virtual Hold mappings", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data),
    next = clone(data.defaults.jp);
  next[0][1] = 5;
  next[6][24] = 0xe2;
  await assert.rejects(
    client.save(data.defaults.jp, next, { flags: 7, en: 1, jp: 16 }),
    /ロック/,
  );
  assert.equal(device.sent.filter((b) => b[0] === 5).length, 0);
  device.locked = false;
  const result = await client.save(data.defaults.jp, next, {
    flags: 7,
    en: 1,
    jp: 16,
  });
  assert.deepEqual(result.keymap, next);
  assert.deepEqual(result.settings, { flags: 7, en: 1, jp: 16, firstUp: true });
  assert.equal(device.sent.filter((b) => b[0] === 5).length, 2);
  await client.close();
});
test("readback mismatch is an error, never a successful save", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  device.locked = false;
  device.corrupt = true;
  await assert.rejects(
    client.save(data.defaults.jp, data.defaults.jp, { flags: 6, en: 0, jp: 0 }),
    /保存結果/,
  );
  await client.close();
});
test("a failed send closes the command stream without an unhandled rejected waiter", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  device.sendReport = async () => {
    throw Error("USB disconnected");
  };
  await assert.rejects(client.settings(), /USB disconnected/);
  assert.equal(client.closed, true);
  await client.close();
});

test("USB open errors explain permissions before attempting firmware identification", async () => {
  const { connectKeyboard } = await import("../site/hid.js");
  const old = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      hid: {
        requestDevice: async () => [
          {
            open: async () => {
              throw Error("Failed to open the device.");
            },
          },
        ],
      },
    },
  });
  try {
    await assert.rejects(
      connectKeyboard(data),
      /udev.*Failed to open the device/,
    );
  } finally {
    if (old) Object.defineProperty(globalThis, "navigator", old);
    else delete globalThis.navigator;
  }
});

test("extra combo Tap and Hold writes use extension storage and read back exactly", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data),
    next = clone(data.defaults.jp);
  await client.identify();
  device.locked = false;
  next[4][53] = 0x29;
  next[9][50] = 0xe2;
  await client.save(data.defaults.jp, next, device.settings);
  assert.deepEqual(device.keymap, next);
  assert.ok(
    device.sent.some(
      (b) => b.slice(0, 6).join() === [5, 12, 2, 5, 0, 0x29].join(),
    ),
  );
  assert.ok(
    device.sent.some(
      (b) => b.slice(0, 6).join() === [5, 13, 1, 8, 0, 0xe2].join(),
    ),
  );
  await client.close();
});

test("closing a session does not automatically relock the keyboard", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  await client.identify();
  device.locked = false;
  await client.close();
  assert.equal(device.locked, false);
  assert.equal(
    device.sent.some((b) => b[0] === 0xfe && b[1] === 8),
    false,
  );
});

test("saving settings ignores property order and keeps the device connected", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  device.locked = false;
  const result = await client.save(data.defaults.jp, data.defaults.jp, {
    en: 1,
    jp: 0,
    flags: 7,
  });
  assert.deepEqual(result.settings, { flags: 7, en: 1, jp: 0, firstUp: true });
  assert.equal(device.opened, true);
  assert.equal(client.closed, false);
  assert.deepEqual(await client.settings(), result.settings);
  await client.close();
});

test("dictionary rules require unlock, persist through HID reads, and can be removed", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  const rule = {
    kind: 0,
    key: "STK-",
    value: "こんにちは",
    row: "",
    context: 0,
    hidden: false,
  };
  assert.deepEqual(await client.readRules(), []);
  await assert.rejects(client.saveRules([], [rule]), /ロック/);
  device.locked = false;
  assert.deepEqual(await client.saveRules([], [rule]), [rule]);
  assert.deepEqual(await client.readRules(), [rule]);
  assert.deepEqual(await client.saveRules([rule], []), []);
  await client.close();
});
test("first-up setting is stored and read back", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  await assert.rejects(client.setFirstUp(false), /ロック/);
  device.locked = false;
  assert.equal(await client.setFirstUp(false), false);
  assert.equal((await client.settings()).firstUp, false);
  await client.close();
});

test("timings are saved and read back; unsupported firmware refuses before keymap writes", async () => {
  const device = new Device(),
    client = new MejiroHID(device, data);
  device.locked = false;
  device.timing = { combo: 150, continuation: 50, hold: 300 };
  const initial = await client.identify();
  const wanted = {
    ...initial,
    timing: { combo: 100, continuation: 40, hold: 250 },
  };
  const saved = await client.save(data.defaults.jp, data.defaults.jp, wanted);
  assert.deepEqual(saved.settings.timing, wanted.timing);
  assert.deepEqual((await client.settings()).timing, wanted.timing);
  await assert.rejects(
    client.setTiming({ combo: 100, continuation: 200, hold: 150 }),
    /判定時間/,
  );
  await client.close();
  const old = new Device(),
    legacy = new MejiroHID(old, data);
  old.locked = false;
  await legacy.identify();
  await assert.rejects(
    legacy.save(data.defaults.jp, data.defaults.jp, wanted),
    /最新のUF2/,
  );
  assert.equal(
    old.sent.some((b) => b[0] === 5),
    false,
  );
  await legacy.close();
});

test("dictionary capacity follows firmware while preserving older 24-entry devices", async () => {
  const device = new Device(), client = new MejiroHID(device, data);
  device.locked = false;
  const keys = Array.from({length: 128}, (_, n) => ["S", "T", "K", "N", "Y", "I", "A"].filter((_, i) => n & (1 << i)).join("") + "-").slice(1, 97);
  const rules = keys.map(key => ({kind: 0, key, value: "あ", row: "", context: 0, hidden: false}));
  await client.readRules();
  assert.equal((await client.saveRules([], rules)).length, 96);
  device.ruleCapacity = 24;
  device.rules = [];
  await client.readRules();
  await assert.rejects(client.saveRules([], rules), /24件/);
  assert.equal(device.rules.length, 0);
  await client.close();
});

test("immediate sokuon is opt-in, locked writes fail, and save verifies both directions", async () => {
  const device = new Device();
  device.immediateSokuon = false;
  const client = new MejiroHID(device, data);
  const initial = await client.identify();
  assert.equal(client.immediateSokuonSupported, true);
  assert.equal(initial.immediateSokuon, false);
  await assert.rejects(client.setImmediateSokuon(true), /ロック/);
  device.locked = false;
  const keymap = data.defaults.jp;
  const wanted = { ...initial, immediateSokuon: true };
  assert.equal((await client.save(keymap, keymap, wanted)).settings.immediateSokuon, true);
  assert.equal((await client.settings()).immediateSokuon, true);
  assert.equal((await client.save(keymap, keymap, initial)).settings.immediateSokuon, false);
  assert.deepEqual(
    device.sent.filter((b) => b[0] === 0xfa && b[1] === 1 && b[2] === 4)
      .map((b) => b[27]),
    [1, 1, 0],
  );
  device.dropSokuonSave = true;
  await assert.rejects(client.save(keymap, keymap, wanted), /保存結果が一致しません/);
  await client.close();
});

test("old firmware can save other changes but cannot receive immediate sokuon writes", async () => {
  const device = new Device();
  const client = new MejiroHID(device, data);
  device.locked = false;
  const initial = await client.identify();
  assert.equal(client.immediateSokuonSupported, false);
  const keymap = data.defaults.jp;
  const changed = clone(keymap);
  changed[0][1] = 6;
  await assert.rejects(client.save(keymap, changed, { ...initial, immediateSokuon: true }), /対応ファームウェア/);
  assert.equal(device.sent.some(b => b[0] === 5), false);
  const saved = await client.save(keymap, changed, { ...initial, immediateSokuon: false });
  assert.deepEqual(saved.keymap, changed);
  assert.equal(device.sent.some(b => b[0] === 0xfa && b[1] === 1 && b[2] === 4), false);
  await client.close();
});

test("automatic IME switch persists both ways, verifies readback and does not change with older backups", async () => {
  const device = new Device();
  device.autoImeSwitch = true;
  const client = new MejiroHID(device, data);
  const initial = await client.identify();
  assert.equal(client.autoImeSwitchSupported, true);
  assert.equal(initial.autoImeSwitch, true);
  await assert.rejects(client.setAutoImeSwitch(false), /ロック/);
  device.locked = false;
  const keymap = data.defaults.jp;
  const disabled = { ...initial, autoImeSwitch: false };
  assert.equal((await client.save(keymap, keymap, disabled)).settings.autoImeSwitch, false);
  const { autoImeSwitch: _omitted, ...legacy } = initial;
  assert.equal((await client.save(keymap, keymap, legacy)).settings.autoImeSwitch, false);
  assert.equal((await client.save(keymap, keymap, initial)).settings.autoImeSwitch, true);
  assert.deepEqual(device.sent.filter(b => b[0] === 0xfa && b[1] === 1 && b[2] === 5)
    .map(b => b[29]), [0, 0, 1]);
  device.dropImeSave = true;
  await assert.rejects(client.save(keymap, keymap, disabled), /保存結果が一致しません/);
  await client.close();
});

test("old firmware rejects unsupported IME switch changes before writing other settings", async () => {
  const device = new Device();
  const client = new MejiroHID(device, data);
  device.locked = false;
  const initial = await client.identify();
  assert.equal(client.autoImeSwitchSupported, false);
  const keymap = data.defaults.jp;
  const changed = clone(keymap);
  changed[0][1] = 6;
  await assert.rejects(client.save(keymap, changed, { ...initial, autoImeSwitch: false }), /対応ファームウェア/);
  assert.equal(device.sent.some(b => b[0] === 5), false);
  assert.deepEqual((await client.save(keymap, changed, { ...initial, autoImeSwitch: true })).keymap, changed);
  assert.equal(device.sent.some(b => b[0] === 0xfa && b[1] === 1 && b[2] === 5), false);
  await client.close();
});

test("output mode and spacing save independently and legacy backups preserve both", async () => {
  const device = new Device();
  device.outputOptions = 0;
  device.immediateSokuon = true;
  device.autoImeSwitch = false;
  const client = new MejiroHID(device, data);
  const initial = await client.identify();
  assert.equal(client.outputSupported, true);
  assert.equal(initial.outputMode, "romaji");
  assert.equal(initial.outputGap, 0);
  await assert.rejects(client.setOutput(7), /ロック/);
  device.locked = false;
  const keymap = data.defaults.jp;
  const wanted = { ...initial, outputMode: "jis-kana", outputGap: 10 };
  assert.deepEqual((await client.save(keymap, keymap, wanted)).settings, wanted);
  const { outputMode, outputGap, ...legacy } = initial;
  assert.deepEqual((await client.save(keymap, keymap, legacy)).settings, wanted);
  assert.deepEqual((await client.save(keymap, keymap, { ...legacy, outputGap: 2 })).settings,
    { ...wanted, outputGap: 2 });
  assert.deepEqual((await client.save(keymap, keymap, initial)).settings, initial);
  device.dropOutputSave = true;
  await assert.rejects(client.save(keymap, keymap, wanted), /保存結果が一致しません/);
  await client.close();
});
test("old firmware refuses non-default output settings before other writes", async () => {
  const device = new Device();
  device.locked = false;
  const client = new MejiroHID(device, data);
  const initial = await client.identify();
  assert.equal(client.outputSupported, false);
  const keymap = data.defaults.jp;
  const changed = clone(keymap);
  changed[0][1] = 6;
  for (const settings of [{ outputMode: "jis-kana" }, { outputGap: 2 }])
    await assert.rejects(client.save(keymap, changed, { ...initial, ...settings }), /対応ファームウェア/);
  assert.equal(device.sent.some(b => b[0] === 5), false);
  assert.deepEqual((await client.save(keymap, changed, { ...initial, outputMode: "romaji", outputGap: 0 })).keymap, changed);
  assert.equal(device.sent.some(b => b[0] === 250 && b[1] === 1 && b[2] === 6), false);
  await client.close();
});

test("shortcut settings probe and write keep navigation and modifiers independent", async () => {
  const device = Object.create(MejiroHID.prototype);
  let supported = false;
  let bytes = [0, 0];
  device.request = async (request) => {
    const response = new Uint8Array(32);
    response.set(request.slice(0, 12));
    if (!supported) response[3] = 2;
    else {
      if (request[2] === 8) bytes = request.slice(12, 14);
      response.set([...bytes, 1], 12);
    }
    return response;
  };
  assert.deepEqual(await device.shortcuts(), {});
  assert.equal(device.shortcutsSupported, false);
  supported = true;
  assert.deepEqual(await device.shortcuts(), { shortcutHome: "auto", modifierOrder: 0 });
  assert.equal(device.appleHost, true);
  await device.shortcuts({ shortcutHome: "apple", modifierOrder: 1 });
  assert.deepEqual(await device.shortcuts(), { shortcutHome: "apple", modifierOrder: 1 });
  await device.shortcuts({ shortcutHome: "native", modifierOrder: 22 });
  assert.deepEqual(await device.shortcuts(), { shortcutHome: "native", modifierOrder: 22 });
});

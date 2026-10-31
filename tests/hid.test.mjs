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
        if (b[2] === 0) b.set([this.rules.length, 24, 1, 32, 96, 8], 12);
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
        for (let i = 0; i < 54; i++) {
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

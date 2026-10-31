import {
  ruleNames,
  searchDictionary,
} from "./dictionary.js?v=20261031-rulekind1";
import { createKeyIcon } from "./key-icons.js";
import { downloadKeymapPNG } from "./keymap-image.js";
import { keyName } from "./key-names.js?v=20261030-names3";
import { setIcon } from "./ui.js?v=20261031-timing1";
import { keyChoices, searchChoices } from "./key-choices.js?v=20261030-names3";
import {
  clone,
  DEFAULT_TIMING,
  validateTiming,
  makeBackup,
  validateBackup,
  changes,
  selectRelease,
  selectBundledFirmware,
  supportedCode,
} from "./model.js?v=20261031-timing1";
import { connectKeyboard } from "./hid.js?v=20261031-timing1";
import { ruleId, validateRules } from "./rules.js";
import {
  boardKeys,
  labelFontSize,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from "./board-layout.js";
const $ = (id) => document.getElementById(id);
const data = await fetch("./data.json?v=20261030-defaults1")
  .then((r) => {
    if (!r.ok) throw Error("設定データを読み込めません。");
    return r.json();
  })
  .catch((error) => {
    $("status").textContent = error.message;
    throw error;
  });
const state = {
  profile: "jp",
  settings: {
    flags: 6,
    en: 0,
    jp: 0,
    firstUp: true,
    timing: { ...DEFAULT_TIMING },
  },
  rules: [],
  keymap: clone(data.defaults.jp),
  baseline: null,
  layer: 0,
  selected: 1,
  client: null,
  busy: false,
  unlocked: false,
  autoSave: false,
  releases: [],
  firmwareManifest: null,
  unlockController: null,
  modified: false,
};
const nameToCode = new Map(data.keycodes.map((k) => [k.name, k.value]));
const codeToName = new Map();
for (const { name, value } of data.keycodes)
  if (!codeToName.has(value)) codeToName.set(value, name);
// Prefer concise, familiar names over the long QMK enum aliases.
for (const name of [
  "KC_NO",
  "KC_TRNS",
  "KC_ENT",
  "KC_ESC",
  "KC_BSPC",
  "KC_TAB",
  "KC_SPC",
  "KC_MINS",
  "KC_EQL",
  "KC_LBRC",
  "KC_RBRC",
  "KC_BSLS",
  "KC_SCLN",
  "KC_QUOT",
  "KC_GRV",
  "KC_COMM",
  "KC_DOT",
  "KC_SLSH",
  "KC_LCTL",
  "KC_LSFT",
  "KC_LALT",
  "KC_LGUI",
  "KC_RCTL",
  "KC_RSFT",
  "KC_RALT",
  "KC_RGUI",
  "KC_LNG1",
  "KC_LNG2",
  "KC_DEL",
  "KC_NUBS",
  "KC_NUHS",
])
  if (nameToCode.has(name)) codeToName.set(nameToCode.get(name), name);
const layerLabels = [
  "Keyboard",
  "⇧ Keyboard",
  "Number",
  "⇧ Number",
  "Function",
  "Steno",
];
function status(message, type = "") {
  $("status").textContent = message;
  $("status").className = `status ${type}`;
}
function codeName(code) {
  return (
    codeToName.get(code) ||
    `0x${code.toString(16).padStart(4, "0").toUpperCase()}`
  );
}
function shortName(code) {
  const punctuation = {
    45: "-",
    46: "=",
    47: "[",
    48: "]",
    49: "\\",
    50: "#",
    51: ";",
    52: "'",
    53: "`",
    54: ",",
    55: ".",
    56: "/",
  };
  const shifted = {
    30: "!",
    31: "@",
    32: "#",
    33: "$",
    34: "%",
    35: "^",
    36: "&",
    37: "*",
    38: "(",
    39: ")",
    45: "_",
    46: "+",
    47: "{",
    48: "}",
    49: "|",
    51: ":",
    52: '"',
    53: "~",
    54: "<",
    55: ">",
    56: "?",
  };
  if (punctuation[code]) return punctuation[code];
  if ((code & 0xff00) === 0x0200 && shifted[code & 0xff])
    return shifted[code & 0xff];
  const name = codeName(code);
  const specials = {
    KC_NO: "—",
    KC_TRNS: "▽",
    KC_ENT: "Enter",
    KC_SPC: "Space",
    KC_BSPC: "BS",
    KC_DEL: "Del",
    KC_ESC: "Esc",
    KC_TAB: "Tab",
    KC_LSFT: "⇧",
    KC_RSFT: "⇧",
    KC_LCTL: "Ctrl",
    KC_LALT: "Alt",
    KC_LGUI: "Win",
    KC_RCTL: "Ctrl",
    KC_RALT: "Alt",
    KC_RGUI: "Win",
    KC_LNG1: "かな",
    KC_LNG2: "英数",
    MJI_MODE: "Layer",
    MJI_JIS: "JIS/US",
    MJI_ALT: "Layout ↔",
    MJI_MEJIRO: "Steno ↔",
    MJI_STICKY: "Sticky ⇧",
    MJI_00: "00",
    MJI_000: "000",
  };
  return specials[name] || keyName(code, name).label;
}
function parseCode(text, hold = false) {
  text = text.trim().toUpperCase();
  const modified =
    /^(LCTL|LSFT|LALT|LGUI|RCTL|RSFT|RALT|RGUI)\((KC_[A-Z0-9_]+)\)$/.exec(text);
  const modBits = {
    LCTL: 1,
    LSFT: 2,
    LALT: 4,
    LGUI: 8,
    RCTL: 17,
    RSFT: 18,
    RALT: 20,
    RGUI: 24,
  };
  const base = modified ? nameToCode.get(modified[2]) : undefined;
  const composed =
    base !== undefined && base <= 255
      ? (modBits[modified[1]] << 8) | base
      : undefined;
  const code =
    composed ??
    nameToCode.get(text) ??
    (/^[LR](CTL|SFT|ALT|GUI)$/.test(text)
      ? nameToCode.get(`KC_${text}`)
      : undefined) ??
    (/^0X[0-9A-F]{1,4}$/.test(text) ? Number(text) : NaN);
  if (!supportedCode(code))
    throw Error(
      `「${text}」はMejiro31で対応していないキーです。候補から選んでください。`,
    );
  if (hold && (code === 0x7e06 || code === 0x52a2))
    throw Error("Sticky ShiftはTap欄に割り当ててください。");
  if (
    code >= 0x74c0 &&
    code <= 0x74e9 &&
    (state.layer !== 5 || data.pairs.some((p) => p.logical === state.selected))
  )
    throw Error("速記キーはStenoレイヤーの物理キーに割り当ててください。");
  if (hold && code >= 0x74c0 && code <= 0x74e9)
    throw Error("速記キーはTap欄に割り当ててください。");
  return code;
}
function pairLabel(p) {
  return [p.a, p.b]
    .map((i) => `${Math.floor(i / 12) + 1}-${(i % 12) + 1}`)
    .join(" + ");
}
function fillLayouts(id) {
  $(id).replaceChildren(
    ...data.layouts.map((p, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = p.label;
      return o;
    }),
  );
}
for (const id of ["english-layout", "japanese-layout"]) fillLayouts(id);
$("layers").replaceChildren(
  ...layerLabels.map((name, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "layer-tab";
    b.setAttribute("role", "tab");
    b.id = `layer-tab-${i}`;
    b.setAttribute("aria-controls", "board");
    b.textContent = name;
    b.onclick = () => {
      state.layer = i;
      render();
    };
    b.onkeydown = (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        state.layer =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? 5
              : (i + (event.key === "ArrowLeft" ? 5 : 1)) % 6;
        render();
        $(`layer-tab-${state.layer}`).focus();
      }
    };
    return b;
  }),
);
function confirmAction(message) {
  return new Promise((resolve) => {
    const dialog = $("confirm-dialog");
    $("confirm-message").textContent = message;
    dialog.returnValue = "";
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "continue"),
      { once: true },
    );
    dialog.showModal();
  });
}
let autoSaveTimer;
function queueAutoSave() {
  clearTimeout(autoSaveTimer);
  if (
    state.autoSave &&
    state.client &&
    state.unlocked &&
    !state.busy &&
    isDirty()
  )
    autoSaveTimer = setTimeout(() => saveChanges(), 500);
}
$("auto-save").onclick = () => {
  state.autoSave = !state.autoSave;
  render();
  queueAutoSave();
  if (state.autoSave && state.client && !state.unlocked)
    status("オートセーブを開始するには本体のロックを解除してください。");
};
function touch() {
  state.modified = true;
  render();
  queueAutoSave();
}
function isDirty() {
  return (
    state.modified ||
    (state.baseline &&
      (changes(state.baseline.keymap, state.keymap).length ||
        ["combo", "continuation", "hold"].some(
          (key) =>
            (state.baseline.settings.timing || DEFAULT_TIMING)[key] !==
            (state.settings.timing || DEFAULT_TIMING)[key],
        ) ||
        JSON.stringify(state.baseline.rules) !== JSON.stringify(state.rules) ||
        ["flags", "en", "jp", "firstUp"].some(
          (key) => state.baseline.settings[key] !== state.settings[key],
        )))
  );
}
function keyChanged(map, reference, layer, pos) {
  return [layer, layer + 6].some((l) => map[l][pos] !== reference[l][pos]);
}
$("board").parentElement.onclick = (event) => {
  if (event.target.closest(".key")) return;
  state.selected = null;
  if (document.activeElement?.matches(".key")) document.activeElement.blur();
  render();
};
$("reset-settings").onclick = async () => {
  if (
    !(await confirmAction(
      "キーマップ・入力設定・メジロ式の辞書を標準設定に戻します。よろしいですか？",
    ))
  )
    return;
  state.keymap = clone(data.defaults[state.profile]);
  state.settings = {
    flags: state.profile === "en" ? 2 : 6,
    en: 0,
    jp: 0,
    firstUp: true,
    timing: { ...DEFAULT_TIMING },
  };
  state.rules = [];
  if (state.client && !state.client.timingSupported)
    delete state.settings.timing;
  touch();
};
let editingRule = null;
let dictionary = [];
let dictionaryError = "";
let dictionaryLimit = 100;
function editRule(rule) {
  editingRule = state.rules.some((entry) => ruleId(entry) === ruleId(rule))
    ? ruleId(rule)
    : null;
  $("rule-kind").value = rule.kind;
  try {
    localStorage.setItem("mejiro31-rule-kind", String(rule.kind));
  } catch {}
  $("rule-key").value = rule.key;
  $("rule-value").value = rule.value;
  $("rule-hidden").checked = rule.hidden;
  $("rule-row").value = rule.row;
  $("rule-context").value = rule.context;
  $("rule-submit").textContent = editingRule ? "変更を反映" : "辞書に追加";
  $("rule-cancel").hidden = false;
  updateRuleFields();
  $("rule-key").focus();
}
function renderDictionary() {
  if (!$("dictionary-search").value.trim()) {
    $("dictionary-results").replaceChildren();
    $("dictionary-count").textContent = "";
    $("dictionary-more").hidden = true;
    return;
  }
  const results = searchDictionary(
    dictionary,
    state.rules,
    $("dictionary-search").value,
    $("dictionary-kind").value,
  );
  $("dictionary-count").textContent =
    dictionaryError ||
    `${results.length} 件（${Math.min(dictionaryLimit, results.length)} 件表示）`;
  $("dictionary-results").replaceChildren(
    ...results.slice(0, dictionaryLimit).map((rule) => {
      const row = document.createElement("div");
      row.className = "rule-item dictionary-result";
      const title = document.createElement("strong");
      title.textContent = `${ruleNames[rule.kind]} · ${rule.key || "（空）"}`;
      const value = document.createElement("span");
      value.textContent = `${rule.hidden ? "無効" : rule.value || "（空文字）"}${rule.row ? ` · ${rule.row}行（語幹）` : ""} · ${rule.custom ? "ユーザー設定" : "標準"}`;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "button";
      edit.textContent = "編集";
      edit.disabled = state.busy;
      edit.onclick = () => editRule(rule);
      row.append(title, value, edit);
      return row;
    }),
  );
  $("dictionary-more").hidden = results.length <= dictionaryLimit;
}
for (const id of ["dictionary-search", "dictionary-kind"])
  $(id).addEventListener("input", () => {
    dictionaryLimit = 100;
    renderDictionary();
  });
$("dictionary-more").onclick = () => {
  dictionaryLimit += 100;
  renderDictionary();
};
fetch("./dictionary.json?v=004a3fb")
  .then((response) => {
    if (!response.ok) throw Error("辞書の読み込みに失敗しました。");
    return response.json();
  })
  .then((data) => {
    dictionary = data.entries;
    renderDictionary();
  })
  .catch((error) => {
    dictionaryError = error.message;
    renderDictionary();
  });
function renderRules() {
  renderDictionary();
  const list = $("rule-list");
  list.replaceChildren();
  if (!state.rules.length) {
    const empty = document.createElement("p");
    empty.className = "fine";
    empty.textContent = "登録した辞書項目はありません。";
    list.append(empty);
  }
  for (const rule of state.rules) {
    const item = document.createElement("div");
    item.className = "rule-item";
    const title = document.createElement("strong");
    title.textContent = `${ruleNames[rule.kind]} · ${rule.key || "（空）"}`;
    const value = document.createElement("span");
    value.textContent = rule.hidden
      ? "標準項目を無効化"
      : `${rule.value}${rule.row ? ` · ${rule.row}行` : ""}`;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "button";
    edit.textContent = "編集";
    edit.disabled = state.busy;
    edit.onclick = () => editRule(rule);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button";
    remove.textContent = "削除";
    remove.disabled = state.busy;
    remove.onclick = () => {
      state.rules = state.rules.filter(
        (entry) => ruleId(entry) !== ruleId(rule),
      );
      if (editingRule === ruleId(rule)) clearRuleForm();
      touch();
    };
    item.append(title, value, edit, remove);
    list.append(item);
  }
}
function updateRuleFields() {
  const kind = Number($("rule-kind").value);
  // Built-in examples match Mejiro Engine's USERS/ABSTRACT/VERB rule formats.
  const examples = [
    { key: "STK-", value: "こんにちは" },
    { key: "K-KAU", value: "ここ" },
    { key: "K", value: "この" },
    { key: "KAU", value: "こと" },
    { key: "A-", value: "あ", row: "ge" },
  ];
  const example = examples[kind];
  $("rule-key").placeholder = `例：${example.key}`;
  $("rule-value").placeholder = `例：${example.value}`;
  $("rule-row").placeholder = `例：${example.row || "r"}`;
  $("rule-row-label").hidden = kind !== 4;
  $("rule-context-label").hidden = kind !== 1;
  $("rule-key").required = kind !== 2;
  $("rule-value").disabled = $("rule-hidden").checked || state.busy;
}
function clearRuleForm() {
  editingRule = null;
  const kind = $("rule-kind").value;
  $("rule-form").reset();
  $("rule-kind").value = kind;
  $("rule-submit").textContent = "辞書に追加";
  $("rule-cancel").hidden = true;
  updateRuleFields();
}
const ruleKindStorageKey = "mejiro31-rule-kind";
try {
  const saved = localStorage.getItem(ruleKindStorageKey);
  if (["0", "1", "2", "3", "4"].includes(saved)) $("rule-kind").value = saved;
} catch {}
$("rule-kind").onchange = () => {
  try {
    localStorage.setItem(ruleKindStorageKey, $("rule-kind").value);
  } catch {}
  updateRuleFields();
};
$("rule-hidden").onchange = updateRuleFields;
$("rule-cancel").onclick = clearRuleForm;
$("rule-form").onsubmit = (event) => {
  event.preventDefault();
  const kind = Number($("rule-kind").value);
  const rule = {
    kind,
    key: $("rule-key").value.trim(),
    value: $("rule-hidden").checked ? "" : $("rule-value").value,
    row:
      !$("rule-hidden").checked && kind === 4 ? $("rule-row").value.trim() : "",
    context:
      !$("rule-hidden").checked && kind === 1
        ? Number($("rule-context").value)
        : 0,
    hidden: $("rule-hidden").checked,
  };
  try {
    const next = state.rules.filter((entry) => ruleId(entry) !== editingRule);
    next.push(rule);
    validateRules(next);
    state.rules = next;
    clearRuleForm();
    touch();
  } catch (error) {
    status(error.message, "error");
  }
};
updateRuleFields();
function updateTimingAppearance(name) {
  const field = $("timing-" + name);
  const changed = Number(field.value) !== DEFAULT_TIMING[name];
  field.classList.toggle("customized", changed);
  $("timing-" + name + "-default").hidden = !changed;
}
function render() {
  if (state.layer === 5 && data.pairs.some((p) => p.logical === state.selected))
    state.selected = 1;
  const pair = data.pairs.find((p) => p.logical === state.selected);
  $("board").setAttribute("role", "tabpanel");
  $("board").setAttribute("aria-labelledby", `layer-tab-${state.layer}`);
  for (const [i, b] of [...$("layers").children].entries()) {
    b.setAttribute("aria-selected", String(i === state.layer));
    b.tabIndex = i === state.layer ? 0 : -1;
    b.disabled = state.busy;
    const reference = state.baseline?.keymap || data.defaults[state.profile];
    b.classList.toggle(
      "dirty",
      state.keymap[i].some((_, pos) =>
        keyChanged(state.keymap, reference, i, pos),
      ),
    );
  }
  $("layer-heading").textContent = layerLabels[state.layer].toUpperCase();
  $("board").replaceChildren(
    ...boardKeys(data, state.layer).map((key) => {
      const pos = key.logical;
      const code = state.keymap[state.layer][pos];
      const hold = state.keymap[state.layer + 6][pos];
      const combo = key.kind === "combo";
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "key" +
        (combo ? " combo-key" : "") +
        (combo && code === 0 && hold === 0 ? " empty-combo" : "") +
        (key.width === 2 ? " wide-key" : "") +
        (state.selected === pos ? " selected" : "") +
        (!combo && pair && [pair.a, pair.b].includes(pos) ? " source" : "") +
        (keyChanged(
          state.keymap,
          state.baseline?.keymap || data.defaults[state.profile],
          state.layer,
          pos,
        )
          ? " dirty"
          : "") +
        (state.client &&
        keyChanged(state.keymap, data.defaults[state.profile], state.layer, pos)
          ? " customized"
          : "");
      button.dataset.logical = pos;
      button.dataset.kind = key.kind;
      button.style.left = `${(key.x / BOARD_WIDTH) * 100}%`;
      button.style.top = `${(key.y / BOARD_HEIGHT) * 100}%`;
      button.style.width = `${((key.width - (combo ? 0 : 0.06)) / BOARD_WIDTH) * 100}%`;
      button.style.height = `${((key.height - (combo ? 0 : 0.06)) / BOARD_HEIGHT) * 100}%`;

      button.title = `${combo ? "同時押し" : "キー"} · 短く押す：${keyName(code, codeName(code)).label} · 長押し：${keyName(hold, codeName(hold)).label}`;
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", String(state.selected === pos));
      button.disabled = state.busy;
      const text = document.createElement("span");
      text.className = "key-label";
      const holdLabel = [0xe1, 0xe5].includes(hold) ? "Shift" : shortName(hold);
      const hasHold = hold !== 0 && hold !== 1;
      // Modifier-only keys show the modifier as their main legend.
      // Every key, including the 2u thumbs, uses the same Tap/Hold hierarchy.
      text.textContent =
        !combo && [0, 1].includes(code) && hasHold
          ? holdLabel
          : shortName(code);
      const iconCode = !combo && [0, 1].includes(code) && hasHold ? hold : code;
      const symbol = createKeyIcon(iconCode);
      if (symbol) {
        text.replaceChildren(symbol);
        text.dataset.iconCode = iconCode;
      }
      button.style.setProperty(
        "--label-size",
        `${labelFontSize(text.textContent, key)}cqw`,
      );
      if (code === nameToCode.get("MJI_MODE")) button.classList.add("mode-key");
      const hint = document.createElement("small");
      hint.textContent =
        !combo && ![0, 1].includes(code) && hasHold ? holdLabel : "";
      if (hint.textContent) button.classList.add("has-hold");
      const legends = document.createElement("span");
      legends.className = "key-legends";
      legends.append(text, hint);
      button.append(legends);
      button.onclick = () => {
        state.selected = pos;
        render();
      };
      return button;
    }),
  );
  const hasSelection = state.selected !== null;
  document.querySelector(".binding-panel").hidden = !hasSelection;
  const selected = state.selected ?? 1;
  const code = state.keymap[state.layer][selected];
  $("binding-title").textContent = shortName(code);
  $("tap-code").dataset.code = codeName(code);
  $("tap-code").value = keyName(code, codeName(code)).label;
  const holdCode = state.keymap[state.layer + 6][selected];
  $("hold-code").dataset.code = choiceName(holdCode);
  $("hold-code").value = keyName(holdCode, codeName(holdCode)).label;
  $("edit-profile").value = state.profile;
  $("edit-profile").disabled = !!state.client || state.busy;
  $("english-layout").value = state.settings.en;
  $("japanese-layout").value = state.settings.jp;
  $("host-layout").value = state.settings.flags & 1 ? "jis" : "us";
  $("alt-enabled").checked = !!(state.settings.flags & 2);
  $("mejiro-enabled").checked = !!(state.settings.flags & 4);
  $("first-up").checked = state.settings.firstUp;
  for (const name of ["combo", "continuation", "hold"]) {
    $("timing-" + name).value = (state.settings.timing || DEFAULT_TIMING)[name];
    updateTimingAppearance(name);
    $("timing-" + name).disabled =
      state.busy || (!!state.client && !state.client.timingSupported);
  }
  $("timing-support").hidden = !state.client || !!state.client.timingSupported;
  renderRules();
  $("rule-value").disabled = state.busy || $("rule-hidden").checked;
  for (const id of [
    "tap-code",
    "hold-code",
    "apply-key",
    "import",
    "reset-settings",
    "english-layout",
    "japanese-layout",
    "host-layout",
    "alt-enabled",
    "mejiro-enabled",
    "first-up",
    "rule-kind",
    "rule-key",
    "rule-value",
    "rule-row",
    "rule-context",
    "rule-submit",
    "rule-cancel",
    "rule-hidden",
  ])
    $(id).disabled = state.busy;
  $("connect").disabled = state.busy;
  setIcon(
    $("connect"),
    state.client ? "close" : "plug",
    state.client ? "接続を終了" : "キーボードを接続",
  );
  $("connection-label").textContent = state.client ? "接続済み" : "未接続";
  $("connection-dot").classList.toggle("connected", !!state.client);
  $("mode-badge").textContent = state.client
    ? "Mejiro31 接続済み"
    : "オフライン編集";
  const dirty = isDirty();
  $("dirty-label").textContent = state.busy
    ? "キーボードと通信中…"
    : dirty
      ? "未保存"
      : state.client
        ? "保存済み"
        : "オフライン";
  $("save-hint").textContent = state.client
    ? "変更内容を確認して、本体に保存してください。"
    : "設定の保存にはキーボードを接続してください。";
  $("save").disabled = !state.client || !state.unlocked || state.busy || !dirty;
  $("unlock").disabled = !state.client || state.busy;
  $("unlock").setAttribute(
    "aria-pressed",
    String(!!state.client && !state.unlocked),
  );
  $("auto-save").disabled = state.busy;
  $("auto-save").setAttribute("aria-pressed", String(state.autoSave));
  setIcon(
    $("auto-save"),
    "autosave",
    `オートセーブ：${state.autoSave ? "オン" : "オフ"}`,
  );
  setIcon(
    $("unlock"),
    state.unlocked ? "unlock" : "lock",
    !state.client ? "未接続" : state.unlocked ? "本体をロック" : "ロックを解除",
  );
}
function busy(value) {
  state.busy = value;
  $("progress").hidden = !value;
  if (value) $("progress").value = 0;
  render();
}
function downloadBlob(name, value) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2) + "\n"], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("apply-key").onclick = () => {
  if (state.selected === null) return;
  try {
    const tap = parseCode($("tap-code").dataset.code),
      hold = parseCode($("hold-code").dataset.code, true);
    state.keymap[state.layer][state.selected] = tap;
    state.keymap[state.layer + 6][state.selected] = hold;
    touch();
    status(
      "編集中の設定に反映しました。本体へ反映するには「キーボードに保存」を押してください。",
    );
  } catch (e) {
    status(e.message, "error");
  }
};
function choiceName(code) {
  if (code >= 0xe0 && code <= 0xe7) return codeName(code).replace(/^KC_/, "");
  const mods = {
    1: "LCTL",
    2: "LSFT",
    4: "LALT",
    8: "LGUI",
    17: "RCTL",
    18: "RSFT",
    20: "RALT",
    24: "RGUI",
  };
  if (code > 0xff && code <= 0x1fff && mods[code >> 8])
    return `${mods[code >> 8]}(${codeName(code & 0xff)})`;
  return codeName(code);
}
let pickerTarget = null;
let pickerChoices = [];
function renderChoices() {
  const choices = searchChoices(pickerChoices, $("key-search").value);
  $("key-count").textContent = choices.length
    ? `${choices.length} 件の候補`
    : "一致するキーがありません。検索語を変えてください。";
  $("key-options").replaceChildren(
    ...choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key-option";
      button.textContent = choice.label;
      button.setAttribute(
        "aria-pressed",
        String(choice.code === $(pickerTarget).dataset.code),
      );
      button.onclick = () => {
        $(pickerTarget).value = choice.label;
        $(pickerTarget).dataset.code = choice.code;
        $("key-picker").close();
        $(pickerTarget).focus();
      };
      return button;
    }),
  );
}
function openPicker(id) {
  if ($(id).disabled) return;
  pickerTarget = id;
  const hold = id === "hold-code";
  pickerChoices = keyChoices(data, choiceName, {
    hold,
    steno:
      state.layer === 5 &&
      !data.pairs.some((p) => p.logical === state.selected),
  });
  $("key-picker-title").textContent = hold
    ? "長押し — キー・レイヤーを選択"
    : "短く押す — キーを選択";
  $("key-search").value = "";
  renderChoices();
  $("key-picker").showModal();
  $("key-search").focus();
}
for (const id of ["tap-code", "hold-code"]) {
  $(id).onclick = () => openPicker(id);
  $(id).onkeydown = (e) => {
    if (["Enter", " ", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      openPicker(id);
    }
  };
}
$("key-search").oninput = renderChoices;
$("key-picker-close").onclick = () => $("key-picker").close();
$("edit-profile").onchange = async () => {
  if (
    isDirty() &&
    !(await confirmAction(
      "編集中の設定を初期状態に置き換えます。先に必要な設定を書き出してください。",
    ))
  ) {
    render();
    return;
  }
  state.profile = $("edit-profile").value;
  state.keymap = clone(data.defaults[state.profile]);
  state.settings = {
    flags: state.profile === "en" ? 2 : 6,
    en: 0,
    jp: 0,
    firstUp: true,
    timing: { ...DEFAULT_TIMING },
  };
  state.baseline = null;
  state.rules = [];
  state.modified = false;
  render();
};
for (const id of [
  "english-layout",
  "japanese-layout",
  "host-layout",
  "alt-enabled",
  "mejiro-enabled",
  "first-up",
])
  $(id).onchange = () => {
    state.settings = {
      ...state.settings,
      firstUp: $("first-up").checked,
      en: Number($("english-layout").value),
      jp: Number($("japanese-layout").value),
      flags:
        ($("host-layout").value === "jis" ? 1 : 0) |
        ($("alt-enabled").checked ? 2 : 0) |
        ($("mejiro-enabled").checked ? 4 : 0),
    };
    touch();
  };
for (const name of ["combo", "continuation", "hold"])
  $("timing-" + name).oninput = () => updateTimingAppearance(name);
for (const name of ["combo", "continuation", "hold"])
  $("timing-" + name).onchange = () => {
    try {
      const timing = Object.fromEntries(
        ["combo", "continuation", "hold"].map((key) => [
          key,
          Number($("timing-" + key).value),
        ]),
      );
      validateTiming(timing);
      state.settings.timing = timing;
      touch();
    } catch (error) {
      status(error.message, "error");
      render();
    }
  };
$("export").onclick = () =>
  downloadBlob(
    `mejiro31-${state.profile}-keymap.json`,
    makeBackup(state.profile, state.settings, state.keymap, state.rules),
  );
$("import").onclick = () => $("import-file").click();
$("import-file").onchange = async () => {
  const file = $("import-file").files[0];
  if (!file) return;
  try {
    if (file.size > 100000) throw Error("設定ファイルが大きすぎます。");
    const parsed = validateBackup(JSON.parse(await file.text()), data);
    if (state.client && parsed.profile !== state.profile)
      throw Error(
        "接続中のファームウェアと基本プロファイルが違います。対応する言語のファームウェアを使用してください。",
      );
    if (
      isDirty() &&
      !(await confirmAction("現在の編集内容を読み込んだ設定で置き換えますか？"))
    )
      return;
    state.profile = parsed.profile;
    state.settings = parsed.settings;
    state.keymap = parsed.keymap;
    state.rules = parsed.rules;
    touch();
    status(
      "設定を読み込みました。キーボードへの書き込みはまだ行っていません。",
      "success",
    );
  } catch (e) {
    status(`読み込めませんでした: ${e.message}`, "error");
  } finally {
    $("import-file").value = "";
  }
};
$("connect").onclick = async () => {
  if (state.client) {
    busy(true);
    try {
      await state.client.close();
    } catch (e) {
      status(e.message, "error");
    } finally {
      state.client = null;
      state.baseline = null;
      busy(false);
    }
    return;
  }
  if (
    isDirty() &&
    !(await confirmAction(
      "接続するとキーボードの現在の設定を読み込み、編集中の内容を置き換えます。必要なら先に「書き出す」で保存してください。",
    ))
  )
    return;
  busy(true);
  let client;
  try {
    const result = await connectKeyboard(data);
    if (!result) return;
    client = result.client;
    const keymap = await client.readKeymap((p) => ($("progress").value = p));
    const rules = await client.readRules((p) => ($("progress").value = p));
    state.client = client;
    state.unlocked = !!(await client.unlockStatus())[0];
    state.profile = client.profile;
    state.settings = result.settings;
    state.keymap = keymap;
    state.rules = rules;
    state.baseline = {
      rules: clone(rules),
      keymap: clone(keymap),
      settings: clone(result.settings),
    };
    state.modified = false;
    status(
      "Mejiro31の設定を読み込みました。変更後はロックを解除して保存してください。",
      "success",
    );
  } catch (e) {
    if (client) await client.close().catch(() => {});
    status(
      e.name === "NotFoundError" ? "接続をキャンセルしました。" : e.message,
      "error",
    );
  } finally {
    busy(false);
  }
};
async function saveChanges() {
  clearTimeout(autoSaveTimer);
  if (!state.client || state.busy) return;
  const client = state.client;
  busy(true);
  try {
    const result = await client.save(
      state.baseline.keymap,
      state.keymap,
      state.settings,
      (p) => ($("progress").value = p),
    );
    const rules = await client.saveRules(
      state.baseline.rules,
      state.rules,
      (p) => ($("progress").value = p),
    );
    state.baseline = { ...clone(result), rules: clone(rules) };
    state.modified = false;
    status("キーボードに保存し、読み戻して内容を確認しました。", "success");
  } catch (e) {
    const disconnected = client.disconnected || state.client !== client;
    status(
      disconnected
        ? "デバイスが切断されました"
        : `保存できませんでした：${e.message}`,
      "error",
    );
    // Keep a usable connection open after validation/readback errors.
    if (client.closed || disconnected) {
      await client.close().catch(() => {});
      if (state.client === client) state.client = null;
      state.baseline = null;
    }
    state.modified = true;
  } finally {
    busy(false);
  }
}
$("save").onclick = saveChanges;
$("unlock").onclick = async () => {
  if (!state.client || state.busy) return;
  const client = state.client;
  if (state.unlocked) {
    clearTimeout(autoSaveTimer);
    busy(true);
    try {
      await client.lock();
      state.unlocked = false;
      status("本体をロックしました。");
    } catch (e) {
      status(e.message, "error");
    } finally {
      busy(false);
    }
    return;
  }
  const controller = new AbortController();
  state.unlockController = controller;
  busy(true);
  $("unlock-status").textContent = "キーが押されるのを待っています…";
  $("unlock-dialog").showModal();
  try {
    await client.unlockStart();
    for (let i = 0; i < 600 && !controller.signal.aborted; i++) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (controller.signal.aborted) break;
      const result = await client.unlockPoll();
      if (result[0]) {
        state.unlocked = true;
        status(
          "ロックを解除しました。変更内容を確認して「キーボードに保存」を押してください。",
          "success",
        );
        return;
      }
      $("unlock-status").textContent =
        `両端のキーを押し続けてください… ${Math.max(0, 50 - result[2])} / 50`;
    }
    if (!controller.signal.aborted)
      throw Error(
        "時間内にロックを解除できませんでした。もう一度お試しください。",
      );
  } catch (e) {
    status(e.message, "error");
  } finally {
    if (!controller.signal.aborted) controller.abort();
    if ($("unlock-dialog").open) $("unlock-dialog").close();
    state.unlockController = null;
    busy(false);
    queueAutoSave();
  }
};
$("unlock-dialog").addEventListener("close", () => {
  if (state.unlockController && !state.unlockController.signal.aborted) {
    state.unlockController.abort();
    state.client?.lock().catch(() => {});
    status("ロック解除をキャンセルしました。");
  }
});
navigator.hid?.addEventListener("disconnect", (event) => {
  if (state.client?.device === event.device) {
    state.unlockController?.abort();
    const old = state.client;
    old.disconnected = true;
    state.client = null;
    old.close().catch(() => {});
    state.baseline = null;
    state.modified = true;
    render();
    status("デバイスが切断されました", "error");
  }
});
window.addEventListener("beforeunload", (e) => {
  if (isDirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function selectedFirmware() {
  const profile = $("download-profile").value;
  const layout = "qwerty";
  return (
    selectBundledFirmware(state.firmwareManifest, profile, layout) ||
    selectRelease(state.releases, profile, layout)
  );
}
function updateDownload() {
  try {
    const asset = selectedFirmware();
    $("download").disabled = !asset;
    $("release-status").textContent = asset
      ? `${asset.tag} · ${asset.filename} · ${Math.round(asset.size / 1024)} KB`
      : "このプロファイルのUF2はまだ用意されていません。配布UF2はQWERTYです。代替配列は書き込み後、このサイトの設定から変更できます。";
  } catch (e) {
    $("download").disabled = true;
    $("release-status").textContent = e.message;
  }
}
$("download-profile").onchange = updateDownload;
$("download").onclick = async () => {
  $("download").disabled = true;
  try {
    const asset = selectedFirmware();
    if (!asset) throw Error("この組み合わせのUF2はまだ用意されていません。");
    let url = asset.url;
    if (asset.bundled) {
      const response = await fetch(asset.url, { cache: "no-store" });
      if (!response.ok)
        throw Error(
          "UF2を取得できませんでした。再読み込みしてお試しください。",
        );
      const bytes = await response.arrayBuffer();
      const digest = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      ]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      if (bytes.byteLength !== asset.size || digest !== asset.sha256)
        throw Error(
          "UF2の検証に失敗しました。書き込まず、ファイルを再配置してください。",
        );
      url = URL.createObjectURL(
        new Blob([bytes], { type: "application/octet-stream" }),
      );
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = asset.filename;
    a.click();
    if (asset.bundled) setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(
      `ダウンロードしました: ${asset.filename}。BOOTSELを押しながら接続し、RPI-RP2へコピーしてください。`,
    );
  } catch (e) {
    status(e.message, "error");
  } finally {
    updateDownload();
  }
};
render();
status(
  navigator.hid
    ? ""
    : "本体への接続にはWebHID対応のChrome／Edgeを使用してください。",
  navigator.hid ? "" : "notice",
);
$("download").disabled = true;
const keyboardSurface = document.querySelector(".board-scroll");
let keyboardColor = "black";
try {
  keyboardColor =
    localStorage.getItem("mejiro31-keyboard-color") === "white"
      ? "white"
      : "black";
} catch {}
function setKeyboardColor(color) {
  keyboardSurface.dataset.keyboardColor = color;
  document.querySelector(
    `input[name="keyboard-color"][value="${color}"]`,
  ).checked = true;
}
setKeyboardColor(keyboardColor);
for (const input of document.querySelectorAll('input[name="keyboard-color"]')) {
  input.addEventListener("change", () => {
    setKeyboardColor(input.value);
    try {
      localStorage.setItem("mejiro31-keyboard-color", input.value);
    } catch {}
  });
}

// Make bundled downloads available independently of GitHub API availability.
await Promise.allSettled([
  (async () => {
    const result = await fetch("./firmware/manifest.json", {
      cache: "no-store",
    });
    if (!result.ok) throw Error("同梱UF2の一覧を読み込めませんでした。");
    state.firmwareManifest = await result.json();
    updateDownload();
  })(),
  (async () => {
    const result = await fetch(
      "https://api.github.com/repos/JEEBIS27/Mejiro31/releases?per_page=30",
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!result.ok) throw Error("GitHubのリリース情報を取得できませんでした。");
    state.releases = await result.json();
    updateDownload();
  })(),
]);
updateDownload();

$("save-png").onclick = async () => {
  $("save-png").disabled = true;
  try {
    await downloadKeymapPNG(
      $("board"),
      layerLabels[state.layer],
      state.profile,
    );
  } catch (e) {
    status(`PNGを保存できませんでした: ${e.message}`, "error");
  } finally {
    $("save-png").disabled = false;
  }
};

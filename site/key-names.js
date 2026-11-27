import { detectPlatform } from "./platform.js?v=20261126-prism";
import { t } from "./locale.js?v=20261127-english-copy";
// User-facing names are separate from the firmware codes saved to the device.
const symbols = {
  45: ["-", "Minus", "マイナス"],
  46: ["=", "Equal", "イコール"],
  47: ["[", "Left bracket", "左角括弧"],
  48: ["]", "Right bracket", "右角括弧"],
  49: ["\\", "Backslash", "バックスラッシュ"],
  50: ["#", "Hash (ISO)", "ハッシュ ISO"],
  51: [";", "Semicolon", "セミコロン"],
  52: ["'", "Apostrophe", "アポストロフィ"],
  53: ["`", "Grave", "バッククォート"],
  54: [",", "Comma", "コンマ カンマ"],
  55: [".", "Period", "ピリオド ドット"],
  56: ["/", "Slash", "スラッシュ"],
  100: ["\\", "Backslash (ISO)", "バックスラッシュ ISO"],
};
const shifted = {
  30: ["!", "Exclamation", "感嘆符 ビックリマーク"],
  31: ["@", "At", "アットマーク"],
  32: ["#", "Hash", "ハッシュ シャープ ナンバー"],
  33: ["$", "Dollar", "ドル"],
  34: ["%", "Percent", "パーセント"],
  35: ["^", "Caret", "キャレット"],
  36: ["&", "Ampersand", "アンパサンド"],
  37: ["*", "Asterisk", "アスタリスク"],
  38: ["(", "Left parenthesis", "左丸括弧"],
  39: [")", "Right parenthesis", "右丸括弧"],
  45: ["_", "Underscore", "アンダースコア"],
  46: ["+", "Plus", "プラス"],
  47: ["{", "Left brace", "左波括弧"],
  48: ["}", "Right brace", "右波括弧"],
  49: ["|", "Pipe", "パイプ"],
  51: [":", "Colon", "コロン"],
  52: ['"', "Double quote", "ダブルクォート"],
  53: ["~", "Tilde", "チルダ"],
  54: ["<", "Less than", "小なり"],
  55: [">", "Greater than", "大なり"],
  56: ["?", "Question", "疑問符 クエスチョン"],
};
const names = {
  0: [t("未割り当て"), "None 無効 なし"],
  1: [t("下のレイヤーを使用"), "Transparent 透過"],
  40: ["Enter", "エンター 改行 リターン"],
  41: ["Esc", "Escape エスケープ"],
  42: ["Backspace", "バックスペース"],
  43: ["Tab", "タブ"],
  44: ["Space", "スペース 空白"],
  57: ["Caps Lock", "キャプスロック"],
  70: ["Print Screen", "スクリーンショット"],
  71: ["Scroll Lock", "スクロールロック"],
  72: ["Pause", "ポーズ"],
  73: ["Insert", "インサート 挿入"],
  74: ["Home", "ホーム"],
  75: ["Page Up", "ページアップ"],
  76: ["Delete", "削除 デリート"],
  77: ["End", "エンド"],
  78: ["Page Down", "ページダウン"],
  79: ["→ (Right)", "右 右矢印"],
  80: ["← (Left)", "左 左矢印"],
  81: ["↓ (Down)", "下 下矢印"],
  82: ["↑ (Up)", "上 上矢印"],
  83: ["Num Lock", "ナムロック"],
  101: ["Menu", "メニュー Application"],
  135: ["ろ (Ro)", "日本語 JIS"],
  136: ["かな (Kana)", "ひらがな カタカナ"],
  137: ["¥ (Yen)", "円 バックスラッシュ"],
  138: ["変換 (Henkan)", "Conversion"],
  139: ["無変換 (Muhenkan)", "Non conversion"],
  144: [
    "かな (Kana / IME On)",
    "かな カナ 日本語 ひらがな IME オン 入力切替 Language 1",
  ],
  145: [
    "英数 (IME Off)",
    "英数 えいすう 英語 半角 IME オフ 入力切替 Language 2",
  ],
  168: ["Mute", "ミュート 消音"],
  169: ["Volume Up", "音量 上げる"],
  170: ["Volume Down", "音量 下げる"],
  171: ["Next Track", "次 曲"],
  172: ["Previous Track", "前 曲"],
  173: ["Stop", "停止"],
  174: ["Play / Pause", "再生 一時停止"],
  189: ["Brightness Up", "明るさ 上げる"],
  190: ["Brightness Down", "明るさ 下げる"],
  224: ["Left Ctrl", "左Ctrl 左 コントロール Control"],
  225: ["Left Shift", "左Shift 左 シフト"],
  226: ["Left Alt", "左Alt 左 オルト Option"],
  227: ["Left Win / Command", "左 Windows GUI Super コマンド"],
  228: ["Right Ctrl", "右Ctrl 右 コントロール Control"],
  229: ["Right Shift", "右Shift 右 シフト"],
  230: ["Right Alt", "右Alt 右 オルト Option AltGr"],
  231: ["Right Win / Command", "右 Windows GUI Super コマンド"],
};
export const layerNames = [
  "Keyboard",
  "⇧ Keyboard",
  "Number",
  "⇧ Number",
  "Function",
  "Steno",
];
const platform = detectPlatform(globalThis.navigator)?.legends;
const mac = platform === "mac";
// Standard characters used in Apple keyboard menus and shortcut documentation.
const appleKeys = {
  40: ["⏎", "Return"],
  41: ["⎋", "Escape"],
  42: ["⌫", "Delete"],
  43: ["⇥", "Tab"],
  57: ["⇪", "Caps Lock"],
  74: ["↖", "Home"],
  75: ["⇞", "Page Up"],
  76: ["⌦", "Forward Delete"],
  77: ["↘", "End"],
  78: ["⇟", "Page Down"],
  79: ["▶", "Right Arrow"],
  80: ["◀", "Left Arrow"],
  81: ["▼", "Down Arrow"],
  82: ["▲", "Up Arrow"],
  88: ["⌤", "Keypad Enter"],
  224: ["⌃", "Left Control"],
  225: ["⇧", "Left Shift"],
  226: ["⌥", "Left Option"],
  227: ["⌘", "Left Command"],
  228: ["⌃", "Right Control"],
  229: ["⇧", "Right Shift"],
  230: ["⌥", "Right Option"],
  231: ["⌘", "Right Command"],
};

export function macKeySymbol(code) {
  if (!mac) return undefined;
  if (code > 0xff && code <= 0x1fff && (code & 255) === 0) {
    const bits = (code >> 8) & 15;
    return [0, 2, 1, 3]
      .filter((bit) => bits & (1 << bit))
      .map((bit) => appleKeys[224 + bit][0])
      .join("") || undefined;
  }
  return appleKeys[code]?.[0];
}

// Steno aliases identify physical usages; keycaps show only the stroke character.
export function stenoKeyLegend(name) {
  if (!name.startsWith("STN_")) return undefined;
  const usage = name.slice(4);
  if (usage === "NUM" || /^N[1-9ABC]$/.test(usage)) return "#";
  if (usage === "STR" || /^ST[1-4]$/.test(usage)) return "*";
  if (/^S[12]$/.test(usage) || /^[A-Z][LR]?$/.test(usage)) return usage[0];
  return { FN: "Fn", PWR: "⏻", RES1: "—", RES2: "—", RE1: "—", RE2: "—" }[usage];
}

export function keyName(code, fallback) {
  if (mac && appleKeys[code]) {
    const [symbol, name] = appleKeys[code];
    return { label: `${symbol} ${name}`, search: names[code]?.[1] ?? name };
  }
  if (platform === "linux" && (code === 0xe3 || code === 0xe7)) {
    return { label: code === 0xe3 ? "Left Super" : "Right Super", search: names[code]?.[1] ?? "Super" };
  }
  if (code >= 4 && code <= 29)
    return {
      label: String.fromCharCode(65 + code - 4),
      search: String.fromCharCode(65 + code - 4),
    };
  if (code >= 30 && code <= 39)
    return { label: "1234567890"[code - 30], search: "1234567890"[code - 30] };
  if ((code >= 58 && code <= 69) || (code >= 104 && code <= 115)) {
    const label = `F${code <= 69 ? code - 57 : code - 91}`;
    return {label, search: label};
  }
  if (code >= 89 && code <= 98) return {label: `${t("テンキー")} ${code === 98 ? 0 : code - 88}`, search: `Keypad Numpad ${code === 98 ? 0 : code - 88}`};
  if (code === 0x52a2)
    return {
      label: t("Shift（次の1回）"),
      search: "Sticky Shift シフト ワンショット",
    };
  if (symbols[code]) {
    const [char, name, search] = symbols[code];
    return { label: `${char} (${name})`, search };
  }
  if (names[code]) {
    const [label, search] = names[code];
    return { label, search };
  }
  if (code >= 0x5220 && code <= 0x5225)
    return {
      label: `${layerNames[code - 0x5220]}（Layer${code - 0x5220}）`,
      search: `レイヤー 層 momentary 長押し Layer ${code - 0x5220}`,
    };
  if (code > 0xff && code <= 0x1fff && (code & 255) === 0) {
    const bits = (code >> 8) & 15;
    const right = !!(code & 0x1000);
    const parts = [0, 1, 2, 3]
      .filter((bit) => bits & (1 << bit))
      .map((bit) => keyName(0xe0 + (right ? 4 : 0) + bit, ""));
    return {
      label: parts.map((p) => p.label).join(" + "),
      search: parts.map((p) => p.search).join(" "),
    };
  }
  if (code > 0xff && code <= 0x1fff) {
    const base = code & 255,
      mod = code >> 8;
    if (mod === 2 && shifted[base]) {
      const [char, name, search] = shifted[base];
      return { label: `${char} (${name})`, search: `${search} Shift シフト` };
    }
    const plain = keyName(base, fallback.replace(/^\w+\((.*)\)$/, "$1"));
    const modifier = keyName(code & 0x1f00, "");
    return {
      label: `${modifier.label} + ${plain.label}`,
      search: `${plain.search} ${modifier.search}`,
    };
  }
  const actions = {
    MJI_00: "00",
    MJI_000: "000",
    MJI_MODE: t("通常入力／速記入力"),
    MJI_JIS: t("PC側のJIS／US配列を切り替え"),
    MJI_ALT: t("代替配列のオン／オフ"),
    MJI_MEJIRO: t("メジロ式／Plover"),
    MJI_STICKY: "Sticky Shift",
    QK_BOOT: t("再起動して書き込みモードへ"),
    QK_BOOTLOADER: t("再起動して書き込みモードへ"),
  };
  if (actions[fallback])
    return {
      label: actions[fallback],
      search: `${actions[fallback]} モード 切り替え`,
    };
  if (fallback.startsWith("KC_KP_")) {
    const key = fallback
      .slice(6)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { label: `${t("テンキー")} ${key}`, search: `Keypad Numpad ${key}` };
  }
  const label = fallback
    .replace(/^KC_/, "")
    .replace(/^LSFT\((.*)\)$/, "Shift + $1")
    .replace(/^MJI_/, "")
    .replace(/^STN_/, "Steno ")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, search: label };
}

const actionDescriptions = {
  1: "下のレイヤーにある同じ位置の割り当てを使います。",
  0x7e02: "通常のキーボード入力と、複数キーを同時に押す速記入力を切り替えます。",
  0x7e03: "PC側のキーボード配列に合わせ、記号の送信をJIS用とUS用で切り替えます。",
  0x7e04: "代替配列を有効または無効にします。",
  0x7e05: "速記入力で、メジロ式の文字出力とPloverへのストローク送信を切り替えます。",
  0x7e06: "次のキー1回だけにShiftを適用します。",
  0x52a2: "次のキー1回だけにShiftを適用します。",
  0x7c00: "キーボードを再起動し、ファームウェアの書き込みモードに入ります。",
};

export function keyDescription(code, fallback) {
  const description = actionDescriptions[code];
  const label = keyName(code, fallback).label;
  if (description) return `${label} — ${t(description)}`;
  if (code >= 0x5220 && code <= 0x5225) {
    return `${label} — ${t("押している間だけこのレイヤーを使います。")}`;
  }
  return label;
}

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
  0: ["未割り当て", "None 無効 なし"],
  1: ["下のレイヤーを使用", "Transparent 透過"],
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
export function keyName(code, fallback) {
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
  if (code >= 89 && code <= 98) return {label: `テンキー ${code === 98 ? 0 : code - 88}`, search: `Keypad Numpad ${code === 98 ? 0 : code - 88}`};
  if (code === 0x52a2)
    return {
      label: "Shift（次の1回）",
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
    MJI_MODE: "Keyboard / Steno",
    MJI_JIS: "JIS / US",
    MJI_ALT: "代替配列 ON / OFF",
    MJI_MEJIRO: "Mejiro / Plover",
    MJI_STICKY: "Sticky Shift",
    QK_BOOT: "再起動して書き込みモードへ",
    QK_BOOTLOADER: "再起動して書き込みモードへ",
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
    return { label: `テンキー ${key}`, search: `Keypad Numpad ${key}` };
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

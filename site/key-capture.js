// Convert browser-visible key presses to the adapter's basic/QMK-modifier encoding.
const named = {
  Enter: 40,
  Escape: 41,
  Backspace: 42,
  Tab: 43,
  " ": 44,
  CapsLock: 57,
  PrintScreen: 70,
  ScrollLock: 71,
  Pause: 72,
  Insert: 73,
  Home: 74,
  PageUp: 75,
  Delete: 76,
  End: 77,
  PageDown: 78,
  ArrowRight: 79,
  ArrowLeft: 80,
  ArrowDown: 81,
  ArrowUp: 82,
  NumLock: 83,
  ContextMenu: 101,
  AudioVolumeMute: 168,
  AudioVolumeUp: 169,
  AudioVolumeDown: 170,
  MediaTrackNext: 171,
  MediaTrackPrevious: 172,
  MediaStop: 173,
  MediaPlayPause: 174,
};
const punctuation = {
  "-": 45,
  "=": 46,
  "[": 47,
  "]": 48,
  "\\": 49,
  ";": 51,
  "'": 52,
  "`": 53,
  ",": 54,
  ".": 55,
  "/": 56,
};
const shifted = {
  "!": 30,
  "@": 31,
  "#": 32,
  $: 33,
  "%": 34,
  "^": 35,
  "&": 36,
  "*": 37,
  "(": 38,
  ")": 39,
  _: 45,
  "+": 46,
  "{": 47,
  "}": 48,
  "|": 49,
  ":": 51,
  '"': 52,
  "~": 53,
  "<": 54,
  ">": 55,
  "?": 56,
};
const keypad = {
  NumpadDivide: 84,
  NumpadMultiply: 85,
  NumpadSubtract: 86,
  NumpadAdd: 87,
  NumpadEnter: 88,
  NumpadDecimal: 99,
  NumpadEqual: 103,
};
function nativeToLogicalModifiers(mask, mac) {
  return mac ? (mask & ~9) | ((mask & 1) << 3) | ((mask & 8) >> 3) : mask;
}
export function isModifierEvent(event) {
  return ["Control", "Shift", "Alt", "Meta"].includes(event.key);
}
export function captureKey(event, { hold = false, modifierCodes = [], mac = false } = {}) {
  if (
    event.isComposing ||
    ["Process", "Dead", "Unidentified"].includes(event.key)
  )
    throw Error("IMEを確定してから、キーを入力してください。");
  let mask =
    (event.ctrlKey ? 1 : 0) |
    (event.shiftKey ? 2 : 0) |
    (event.altKey ? 4 : 0) |
    (event.metaKey ? 8 : 0);
  const side = new Set(modifierCodes.map((code) => code.endsWith("Right")));
  if (side.size > 1)
    throw Error("左右の修飾キーを混在させた組み合わせには対応していません。");
  if (side.has(true)) mask |= 16;
  if (isModifierEvent(event)) {
    const bit = { Control: 1, Shift: 2, Alt: 4, Meta: 8 }[event.key];
    mask |= bit;
    if (event.code?.endsWith("Right")) mask |= 16;
    mask = nativeToLogicalModifiers(mask, mac);
    const low = mask & 15;
    if ((low & (low - 1)) === 0)
      return 0xe0 + (mask & 16 ? 4 : 0) + Math.log2(low);
    return mask << 8;
  }
  if (hold)
    throw Error(
      "長押しにはCtrl・Alt・Shiftなどの修飾キー、またはその組み合わせを入力してください。",
    );
  let base;
  if (event.code?.startsWith("Numpad")) {
    base = keypad[event.code];
    const digit = /^Numpad([0-9])$/.exec(event.code);
    if (digit) base = digit[1] === "0" ? 98 : 88 + Number(digit[1]);
  }
  if (base === undefined) {
    if (/^[a-z]$/i.test(event.key))
      base = event.key.toUpperCase().charCodeAt(0) - 65 + 4;
    else if (/^[0-9]$/.test(event.key))
      base = event.key === "0" ? 39 : 29 + Number(event.key);
    else if (event.key in punctuation) base = punctuation[event.key];
    else if (event.key in shifted) {
      base = shifted[event.key];
      mask |= 2;
    } else if (event.key in named) base = named[event.key];
    else {
      const fn = /^F([1-9]|1[0-9]|2[0-4])$/.exec(event.key);
      if (fn)
        base = Number(fn[1]) <= 12 ? 57 + Number(fn[1]) : 91 + Number(fn[1]);
    }
  }
  if (base === undefined)
    throw Error(
      "このキーは直接入力に対応していません。名前から検索してください。",
    );
  mask = nativeToLogicalModifiers(mask, mac);
  return mask ? (mask << 8) | base : base;
}

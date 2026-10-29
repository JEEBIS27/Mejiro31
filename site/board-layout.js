// Display geometry only. Logical matrix positions and combo definitions remain
// those supplied by the firmware, including Tap/Hold storage coordinates.
export const BOARD_WIDTH = 14;
export const BOARD_HEIGHT = 4.98;

export function boardKeys(data, layer = 0) {
  const physical = data.physical.map((key) => {
    const wide = key.row === 2 && [4, 6].includes(key.col);
    return {
      ...key,
      logical: key.row * data.cols + key.col,
      x: key.x - (wide ? 0.5 : 0),
      y: key.y + 0.24,
      width: wide ? 2 : 1,
      height: 1,
      kind: "physical",
    };
  });
  if (layer === 5) return physical;
  const positions = new Map(physical.map((key) => [key.logical, key]));
  const combos = data.pairs.map((pair) => {
    const a = positions.get(pair.a);
    const b = positions.get(pair.b);
    if (!a || !b) throw Error("Combo references an unknown physical key.");
    const vertical = a.x === b.x;
    const width = vertical ? 0.54 : 0.48;
    const height = 0.48;
    const centerX = (a.x + a.width / 2 + b.x + b.width / 2) / 2;
    // Keep horizontal badges over the shared edges of their source keys.
    const centerY = vertical
      ? (a.y + b.y + 1) / 2
      : a.row === 0
        ? 0.3
        : a.row === 1
          ? 2.09
          : 4.595;
    return {
      ...pair,
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
      kind: "combo",
    };
  });
  return [...physical, ...combos];
}

// Estimate visual width rather than treating Japanese and Latin as equal widths.
export function labelFontSize(label, key) {
  const units = [...label].reduce(
    (sum, char) => sum + (/[^\u0000-\u007f]/.test(char) ? 1.1 : 0.8),
    0,
  );
  const base = key.kind === "combo" ? 1.8 : 2.5;
  const gentle = base / (1 + Math.max(0, units - 0.8) * 0.18);
  const fit =
    ((key.width * 100) / BOARD_WIDTH - (key.kind === "combo" ? 0.5 : 1.6)) /
    Math.max(units, 0.8);
  return Math.min(gentle, fit);
}

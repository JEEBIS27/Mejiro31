// Shared vector geometry for on-screen key legends and PNG exports.
const speaker = "M3 9h4l5-4v14l-5-4H3z";
const sun =
  "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5";
const swap = "M4 9h16l-3-3M20 15H4l3 3";
const icons = {
  0x7e02: {
    paths: ["M3 4h18v7H3zM6 7.5h1m4 0h1m4 0h1", "M12 14v7m-3-3 3 3 3-3"],
  },
  0x7e03: {
    paths: ["M4 3h16v18H4zM8 7h8M8 11h4M8 15h8", "m15 10 3 2-3 2"],
  },
  0x7e04: { paths: ["M5 4h14v16H5z", swap] },
  0x7e05: { paths: [swap, "M8 4h.01M12 4h.01M16 4h.01M8 20h.01M12 20h.01M16 20h.01"] },
  0x7e06: { paths: ["m4 12 8-8 8 8h-4v8h-8v-8z", "M11 16h2"] },
  0x52a2: { paths: ["m4 12 8-8 8 8h-4v8h-8v-8z", "M11 16h2"] },
  0x7c00: { paths: ["M6 13h12l2 6H4zM12 3v12m-4-8 4-4 4 4"] },
  70: {
    paths: ["M3 7h4l2-3h6l2 3h4v13H3z", "M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"],
    name: "スクリーンショット",
  },
  168: { paths: [speaker, "m16 9 6 6m0-6-6 6"], name: "ミュート" },
  169: {
    paths: [speaker, "M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"],
    name: "音量を上げる",
  },
  170: { paths: [speaker, "M15 10a3 3 0 0 1 0 4"], name: "音量を下げる" },
  171: { paths: ["m4 5 9 7-9 7zM19 5v14m-4-14 0 14"], name: "次の曲" },
  172: { paths: ["m20 5-9 7 9 7zM5 5v14m4-14v14"], name: "前の曲" },
  173: { paths: ["M6 6h12v12H6z"], name: "停止" },
  174: { paths: ["M8 5v14M16 5v14"], name: "再生・一時停止" },
  189: {
    paths: [sun, "M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"],
    name: "画面を明るくする",
  },
  190: {
    paths: [sun, "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"],
    name: "画面を暗くする",
  },
};
export function keyIcon(code) {
  return icons[code] || null;
}
export function createKeyIcon(code) {
  const icon = keyIcon(code);
  if (!icon) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "key-symbol");
  svg.setAttribute("aria-hidden", "true");
  for (const d of icon.paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}
export function paintKeyIcon(ctx, code, x, y, size, color) {
  const icon = keyIcon(code);
  if (!icon) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of icon.paths) ctx.stroke(new Path2D(d));
  ctx.restore();
}

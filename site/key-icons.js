// Shared vector geometry for on-screen key legends and PNG exports.
const speaker = "M3 9h4l5-4v14l-5-4H3z";
const sun =
  "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5";
const icons = {
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

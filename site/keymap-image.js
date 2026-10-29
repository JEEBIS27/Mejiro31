import { paintKeyIcon } from "./key-icons.js";
// Render the current board at 2x resolution, including off-screen keys.
export async function downloadKeymapPNG(board, layerName, profile) {
  await document.fonts.ready;
  const bounds = board.getBoundingClientRect();
  const padding = 32,
    heading = 52;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((bounds.width + padding * 2) * 2);
  canvas.height = Math.ceil((bounds.height + padding * 2 + heading) * 2);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("画像の作成に対応していません。");
  ctx.scale(2, 2);
  const surface = getComputedStyle(board.parentElement);
  const dark = document.documentElement.dataset.theme === "dark";
  ctx.fillStyle = surface.backgroundColor;
  ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = dark ? "#e2e5e9" : "#25282b";
  ctx.font = "600 18px sans-serif";
  ctx.fillText(`Mejiro31 · ${layerName}`, padding, padding + 20);
  const keys = [...board.querySelectorAll(".key")];
  for (const key of keys) {
    if (key.classList.contains("empty-combo")) continue;
    const box = key.getBoundingClientRect();
    let style = getComputedStyle(key);
    // Export assignments, without the temporary selection/source highlights.
    if (key.matches(".selected,.source")) {
      const peer = keys.find(
        (k) =>
          k.dataset.kind === key.dataset.kind &&
          !k.matches(".selected,.source,.mode-key,.customized"),
      );
      if (peer) style = getComputedStyle(peer);
    }
    const x = box.left - bounds.left + padding,
      y = box.top - bounds.top + padding + heading;
    ctx.beginPath();
    ctx.roundRect(
      x,
      y,
      box.width,
      box.height,
      parseFloat(style.borderTopLeftRadius) || 4,
    );
    ctx.fillStyle = style.backgroundColor;
    ctx.fill();
    const white = board.parentElement.dataset.keyboardColor === "white";
    ctx.strokeStyle = key.matches(".customized,.selected,.source")
      ? white
        ? key.dataset.kind === "combo"
          ? "#b4bca9"
          : "#c1c6bc"
        : key.dataset.kind === "combo"
          ? "#686c65"
          : "#4b4f49"
      : style.borderTopColor;
    ctx.lineWidth = parseFloat(style.borderTopWidth) || 1;
    ctx.stroke();
    for (const label of key.querySelectorAll(".key-label,small")) {
      if (label.dataset.iconCode) {
        const icon = label.querySelector("svg").getBoundingClientRect();
        paintKeyIcon(
          ctx,
          Number(label.dataset.iconCode),
          icon.left - bounds.left + padding,
          icon.top - bounds.top + padding + heading,
          icon.width,
          style.color,
        );
        continue;
      }
      if (!label.textContent || getComputedStyle(label).display === "none")
        continue;
      const rect = label.getBoundingClientRect(),
        font = getComputedStyle(label);
      ctx.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      ctx.fillStyle = key.classList.contains("mode-key")
        ? font.color
        : label.tagName === "SMALL"
          ? font.color
          : style.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        label.textContent,
        rect.left - bounds.left + rect.width / 2 + padding,
        rect.top - bounds.top + rect.height / 2 + padding + heading,
        box.width - 4,
      );
    }
  }
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw Error("PNGの作成に失敗しました。");
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `mejiro31-${profile}-${layerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

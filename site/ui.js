import { initInputTest } from "./input-test.js?v=20261029-inputlog3";
// View navigation and accessible icon controls, independent of device state.
const paths = {
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
  autosave:
    '<path d="M20 7a8 8 0 0 0-13-3L4 7m0-5v5h5M4 17a8 8 0 0 0 13 3l3-3m0 5v-5h-5"/><path d="m9 12 2 2 4-4"/>',
  moon: '<path d="M20 15a9 9 0 0 1-11-11 9 9 0 1 0 11 11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  test: '<path d="m4 7 5 5-5 5m8 0h8"/>',
  clear: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  keyboard:
    '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 15h10"/>',
  sliders:
    '<path d="M4 7h7m4 0h5M4 17h2m4 0h10"/><circle cx="13" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><path d="M10 10h4v4h-4z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',
  plug: '<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0zm6 9v4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  import: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  export: '<path d="M12 15V3m-4 4 4-4 4 4M4 16v4h16v-4"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  unlock:
    '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0m-4 9v2"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
};
export function setIcon(element, name, label) {
  element.querySelector("svg")?.remove();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = paths[name] || paths.help;
  element.prepend(svg);
  if (label) {
    element.setAttribute("aria-label", label);
    element.dataset.tip = label;
  }
}
for (const element of document.querySelectorAll("[data-icon]")) {
  setIcon(element, element.dataset.icon);
}
const titles = {
  remap: "キーマップ",
  tester: "入力テスト",
  settings: "入力設定",
  firmware: "ファームウェア",
  guide: "ヘルプ",
};
function showView() {
  const requested = location.hash.slice(1);
  const view = Object.hasOwn(titles, requested) ? requested : "remap";
  for (const panel of document.querySelectorAll("[data-panel]"))
    panel.hidden = panel.dataset.panel !== view;
  for (const link of document.querySelectorAll("[data-view]")) {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.getElementById("view-title").textContent = titles[view];
  document.title = `${titles[view]} · Mejiro31`;
  document.querySelector("main").scrollTop = 0;
  document.querySelector(".save-bar").hidden = !["remap", "settings"].includes(
    view,
  );
}
window.addEventListener("hashchange", showView);
showView();
const tooltip = document.getElementById("tooltip");
let owner;
function hideTip() {
  tooltip.hidden = true;
  owner?.removeAttribute("aria-describedby");
  owner = null;
}
function showTip(element) {
  hideTip();
  if (!element) return;
  owner = element;
  tooltip.textContent = element.dataset.tip;
  tooltip.hidden = false;
  element.setAttribute("aria-describedby", "tooltip");
  const box = element.getBoundingClientRect();
  const tip = tooltip.getBoundingClientRect();
  const rail = element.closest(".rail");
  const x = rail ? box.right + 12 : box.left + (box.width - tip.width) / 2;
  const y =
    box.bottom + tip.height + 16 < innerHeight
      ? box.bottom + 8
      : box.top - tip.height - 8;
  tooltip.style.left = `${Math.max(12, Math.min(x, innerWidth - tip.width - 12))}px`;
  tooltip.style.top = `${Math.max(8, y)}px`;
}
document.addEventListener("pointerover", (e) =>
  showTip(e.target.closest("[data-tip]")),
);
document.addEventListener("pointerout", (e) => {
  if (owner && !owner.contains(e.relatedTarget)) hideTip();
});
document.addEventListener("focusin", (e) =>
  showTip(e.target.closest("[data-tip]")),
);
document.addEventListener("focusout", hideTip);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideTip();
});
document.addEventListener("click", hideTip);
window.addEventListener("resize", hideTip);
document.addEventListener("scroll", hideTip, true);

let theme;
try {
  theme = localStorage.getItem("mejiro31-theme");
} catch {}
const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)");
function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  const dark = value === "dark";
  setIcon(
    document.getElementById("theme-toggle"),
    dark ? "sun" : "moon",
    dark ? "ライトモード" : "ダークモード",
  );
  document
    .getElementById("theme-toggle")
    .setAttribute("aria-pressed", String(dark));
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#191c20"
    : "#ffffff";
}
applyTheme(theme || (systemTheme?.matches ? "dark" : "light"));
document.getElementById("theme-toggle").onclick = () => {
  theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try {
    localStorage.setItem("mejiro31-theme", theme);
  } catch {}
};
systemTheme?.addEventListener("change", (e) => {
  if (!theme) applyTheme(e.matches ? "dark" : "light");
});

initInputTest(document, window);

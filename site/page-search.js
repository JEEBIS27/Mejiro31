import { english } from "./locale.js?v=20261126-ime";

const normalize = (text) => text.normalize("NFKC").toLocaleLowerCase().trim();

function searchEntries(panel, query) {
  const found = [];
  const candidates = panel.querySelectorAll(
    "h2, h3, label, summary, li > strong, a, button[aria-label], textarea[aria-label]",
  );
  for (const item of candidates) {
    if (!item.getClientRects().length || item.closest("#dictionary-results, #reverse-results, #rule-list")) continue;
    let label, detail = "";
    if (item.tagName === "LABEL") {
      label = [...item.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim()).join(" ").trim();
      detail = item.querySelector("small")?.textContent ?? "";
    } else {
      label = item.getAttribute("aria-label") || item.textContent.trim();
      if (item.matches("summary, li > strong")) detail = item.parentElement.querySelector("p")?.textContent ?? "";
    }
    if (!label || !normalize(label + " " + detail).includes(query)) continue;
    const target = item.control || item;
    if (target.disabled) continue;
    found.push({ label, target });
  }
  return found;
}

export function initPageSearch() {
  const form = document.getElementById("page-search-form");
  const input = document.getElementById("page-query");
  const popup = document.getElementById("page-search-results");
  const matches = document.getElementById("page-matches");
  const count = document.getElementById("page-match-count");
  const search = form.closest("search");
  let panel;

  function openResult(target) {
    popup.hidden = true;
    if (target.tabIndex < 0) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "center", inline: "nearest" });
  }

  function update() {
    const query = normalize(input.value);
    matches.replaceChildren();
    popup.hidden = !query;
    if (!query) return;
    const entries = searchEntries(panel, query);
    count.textContent = english ? (entries.length === 1 ? "1 match" : entries.length + " matches") : entries.length + " 件";
    for (const { label, target } of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.onclick = () => openResult(target);
      matches.append(button);
    }
  }

  input.addEventListener("input", update);
  input.addEventListener("focus", update);
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (popup.hidden) update();
    else matches.firstElementChild?.click();
  });
  search.addEventListener("keydown", event => {
    if (event.isComposing || event.keyCode === 229 || popup.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      input.focus();
      popup.hidden = true;
    }
    const button = event.target.closest("#page-matches button");
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = event.key === "ArrowDown"
        ? (button ? button.nextElementSibling : matches.firstElementChild)
        : (button ? button.previousElementSibling || input : matches.lastElementChild);
      next?.focus();
    }
  });
  search.addEventListener("focusout", event => {
    if (event.relatedTarget && !search.contains(event.relatedTarget)) popup.hidden = true;
  });
  document.addEventListener("pointerdown", event => {
    if (!search.contains(event.target)) popup.hidden = true;
  });
  return {
    setPanel(nextPanel, title) {
      panel = nextPanel;
      input.value = "";
      input.placeholder = english ? "Search " + title : title + "を検索";
      input.setAttribute("aria-label", input.placeholder);
      update();
    },
  };
}

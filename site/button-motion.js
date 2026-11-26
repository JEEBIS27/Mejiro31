const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Keep fading copies outside the result list so they cannot receive focus or clicks.
export function replaceButtons(container, children) {
  if (reducedMotion.matches || container.closest("[hidden], [inert], dialog:not([open])")) {
    container.replaceChildren(...children);
    return;
  }

  const available = selector => selector.querySelectorAll("button[data-motion-key]:enabled");
  const incoming = document.createDocumentFragment();
  incoming.append(...children);
  const previous = new Map([...available(container)].map(button => [button.dataset.motionKey, button]));
  const next = new Map([...available(incoming)].map(button => [button.dataset.motionKey, button]));
  const departing = [...previous].filter(([key]) => !next.has(key));
  const viewport = container.closest("dialog") ?? document.body;
  const scrollArea = container.closest("#key-options, #page-search-results, main") ?? container;
  const clip = departing.length ? scrollArea.getBoundingClientRect() : null;
  const visible = departing.map(([, button]) => ({
    button,
    bounds: button.getBoundingClientRect(),
    opacity: getComputedStyle(button).opacity,
  })).filter(({ bounds }) => bounds.width && bounds.height &&
    bounds.bottom > clip.top && bounds.top < clip.bottom &&
    bounds.right > clip.left && bounds.left < clip.right);

  for (const { button, bounds, opacity } of visible) {
    const copy = button.cloneNode(true);
    copy.inert = true;
    copy.removeAttribute("id");
    copy.classList.add("departing-button");
    Object.assign(copy.style, {
      position: "fixed",
      inset: `${bounds.top}px auto auto ${bounds.left}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: "6",
    });
    viewport.append(copy);
    copy.animate([{ opacity, scale: 1 }, { opacity: 0, scale: .94 }],
      { duration: 120, easing: "ease-out" }).finished.then(() => copy.remove(), () => copy.remove());
  }
  container.replaceChildren(incoming);
  for (const [key, button] of next) {
    if (!previous.has(key)) button.animate([{ opacity: 0, scale: .94 }, { opacity: 1, scale: 1 }],
      { duration: 180, easing: "ease-out" });
  }
}

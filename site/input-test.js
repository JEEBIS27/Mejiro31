// Tests host-visible keyboard events only; never requests raw matrix access.
export function inputEventLabel(event) {
  const names = { " ": "Space", Dead: "Dead key", Process: "IME" };
  const key = names[event.key] || event.key;
  const mods = ["Ctrl", "Alt", "Shift", "Meta"].filter(
    (_, i) => [event.ctrlKey, event.altKey, event.shiftKey, event.metaKey][i],
  );
  return [
    ...mods.filter(
      (mod) =>
        !(
          { Control: "Ctrl", Alt: "Alt", Shift: "Shift", Meta: "Meta" }[
            event.key
          ] === mod
        ),
    ),
    key,
  ].join(" + ");
}
export function intervalMs(previous, current) {
  return previous === null
    ? 0
    : Math.min(999, Math.max(0, Math.round(current - previous)));
}
export function initInputTest(document, window) {
  const input = document.getElementById("test-input");
  const held = new Map();
  let previous = null;
  const log = [];
  let active = null;
  let timer = null;
  function updateDuration(now = window.performance.now()) {
    if (!active) return;
    const duration = intervalMs(active.started, now);
    active.entry.durationMs = duration;
    active.number.textContent = String(duration);
    active.row.title = `${active.entry.action === "press" ? "押す" : "離す"}：${active.entry.label} / 継続 ${duration}ms`;
    if (duration === 999 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }
  function stopDuration() {
    updateDuration();
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    active = null;
  }
  let total = 0;
  const marks = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Enter: "↵",
    Backspace: "⌫",
    Escape: "Esc",
  };
  const updateCount = () =>
    (document.getElementById("test-log-count").textContent = `${total} 件`);
  document.getElementById("test-export").onclick = () => {
    updateDuration();
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "mejiro31-input-log",
            version: 1,
            exportedAt: new Date().toISOString(),
            intervalLimitMs: 999,
            total,
            retained: log.length,
            text: input.value,
            events: log,
          },
          null,
          2,
        ) + "\n",
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `mejiro31-input-log-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const renderHeld = () => {
    document.getElementById("test-held").replaceChildren(
      ...[...held.values()].map((label) => {
        const key = document.createElement("kbd");
        key.textContent = label;
        return key;
      }),
    );
  };
  function clearHeld() {
    stopDuration();
    held.clear();
    renderHeld();
  }
  function record(event, down) {
    if (document.getElementById("tester").hidden) return;
    // Only capture typing in the test field, leaving page controls usable.
    if (down && event.target !== input) return;
    if (!down && !held.has(event.code || event.key)) return;
    // OS repeat events do not start a new physical press or reset its timer.
    if (down && held.has(event.code || event.key)) return;
    stopDuration();
    const label = inputEventLabel(event),
      code = event.code || event.key;
    if (down) held.set(code, label);
    else held.delete(code);
    renderHeld();
    const now = event.timeStamp;
    const delta = intervalMs(previous, now);
    previous = now;
    const heldNames = [...held.values()];
    const entry = {
      intervalMs: delta,
      durationMs: 0,
      action: down ? "press" : "release",
      key: event.key,
      code,
      label,
      held: heldNames,
      repeat: !!event.repeat,
      composing: !!event.isComposing,
    };
    log.push(entry);
    total++;
    updateCount();
    const row = document.createElement("li");
    row.className = down ? "input-press" : "input-release";
    const time = document.createElement("span");
    time.className = "input-interval";
    const number = document.createElement("span");
    number.textContent = "0";
    time.append(number);
    const unit = document.createElement("small");
    unit.textContent = "ms";
    time.append(unit);
    const marker = document.createElement("span");
    marker.className = "input-marker";
    marker.textContent = down ? "●" : "○";
    marker.setAttribute("aria-label", down ? "押す" : "離す");
    const keys = document.createElement("span");
    keys.className = "input-keys";
    keys.textContent = marks[event.key] || label;
    const chord = document.createElement("small");
    chord.className = "input-chord";
    chord.textContent = heldNames.join(" + ") || "N";
    row.append(time, marker, keys, chord);
    row.title = `${down ? "押す" : "離す"}：${label} / 間隔 ${delta}ms${event.repeat ? " / リピート" : ""}`;
    const list = document.getElementById("test-events");
    list.prepend(row);
    active = { entry, number, row, started: window.performance.now() };
    timer = window.setInterval(updateDuration, 16);
    while (list.children.length > 200) list.lastElementChild.remove();
    // Keep focus here for Tab, but preserve text, shortcuts and IME behavior.
    if (
      event.key === "Tab" &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey
    )
      event.preventDefault();
  }
  input.addEventListener("keydown", (e) => record(e, true));
  document.addEventListener("keyup", (e) => record(e, false));
  input.addEventListener("blur", clearHeld);
  window.addEventListener("blur", clearHeld);
  window.addEventListener("hashchange", clearHeld);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearHeld();
  });
  document.getElementById("test-clear").onclick = () => {
    clearHeld();
    previous = null;
    log.length = 0;
    total = 0;
    updateCount();
    input.value = "";
    document.getElementById("test-events").replaceChildren();
    input.focus();
  };
}

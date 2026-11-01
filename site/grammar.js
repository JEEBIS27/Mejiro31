// Keep morphology off the UI thread. A slow dictionary load falls back to
// grammar-free reverse lookup instead of holding the form indefinitely.
const GRAMMAR_TIMEOUT_MS = 12_000;
let worker;
let nextId = 0;
const pending = new Map();

function stopWorker(error) {
  worker?.terminate();
  worker = undefined;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(error);
  }
  pending.clear();
}

function parserWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./grammar-worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    clearTimeout(request.timer);
    if (data.error) request.reject(Error(data.error));
    else request.resolve(data.spans);
  };
  worker.onerror = () => stopWorker(Error("文法解析器を読み込めません。"));
  return worker;
}

export function grammarSpans(text, timeoutMs = GRAMMAR_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let parser;
    try {
      parser = parserWorker();
    } catch (error) {
      reject(error);
      return;
    }
    const id = ++nextId;
    const timer = setTimeout(
      () => stopWorker(Error("文法解析が時間内に完了しませんでした。")),
      timeoutMs,
    );
    pending.set(id, { resolve, reject, timer });
    try {
      parser.postMessage({ id, text });
    } catch (error) {
      stopWorker(error);
    }
  });
}
export function spansFromTokens(tokens) {
  const spans = [];
  let offset = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const start = offset;
    offset += [...token.surface_form].length;
    let kind = token.pos === "助詞" ? 1 : token.pos === "動詞" ? 2 : null;
    if (kind === null) continue;
    if (kind === 2) {
      while (i + 1 < tokens.length &&
        ["て", "で", "た", "だ", "ない", "ます"].includes(tokens[i + 1].surface_form) &&
        ["助詞", "助動詞"].includes(tokens[i + 1].pos)) {
        offset += [...tokens[++i].surface_form].length;
      }
    } else {
      while (i + 1 < tokens.length && tokens[i + 1].pos === "助詞") {
        offset += [...tokens[++i].surface_form].length;
      }
    }
    spans.push({ start, end: offset, kind,
      ...(kind === 2 && token.basic_form && token.basic_form !== "*"
        ? { lemma: token.basic_form } : {}),
    });
  }
  return spans;
}

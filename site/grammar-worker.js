import { spansFromTokens } from "./grammar.js";

let tokenizerPromise;
function tokenizer() {
  tokenizerPromise ||= (async () => {
    await import("./vendor/kuromoji/kuromoji.js");
    return new Promise((resolve, reject) => {
      self.kuromoji.builder({
        dicPath: new URL("./vendor/kuromoji/dict/", import.meta.url).href,
      }).build((error, value) => error ? reject(error) : resolve(value));
    });
  })();
  return tokenizerPromise;
}

self.onmessage = async ({ data: { id, text } }) => {
  try {
    const spans = spansFromTokens((await tokenizer()).tokenize(text));
    self.postMessage({ id, spans });
  } catch (error) {
    tokenizerPromise = undefined;
    self.postMessage({ id, error: error.message || String(error) });
  }
};

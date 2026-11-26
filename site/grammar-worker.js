import { spansFromTokens } from "./grammar.js?v=20261126-lexical";

let tokenizerPromise;
function tokenizer() {
  tokenizerPromise ||= (async () => {
    await import("./vendor/kuromoji/kuromoji.js");
    return new Promise((resolve, reject) => {
      self.kuromoji.builder({
        dicPath: new URL("./vendor/kuromoji/dict/", import.meta.url).pathname,
      }).build((error, value) => error ? reject(error) : resolve(value));
    });
  })();
  return tokenizerPromise;
}

self.onmessage = async ({ data: { id, text, word } }) => {
  try {
    const tokens = (await tokenizer()).tokenize(text);
    if (word) {
      const token = tokens.length === 1 && tokens[0].word_type === "KNOWN" ? tokens[0] : null;
      self.postMessage({ id, token });
    } else {
      self.postMessage({ id, spans: spansFromTokens(tokens) });
    }
  } catch (error) {
    tokenizerPromise = undefined;
    self.postMessage({ id, error: error.message || String(error) });
  }
};

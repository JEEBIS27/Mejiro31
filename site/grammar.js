// Japanese morphology stays in the site. The Rust engine receives only spans
// and does not tokenize or assign parts of speech.
let tokenizerPromise;
function loadScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "./vendor/kuromoji/kuromoji.js";
    script.onload = resolve;
    script.onerror = () => reject(Error("文法解析器を読み込めません。"));
    document.head.append(script);
  });
}
export async function grammarSpans(text) {
  tokenizerPromise ||= (async () => {
    await loadScript();
    return new Promise((resolve, reject) => {
      window.kuromoji.builder({
        dicPath: new URL("./vendor/kuromoji/dict/", import.meta.url).href,
      }).build((error, tokenizer) => error ? reject(error) : resolve(tokenizer));
    });
  })();
  try {
    return spansFromTokens((await tokenizerPromise).tokenize(text));
  } catch (error) {
    tokenizerPromise = undefined;
    throw error;
  }
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

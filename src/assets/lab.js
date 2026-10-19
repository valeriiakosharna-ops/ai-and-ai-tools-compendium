import {
  contextBudget,
  nearestDocuments,
  keywordDocuments,
  ragAnswer,
} from "./lab-models.js";
const t = JSON.parse(document.querySelector("#ui-data").textContent);
const data = JSON.parse(document.querySelector("#lab-data").textContent);
const lang = document.documentElement.lang;
const $ = (id) => document.getElementById(id);
const make = (tag, text) => {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
};

let tokenizer;
let tokenVersion = 0;
let attempt = 0;
$("tokenize").addEventListener("click", async () => {
  const version = ++tokenVersion;
  const text = $("token-input").value;
  $("tokenize").disabled = true;
  $("token-result").hidden = true;
  $("token-status").textContent = t.tokenLoading;
  try {
    if (!tokenizer) {
      const url = new URL("./tokenizer.js", import.meta.url);
      if (attempt) url.searchParams.set("retry", attempt);
      tokenizer = import(url.href);
    }
    const { encode, decode } = await tokenizer;
    if (version !== tokenVersion) return;
    const ids = encode(text, { disallowedSpecial: new Set() });
    $("token-count").textContent = ids.length;
    $("character-count").textContent = [...text].length;
    $("token-pieces").replaceChildren(
      ...ids.map((id) => {
        const piece = decode([id]);
        const node = make(
          "li",
          piece.includes("\uFFFD")
            ? t.runtime.byte
            : piece
                .replaceAll(" ", "␠")
                .replaceAll("\n", "↵")
                .replaceAll("\t", "⇥"),
        );
        node.title = `ID ${id}`;
        return node;
      }),
    );
    $("token-roundtrip").textContent = decode(ids);
    $("token-result").hidden = false;
    $("token-status").textContent =
      `cl100k_base · ${t.tokenCount}: ${ids.length}`;
  } catch {
    tokenizer = undefined;
    attempt++;
    if (version === tokenVersion) $("token-status").textContent = t.tokenError;
  } finally {
    if (version === tokenVersion) $("tokenize").disabled = false;
  }
});
$("token-input").addEventListener("input", () => {
  tokenVersion++;
  $("tokenize").disabled = false;
  $("token-result").hidden = true;
  $("token-status").textContent = t.runtime.changed;
});
document.querySelector("[data-token-controls]").hidden = false;

function updateContext() {
  const docs = Number($("context-document").value),
    answer = Number($("context-answer").value);
  const budget = contextBudget(docs, answer, $("context-summary").checked);
  $("document-value").textContent = docs;
  $("answer-value").textContent = answer;
  const units = [
    0,
    ...Array(budget.historyUnits).fill(1),
    2,
    ...Array(docs).fill(3),
    ...Array(answer).fill(4),
  ];
  $("context-desk").replaceChildren(
    ...Array.from({ length: 10 }, (_, i) => {
      const type = units[i] ?? 5;
      const cell = make("span", t.contextParts[type]);
      cell.className = `context-unit unit-${type}`;
      return cell;
    }),
  );
  $("context-equation").textContent =
    `1 + ${budget.historyUnits} + 1 + ${docs} + ${answer} = ${budget.total} / 10 ${t.units}`;
  $("context-status").textContent = budget.overflow
    ? `${t.overflow}: ${budget.overflow}. ${t.used}: ${budget.total} / 10.`
    : `${t.fits}. ${t.used}: ${budget.total} / 10.`;
  $("context-status").dataset.overflow = String(budget.overflow > 0);
}
for (const id of ["context-document", "context-answer", "context-summary"])
  $(id).addEventListener("input", updateContext);
document.querySelector("[data-context-controls]").hidden = false;
updateContext();

function updateVectors() {
  const query = data.queries.find(
    (query) => query.id === $("vector-query").value,
  );
  const nearest = nearestDocuments(data.documents, query, 3),
    exact = keywordDocuments(data.documents, query.text);
  $("keyword-results").replaceChildren(
    ...(exact.length
      ? exact.map((doc) => make("li", doc.title))
      : [make("li", t.noMatches)]),
  );
  $("vector-results").replaceChildren(
    ...nearest.map((doc) => {
      const li = make("li", doc.title);
      li.append(make("p", doc.text));
      return li;
    }),
  );
  const svg = $("vector-map");
  svg.querySelector("g")?.remove();
  const el = (tag, attrs) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    return n;
  };
  const layer = el("g", { "aria-hidden": "true" });
  const pos = (doc) => ({ x: 80 + doc.x * 3.6, y: 15 + doc.y * 3.5 });
  const point = pos(query);
  for (let i = 0; i <= 100; i += 20) {
    layer.append(
      el("line", {
        x1: 80 + i * 3.6,
        y1: 15,
        x2: 80 + i * 3.6,
        y2: 330,
        class: "map-grid",
      }),
    );
    layer.append(
      el("line", {
        x1: 80,
        y1: 15 + i * 3.1,
        x2: 440,
        y2: 15 + i * 3.1,
        class: "map-grid",
      }),
    );
  }
  nearest.forEach((doc) => {
    const d = pos(doc);
    layer.append(
      el("line", {
        x1: point.x,
        y1: point.y,
        x2: d.x,
        y2: d.y,
        class: "map-neighbor",
      }),
    );
  });
  data.documents.forEach((doc, index) => {
    const p = pos(doc);
    layer.append(
      el("circle", {
        cx: p.x,
        cy: p.y,
        r: 7,
        class: nearest.some((d) => d.id === doc.id)
          ? "map-point selected"
          : "map-point",
      }),
    );
    const label = el("text", { x: p.x + 11, y: p.y + 4 });
    label.textContent = index + 1;
    layer.append(label);
  });
  layer.append(
    el("path", {
      d: `M${point.x},${point.y - 10}l10,10 -10,10 -10,-10Z`,
      class: "map-query",
    }),
  );
  svg.append(layer);
  const names = nearest.map((doc) => doc.title).join(" · ");
  $("map-title").textContent = `${query.text} → ${names}`;
  $("vector-status").textContent = `${t.nearest}: ${names}`;
}
$("vector-query").addEventListener("change", updateVectors);
document.querySelector("[data-vector-controls]").hidden = false;
updateVectors();

const inputs = [...document.querySelectorAll("[data-rag-source]")];
let retrieved = false;
const selected = () =>
  inputs.filter((input) => input.checked).map((input) => input.value);
function context() {
  const ids = selected();
  $("rag-context").textContent =
    data.ragSources
      .filter((source) => ids.includes(source.id))
      .map((source) => `[${source.id}] ${source.title}\n${source.text}`)
      .join("\n\n") || t.noSources;
  $("rag-answer").hidden = true;
  $("rag-status").textContent = "";
}
function clearRag() {
  retrieved = false;
  inputs.forEach((input) => {
    input.checked = false;
  });
  $("rag-selection").hidden = true;
  $("rag-context").hidden = true;
  $("rag-generate").disabled = true;
  context();
}
$("rag-retrieve").addEventListener("click", () => {
  const question = data.ragQuestions.find(
    (query) => query.id === $("rag-question").value,
  );
  retrieved = true;
  inputs.forEach((input) => {
    input.checked = question.sourceIds.includes(input.value);
  });
  context();
  $("rag-selection").hidden = false;
  $("rag-context").hidden = false;
  $("rag-generate").disabled = false;
});
inputs.forEach((input) => input.addEventListener("change", context));
$("rag-question").addEventListener("change", clearRag);
$("rag-reset").addEventListener("click", () => {
  $("rag-question").selectedIndex = 0;
  clearRag();
});
$("rag-generate").addEventListener("click", () => {
  if (!retrieved) return;
  const result = ragAnswer($("rag-question").value, selected(), lang);
  $("rag-paragraphs").replaceChildren(
    ...result.paragraphs.map((text) => make("p", text)),
  );
  $("rag-warning").textContent = result.warning;
  $("rag-citations").replaceChildren(
    ...result.citations.map((id) => {
      const link = make("a", `[${id}] →`);
      link.href = `#source-${id}`;
      return link;
    }),
  );
  $("rag-answer").hidden = false;
  $("rag-status").textContent = t.ragResult;
});
document.querySelector("[data-rag-controls]").hidden = false;

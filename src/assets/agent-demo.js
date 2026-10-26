import { filterTools, checkSearch } from "./agent-model.js";

const demo = document.querySelector("#agent-demo");
if (demo) {
  const t = JSON.parse(document.querySelector("#ui-data").textContent);
  const tools = JSON.parse(
    document.querySelector("#agent-demo-data").textContent,
  );
  const $ = (id) => document.getElementById(id);
  const buttons = [...demo.querySelectorAll("[data-agent-stage]")];
  const panels = [...demo.querySelectorAll("[data-agent-panel]")];
  let applied = false;
  const currentFilter = (items, query) =>
    applied ? filterTools(items, query) : items;
  function showStage(index) {
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    buttons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
  }
  function renderPreview() {
    const matches = currentFilter(tools, $("agent-search").value);
    $("agent-result-cards").replaceChildren(
      ...matches.map((tool) => {
        const card = document.createElement("article");
        const heading = document.createElement("strong");
        heading.textContent = tool.name;
        const text = document.createElement("p");
        text.textContent = tool.description;
        card.append(heading, text);
        return card;
      }),
    );
    $("agent-result-count").textContent =
      `${t.runtime.shown}: ${matches.length} / ${tools.length}`;
    $("agent-empty").hidden = matches.length !== 0;
    $("agent-mode").textContent = applied ? t.after : t.before;
  }
  function clearChecks() {
    $("agent-checks").replaceChildren();
    $("agent-check-score").textContent = t.agentNotChecked;
  }
  buttons.forEach((button, index) => {
    button.hidden = false;
    button.addEventListener("click", () => showStage(index));
  });
  $("agent-search").addEventListener("input", renderPreview);
  $("agent-apply").addEventListener("click", () => {
    applied = true;
    clearChecks();
    renderPreview();
    showStage(3);
    $("agent-demo-status").textContent = t.agentApplied;
  });
  $("agent-validate").addEventListener("click", () => {
    const results = checkSearch(currentFilter, tools);
    $("agent-checks").replaceChildren(
      ...results.map((passed, index) => {
        const li = document.createElement("li");
        li.dataset.passed = String(passed);
        li.textContent = `${passed ? "✓" : "✗"} ${t.agentChecks[index]}`;
        return li;
      }),
    );
    $("agent-check-score").textContent =
      `${results.filter(Boolean).length} / ${results.length}`;
    showStage(4);
  });
  $("agent-reset").addEventListener("click", () => {
    applied = false;
    $("agent-search").value = "Gemini";
    clearChecks();
    renderPreview();
    showStage(0);
    $("agent-demo-status").textContent = t.agentOriginal;
  });
  demo.querySelector(".demo-controls").hidden = false;
  renderPreview();
}

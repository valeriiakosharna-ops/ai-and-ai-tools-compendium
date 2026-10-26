export const tools = [
  { id: "chatgpt", name: "ChatGPT", description: "Writing and learning" },
  { id: "gemini", name: "Gemini", description: "Research and Google services" },
  { id: "claude", name: "Claude", description: "Documents and reasoning" },
  { id: "copilot", name: "GitHub Copilot", description: "Code and tests" },
];

export function filterTools(items, query) {
  // TODO: filter by name or description; ignore case and surrounding whitespace.
  return items;
}

if (typeof document !== "undefined") {
  const search = document.querySelector("#search");
  const cards = [...document.querySelectorAll("[data-tool]")];
  const empty = document.querySelector("#empty");
  const status = document.querySelector("#status");
  function update() {
    const visible = filterTools(tools, search.value);
    const ids = new Set(visible.map((tool) => tool.id));
    cards.forEach((card) => {
      card.hidden = !ids.has(card.dataset.tool);
    });
    empty.hidden = visible.length > 0;
    status.textContent = `Tools found: ${visible.length}`;
  }
  search.addEventListener("input", update);
  update();
}

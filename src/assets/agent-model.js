// A deterministic teaching model; this does not call an AI service.
export function filterTools(items, query) {
  const normalized = query.trim().toLowerCase();
  return items.filter((tool) =>
    `${tool.name} ${tool.description}`.toLowerCase().includes(normalized),
  );
}

export function checkSearch(filter, tools) {
  const before = JSON.stringify(tools);
  const cases = [
    ["", tools.map((tool) => tool.id)],
    ["Gemini", ["gemini"]],
    ["GEMINI", ["gemini"]],
    ["  Gemini  ", ["gemini"]],
    ["reasoning", ["claude"]],
    ["xyz-not-found", []],
  ];
  const results = cases.map(([query, ids]) => {
    try {
      return (
        JSON.stringify(filter(tools, query).map((tool) => tool.id)) ===
        JSON.stringify(ids)
      );
    } catch {
      return false;
    }
  });
  try {
    filter(tools, "Gemini");
    results.push(JSON.stringify(tools) === before);
  } catch {
    results.push(false);
  }
  return results;
}

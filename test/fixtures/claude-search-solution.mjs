// Reference implementation for workshop verification; not included in site assets.
export function filterTools(items, query) {
  const normalized = query.trim().toLowerCase();
  return items.filter((tool) =>
    `${tool.name} ${tool.description}`.toLowerCase().includes(normalized),
  );
}

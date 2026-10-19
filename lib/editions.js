const sectionIds = ["taxonomy", "practice", "simulators", "image-prompts"];
export function validateEditions(editions, source) {
  if (!editions.universal) throw new Error("The universal edition is required");
  for (const [slug, edition] of Object.entries(editions)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new Error(`Invalid edition slug: ${slug}`);
    for (const lang of ["uk", "en"]) {
      if (!edition.title?.[lang] || !edition.description?.[lang])
        throw new Error(`${slug}: missing ${lang} metadata`);
    }
    for (const [key, allowed] of Object.entries({
      sections: sectionIds,
      tools: source.tools,
      exercises: source.exercises,
      imageExamples: ["mercedes", "oxford"],
    })) {
      const list = edition[key];
      if (list === "all" && ["tools", "exercises"].includes(key)) continue;
      if (
        !Array.isArray(list) ||
        new Set(list).size !== list.length ||
        list.some((id) => !allowed.includes(id))
      ) {
        throw new Error(`${slug}: invalid ${key}`);
      }
    }
    if (!edition.sections.length)
      throw new Error(`${slug}: choose at least one section`);
    if (edition.sections.includes("taxonomy") && edition.tools.length === 0)
      throw new Error(`${slug}: taxonomy needs tools`);
    if (edition.sections.includes("practice") && edition.exercises.length === 0)
      throw new Error(`${slug}: practice needs exercises`);
    if (
      edition.sections.includes("image-prompts") &&
      !edition.imageExamples.length
    )
      throw new Error(`${slug}: image-prompts needs examples`);
  }
}
export function selectItems(items, selection) {
  return selection === "all"
    ? items
    : selection.map((id) => items.find((item) => item.id === id));
}

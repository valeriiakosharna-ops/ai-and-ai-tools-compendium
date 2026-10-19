import { readFileSync, existsSync } from "node:fs";
import { encode } from "gpt-tokenizer/encoding/cl100k_base";
import ui from "../../content/ui.js";
import { validateEditions, selectItems } from "../../lib/editions.js";

const json = (path) =>
  JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));
const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
export default function () {
  const editions = json("editions.json");
  const imageFiles = json("content/images.json");
  const source = json("content/uk/taxonomy.json");
  validateEditions(editions, {
    tools: source.tools.map((t) => t.id),
    exercises: json("content/uk/practice.json").exercises.map((e) => e.id),
  });
  const selected = process.env.SITE_EDITION;
  const language = process.env.SITE_LANGUAGE;
  if (selected && !Object.hasOwn(editions, selected))
    throw new Error(`Unknown edition: ${selected}`);
  if (language && !["uk", "en"].includes(language))
    throw new Error(`Unknown language: ${language}`);
  const standalone = Boolean(selected || language);
  const views = [];
  for (const [slug, edition] of Object.entries(editions)) {
    if (
      (selected && selected !== slug) ||
      (language && !selected && slug !== "universal")
    )
      continue;
    for (const lang of language ? [language] : ["uk", "en"]) {
      const t = ui[lang];
      const base = standalone
        ? ""
        : slug === "universal"
          ? ""
          : `editions/${slug}/`;
      const root = `${base}${standalone && language ? "" : `${lang}/`}`;
      const tools = selectItems(
        json(`content/${lang}/taxonomy.json`).tools,
        edition.tools,
      );
      const taxonomy = {
        tools,
        categories: json(`content/${lang}/taxonomy.json`).categories.map(
          (c) => ({
            ...c,
            tools:
              c.id === "integrations"
                ? c.tools
                : tools
                    .filter((tool) => tool.category === c.id)
                    .map((tool) => tool.name)
                    .join(" · "),
          }),
        ),
      };
      const exercises = selectItems(
        json(`content/${lang}/practice.json`).exercises,
        edition.exercises,
      );
      const examples = edition.imageExamples.map((id) => {
        const text = read(`content/prompts/${id}/text.txt`);
        const structured = read(`content/prompts/${id}/structured.json`);
        const compact = JSON.stringify(JSON.parse(structured));
        const metrics = [text, structured, compact].map((value) => ({
          tokens: encode(value, { disallowedSpecial: new Set() }).length,
          characters: [...value].length,
        }));
        const image = (descriptor, role) => {
          const path = descriptor.src;
          if (!path.startsWith("assets/") || path.split("/").includes(".."))
            throw new Error(`Invalid image path: ${path}`);
          return {
            path,
            exists: existsSync(new URL(`../${path}`, import.meta.url)),
            label: descriptor.role || role,
            width: descriptor.width,
            height: descriptor.height,
          };
        };
        return {
          id,
          text,
          structured,
          compact,
          metrics,
          delta: Math.round((metrics[1].tokens / metrics[0].tokens - 1) * 100),
          references: imageFiles[id].references.map((reference) =>
            image(reference),
          ),
          result: image(imageFiles[id].result, "result"),
        };
      });
      const common = {
        lang,
        t,
        slug,
        root,
        edition,
        standalone,
        taxonomy,
        exercises,
        examples,
        lab: json(`content/${lang}/lab.json`),
        switchRoot:
          standalone && language
            ? null
            : `${base}${lang === "uk" ? "en" : "uk"}/`,
      };
      for (const section of ["home", ...edition.sections]) {
        const route = section === "home" ? "" : `${section}/`;
        views.push({
          ...common,
          section,
          route,
          title: section === "home" ? edition.title[lang] : t[section],
          output: `${root}${route}index.html`,
        });
      }
    }
  }
  return views;
}

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { encode } from "gpt-tokenizer/encoding/cl100k_base";
import ui from "../content/ui.js";
import views from "../src/_data/views.js";
import { validateEditions } from "../lib/editions.js";

const output = path.resolve("_site");
const segments = (process.env.SITE_PATH_PREFIX || "/")
  .split("/")
  .filter(Boolean);
const prefix = segments.length ? `/${segments.join("/")}/` : "/";
const origin = "https://example.github.io";
const walk = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(path.join(dir, entry.name))
          : path.join(dir, entry.name),
      ),
    )
  ).flat();
const htmlFiles = (await walk(output)).filter(
  (file) =>
    file.endsWith(".html") &&
    !path.relative(output, file).startsWith(`assets${path.sep}`),
);
const pages = new Map(
  await Promise.all(
    htmlFiles.map(async (file) => [
      path.relative(output, file),
      await readFile(file, "utf8"),
    ]),
  ),
);
const decode = (text) =>
  text.replace(
    /&(amp|lt|gt|quot|#39);/g,
    (_, entity) =>
      ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[entity],
  );

test("both complete languages and the custom edition render independent, labelled pages", () => {
  assert.equal(pages.size, 17);
  for (const view of views()) {
    const html = pages.get(view.output);
    assert.ok(html, view.output);
    assert.ok(html.includes(`<html lang="${view.lang}"`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.ok(html.includes('id="main-nav"'));
    assert.doesNotMatch(html, /\{\{|\{%/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${view.output}: duplicate ids`,
    );
    if (view.lang === "en") {
      const visible = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
        .replaceAll("Українська", "");
      assert.doesNotMatch(
        visible,
        /[\u0400-\u04ff]/,
        `${view.output}: untranslated visible text`,
      );
    }
    if (view.slug === "starter") {
      assert.doesNotMatch(html, /href="[^"]*\/(practice|simulators)\//);
    }
  }
});

test("all local links, fragments and assets resolve beneath the deployment prefix", async () => {
  let checked = 0;
  for (const [file, html] of pages) {
    const current = new URL(prefix + file.replace(/index\.html$/, ""), origin);
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const url = new URL(decode(match[1]), current);
      if (url.origin !== origin) continue;
      assert.ok(
        url.pathname.startsWith(prefix),
        `${file}: escaped prefix ${match[1]}`,
      );
      let target = decodeURIComponent(url.pathname.slice(prefix.length));
      let full = path.join(output, target);
      const metadata = await stat(full).catch(() => null);
      assert.ok(metadata, `${file}: missing ${match[1]}`);
      if (metadata.isDirectory()) {
        target = path.join(target, "index.html");
        full = path.join(full, "index.html");
      }
      assert.ok((await stat(full)).isFile());
      if (url.hash)
        assert.ok(
          (await readFile(full, "utf8")).includes(
            `id="${decodeURIComponent(url.hash.slice(1))}"`,
          ),
          `${file}: missing ${match[1]}`,
        );
      checked++;
    }
  }
  assert.ok(checked > 200);
});

test("catalogue preserves four approaches and adds Copilot throughout the complete guide", async () => {
  for (const lang of ["uk", "en"]) {
    const data = JSON.parse(
      await readFile(`content/${lang}/taxonomy.json`, "utf8"),
    );
    const html = pages.get(`${lang}/taxonomy/index.html`);
    assert.equal(data.categories.length, 4);
    assert.equal(data.tools.length, 7);
    for (const tool of data.tools) {
      assert.ok(html.includes(`id="${tool.id}"`));
      assert.ok(decode(html).includes(tool.description));
      assert.ok(decode(html).includes(tool.limitation));
      for (const link of tool.links) assert.ok(decode(html).includes(link.url));
    }
    const starter = pages.get(`editions/starter/${lang}/taxonomy/index.html`);
    for (const id of ["chatgpt", "notebooklm", "github-copilot"])
      assert.ok(starter.includes(`id="${id}"`));
    for (const id of ["gemini", "claude", "claude-code", "codex"])
      assert.ok(!starter.includes(`id="${id}"`));
  }
});

test("all six exercises, source materials, reflection prompts and agent demo are preserved", async () => {
  for (const lang of ["uk", "en"]) {
    const data = JSON.parse(
      await readFile(`content/${lang}/practice.json`, "utf8"),
    );
    const html = pages.get(`${lang}/practice/index.html`);
    assert.equal(data.exercises.length, 6);
    assert.equal((html.match(/data-complete-exercise=/g) || []).length, 6);
    for (const exercise of data.exercises) {
      for (const text of [
        exercise.title,
        exercise.result,
        ...exercise.steps,
        ...exercise.checks,
        ...exercise.reflection,
      ])
        assert.ok(decode(html).includes(text));
      for (const prompt of exercise.prompts)
        assert.ok(decode(html).includes(prompt.text));
    }
    assert.ok(html.includes('id="agent-demo"'));
    assert.ok(html.includes('sandbox=""'));
    const folder = lang === "en" ? "en/" : "";
    const brief = await readFile(
      `${output}/assets/materials/${folder}event-brief.txt`,
      "utf8",
    );
    const update = await readFile(
      `${output}/assets/materials/${folder}event-update.txt`,
      "utf8",
    );
    assert.match(brief, /3000|3,000/);
    assert.match(update, /2400|2,400/);
    const starter = await readFile(
      `${output}/assets/materials/${folder}copilot-starter.html`,
      "utf8",
    );
    assert.ok(starter.includes('id="reserve"'));
    assert.ok(
      starter.includes('id="availability" role="status" aria-live="polite"'),
    );
    assert.doesNotMatch(starter, /<script\b|onclick=/);
    assert.ok(html.includes('id="copilot"'));
    assert.ok(html.includes('id="copilot-explain"'));
    assert.ok(html.includes('id="copilot-edit"'));
  }
});

test("four full image prompts start collapsed and retain the exact uploaded strings and reproducible metrics", () => {
  for (const lang of ["uk", "en"]) {
    const view = views().find(
      (v) =>
        v.lang === lang &&
        v.slug === "universal" &&
        v.section === "image-prompts",
    );
    const html = pages.get(`${lang}/image-prompts/index.html`);
    const details = [...html.matchAll(/<details\b([^>]*)>/g)];
    assert.equal(details.length, 7);
    details.forEach(([, attrs]) => assert.doesNotMatch(attrs, /\bopen\b/));
    const missing = view.examples
      .flatMap((example) => [...example.references, example.result])
      .filter((image) => !image.exists).length;
    assert.equal(
      (html.match(/class="image-placeholder"/g) || []).length,
      missing,
    );
    for (const example of view.examples) {
      assert.equal(
        example.references.length,
        example.id === "mercedes" ? 2 : 1,
      );
      for (const [index, [suffix, text]] of [
        [0, ["text", example.text]],
        [1, ["json", example.structured]],
      ]) {
        const rendered = html.match(
          new RegExp(
            `<pre id="${example.id}-${suffix}"[^>]*><code>([\\s\\S]*?)<\\/code><\\/pre>`,
          ),
        )?.[1];
        assert.equal(decode(rendered), text);
        assert.equal(
          example.metrics[index].tokens,
          encode(text, { disallowedSpecial: new Set() }).length,
        );
      }
      assert.deepEqual(
        JSON.parse(example.compact),
        JSON.parse(example.structured),
      );
      assert.equal(example.metrics[2].tokens, encode(example.compact).length);
      assert.ok(html.includes(String(example.metrics[0].tokens)));
    }
    assert.ok(html.includes("cl100k_base"));
    assert.ok(html.includes('id="convert-json"'));
  }
});

test("edition configuration rejects unknown sections, duplicate IDs, invalid slugs, and empty active content", async () => {
  const editions = JSON.parse(await readFile("editions.json", "utf8"));
  const source = {
    tools: JSON.parse(await readFile("content/uk/taxonomy.json")).tools.map(
      (t) => t.id,
    ),
    exercises: JSON.parse(
      await readFile("content/uk/practice.json"),
    ).exercises.map((t) => t.id),
  };
  for (const mutate of [
    (e) => {
      e.universal.sections = ["unknown"];
    },
    (e) => {
      e.universal.tools = ["chatgpt", "chatgpt"];
    },
    (e) => {
      e["../escape"] = e.starter;
    },
    (e) => {
      e.universal.imageExamples = [];
    },
    (e) => {
      e.universal.tools = [];
    },
  ]) {
    const invalid = structuredClone(editions);
    mutate(invalid);
    assert.throws(() => validateEditions(invalid, source));
  }
});

test("translation dictionaries have identical shapes", () => {
  const shape = (value) =>
    Array.isArray(value)
      ? value.map(shape)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, shape(value[key])]),
          )
        : typeof value;
  assert.deepEqual(shape(ui.en), shape(ui.uk));
});

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir, stat, mkdtemp, cp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const run = (args, env = process.env) => {
  const result = spawnSync(process.execPath, ["scripts/build.mjs", ...args], {
    encoding: "utf8",
    env,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
};
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
async function linksResolve(root, prefix) {
  for (const file of (await walk(root)).filter((file) =>
    file.endsWith(".html"),
  )) {
    const html = await readFile(file, "utf8");
    const url = new URL(
      prefix + path.relative(root, file).replace(/index\.html$/, ""),
      "https://example.com",
    );
    for (const [, link] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      const target = new URL(link.replaceAll("&amp;", "&"), url);
      if (target.origin !== url.origin) continue;
      assert.ok(target.pathname.startsWith(prefix));
      let full = path.join(
        root,
        decodeURIComponent(target.pathname.slice(prefix.length)),
      );
      const meta = await stat(full).catch(() => null);
      assert.ok(meta, `${file}: missing ${link}`);
      if (meta.isDirectory()) full = path.join(full, "index.html");
      assert.ok((await stat(full)).isFile());
      if (target.hash)
        assert.ok(
          (await readFile(full, "utf8")).includes(
            `id="${decodeURIComponent(target.hash.slice(1))}"`,
          ),
        );
    }
  }
}

test("separate language builds and custom single/bilingual builds have complete working links", async () => {
  for (const lang of ["uk", "en"]) {
    run(["--language", lang]);
    const root = `dist/universal-${lang}`;
    const pages = (await walk(root)).filter((file) => file.endsWith(".html"));
    assert.equal(pages.length, 5);
    const html = await readFile(`${root}/index.html`, "utf8");
    assert.ok(html.includes(`<html lang="${lang}"`));
    assert.doesNotMatch(html, /hreflang=/);
    const segments = (process.env.SITE_PATH_PREFIX || "/")
      .split("/")
      .filter(Boolean);
    await linksResolve(root, segments.length ? `/${segments.join("/")}/` : "/");
  }
  run(["--edition", "starter"], {
    ...process.env,
    SITE_PATH_PREFIX: "/custom/guide/",
  });
  assert.equal(
    (await walk("dist/starter")).filter((file) => file.endsWith(".html"))
      .length,
    7,
  );
  await linksResolve("dist/starter", "/custom/guide/");
  run(["--edition", "starter", "--language", "en"], {
    ...process.env,
    SITE_PATH_PREFIX: "/custom/guide/",
  });
  assert.equal(
    (await walk("dist/starter-en")).filter((file) => file.endsWith(".html"))
      .length,
    3,
  );
  await linksResolve("dist/starter-en", "/custom/guide/");
});

test("an added edition can reorder/remove lessons, select one image example, and replace image slots", async () => {
  // Exercise changes in an isolated fixture, preserving the user's working tree.
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ai-guide-build-"));
  try {
    for (const item of [
      "src",
      "content",
      "lib",
      "scripts",
      "editions.json",
      "eleventy.config.js",
      "package.json",
    ])
      await cp(item, path.join(temporary, item), { recursive: true });
    const { symlink } = await import("node:fs/promises");
    await symlink(
      path.resolve("node_modules"),
      path.join(temporary, "node_modules"),
      "dir",
    );
    const editions = JSON.parse(
      await readFile(path.join(temporary, "editions.json"), "utf8"),
    );
    editions.workshop = {
      title: { uk: "Тестова збірка", en: "Test edition" },
      description: { uk: "Опис", en: "Description" },
      sections: ["practice", "image-prompts"],
      tools: [],
      exercises: ["sources", "plan"],
      imageExamples: ["oxford"],
    };
    const { writeFile, mkdir } = await import("node:fs/promises");
    await writeFile(
      path.join(temporary, "editions.json"),
      JSON.stringify(editions),
    );
    const images = JSON.parse(
      await readFile(path.join(temporary, "content/images.json"), "utf8"),
    );
    images.oxford = {
      references: [
        {
          src: "assets/images/oxford/reference-1.webp",
          role: "hall",
          width: 1600,
          height: 900,
        },
      ],
      result: { src: "assets/images/oxford/result.webp", width: 1, height: 1 },
    };
    await writeFile(
      path.join(temporary, "content/images.json"),
      JSON.stringify(images),
    );
    await mkdir(path.join(temporary, "src/assets/images/oxford"), {
      recursive: true,
    });
    // A real 1x1 WebP fixture verifies file discovery and passthrough, not image quality.
    await writeFile(
      path.join(temporary, "src/assets/images/oxford/result.webp"),
      Buffer.from(
        "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
        "base64",
      ),
    );
    const result = spawnSync(
      process.execPath,
      ["scripts/build.mjs", "--edition", "workshop", "--language", "en"],
      {
        cwd: temporary,
        encoding: "utf8",
        env: { ...process.env, SITE_PATH_PREFIX: "/workshop/" },
      },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const root = path.join(temporary, "dist/workshop-en");
    assert.equal(
      (await walk(root)).filter((file) => file.endsWith(".html")).length,
      3,
    );
    const home = await readFile(path.join(root, "index.html"), "utf8");
    assert.doesNotMatch(home, /href="[^"]*taxonomy\//);
    const practice = await readFile(
      path.join(root, "practice/index.html"),
      "utf8",
    );
    assert.equal((practice.match(/data-complete-exercise=/g) || []).length, 2);
    assert.ok(practice.indexOf('id="sources"') < practice.indexOf('id="plan"'));
    const gallery = await readFile(
      path.join(root, "image-prompts/index.html"),
      "utf8",
    );
    assert.ok(
      gallery.includes('src="/workshop/assets/images/oxford/result.webp"'),
    );
    assert.doesNotMatch(gallery, /id="mercedes"/);
    assert.equal((gallery.match(/class="image-placeholder"/g) || []).length, 1);
    await linksResolve(root, "/workshop/");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

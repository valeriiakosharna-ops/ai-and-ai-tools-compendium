import { build } from "esbuild";
import { buildPracticeArchive } from "./lib/practice-archive.js";
export default function (config) {
  const segments = (process.env.SITE_PATH_PREFIX || "/")
    .split("/")
    .filter(Boolean);
  const prefix = segments.length ? `/${segments.join("/")}/` : "/";
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  config.addWatchTarget("content/");
  config.addWatchTarget("editions.json");
  config.watchIgnores.add(".cache/**");
  config.addPassthroughCopy({ "src/assets": "assets" });
  config.addPassthroughCopy({
    ".cache/claude-code-practice.zip":
      "assets/materials/claude-code-practice.zip",
    ".cache/tokenizer.js": "assets/tokenizer.js",
    "node_modules/gpt-tokenizer/LICENSE": "assets/tokenizer-LICENSE.txt",
  });
  config.on("eleventy.before", async () => {
    buildPracticeArchive();
    await build({
      entryPoints: ["lib/tokenizer-entry.js"],
      outfile: ".cache/tokenizer.js",
      bundle: true,
      minify: true,
      format: "esm",
      platform: "browser",
      target: "es2022",
      legalComments: "inline",
    });
  });
  config.addFilter("url", (path) => prefix + String(path).replace(/^\/+/, ""));
  config.addFilter("jsonScript", (value) =>
    JSON.stringify(value).replace(/</g, "\\u003c"),
  );
  config.addFilter("searchText", (tool) =>
    [tool.name, tool.type, tool.summary, ...tool.capabilities].join(" "),
  );
  config.addFilter("pad", (value) => String(value).padStart(2, "0"));
  config.addFilter("categoryTools", (tools, category) =>
    tools.filter((t) => t.category === category),
  );
  return {
    pathPrefix: prefix,
    templateFormats: ["njk"],
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
  };
}

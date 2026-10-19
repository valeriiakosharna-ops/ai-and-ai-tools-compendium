import { spawnSync } from "node:child_process";
import { rmSync, readFileSync } from "node:fs";
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!["--language", "--edition"].includes(args[i]) || !args[i + 1])
    throw new Error(
      "Usage: npm run build:edition -- --edition starter [--language uk|en]",
    );
  options[args[i].slice(2)] = args[i + 1];
}
const editions = JSON.parse(readFileSync("editions.json", "utf8"));
if (options.language && !["uk", "en"].includes(options.language))
  throw new Error("Language must be uk or en");
if (options.edition && !Object.hasOwn(editions, options.edition))
  throw new Error("Unknown edition");
if (!options.language && !options.edition)
  throw new Error("Choose --edition or --language");
const output = `dist/${options.edition || "universal"}${options.language ? `-${options.language}` : ""}`;
rmSync(output, { recursive: true, force: true });
const result = spawnSync(
  process.execPath,
  ["node_modules/@11ty/eleventy/cmd.cjs", `--output=${output}`],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      SITE_EDITION: options.edition || "universal",
      SITE_LANGUAGE: options.language || "",
    },
  },
);
process.exit(result.status ?? 1);

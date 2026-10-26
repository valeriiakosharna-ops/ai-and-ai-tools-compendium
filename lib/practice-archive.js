import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { zipSync } from "fflate";

export const workshopFiles = [
  "index.html",
  "app.mjs",
  "verify.mjs",
  "serve.mjs",
];
export function buildPracticeArchive() {
  const files = Object.fromEntries(
    workshopFiles.map((name) => [
      name,
      readFileSync(
        new URL(`../src/assets/materials/claude-code/${name}`, import.meta.url),
      ),
    ]),
  );
  mkdirSync(".cache", { recursive: true });
  writeFileSync(
    ".cache/claude-code-practice.zip",
    zipSync(files, { level: 6, mtime: new Date("2020-01-01T00:00:00Z") }),
  );
}

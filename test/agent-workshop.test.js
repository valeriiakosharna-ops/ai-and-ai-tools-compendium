import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, cp, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { unzipSync } from "fflate";
import { filterTools } from "./fixtures/claude-search-solution.mjs";
import { filterTools as initialFilter } from "../src/assets/materials/claude-code/app.mjs";
import { workshopFiles } from "../lib/practice-archive.js";

test("the downloadable workshop preserves the starter files and its honest failing baseline", async () => {
  const archive = unzipSync(
    await readFile("_site/assets/materials/claude-code-practice.zip"),
  );
  assert.deepEqual(Object.keys(archive).sort(), [...workshopFiles].sort());
  for (const name of workshopFiles)
    assert.deepEqual(
      Buffer.from(archive[name]),
      await readFile(`src/assets/materials/claude-code/${name}`),
    );
  const baseline = spawnSync(process.execPath, ["verify.mjs"], {
    cwd: "src/assets/materials/claude-code",
    encoding: "utf8",
  });
  assert.equal(baseline.status, 1);
  assert.match(baseline.stdout, /2\/7 checks passed/);
  assert.equal((baseline.stderr.match(/FAIL /g) || []).length, 5);
});

test("the test reference implementation passes the real workshop verifier after changing only the intended function", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "claude-workshop-"));
  try {
    await cp("src/assets/materials/claude-code", temporary, {
      recursive: true,
    });
    const original = await readFile(path.join(temporary, "app.mjs"), "utf8");
    assert.ok(original.includes(initialFilter.toString()));
    await writeFile(
      path.join(temporary, "app.mjs"),
      original.replace(initialFilter.toString(), filterTools.toString()),
    );
    const result = spawnSync(process.execPath, ["verify.mjs"], {
      cwd: temporary,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /7\/7 checks passed/);
    assert.equal((result.stdout.match(/PASS /g) || []).length, 7);
    for (const name of workshopFiles.filter((name) => name !== "app.mjs"))
      assert.deepEqual(
        await readFile(path.join(temporary, name)),
        await readFile(`src/assets/materials/claude-code/${name}`),
      );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

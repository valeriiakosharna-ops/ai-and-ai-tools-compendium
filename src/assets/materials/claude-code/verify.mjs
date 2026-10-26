import assert from "node:assert/strict";
import { filterTools, tools } from "./app.mjs";

const cases = [
  ["empty query returns all tools", "", tools.map((tool) => tool.id)],
  ["matches a name", "Gemini", ["gemini"]],
  ["ignores case", "GEMINI", ["gemini"]],
  ["trims whitespace", "  Gemini  ", ["gemini"]],
  ["matches a description", "reasoning", ["claude"]],
  ["no match returns an empty list", "xyz-not-found", []],
];
let passed = 0;
const original = JSON.stringify(tools);
for (const [label, query, expected] of cases) {
  try {
    assert.deepEqual(
      filterTools(tools, query).map((tool) => tool.id),
      expected,
    );
    console.log(`PASS ${label}`);
    passed++;
  } catch {
    console.error(`FAIL ${label}`);
  }
}
try {
  filterTools(tools, "Gemini");
  assert.equal(JSON.stringify(tools), original);
  console.log("PASS preserves source data");
  passed++;
} catch {
  console.error("FAIL preserves source data");
}
console.log(`${passed}/7 checks passed`);
process.exitCode = passed === 7 ? 0 : 1;

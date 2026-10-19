import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve("_site");
const segments = (process.env.SITE_PATH_PREFIX || "/")
  .split("/")
  .filter(Boolean);
const prefix = segments.length ? `/${segments.join("/")}/` : "/";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(prefix)) throw new Error("Outside mount");
    let file = path.resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)),
    );
    if (file !== root && !file.startsWith(root + path.sep))
      throw new Error("Outside root");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}${prefix}`;
const executable =
  process.env.CHROMIUM_PATH ||
  [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find(existsSync);
let browser;
try {
  browser = await chromium.launch({
    ...(executable ? { executablePath: executable } : {}),
    headless: true,
    args: process.env.CI ? ["--no-sandbox"] : [],
  });
} catch (error) {
  await new Promise((resolve) => server.close(resolve));
  throw error;
}
let checks = 0;
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  const noOverflow = async () =>
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "No horizontal page overflow",
    );
  for (const lang of ["uk", "en"]) {
    await page.goto(`${base}${lang}/`);
    await noOverflow();
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    assert.equal(await page.locator(".menu-toggle").isVisible(), false);
    checks++;
    await page.goto(`${base}${lang}/taxonomy/`);
    await page.locator(".tool-controls").waitFor({ state: "visible" });
    await page.locator('[data-filter="coding"]').click();
    assert.equal(await page.locator(".tool-card:visible").count(), 3);
    await page.locator("#tool-search").fill("Copilot");
    assert.equal(await page.locator(".tool-card:visible").count(), 1);
    await page.locator("#tool-search").fill("does-not-exist");
    await page.locator(".empty-state").waitFor({ state: "visible" });
    await page.locator("#reset-filters").click();
    assert.equal(await page.locator(".tool-card:visible").count(), 7);
    await page.locator('a[data-open-tool="github-copilot"]').first().click();
    assert.equal(
      await page.locator("#github-copilot details").getAttribute("open"),
      "",
    );
    checks += 5;
    await noOverflow();
    await page.goto(`${base}${lang}/image-prompts/`);
    assert.equal(await page.locator("details[open]").count(), 0);
    assert.equal(await page.locator(".prompt-disclosure").count(), 4);
    assert.equal(await page.locator(".image-placeholder").count(), 0);
    const galleryImages = page.locator(".image-slot img");
    assert.equal(await galleryImages.count(), 5);
    for (const image of await galleryImages.all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
    }
    checks++;
    const first = page.locator(".prompt-disclosure").first();
    await first.locator("summary").click();
    await first.locator("pre").waitFor({ state: "visible" });
    const text = await first.locator("pre").textContent();
    assert.ok(text.startsWith("Create an ultra-photorealistic"));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await first.locator("[data-copy-target]").click();
    await page.waitForFunction(
      () => document.querySelector(".copy-status").textContent.length > 0,
    );
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      text,
    );
    checks += 4;
    await page.goto(`${base}${lang}/practice/`);
    await page.locator(".progress-panel").waitFor({ state: "visible" });
    await page.locator('[data-complete-exercise="plan"]').check();
    await page.reload();
    assert.equal(
      await page.locator('[data-complete-exercise="plan"]').isChecked(),
      true,
    );
    await page.locator("#reset-progress").click();
    assert.equal(
      await page.locator("#practice-progress").getAttribute("value"),
      "0",
    );
    await page.locator("#agent-apply").click();
    await page.locator("#agent-validate").click();
    assert.equal(
      await page.locator('#agent-checks [data-passed="true"]').count(),
      4,
    );
    checks += 3;
    await page.goto(`${base}${lang}/simulators/`);
    await page.locator("#token-input").fill("Hello, world!");
    await page.locator("#tokenize").click();
    await page.waitForFunction(
      () => document.querySelector("#token-count").textContent === "4",
    );
    assert.equal(
      await page.locator("#token-roundtrip").textContent(),
      "Hello, world!",
    );
    await page.locator("#context-document").evaluate((input) => {
      input.value = "7";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(
      await page.locator("#context-status").getAttribute("data-overflow"),
      "true",
    );
    await page.locator("#vector-query").selectOption("keyword");
    assert.ok(
      (await page.locator("#keyword-results").textContent()).includes(
        lang === "uk" ? "стартер" : "starter",
      ),
    );
    await page.locator("#rag-question").selectOption("extension");
    await page.locator("#rag-retrieve").click();
    await page.locator("#rag-generate").click();
    assert.equal(await page.locator("#rag-citations a").count(), 2);
    await page.locator('[data-rag-source][value="R2"]').uncheck();
    assert.equal(await page.locator("#rag-answer").isHidden(), true);
    await page.locator("#rag-generate").click();
    assert.equal(await page.locator("#rag-citations a").count(), 1);
    await page.locator("#rag-question").selectOption("fee");
    await page.locator("#rag-retrieve").click();
    await page.locator("#rag-generate").click();
    assert.equal(await page.locator("#rag-citations a").count(), 0);
    checks += 7;
    for (const route of [
      "",
      "taxonomy/",
      "practice/",
      "simulators/",
      "image-prompts/",
    ]) {
      await page.setViewportSize({ width: 375, height: 850 });
      await page.goto(`${base}${lang}/${route}`);
      await noOverflow();
      checks++;
    }
    await page.locator(".menu-toggle").click();
    assert.equal(await page.locator("#main-nav").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#main-nav").isVisible(), false);
    checks++;
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(`${base}editions/starter/en/taxonomy/`);
  assert.equal(await page.locator(".tool-card").count(), 3);
  assert.equal(await page.locator("#main-nav a").count(), 3);
  checks += 2;
  await page.goto(`${base}en/image-prompts/`);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
  });
  await page.locator(".prompt-disclosure").first().locator("summary").click();
  await page.locator('[data-copy-target="mercedes-text"]').click();
  assert.ok(
    (await page.locator(".copy-status").first().textContent()).includes(
      "manually",
    ),
  );
  checks++;
  await page.route("**/assets/tokenizer.js*", (route) => route.abort());
  await page.goto(`${base}en/simulators/`);
  await page.locator("#tokenize").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#token-status")
      .textContent.includes("Could not load"),
  );
  await page.unroute("**/assets/tokenizer.js*");
  await page.locator("#tokenize").click();
  await page.locator("#token-result").waitFor({ state: "visible" });
  checks++;
  await context.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${base}uk/image-prompts/`);
  assert.equal(await staticPage.locator("details[open]").count(), 0);
  await staticPage
    .locator(".prompt-disclosure")
    .first()
    .locator("summary")
    .click();
  assert.equal(await staticPage.locator("#mercedes-text").isVisible(), true);
  checks++;
  await staticPage.goto(`${base}en/taxonomy/`);
  assert.equal(await staticPage.locator(".tool-card").count(), 7);
  await staticPage.locator("#github-copilot summary").click();
  assert.equal(
    await staticPage.locator("#github-copilot .tool-body").isVisible(),
    true,
  );
  checks++;
  await noJs.close();
  const storage = await browser.newContext();
  await storage.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Blocked storage");
      },
    });
  });
  const storagePage = await storage.newPage();
  await storagePage.goto(`${base}en/practice/`);
  await storagePage.locator(".progress-panel").waitFor({ state: "visible" });
  await storagePage.locator('[data-complete-exercise="plan"]').check();
  assert.ok(
    (await storagePage.locator("#storage-note").textContent()).includes(
      "unavailable",
    ),
  );
  checks++;
  await storage.close();
  const screenshots = path.resolve(".cache/screenshots");
  await mkdir(screenshots, { recursive: true });
  const capture = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await capture.goto(`${base}en/`);
  await capture.screenshot({
    path: path.join(screenshots, "home-desktop.png"),
    fullPage: true,
  });
  await capture.goto(`${base}uk/image-prompts/`);
  for (const image of await capture.locator('.image-slot img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(img => img.decode());
  }
  await capture.evaluate(() => scrollTo(0, 0));
  await capture.screenshot({
    path: path.join(screenshots, "images-desktop.png"),
    fullPage: true,
  });
  await capture.setViewportSize({ width: 375, height: 850 });
  await capture.goto(`${base}uk/`);
  await capture.screenshot({
    path: path.join(screenshots, "home-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, [], "No browser exceptions or failed HTTP requests");
  console.log(
    `Browser checks passed: ${checks}. Screenshots: .cache/screenshots/`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

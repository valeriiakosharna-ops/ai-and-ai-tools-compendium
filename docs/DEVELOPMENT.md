# AI Field Guide · Довідник інструментів ШІ

A reusable static mini-site in **Ukrainian and English**, adapted from [AI Tools for Everyday Routine](https://github.com/valeriiakosharna-ops/ai-tools-for-everyday-routine). No backend, database, or API keys are required.

## What is included

- Four approaches to AI and seven detailed tools: ChatGPT, Gemini, Claude, NotebookLM, Claude Code, Codex, and **GitHub Copilot**. Search, category filters, comparison, and task-based recommendations.
- Six practical exercises with copyable prompts, downloadable documents, checklists, reflection questions, and locally saved completion marks. An optional HTML agent simulation checks a real in-memory change without calling an agent.
- Four interactive trainers: real `cl100k_base` tokenisation, an illustrative context budget, keyword versus manually positioned vector retrieval, and RAG using fictional documents and predefined answers.
- Two image examples: **Mercedes / Monaco** with two reference slots and one result; **Oxford** with one reference slot and one result. Start by downloading references and recreating the target with your own prompt. The supplied prompts, token comparisons, analysis, and tips are collapsed until opened.
- Shared templates, fully localised learning content and runtime messages, language switching on the same page, mobile layouts, and meaningful content available without JavaScript.
- Configurable editions that can be built under different paths or deployed independently.

## Development

Node.js **22 or newer** and npm are required. The version pin is in `.nvmrc`.

```sh
npm ci
npm start
```

The development server uses port 8080 and watches templates, content, edition settings, and images. In cloud environments where the default npm cache is not writable, use `npm ci --cache /workspace/.npm-cache`.

```sh
npm run check          # Clean build and content/link/model tests
npm run test:browser   # Functional browser checks, desktop and mobile
```

Browser checks need Chromium. They use `CHROMIUM_PATH`, then a system Chromium installation, then Playwright's installed browser. To install the latter, run `npx playwright-core install chromium`; on Linux you may also need its documented system dependencies. CI installs them using `npx playwright-core install --with-deps chromium`. Screenshots go to the ignored `.cache/screenshots/` directory.

`npm run build` cleans `_site/` before rebuilding, so removed editions do not leave old public pages. Restart the dev server or run a clean build after removing routes. Generated files, caches, dependencies, and `dist/` outputs are ignored by Git.

## Separate languages and editions

The default build contains:

| Path relative to the published site | Contents                        |
| ----------------------------------- | ------------------------------- |
| `/`                                 | Language selector               |
| `/uk/`                              | Complete Ukrainian guide        |
| `/en/`                              | Complete English guide          |
| `/editions/starter/uk/`             | Sample custom Ukrainian edition |
| `/editions/starter/en/`             | Sample custom English edition   |

These are output paths, not already published URLs. Each language contains separate generated HTML; no browser translation is required.

For independently deployable builds:

```sh
npm run build:uk
# dist/universal-uk/ — Ukrainian site at its deployment root

npm run build:en
# dist/universal-en/ — English site at its deployment root

npm run build:edition -- --edition starter
# dist/starter/ — language selector plus uk/ and en/

npm run build:edition -- --edition starter --language en
# dist/starter-en/ — only the English custom site, at its deployment root
```

Upload the **contents** of the chosen output directory to a static host. One-language standalone builds omit the language switch because the other language is not included.

### Create a custom edition

Add an entry to [`editions.json`](../editions.json). The slug becomes part of its public path. Use lowercase ASCII letters, numbers, and hyphens.

```json
{
  "workshop": {
    "title": { "uk": "ШІ для команди", "en": "AI for the team" },
    "description": {
      "uk": "Матеріали нашої зустрічі.",
      "en": "Resources for our workshop."
    },
    "sections": ["taxonomy", "practice", "image-prompts"],
    "tools": ["chatgpt", "notebooklm", "github-copilot"],
    "exercises": ["plan", "sources"],
    "imageExamples": ["mercedes"]
  }
}
```

Merge this entry alongside `universal` and `starter`; do not replace the entire file with the snippet. Then run `npm run build`. The new links will be `/editions/workshop/uk/` and `/editions/workshop/en/` under the site prefix. You can also run `npm run build:edition -- --edition workshop --language uk` for an independent deployment.

- `sections`: select and order `taxonomy`, `practice`, `simulators`, `image-prompts`. A home page is always added.
- `tools`: `"all"` or an ordered list of tool IDs. The seven IDs are in `content/uk/taxonomy.json` and matched in the English file.
- `exercises`: `"all"` or IDs `plan`, `context`, `sources`, `arguments`, `compare`, `copilot`.
- `imageExamples`: an ordered selection of `mercedes`, `oxford`.
- Use `[]` for content belonging to a disabled section. An enabled section must have content.

Navigation and home cards follow the selected sections. Tool cards, comparison rows, and recommendations follow the selected tools; exercises and progress follow the selected exercise list. Edition pages never link to removed sections. The four approaches remain general educational explanations. Practice exercises may use external services not present in a shortened tool catalogue; choose exercises appropriate to your audience.

To add a new tool, exercise, or lesson, add its data in **both** `content/uk/` and `content/en/`. A new page type needs a shared template in `src/_includes/pages/`, translations in `content/ui.js`, and registration in `lib/editions.js`. The same source materials feed all builds.

## Visual prompts and image files

The owner-provided images are connected through [`content/images.json`](../content/images.json). Both languages and all editions use this shared mapping:

| Example  | Role               | Asset                                 |
| -------- | ------------------ | ------------------------------------- |
| Mercedes | Driver reference   | `src/assets/kimi.png`                 |
| Mercedes | Car reference      | `src/assets/kimi-car.png`             |
| Mercedes | Generated result   | `src/assets/petronas.png`             |
| Oxford   | Interior reference | `src/assets/oxford.png`               |
| Oxford   | Generated result   | `src/assets/scientists-in-oxford.png` |

Replace a file in place, or change its `src`, `width`, and `height` in `content/images.json`. Paths are relative to `src/` and start with `assets/`. PNG, WebP, and JPEG are supported by the site. Keep dimensions consistent with the actual file. Missing files display a labelled placeholder. Images are shown without cropping; references share a consistent frame while preserving their original proportions.

The page is named **Візуальні промпти / Visual prompts**. Its `/image-prompts/` route is retained so existing links continue to work. The owner-provided `src/assets/logo.svg` and favicon provide the site identity. Brand colours are defined together at the top of `src/assets/styles.css`; pale surfaces derive from those colours.

Prompt source files:

```text
content/prompts/mercedes/text.txt
content/prompts/mercedes/structured.json
content/prompts/oxford/text.txt
content/prompts/oxford/structured.json
```

Token and Unicode-character counts are recalculated from the actual strings at every build, including whitespace. A third table row shows minified JSON as a size comparison; the original JSON remains unchanged and is the one displayed/copied. The tokenizer is explicitly named. Counts exclude reference images and service messages and do not claim to reproduce an image service's billing.

Text and JSON are different supplied formulations, not controlled equivalents. The guide explains structure, editability, token overhead, the JSON-first workflow, reference-image roles, and parameter control. A single result image cannot establish a winning format. For a genuine comparison, keep model, settings, references, and seed (if supported) the same, preserve results for each format, and repeat several runs.

## Publish with GitHub Pages

The repository includes `.github/workflows/pages.yml`. After you push the reviewed code to `main`:

1. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Run the workflow if it has not already started.
3. Every push to any branch installs dependencies and runs static and browser checks. Every change in `main` also publishes `_site/` after successful validation. Pull requests build and test without publishing. There are no path filters: changes to images, content, configuration, or code all trigger a new build.

For this repository, the expected base address after deployment is:

```text
https://valeriiakosharna-ops.github.io/ai-and-ai-tools-compendium/
```

Append `uk/`, `en/`, or `editions/starter/en/` for the corresponding guide. The workflow detects the repository prefix automatically. These URLs are not claimed to be live until deployment succeeds.

For a custom host or subdirectory, set the prefix **at build time**:

```sh
SITE_PATH_PREFIX=/my-guide/ npm run build
SITE_PATH_PREFIX=/my-guide/ npm run build:edition -- --edition starter --language en
```

Keep the prefix consistent with the deployment directory. It applies to navigation, alternate-language links, scripts, images, styles, downloads, and lazy tokenizer imports.

Development commands do not push commits or publish the site. Core source attribution and the inspected commit are recorded in [`SOURCE.md`](../SOURCE.md).

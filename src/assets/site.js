const t = JSON.parse(document.querySelector("#ui-data")?.textContent || "{}");
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const nav = $("#main-nav");
const menu = $(".menu-toggle");
if (nav && menu) {
  nav.classList.add("enhanced");
  menu.hidden = false;
  function toggle(open) {
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? t.closeMenu : t.menu;
  }
  menu.addEventListener("click", () =>
    toggle(menu.getAttribute("aria-expanded") !== "true"),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      toggle(false);
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !menu.contains(event.target))
      toggle(false);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) toggle(false);
  });
  matchMedia("(min-width: 981px)").addEventListener("change", () =>
    toggle(false),
  );
}

$$("[data-copy-target]").forEach((button) => {
  const target = document.getElementById(button.dataset.copyTarget);
  if (!target) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    const status = button.closest(".prompt-card").querySelector(".copy-status");
    status.textContent = "";
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(target.textContent);
      status.textContent = t.copied;
    } catch {
      target.focus({ preventScroll: true });
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = t.copyFailed;
    }
  });
});

const cards = $$(".tool-card");
const filters = $$("[data-filter]");
const search = $("#tool-search");
let active = "all";
const normal = (text) =>
  text
    .normalize("NFKC")
    .toLocaleLowerCase(document.documentElement.lang)
    .replace(/[’'ʼ`]/g, "")
    .trim();
function filterTools() {
  const query = normal(search?.value || "");
  let count = 0;
  cards.forEach((card) => {
    const matches =
      (active === "all" || card.dataset.category === active) &&
      normal(card.dataset.search).includes(query);
    card.hidden = !matches;
    if (matches) count++;
  });
  filters.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === active),
    ),
  );
  if ($(".empty-state")) $(".empty-state").hidden = count !== 0;
  if ($("#filter-status"))
    $("#filter-status").textContent =
      `${t.runtime.shown}: ${count} / ${cards.length}`;
}
function resetTools() {
  active = "all";
  if (search) search.value = "";
  filterTools();
}
if (search) {
  $(".tool-controls").hidden = false;
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      active = button.dataset.filter;
      filterTools();
    }),
  );
  search.addEventListener("input", filterTools);
  $("#reset-filters").addEventListener("click", () => {
    resetTools();
    search.focus();
  });
  filterTools();
}
function revealTool(id, focus = false) {
  const target = document.getElementById(id);
  if (!target?.classList.contains("tool-card")) return;
  resetTools();
  target.querySelector("details").open = true;
  if (focus) target.querySelector("summary").focus({ preventScroll: true });
}
$$("[data-open-tool]").forEach((link) =>
  link.addEventListener("click", () => revealTool(link.dataset.openTool, true)),
);
window.addEventListener("hashchange", () =>
  revealTool(decodeURIComponent(location.hash.slice(1))),
);
revealTool(decodeURIComponent(location.hash.slice(1)));

const completion = $$("[data-complete-exercise]");
if (completion.length) {
  const key = `ai-field-guide:${new URL(import.meta.url).pathname}:${document.documentElement.dataset.edition}:practice:v1`;
  let storageAvailable = true;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(stored))
      completion.forEach((input) => {
        input.checked = stored.includes(input.dataset.completeExercise);
      });
  } catch {
    storageAvailable = false;
  }
  function update() {
    const count = completion.filter((input) => input.checked).length;
    $("#practice-progress").value = count;
    $("#progress-status").textContent =
      `${t.runtime.completed}: ${count} / ${completion.length}`;
    $("#storage-note").textContent = storageAvailable
      ? t.storage
      : t.storageFailed;
    completion.forEach((input) => {
      input.closest("[data-exercise]").dataset.completed = String(
        input.checked,
      );
    });
  }
  function save() {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(
          completion
            .filter((input) => input.checked)
            .map((input) => input.dataset.completeExercise),
        ),
      );
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    update();
  }
  completion.forEach((input) => {
    input.closest("label").hidden = false;
    input.addEventListener("change", save);
  });
  $("#reset-progress").addEventListener("click", () => {
    completion.forEach((input) => {
      input.checked = false;
    });
    save();
  });
  $(".progress-panel").hidden = false;
  update();
}

if ($("#agent-demo")) {
  const parser = new DOMParser();
  const before = $("#agent-before code").textContent;
  const expected = $("#agent-after code").textContent;
  let current = before;
  const render = () => {
    $("#agent-preview").srcdoc =
      `<!doctype html><html lang="${document.documentElement.lang}"><head><meta charset="utf-8"><style>body{padding:20px;font:16px/1.6 system-ui;color:#302A40}h1{font-size:26px}button{padding:10px 20px;border:0;background:#81D0F4;color:#302A40}</style></head><body>${current}</body></html>`;
  };
  $(".demo-controls").hidden = false;
  $("#agent-preview").hidden = false;
  render();
  $("#agent-apply").addEventListener("click", () => {
    const doc = parser.parseFromString(before, "text/html");
    doc.querySelector("h1").textContent = t.agentAfter;
    current = doc.body.innerHTML;
    $("#agent-after code").textContent = current;
    $("#agent-validate").disabled = false;
    $("#agent-checks").replaceChildren();
    render();
  });
  $("#agent-validate").addEventListener("click", () => {
    const b = parser.parseFromString(before, "text/html");
    const a = parser.parseFromString(current, "text/html");
    const bodies = (doc) =>
      [...doc.querySelectorAll("p,button")]
        .map((node) => node.outerHTML)
        .join("");
    const checks = [
      a.querySelectorAll("h1").length === 1,
      a.querySelector("h1")?.textContent === t.agentAfter,
      bodies(a) === bodies(b),
    ];
    a.querySelector("h1")?.replaceChildren();
    b.querySelector("h1")?.replaceChildren();
    checks.push(a.body.isEqualNode(b.body));
    $("#agent-checks").replaceChildren(
      ...checks.map((passed, i) => {
        const li = document.createElement("li");
        li.dataset.passed = String(passed);
        li.textContent = `${passed ? "✓" : "✗"} ${t.agentChecks[i]}`;
        return li;
      }),
    );
  });
  $("#agent-reset").addEventListener("click", () => {
    current = before;
    $("#agent-after code").textContent = expected;
    $("#agent-validate").disabled = true;
    $("#agent-checks").replaceChildren();
    render();
  });
}

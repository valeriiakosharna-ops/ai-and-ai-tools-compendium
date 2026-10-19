// These three teaching models use explicit rules and hand-assigned coordinates.
// They never call a language model or claim to compute real embeddings.
export function contextBudget(documentUnits, answerUnits, summarize = false) {
  const historyUnits = summarize ? 1 : 2;
  const inputUnits = 1 + historyUnits + 1 + documentUnits;
  return {
    capacity: 10,
    historyUnits,
    inputUnits,
    answerUnits,
    total: inputUnits + answerUnits,
    overflow: Math.max(0, inputUnits + answerUnits - 10),
    remaining: Math.max(0, 10 - inputUnits - answerUnits),
  };
}

export function nearestDocuments(documents, query, count = 3) {
  return documents
    .map((doc) => ({
      ...doc,
      distance: Math.hypot(doc.x - query.x, doc.y - query.y) / 100,
    }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
    .slice(0, count);
}

const words = (text) =>
  (
    text
      .toLocaleLowerCase("uk")
      .normalize("NFKC")
      .match(/[\p{L}\p{N}]+/gu) || []
  ).filter((word) => word.length >= 4);
export function keywordDocuments(documents, query) {
  const terms = new Set(words(query));
  return documents.filter((doc) =>
    words(doc.title).some((word) => terms.has(word)),
  );
}

function ragAnswerUkrainian(questionId, selectedIds) {
  const selected = new Set(selectedIds);
  const citations = [];
  const paragraphs = [];
  if (questionId === "fee")
    return {
      paragraphs: [
        "У переданих джерелах ви не знайдете розміру внеску. Не визначайте суму за здогадкою — знайдіть додатковий документ.",
      ],
      citations,
      warning: "Ви не маєте достатніх даних для відповіді.",
    };
  if (selected.has("R1")) {
    paragraphs.push("Подайте роботу до 18:00 20 листопада 2026 року.");
    citations.push("R1");
  } else if (selected.has("R0")) {
    paragraphs.push(
      "За обраними архівними умовами ви маєте подати роботу до 18:00 18 листопада 2026 року.",
    );
    citations.push("R0");
  }
  if (questionId === "extension") {
    if (selected.has("R2")) {
      if (!selected.has("R1") && !selected.has("R0"))
        paragraphs.push(
          "Ви не передали джерела з основним терміном подання. Знайдіть його, щоб перевірити, коли потрібно запросити погодження.",
        );
      paragraphs.push(
        "Запросіть погодження до основного терміну. Після погодження подайте роботу до 18:00 23 листопада 2026 року. Не розраховуйте на автоматичне продовження.",
      );
      citations.push("R2");
    } else {
      paragraphs.push(
        "У переданих фрагментах ви не знайдете умов продовження. Знайдіть додаткове джерело, перш ніж вирішувати, чи можете подати роботу пізніше.",
      );
    }
  }
  if (!paragraphs.length)
    paragraphs.push(
      "Ви не передали джерела з відповіддю. Знайдіть потрібні фрагменти, перш ніж робити висновок.",
    );
  const warning = selected.has("R0")
    ? "Ви включили застаріле джерело. Навіть із посиланням ви можете отримати нечинне правило; звірте версії."
    : questionId === "extension" && !selected.has("R2")
      ? "Ви пропустили джерело з винятком. Не прирівнюйте основний термін до повної відповіді про продовження."
      : citations.length
        ? "Відкрийте джерела нижче й перевірте кожен висновок."
        : "Ви не маєте достатніх даних для відповіді.";
  return { paragraphs, citations, warning };
}

const english = {
  "У переданих джерелах ви не знайдете розміру внеску. Не визначайте суму за здогадкою — знайдіть додатковий документ.":
    "The selected sources do not state the fee. Do not guess an amount; find another document.",
  "Ви не маєте достатніх даних для відповіді.":
    "There is not enough information to answer.",
  "Подайте роботу до 18:00 20 листопада 2026 року.":
    "Submit your work by 18:00 on 20 November 2026.",
  "За обраними архівними умовами ви маєте подати роботу до 18:00 18 листопада 2026 року.":
    "According to the selected archived rules, submit by 18:00 on 18 November 2026.",
  "Ви не передали джерела з основним терміном подання. Знайдіть його, щоб перевірити, коли потрібно запросити погодження.":
    "No source states the main deadline. Find it to check when approval must be requested.",
  "Запросіть погодження до основного терміну. Після погодження подайте роботу до 18:00 23 листопада 2026 року. Не розраховуйте на автоматичне продовження.":
    "Request approval before the main deadline. Once approved, submit by 18:00 on 23 November 2026. An extension is not automatic.",
  "У переданих фрагментах ви не знайдете умов продовження. Знайдіть додаткове джерело, перш ніж вирішувати, чи можете подати роботу пізніше.":
    "The selected passages do not explain extensions. Find another source before deciding whether you can submit later.",
  "Ви не передали джерела з відповіддю. Знайдіть потрібні фрагменти, перш ніж робити висновок.":
    "No selected source contains the answer. Find the relevant passages before drawing a conclusion.",
  "Ви включили застаріле джерело. Навіть із посиланням ви можете отримати нечинне правило; звірте версії.":
    "You included an outdated source. Even a cited rule may be obsolete; compare versions.",
  "Ви пропустили джерело з винятком. Не прирівнюйте основний термін до повної відповіді про продовження.":
    "The exception source is missing. The main deadline is not a complete answer about extensions.",
  "Відкрийте джерела нижче й перевірте кожен висновок.":
    "Open the sources below and verify each conclusion.",
};
export function ragAnswer(questionId, selectedIds, lang = "uk") {
  const answer = ragAnswerUkrainian(questionId, selectedIds);
  if (lang !== "en") return answer;
  const translate = (text) => {
    if (!english[text]) throw new Error("Missing English RAG translation");
    return english[text];
  };
  return {
    ...answer,
    paragraphs: answer.paragraphs.map(translate),
    warning: translate(answer.warning),
  };
}

# AI Field Guide · Довідник інструментів ШІ

**[Українська версія](https://valeriiakosharna-ops.github.io/ai-and-ai-tools-compendium/uk/)** · **[English version](https://valeriiakosharna-ops.github.io/ai-and-ai-tools-compendium/en/)**

Практичний мінісайт про інструменти ШІ: каталог інструментів, вправи зокрема з GitHub Copilot, інтерактивні тренажери та візуальні промпти з референсами, результатами й порівнянням тексту та JSON.

## Локальний запуск

Node.js 22+ та npm. Бекенд і API-ключі для роботи сайту не потрібні.

```sh
npm ci
npm start
```

```sh
npm run check          # Збірка й перевірки
npm run test:browser   # Перевірки в Chromium
```

## Оновлення сайту

Кожен push запускає GitHub Actions. Після змін у `main` сайт автоматично збирається, перевіряється й публікується в GitHub Pages. Це стосується також зображень і текстів. Для Pages обрано джерело **GitHub Actions**.

## Матеріали та окремі версії

- `content/uk/`, `content/en/` — навчальні матеріали; `content/ui.js` — переклади інтерфейсу.
- `content/prompts/` — повні англомовні промпти.
- `content/images.json` — відповідність прикладів доданим зображенням у `src/assets/`.
- `editions.json` — склад кастомних версій: розділи, інструменти, вправи та приклади.

```sh
npm run build:uk
npm run build:en
npm run build:edition -- --edition starter
```

[Детальні інструкції: зображення, кастомні збірки й публікація](docs/DEVELOPMENT.md) · [Джерело матеріалів](SOURCE.md)

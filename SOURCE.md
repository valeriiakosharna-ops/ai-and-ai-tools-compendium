# Source and adaptation

The core learning material was adapted from the repository supplied by the project owner:

- https://github.com/valeriiakosharna-ops/ai-tools-for-everyday-routine
- Inspected source commit: `7ef918ecdd086f6f1c4e0569c449a423a61e920f`

Preserved: four approaches to AI, the six original tool profiles and official links, the five practical exercises and training documents, and the token/context/vector/RAG teaching models. Added: GitHub Copilot, a complete English localisation, a shared edition system, two new image examples, and a hands-on GitHub Copilot exercise.

The former Karazin image gallery, its image assets, and organisation-specific branding were replaced with the owner-provided branding and reference/result images for Mercedes/Monaco and Oxford.

The four English image prompts were supplied by the user. They are stored in `content/prompts/` with chat timestamps removed and line endings normalised to LF. Their wording, JSON values, and formatting were otherwise preserved. No real generation or model-quality experiment was performed. Token metrics use the pinned `gpt-tokenizer` package and its `cl100k_base` encoding. The tokenizer license is copied into the built site.

Sources, pinned revisions, and retained licences for tool logos are documented in [docs/LOGOS.md](docs/LOGOS.md).

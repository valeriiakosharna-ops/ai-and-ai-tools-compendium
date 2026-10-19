# Tool marks and sources

Tool cards use recognisable product marks instead of placeholder letters or generic symbols. Shapes and original colours are preserved; the surrounding white frames, dimensions, and spacing provide a consistent presentation. The same local assets are used on the home page, in the comparison and recommendations, and beside practice links. The site does not fetch logos at runtime.

| Product                       | Local asset                           | Source                                                    |
| ----------------------------- | ------------------------------------- | --------------------------------------------------------- |
| ChatGPT                       | `src/assets/tools/chatgpt.svg`        | Lobe Icons `openai.svg` (OpenAI/ChatGPT knot)             |
| Gemini                        | `src/assets/tools/gemini.svg`         | Lobe Icons `gemini-color.svg`                             |
| Claude                        | `src/assets/tools/claude.svg`         | Lobe Icons `claude-color.svg`                             |
| Claude Code                   | `src/assets/tools/claude-code.svg`    | Lobe Icons `claudecode-color.svg` (Clawd mark)            |
| Codex                         | `src/assets/tools/codex.svg`          | Lobe Icons `codex.svg`                                    |
| NotebookLM                    | `src/assets/tools/notebooklm.svg`     | Lobe Icons `notebooklm.svg`                               |
| GitHub Copilot                | `src/assets/tools/github-copilot.svg` | GitHub's Primer Octicons `copilot-24.svg`                 |
| VS Code (practice setup link) | `src/assets/tools/vscode.png`         | Microsoft's VS Code repository `resources/linux/code.png` |

The six Lobe Icons SVG files are community-maintained vector representations of the corresponding brand marks, rather than files published directly by each brand. They are vendored without editing paths, colours, or proportions. Direct brand-site downloads were unavailable under this environment's network policy; the product-reference URLs are recorded in the upstream icon documentation.

Pinned source revisions:

- [Lobe Icons](https://github.com/lobehub/lobe-icons/tree/8a1b2821bb768c484fe8da20c5e1838b6bf551a9/packages/static-svg/icons): `8a1b2821bb768c484fe8da20c5e1838b6bf551a9`.
- [GitHub Primer Octicons](https://github.com/primer/octicons/blob/6dbe38e4e9b4987b2c9332d719c57fbbdd083e2d/icons/copilot-24.svg): `6dbe38e4e9b4987b2c9332d719c57fbbdd083e2d`.
- [Microsoft VS Code](https://github.com/microsoft/vscode/blob/d1eaacc5a33577b2d5b533f5770962ad592ea705/resources/linux/code.png): `d1eaacc5a33577b2d5b533f5770962ad592ea705`.

MIT notices are retained in `src/assets/tools/LICENSE-*.txt` and copied into the built site. Product names and logos remain marks of their respective owners; icon-source licences do not transfer trademark rights or imply endorsement.

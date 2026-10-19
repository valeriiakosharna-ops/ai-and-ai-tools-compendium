# Image slots

Add real WebP files at these paths, then rebuild the site:

| Example | File | Role |
| --- | --- | --- |
| Mercedes | `mercedes/reference-1.webp` | Driver reference |
| Mercedes | `mercedes/reference-2.webp` | Race-car reference |
| Mercedes | `mercedes/result.webp` | Final generated image |
| Oxford | `oxford/reference-1.webp` | Lecture-hall reference |
| Oxford | `oxford/result.webp` | Final generated image |

The site displays an explicit empty slot until a file exists. Both languages and all editions reuse the same assets. Use images you can publish. Recommended: 1600 px wide; retain useful source framing. Results are displayed without cropping. To use other extensions or change reference roles, update `src/_data/views.js` and `content/ui.js`.

The final image is illustrative. The supplied material does not specify which prompt produced it. Record model, date, settings, prompt version, and seed (if supported) alongside your images before making quality comparisons.

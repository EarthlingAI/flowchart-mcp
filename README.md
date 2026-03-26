# flowchart-mcp

Mermaid diagram rendering MCP server. Renders any Mermaid diagram type to PNG or SVG locally via headless Chromium.

## Setup

```bash
npm install                # installs deps + downloads Chromium (~200MB)
npm run build              # tsc → dist/
node dist/index.js         # start via stdio
```

## Tool: `generate_diagram`

Render Mermaid syntax to an image. PNG (default): saved to disk at configurable resolution (scale 1-4) with preview returned inline. SVG: returned as editable text.

| Parameter | Type   | Default    | Description                                                                                                                                                               |
| --------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mermaid` | string | (required) | Mermaid diagram syntax                                                                                                                                                    |
| `style`   | enum   | `"casual"` | Visual style. Built-in Mermaid themes: `default`, `forest`, `dark`, `neutral`. Named presets: `casual`, `corporate`, `blueprint`, `pastel`, `monochrome`, `high-contrast` |
| `scale`   | number | `2`        | PNG resolution multiplier (1-4). Higher = sharper but larger file. At scale > 1, full-res saved to disk, preview thumbnail returned inline. Ignored for SVG               |
| `output`  | enum   | `"png"`    | `png`: saved to disk + returned inline. `svg`: editable SVG text                                                                                                          |

### Annotations

| Hint              | Value   | Reason                                     |
| ----------------- | ------- | ------------------------------------------ |
| `readOnlyHint`    | `false` | Saves PNG files to disk                    |
| `destructiveHint` | `false` | Creates new files, never modifies existing |
| `idempotentHint`  | `true`  | Same input produces same output            |
| `openWorldHint`   | `false` | Renders locally, no external network calls |

## Styles

The `style` parameter accepts built-in Mermaid themes or named presets with pre-vetted contrast ratios.

**Built-in themes:**

| Style     | Description                           |
| --------- | ------------------------------------- |
| `default` | Balanced colors, good for general use |
| `forest`  | Green tones                           |
| `dark`    | Dark background, light text           |
| `neutral` | Grayscale, good for printing          |

**Named presets** (use `base` theme with curated themeVariables):

| Style           | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `casual`        | EarthlingAI brand — blue primary, light secondary          |
| `corporate`     | Professional business docs — navy/grey tones               |
| `blueprint`     | Technical drawing — dark background, cyan/white lines      |
| `pastel`        | Soft, approachable — lavender, pink, light grey            |
| `monochrome`    | Greyscale for print/embedding                              |
| `high-contrast` | Accessibility-focused — black/white/yellow, strong borders |

## Environment Variables

| Variable     | Default    | Description                                              |
| ------------ | ---------- | -------------------------------------------------------- |
| `OUTPUT_DIR` | `outputs/` | Directory for saved PNG files (resolved relative to cwd) |

## License

MIT — EarthlingAI

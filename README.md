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

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mermaid` | string | (required) | Mermaid diagram syntax |
| `theme` | enum | `"default"` | `default`, `base`, `forest`, `dark`, `neutral`. Ignored when `preset` or `theme_variables` is provided |
| `preset` | enum | (optional) | Named color preset. Forces theme to `base`. See Presets table below |
| `theme_variables` | object | (optional) | Mermaid themeVariables overrides (hex colors). Merges on top of preset. Forces theme to `base` |
| `background_color` | string | `"white"` | CSS background color. `"transparent"` for no background |
| `scale` | number | `2` | PNG resolution multiplier (1-4). Higher = sharper but larger file. At scale > 1, full-res saved to disk, preview thumbnail returned inline. Ignored for SVG |
| `output` | enum | `"png"` | `png`: saved to disk + returned inline. `svg`: editable SVG text |

### Annotations

| Hint | Value | Reason |
|------|-------|--------|
| `readOnlyHint` | `false` | Saves PNG files to disk |
| `destructiveHint` | `false` | Creates new files, never modifies existing |
| `idempotentHint` | `true` | Same input produces same output |
| `openWorldHint` | `false` | Renders locally, no external network calls |

## Themes

All five Mermaid themes are supported via the `theme` parameter:

- **default** — balanced colors, good for general use
- **base** — minimal, customizable via themeVariables
- **forest** — green tones
- **dark** — dark background, light text
- **neutral** — grayscale, good for printing

## Presets

Named color presets that auto-set `theme: "base"` with curated themeVariables:

| Preset | Description |
|--------|-------------|
| `earthling` | EarthlingAI brand — blue primary, light secondary |
| `corporate` | Professional business docs — navy/grey tones |
| `blueprint` | Technical drawing — dark background, cyan/white lines |
| `pastel` | Soft, approachable — lavender, pink, light grey |
| `monochrome` | Greyscale for print/embedding |
| `high-contrast` | Accessibility-focused — black/white/yellow, strong borders |

## Custom Theme Variables

Pass `theme_variables` with hex color values. Merges on top of any preset. Only works with the `base` theme (auto-forced when `theme_variables` is provided).

**Most useful keys:** `primaryColor`, `primaryTextColor`, `primaryBorderColor`, `secondaryColor`, `tertiaryColor`, `lineColor`, `textColor`, `mainBkg`, `nodeBorder`, `fontFamily`, `fontSize`, `noteBkgColor`, `noteTextColor`, `clusterBkg`, `clusterBorder`, `edgeLabelBackground`

**Precedence:** `theme_variables` keys override matching `preset` keys. If only `theme_variables` (no preset), starts from the bare `base` theme.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OUTPUT_DIR` | `outputs/` | Directory for saved PNG files (resolved relative to cwd) |

## License

MIT — EarthlingAI

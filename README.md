# flowchart-mcp

Mermaid diagram rendering MCP server. Renders any Mermaid diagram type to PNG or SVG locally via headless Chromium.

## Setup

```bash
npm install                # installs deps + downloads Chromium (~200MB)
npm run build              # tsc → dist/
node dist/index.js         # start via stdio
```

## Tool: `generate_diagram`

Render Mermaid syntax to an image. PNG (default): saved to disk and returned inline. SVG: returned as editable text.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mermaid` | string | (required) | Mermaid diagram syntax |
| `theme` | enum | `"default"` | `default`, `base`, `forest`, `dark`, `neutral` |
| `background_color` | string | `"white"` | CSS background color. `"transparent"` for no background |
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
- **base** — minimal, customizable base theme
- **forest** — green tones
- **dark** — dark background, light text
- **neutral** — grayscale, good for printing

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OUTPUT_DIR` | `outputs/` | Directory for saved PNG files (resolved relative to cwd) |

## License

MIT — EarthlingAI

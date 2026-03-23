# CLAUDE.md (flowchart-mcp)

Mermaid diagram rendering MCP server. See `README.md` for tool parameters and output format.

## Build & Run

```bash
npm install              # also runs postinstall → downloads Chromium (~200MB)
npm run build            # tsc → dist/
npm run dev              # tsx watch (development)
node dist/index.js       # stdio transport — stdout is MCP protocol, use console.error for logging
npm test                 # run tests (requires Chromium installed)
```

## Design Principles

### Agent-First Tool Design

This server is consumed by AI agents, not humans. Every design decision flows from that:

- **Self-explanatory schemas.** Zod `.describe()` strings are the primary documentation agents see. They must be concise, accurate, and sufficient to use the tool without external instructions.
- **Save and return inline.** PNG output always saves to disk (file path for follow-up operations) AND returns the image inline (visual confirmation). Agents don't choose between file and base64 — they get both.
- **Errors that guide recovery.** Error messages tell the agent what went wrong and what to check (e.g., "Check Mermaid syntax is valid").
- **Proper annotations.** All four tool annotations are explicit — `readOnlyHint: false` (saves files), `destructiveHint: false` (creates, doesn't modify), `idempotentHint: true` (same input → same output), `openWorldHint: false` (renders locally).

### Architecture

```
src/
├── index.ts          # Tool registration + dispatch (thin)
└── render.ts         # mermaid-isomorphic wrapper + file save
```

- **`index.ts` is a thin dispatcher.** Tool schema (Zod), parameter handling, preset resolution, routing to `render.ts`. No rendering logic. Presets live here (fat-files convention — single consumer).
- **`render.ts` owns all rendering concerns.** Mermaid renderer lifecycle (lazy singleton), PNG/SVG generation, themeVariables pass-through, background color application, file saving, filename sanitization. Has no knowledge of presets — receives already-resolved `themeVariables`.

### Conventions

- **Tabs** for indentation
- **No `dotenv`** — the parent system passes env vars via `.mcp.json` `env` field
- **`console.error` for all logging** — stdout is the MCP protocol stream
- **`registerTool`** — uses the modern API, not the deprecated `tool()` method
- **`isError: true`** on all failure responses

## Adding a New Output Format

1. Add the format to the `output` Zod enum in `index.ts`
2. Add rendering/conversion logic in `render.ts`
3. Add a response branch in the tool callback in `index.ts`
4. Follow the pattern: save to disk (if binary) + return inline

## Response Format

**PNG:**
```
content: [
  { type: "text", text: "Diagram saved to: <absolute_path>" },
  { type: "image", data: "<base64>", mimeType: "image/png" }
]
```

**SVG:**
```
content: [
  { type: "text", text: "<svg>...</svg>" }
]
```

**Error:**
```
content: [{ type: "text", text: "Error rendering diagram: <message>. Check Mermaid syntax is valid." }]
isError: true
```

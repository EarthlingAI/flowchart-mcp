import {
  createMermaidRenderer,
  type MermaidRenderer,
} from "mermaid-isomorphic";
import { chromium, type Browser } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface RenderOptions {
  theme?: "default" | "base" | "forest" | "dark" | "neutral";
  backgroundColor?: string;
  themeVariables?: Record<string, string>;
  scale?: number;
}

export interface RenderResult {
  svg: string;
  png: Buffer;
  width: number;
  height: number;
}

// --- Mermaid renderer (SVG generation only) ---

let renderer: MermaidRenderer | null = null;

function getRenderer(): MermaidRenderer {
  if (!renderer) {
    renderer = createMermaidRenderer();
  }
  return renderer;
}

// --- Playwright browser (PNG screenshots) ---

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch();
  }
  return browser;
}

process.on("exit", () => {
  browser?.close();
});

async function screenshotSvg(
  svg: string,
  scale: number,
  backgroundColor?: string,
): Promise<{ png: Buffer; width: number; height: number }> {
  const b = await getBrowser();
  const context = await b.newContext({
    deviceScaleFactor: scale,
    bypassCSP: true,
  });
  try {
    const page = await context.newPage();
    const bg =
      backgroundColor && backgroundColor !== "transparent"
        ? backgroundColor
        : "transparent";
    const html = `<!DOCTYPE html>
<html><head><style>
body { margin: 0; padding: 0; background: ${bg}; display: inline-block; }
svg { display: block; min-width: 1280px; height: auto; }
</style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle" });
    const svgElement = page.locator("svg");
    const png = await svgElement.screenshot({
      omitBackground: bg === "transparent",
    });
    const box = await svgElement.boundingBox();
    const width = Math.round((box?.width ?? 0) * scale);
    const height = Math.round((box?.height ?? 0) * scale);
    return { png: Buffer.from(png), width, height };
  } finally {
    await context.close();
  }
}

// --- Public API ---

export async function renderDiagram(
  mermaid: string,
  options?: RenderOptions,
): Promise<RenderResult> {
  const render = getRenderer();
  const theme = options?.theme ?? "default";
  const scale = options?.scale ?? 3;

  // Step 1: Get SVG from mermaid-isomorphic (no screenshot)
  const results = await render([mermaid], {
    screenshot: false,
    mermaidConfig: {
      theme,
      themeVariables: options?.themeVariables,
    },
  });

  const result = results[0];
  if (!result || result.status === "rejected") {
    const reason = result?.reason;
    throw new Error(
      reason instanceof Error
        ? reason.message
        : String(reason ?? "Unknown render error"),
    );
  }

  const { svg } = result.value;

  // Step 2: Screenshot at target scale via our Playwright pipeline
  const { png, width, height } = await screenshotSvg(
    svg,
    scale,
    options?.backgroundColor,
  );

  return { svg, png, width, height };
}

// --- File saving ---

const OUTPUT_DIR = path.resolve(
  process.env["OUTPUT_DIR"] ?? "outputs/diagrams",
);

export async function saveDiagram(png: Buffer, hint?: string): Promise<string> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const timestamp = Date.now();
  const safeName = sanitizeFilename(hint);
  const filename = safeName
    ? `${timestamp}-${safeName}.png`
    : `${timestamp}.png`;
  const filePath = path.join(OUTPUT_DIR, filename);
  await writeFile(filePath, png);
  return filePath;
}

export function sanitizeFilename(hint?: string): string {
  if (!hint) return "";
  return hint
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

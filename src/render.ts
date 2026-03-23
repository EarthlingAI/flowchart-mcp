import { createMermaidRenderer, type MermaidRenderer } from "mermaid-isomorphic";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export interface RenderOptions {
	theme?: "default" | "base" | "forest" | "dark" | "neutral";
	backgroundColor?: string;
}

export interface RenderResult {
	png: Buffer;
	svg: string;
}

let renderer: MermaidRenderer | null = null;

function getRenderer(): MermaidRenderer {
	if (!renderer) {
		renderer = createMermaidRenderer();
	}
	return renderer;
}

export async function renderDiagram(mermaid: string, options?: RenderOptions): Promise<RenderResult> {
	const render = getRenderer();
	const theme = options?.theme ?? "default";
	const results = await render([mermaid], {
		screenshot: true,
		mermaidConfig: {
			theme,
		},
	});

	const result = results[0];
	if (!result || result.status === "rejected") {
		const reason = result?.reason;
		throw new Error(reason instanceof Error ? reason.message : String(reason ?? "Unknown render error"));
	}

	const { svg, screenshot } = result.value;
	if (!screenshot) {
		throw new Error("Screenshot generation failed — Playwright may not be installed. Run: npx playwright install --with-deps chromium");
	}

	// Apply background color if specified (screenshots are transparent by default)
	let png = screenshot;
	if (options?.backgroundColor && options.backgroundColor !== "transparent") {
		png = await applyBackground(screenshot, svg, options.backgroundColor, render, mermaid, options.theme ?? "default");
	}

	return { png, svg };
}

async function applyBackground(
	_originalPng: Buffer,
	_svg: string,
	backgroundColor: string,
	render: MermaidRenderer,
	mermaid: string,
	theme: RenderOptions["theme"],
): Promise<Buffer> {
	// Re-render with background CSS injected via containerStyle
	const results = await render([mermaid], {
		screenshot: true,
		mermaidConfig: { theme: theme ?? "default" },
		containerStyle: {
			backgroundColor,
			maxHeight: "",
			opacity: "",
			overflow: "",
		},
	});

	const result = results[0];
	if (result?.status === "fulfilled" && result.value.screenshot) {
		return result.value.screenshot;
	}
	// Fallback to original transparent PNG
	return _originalPng;
}

const OUTPUT_DIR = path.resolve(process.env["OUTPUT_DIR"] ?? "outputs");

export async function saveDiagram(png: Buffer, hint?: string): Promise<string> {
	await mkdir(OUTPUT_DIR, { recursive: true });
	const timestamp = Date.now();
	const safeName = sanitizeFilename(hint);
	const filename = safeName ? `${timestamp}-${safeName}.png` : `${timestamp}.png`;
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

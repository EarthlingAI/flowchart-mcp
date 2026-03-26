#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderDiagram, saveDiagram, type RenderOptions } from "./render.js";

const server = new McpServer(
	{ name: "flowchart-mcp", version: "1.0.0" },
	{ instructions: "Render Mermaid diagrams to PNG or SVG. Supports all Mermaid diagram types: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, pie charts, mind maps, and more." },
);

const ThemeEnum = z.enum(["default", "base", "forest", "dark", "neutral"]);
type Theme = z.infer<typeof ThemeEnum>;

// --- Presets ---

const PRESETS: Record<string, Record<string, string>> = {
	earthling: {
		primaryColor: "#1a73e8",
		primaryTextColor: "#ffffff",
		primaryBorderColor: "#1557b0",
		secondaryColor: "#e8f0fe",
		secondaryTextColor: "#202124",
		secondaryBorderColor: "#c6dafc",
		tertiaryColor: "#f1f3f4",
		tertiaryTextColor: "#202124",
		tertiaryBorderColor: "#dadce0",
		lineColor: "#5f6368",
		textColor: "#202124",
		nodeBorder: "#1557b0",
		noteTextColor: "#202124",
		noteBkgColor: "#e8f0fe",
		noteBorderColor: "#c6dafc",
	},
	corporate: {
		primaryColor: "#003366",
		primaryTextColor: "#ffffff",
		primaryBorderColor: "#002244",
		secondaryColor: "#e6eef5",
		secondaryTextColor: "#1a1a2e",
		secondaryBorderColor: "#b0c4d8",
		tertiaryColor: "#f5f7fa",
		tertiaryTextColor: "#1a1a2e",
		tertiaryBorderColor: "#d1d9e0",
		lineColor: "#4a6785",
		textColor: "#1a1a2e",
		nodeBorder: "#002244",
		noteTextColor: "#1a1a2e",
		noteBkgColor: "#e6eef5",
		noteBorderColor: "#b0c4d8",
	},
	blueprint: {
		primaryColor: "#1565c0",
		primaryTextColor: "#e1f5fe",
		primaryBorderColor: "#4fc3f7",
		secondaryColor: "#0d47a1",
		secondaryTextColor: "#e1f5fe",
		secondaryBorderColor: "#42a5f5",
		tertiaryColor: "#1a237e",
		tertiaryTextColor: "#bbdefb",
		tertiaryBorderColor: "#5c6bc0",
		lineColor: "#81d4fa",
		textColor: "#e1f5fe",
		nodeBorder: "#4fc3f7",
		noteTextColor: "#e1f5fe",
		noteBkgColor: "#0d47a1",
		noteBorderColor: "#42a5f5",
	},
	pastel: {
		primaryColor: "#b39ddb",
		primaryTextColor: "#37474f",
		primaryBorderColor: "#9575cd",
		secondaryColor: "#f8bbd0",
		secondaryTextColor: "#37474f",
		secondaryBorderColor: "#f48fb1",
		tertiaryColor: "#c8e6c9",
		tertiaryTextColor: "#37474f",
		tertiaryBorderColor: "#a5d6a7",
		lineColor: "#90a4ae",
		textColor: "#37474f",
		nodeBorder: "#9575cd",
		noteTextColor: "#37474f",
		noteBkgColor: "#fff9c4",
		noteBorderColor: "#fff176",
	},
	monochrome: {
		primaryColor: "#616161",
		primaryTextColor: "#ffffff",
		primaryBorderColor: "#424242",
		secondaryColor: "#e0e0e0",
		secondaryTextColor: "#212121",
		secondaryBorderColor: "#bdbdbd",
		tertiaryColor: "#f5f5f5",
		tertiaryTextColor: "#212121",
		tertiaryBorderColor: "#e0e0e0",
		lineColor: "#757575",
		textColor: "#212121",
		nodeBorder: "#424242",
		noteTextColor: "#212121",
		noteBkgColor: "#eeeeee",
		noteBorderColor: "#bdbdbd",
	},
	"high-contrast": {
		primaryColor: "#000000",
		primaryTextColor: "#ffffff",
		primaryBorderColor: "#000000",
		secondaryColor: "#ffff00",
		secondaryTextColor: "#000000",
		secondaryBorderColor: "#000000",
		tertiaryColor: "#ffffff",
		tertiaryTextColor: "#000000",
		tertiaryBorderColor: "#000000",
		lineColor: "#000000",
		textColor: "#000000",
		nodeBorder: "#000000",
		noteTextColor: "#000000",
		noteBkgColor: "#ffff00",
		noteBorderColor: "#000000",
	},
};

const PresetEnum = z.enum(["earthling", "corporate", "blueprint", "pastel", "monochrome", "high-contrast"]);

server.registerTool(
	"generate_diagram",
	{
		description: "Render Mermaid syntax to an image. PNG (default): saved to disk at configurable resolution (scale 1-4) with preview returned inline. SVG: returned as editable text.",
		inputSchema: {
			mermaid: z.string().min(1).describe("Mermaid diagram syntax"),
			theme: ThemeEnum.default("default").describe("Mermaid theme. Ignored when preset or theme_variables is provided (forced to 'base')"),
			preset: PresetEnum.optional()
				.describe("Named color preset. Forces theme to 'base'. Available: earthling, corporate, blueprint, pastel, monochrome, high-contrast"),
			theme_variables: z.record(z.string(), z.string()).optional()
				.describe("Mermaid themeVariables overrides (hex colors). Merges on top of preset. Forces theme to 'base'. Common keys: primaryColor, primaryTextColor, primaryBorderColor, secondaryColor, lineColor, textColor, fontFamily, mainBkg, nodeBorder"),
			background_color: z.string().default("white")
				.describe("CSS background color for PNG output. Use 'transparent' for no background"),
			scale: z.number().min(1).max(4).default(2)
				.describe("PNG resolution multiplier (1-4). Higher = sharper but larger file. At scale > 1, full-res is saved to disk and a preview thumbnail is returned inline. Ignored for SVG output"),
			output: z.enum(["png", "svg"]).default("png")
				.describe("png: image saved to disk + returned inline. svg: returns editable SVG text"),
		},
		annotations: {
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		},
	},
	async (params) => {
		const mermaidSyntax = params.mermaid.trim();
		if (!mermaidSyntax) {
			return {
				content: [{ type: "text" as const, text: "Mermaid syntax is empty. Provide a valid diagram definition." }],
				isError: true,
			};
		}

		try {
			const hasCustomization = params.preset || (params.theme_variables && Object.keys(params.theme_variables).length > 0);
			const resolvedTheme: Theme = hasCustomization ? "base" : params.theme as Theme;

			let themeVariables: Record<string, string> | undefined;
			if (hasCustomization) {
				const presetVars = params.preset ? PRESETS[params.preset] : {};
				themeVariables = { ...presetVars, ...params.theme_variables };
			}

			const renderOpts: RenderOptions = {
				theme: resolvedTheme,
				backgroundColor: params.background_color,
				themeVariables,
				scale: params.scale,
			};
			const result = await renderDiagram(mermaidSyntax, renderOpts);

			if (params.output === "svg") {
				return {
					content: [{ type: "text" as const, text: result.svg }],
				};
			}

			// PNG: save full-res to disk, return thumbnail inline when scale > 1
			const filePath = await saveDiagram(result.png, mermaidSyntax.slice(0, 80));
			const sizeKB = (result.png.length / 1024).toFixed(0);
			const dims = `${result.width}x${result.height}`;
			const inlinePng = result.thumbnail ?? result.png;

			return {
				content: [
					{ type: "text" as const, text: `Diagram saved to: ${filePath} (${dims}, ${sizeKB}KB)` },
					{ type: "image" as const, data: inlinePng.toString("base64"), mimeType: "image/png" },
				],
			};
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			return {
				content: [{ type: "text" as const, text: `Error rendering diagram: ${msg}. Check Mermaid syntax is valid.` }],
				isError: true,
			};
		}
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("flowchart-mcp running via stdio");
}

main().catch((err) => {
	console.error("Fatal:", err);
	process.exit(1);
});

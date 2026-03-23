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

server.registerTool(
	"generate_diagram",
	{
		description: "Render Mermaid syntax to an image. PNG (default): saved to disk and returned inline. SVG: returned as editable text.",
		inputSchema: {
			mermaid: z.string().min(1).describe("Mermaid diagram syntax"),
			theme: ThemeEnum.default("default").describe("Mermaid theme"),
			background_color: z.string().default("white")
				.describe("CSS background color for PNG output. Use 'transparent' for no background"),
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
			const renderOpts: RenderOptions = {
				theme: params.theme as Theme,
				backgroundColor: params.background_color,
			};
			const result = await renderDiagram(mermaidSyntax, renderOpts);

			if (params.output === "svg") {
				return {
					content: [{ type: "text" as const, text: result.svg }],
				};
			}

			// PNG: save to disk + return inline
			const filePath = await saveDiagram(result.png, mermaidSyntax.slice(0, 80));
			return {
				content: [
					{ type: "text" as const, text: `Diagram saved to: ${filePath}` },
					{ type: "image" as const, data: result.png.toString("base64"), mimeType: "image/png" },
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

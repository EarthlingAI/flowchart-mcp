#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderDiagram, saveDiagram, type RenderOptions } from "./render.js";

const server = new McpServer(
  { name: "flowchart-mcp", version: "1.0.0" },
  {
    instructions:
      "Render Mermaid diagrams to PNG or SVG. Supports all Mermaid diagram types: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, pie charts, mind maps, and more.",
  },
);

// --- Presets ---

const PRESETS: Record<string, Record<string, string>> = {
  // indigo rectangles / teal rounded / rose diamonds — EarthlingAI brand palette
  primary: {
    primaryColor: "#bac8ff", // indigo-200 — rectangles
    primaryTextColor: "#1e1b4b", // indigo-950 — dark; pairs with light node fills + light edge label bg
    primaryBorderColor: "#4263eb", // indigo-600
    secondaryColor: "#ccfbf1", // teal-100 — rounded nodes
    secondaryTextColor: "#134e4a", // teal-950
    secondaryBorderColor: "#0d9488",
    tertiaryColor: "#ffe4e6", // rose-100 — diamonds
    tertiaryTextColor: "#881337", // rose-900
    tertiaryBorderColor: "#d5477e",
    lineColor: "#868e96",
    textColor: "#1e293b",
    nodeBorder: "#4263eb",
    edgeLabelBackground: "#eef2ff", // indigo-50 — light; dark primaryTextColor readable on it
    noteBkgColor: "#e0e7ff", // indigo-100
    noteTextColor: "#1e1b4b",
    noteBorderColor: "#4263eb",
  },
  // strong blue rectangles / sky-blue rounded / light-grey diamonds — Atlassian/Tailwind corporate
  professional: {
    primaryColor: "#1d4ed8", // blue-700 — rectangles (strong, authoritative)
    primaryTextColor: "#ffffff", // white; pairs with dark node fill + dark edge label bg
    primaryBorderColor: "#1e3a8a", // blue-900
    secondaryColor: "#e0f2fe", // sky-100 — rounded nodes (light, airy)
    secondaryTextColor: "#0c4a6e", // sky-950
    secondaryBorderColor: "#0284c7",
    tertiaryColor: "#f1f5f9", // slate-100 — diamonds (neutral, decision)
    tertiaryTextColor: "#0f172a", // slate-950
    tertiaryBorderColor: "#334155",
    lineColor: "#64748b", // slate-500
    textColor: "#0f172a",
    nodeBorder: "#1e3a8a",
    edgeLabelBackground: "#1d4ed8", // blue-700 — dark; white primaryTextColor readable on it
    noteBkgColor: "#e0f2fe",
    noteTextColor: "#0c4a6e",
    noteBorderColor: "#0284c7",
  },
  // dark navy rectangles / deeper navy rounded / bright-blue diamonds — architectural blueprint
  blueprint: {
    primaryColor: "#1e3a5f", // dark navy — rectangles
    primaryTextColor: "#ced8f7", // blueprint cream — pairs with dark node fills + dark edge label bg
    primaryBorderColor: "#4a6de5", // blueprint luminous blue
    secondaryColor: "#0d253f", // deeper navy — rounded nodes
    secondaryTextColor: "#88c0d0", // nord cyan
    secondaryBorderColor: "#7da7e2",
    tertiaryColor: "#3057e1", // bright blueprint blue — diamonds (high visibility)
    tertiaryTextColor: "#ffffff",
    tertiaryBorderColor: "#ced8f7",
    lineColor: "#ced8f7", // blueprint cream lines
    textColor: "#1e3a5f",
    nodeBorder: "#4a6de5",
    edgeLabelBackground: "#1e3a5f", // dark navy; cream primaryTextColor readable on it
    noteBkgColor: "#0d253f",
    noteTextColor: "#ced8f7",
    noteBorderColor: "#4a6de5",
  },
  // alice-blue rectangles / mint rounded / blush diamonds — Venngage pastel triad
  pastel: {
    primaryColor: "#dbe4fc", // alice blue — rectangles
    primaryTextColor: "#334155", // slate-700 dark — pairs with all light node fills + light edge label bg
    primaryBorderColor: "#7da7e2",
    secondaryColor: "#b8e0d2", // honeydew mint — rounded nodes
    secondaryTextColor: "#134e4a", // deep teal
    secondaryBorderColor: "#2dd4bf",
    tertiaryColor: "#eac4d5", // cameo pink — diamonds
    tertiaryTextColor: "#831843", // rose-900
    tertiaryBorderColor: "#ea9ab2",
    lineColor: "#94a3b8", // slate-400 (soft connector)
    textColor: "#334155",
    nodeBorder: "#7da7e2",
    edgeLabelBackground: "#fcf5c7", // lemon chiffon — contrasts with dark slate text
    noteBkgColor: "#e8dff5", // lavender
    noteTextColor: "#334155",
    noteBorderColor: "#c4b5fd",
  },
  // light-grey rectangles / mid-grey rounded / dark-grey diamonds — full Tailwind grey scale
  monochrome: {
    primaryColor: "#f3f4f6", // gray-100 — rectangles (light)
    primaryTextColor: "#111827", // gray-900 dark — pairs with light node fill + near-white edge label bg
    primaryBorderColor: "#6b7280", // gray-500
    secondaryColor: "#9ca3af", // gray-400 — rounded nodes (mid-range)
    secondaryTextColor: "#111827",
    secondaryBorderColor: "#4b5563",
    tertiaryColor: "#374151", // gray-700 — diamonds (dark)
    tertiaryTextColor: "#ffffff",
    tertiaryBorderColor: "#1f2937",
    lineColor: "#6b7280",
    textColor: "#111827",
    nodeBorder: "#6b7280",
    edgeLabelBackground: "#f9fafb", // gray-50 — near-white; dark primaryTextColor readable on it
    noteBkgColor: "#f9fafb",
    noteTextColor: "#111827",
    noteBorderColor: "#d1d5db",
  },
  // amber rectangles / cyan rounded / white diamonds — WCAG AAA verified
  "high-contrast": {
    primaryColor: "#fbbf24", // amber-400 — rectangles (15.3:1 vs black — AAA)
    primaryTextColor: "#000000", // black — pairs with bright node fills + light edge label bg
    primaryBorderColor: "#000000",
    secondaryColor: "#a5f3fc", // cyan-200 — rounded nodes (12.6:1 vs black — AAA)
    secondaryTextColor: "#000000",
    secondaryBorderColor: "#000000",
    tertiaryColor: "#ffffff", // white — diamonds (21:1 vs black — AAA)
    tertiaryTextColor: "#000000",
    tertiaryBorderColor: "#000000",
    lineColor: "#000000",
    textColor: "#000000",
    nodeBorder: "#000000",
    edgeLabelBackground: "#fef3c7", // amber-100 — very light; black primaryTextColor readable on it
    noteBkgColor: "#fef3c7",
    noteTextColor: "#000000",
    noteBorderColor: "#000000",
  },
};

server.registerTool(
  "generate_diagram",
  {
    description:
      "Render Mermaid syntax to an image. PNG (default): saved to disk at configurable resolution (scale 1-4) with preview returned inline. SVG: returned as editable text.",
    inputSchema: {
      mermaid: z.string().min(1).describe("Mermaid diagram syntax"),
      style: z
        .enum([
          "default",
          "forest",
          "dark",
          "neutral",
          "primary",
          "professional",
          "blueprint",
          "pastel",
          "monochrome",
          "high-contrast",
        ])
        .default("primary")
        .describe(
          "Visual style. Built-in Mermaid themes (default, forest, dark, neutral) or a named preset with pre-vetted contrast ratios (primary, professional, blueprint, pastel, monochrome, high-contrast)",
        ),
      scale: z
        .number()
        .min(1)
        .max(4)
        .default(3)
        .describe(
          "PNG resolution multiplier (1-4). Higher = sharper but larger file. Ignored for SVG output",
        ),
      output: z
        .enum(["png", "svg"])
        .default("png")
        .describe(
          "png: image saved to disk + returned inline. svg: returns editable SVG text",
        ),
      stylingOverrides: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "Override specific Mermaid themeVariables on top of the selected style. " +
            "Applied after the base style — only specified keys are changed. " +
            "Works with both preset styles and built-in Mermaid themes. " +
            "Common flowchart keys — " +
            "nodes: primaryColor, primaryTextColor, primaryBorderColor, secondaryColor, secondaryTextColor, secondaryBorderColor, tertiaryColor, tertiaryTextColor, tertiaryBorderColor, nodeTextColor, nodeBorder, clusterBkg, clusterBorder; " +
            "edges: lineColor, defaultLinkColor, arrowheadColor; " +
            "edge labels: edgeLabelBackground (bg), relationLabelColor (text), relationLabelBackground; " +
            "general: textColor, labelTextColor, titleColor, background; " +
            "notes: noteBkgColor, noteTextColor, noteBorderColor. " +
            "Any valid Mermaid themeVariable key is accepted (200+ available for sequence, Gantt, git graph, pie, etc.). " +
            "Values: CSS color strings (hex, rgb, named).",
        ),
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
        content: [
          {
            type: "text" as const,
            text: "Mermaid syntax is empty. Provide a valid diagram definition.",
          },
        ],
        isError: true,
      };
    }

    try {
      const baseVars = PRESETS[params.style];
      const renderOpts: RenderOptions = {
        theme: baseVars
          ? "base"
          : (params.style as "default" | "forest" | "dark" | "neutral"),
        backgroundColor: "white",
        themeVariables: { ...baseVars, ...params.stylingOverrides },
        scale: params.scale,
      };
      const result = await renderDiagram(mermaidSyntax, renderOpts);

      if (params.output === "svg") {
        return {
          content: [{ type: "text" as const, text: result.svg }],
        };
      }

      const filePath = await saveDiagram(
        result.png,
        mermaidSyntax.slice(0, 80),
      );
      const sizeKB = (result.png.length / 1024).toFixed(0);
      const dims = `${result.width}x${result.height}`;

      return {
        content: [
          {
            type: "text" as const,
            text: `Diagram saved to: ${filePath} (${dims}, ${sizeKB}KB)`,
          },
          {
            type: "image" as const,
            data: result.png.toString("base64"),
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error rendering diagram: ${msg}. Check Mermaid syntax is valid.`,
          },
        ],
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

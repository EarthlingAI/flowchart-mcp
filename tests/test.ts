import { sanitizeFilename } from "../src/render.js";
import { renderDiagram } from "../src/render.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
	if (condition) {
		console.log(`  PASS: ${name}`);
		passed++;
	} else {
		console.error(`  FAIL: ${name}`);
		failed++;
	}
}

function assertEqual(actual: unknown, expected: unknown, name: string) {
	const match = actual === expected;
	if (!match) {
		console.error(`  FAIL: ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
		failed++;
	} else {
		console.log(`  PASS: ${name}`);
		passed++;
	}
}

// --- sanitizeFilename tests ---

console.log("\nsanitizeFilename:");
assertEqual(sanitizeFilename(), "", "undefined → empty");
assertEqual(sanitizeFilename(""), "", "empty → empty");
assertEqual(sanitizeFilename("Hello World"), "hello-world", "spaces → dashes");
assertEqual(sanitizeFilename("My@Diagram#1!"), "my-diagram-1", "special chars stripped");
assertEqual(sanitizeFilename("---leading---"), "leading", "leading/trailing dashes trimmed");
assertEqual(sanitizeFilename("a".repeat(100)), "a".repeat(64), "truncated to 64 chars");
assertEqual(sanitizeFilename("  UPPER  case  "), "upper-case", "uppercase + whitespace");
assertEqual(sanitizeFilename("graph TD\\nA-->B"), "graph-td-na-b", "mermaid syntax chars");

// --- renderDiagram tests ---

console.log("\nrenderDiagram:");

const validDiagram = `graph TD
    A[Start] --> B[Process]
    B --> C[End]`;

const invalidDiagram = "this is not valid mermaid syntax %%%";

try {
	const result = await renderDiagram(validDiagram);
	assert(result.png instanceof Buffer && result.png.length > 0, "valid diagram returns PNG buffer");
	assert(typeof result.svg === "string" && result.svg.includes("<svg"), "valid diagram returns SVG string");
} catch (err) {
	console.error(`  FAIL: valid diagram threw: ${err}`);
	failed += 2;
}

try {
	const result = await renderDiagram(validDiagram, { theme: "dark" });
	assert(result.png instanceof Buffer && result.png.length > 0, "dark theme returns PNG");
	assert(result.svg.includes("<svg"), "dark theme returns SVG");
} catch (err) {
	console.error(`  FAIL: dark theme threw: ${err}`);
	failed += 2;
}

try {
	const result = await renderDiagram(validDiagram, { backgroundColor: "lightblue" });
	assert(result.png instanceof Buffer && result.png.length > 0, "custom background returns PNG");
} catch (err) {
	console.error(`  FAIL: custom background threw: ${err}`);
	failed++;
}

try {
	await renderDiagram(invalidDiagram);
	console.error("  FAIL: invalid diagram should have thrown");
	failed++;
} catch {
	console.log("  PASS: invalid diagram throws error");
	passed++;
}

// --- themeVariables tests ---

console.log("\nthemeVariables:");

try {
	const result = await renderDiagram(validDiagram, { theme: "base", themeVariables: { primaryColor: "#ff0000", primaryTextColor: "#ffffff" } });
	assert(result.png instanceof Buffer && result.png.length > 0, "theme_variables returns PNG");
	assert(result.svg.includes("<svg"), "theme_variables returns SVG");
} catch (err) {
	console.error(`  FAIL: theme_variables threw: ${err}`);
	failed += 2;
}

try {
	const corporatePreset = {
		primaryColor: "#003366",
		primaryTextColor: "#ffffff",
		primaryBorderColor: "#002244",
		secondaryColor: "#e6eef5",
		lineColor: "#4a6785",
		textColor: "#1a1a2e",
		mainBkg: "#003366",
		nodeBorder: "#002244",
	};
	const result = await renderDiagram(validDiagram, { theme: "base", themeVariables: corporatePreset });
	assert(result.png instanceof Buffer && result.png.length > 0, "preset-like variables returns PNG");
} catch (err) {
	console.error(`  FAIL: preset-like variables threw: ${err}`);
	failed++;
}

try {
	const merged = { primaryColor: "#003366", primaryTextColor: "#ffffff", lineColor: "#ff0000" };
	const result = await renderDiagram(validDiagram, { theme: "base", themeVariables: merged });
	assert(result.png instanceof Buffer && result.png.length > 0, "preset + override combo returns PNG");
} catch (err) {
	console.error(`  FAIL: preset + override combo threw: ${err}`);
	failed++;
}

try {
	const result = await renderDiagram(validDiagram, { themeVariables: {} });
	assert(result.png instanceof Buffer && result.png.length > 0, "empty themeVariables returns PNG (no crash)");
} catch (err) {
	console.error(`  FAIL: empty themeVariables threw: ${err}`);
	failed++;
}

try {
	const result = await renderDiagram(validDiagram, { theme: "base", themeVariables: { primaryColor: "#ff0000" }, backgroundColor: "#0a1929" });
	assert(result.png instanceof Buffer && result.png.length > 0, "themeVariables + background color returns PNG");
} catch (err) {
	console.error(`  FAIL: themeVariables + background threw: ${err}`);
	failed++;
}

// --- Summary ---

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

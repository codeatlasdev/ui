import { describe, expect, it } from "vitest";
import {
	buildManifest,
	extractClasses,
	extractTokens,
	type ManifestToken,
} from "../scripts/build-manifest.ts";

const manifest = buildManifest();
const byName = (n: string) => manifest.components.find((c) => c.name === n);

describe("components manifest", () => {
	it("documents Button props with type, default and JSDoc", () => {
		const loading = byName("Button")?.props.find((p) => p.name === "loading");
		expect(loading).toMatchObject({ type: "boolean", optional: true, default: "false" });
		expect(loading?.description).toContain("aria-busy");
	});

	it("separates snippets from props", () => {
		const names = byName("Button")?.snippets.map((s) => s.name);
		expect(names).toEqual(["children", "leading", "trailing"]);
		expect(byName("Button")?.props.some((p) => p.name === "leading")).toBe(false);
	});

	it("lists the ca-* classes a component owns and skips :global descendants", () => {
		const classes = byName("Button")?.classes;
		expect(classes).toContain("ca-btn--loading");
		expect(classes).not.toContain("ca-spinner__arc");
	});

	it("reads classes from a component's imported CSS file", () => {
		expect(byName("Dialog")?.classes).toContain("ca-dialog__title");
	});

	it("marks $bindable props and keeps generics", () => {
		expect(byName("Dialog")?.props.find((p) => p.name === "open")?.bindable).toBe(true);
		expect(byName("DataTable")?.generics).toContain("TData");
	});

	it("records the subpath each component is imported from", () => {
		expect(byName("Button")?.import).toBe("@codeatlasdev/ui");
		expect(byName("LineChart")?.import).toBe("@codeatlasdev/ui/charts");
		expect(byName("DataTable")?.import).toBe("@codeatlasdev/ui/table");
	});

	it("covers every component the barrel exports", () => {
		for (const name of [
			"AppList",
			"AppShellLayout",
			"Sheet",
			"StickyActions",
			"MobilePane",
			"SimpleTable",
			"DatePicker",
		])
			expect(byName(name), name).toBeDefined();
	});
});

describe("extractClasses", () => {
	it("collects own classes, drops :global() descendants and comments", () => {
		const css = `/* .ca-comment */ .ca-a { } .ca-a:hover .ca-b { } :global(.ca-own) { } .ca-parent :global(.ca-foreign) { }`;
		expect(extractClasses(css)).toEqual(["ca-a", "ca-b", "ca-own", "ca-parent"]);
	});
});

describe("extractTokens", () => {
	it("keeps light and dark values apart and tracks the section", () => {
		const out = new Map<string, ManifestToken>();
		extractTokens(
			`:root {\n  /* ── Spacing scale (base 4) ── */\n  --ca-space-1: 4px;\n  --ca-bg: white;\n}\n.dark {\n  --ca-bg: black;\n  --ca-only-dark: red;\n}`,
			"x.css",
			out
		);
		expect(out.get("--ca-space-1")).toMatchObject({ value: "4px", group: "Spacing scale" });
		expect(out.get("--ca-bg")).toMatchObject({ value: "white", dark: "black" });
		expect(out.get("--ca-only-dark")).toMatchObject({ value: "", dark: "red" });
	});
});

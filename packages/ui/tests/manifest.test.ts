import { describe, expect, it } from "bun:test";
import {
	buildManifest,
	buildTokens,
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

	it("takes the component description from the component-level doc, never from a prop", () => {
		// TextField has no component doc: the first JSDoc in its script belongs to a prop.
		expect(byName("TextField")?.description).toBeUndefined();
		expect(byName("Button")?.description ?? "").not.toContain("aria-busy");
		expect(byName("AppShellLayout")?.description ?? "").not.toMatch(/Brand mark/);
		expect(byName("KpiCard")?.description ?? "").not.toMatch(/size and color are managed/);
	});

	it("never describes a component with a tag-only or prop-owned comment", () => {
		for (const c of manifest.components) {
			expect(c.description ?? "", c.name).not.toMatch(/^@\w+/);
			const propDocs = [...c.props, ...c.snippets].map((p) => p.description);
			if (c.description) expect(propDocs, c.name).not.toContain(c.description);
		}
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

describe("token descriptions (#21, #22)", () => {
	it("extractTokens reads the comment that precedes a declaration as its description", () => {
		const out = new Map<string, ManifestToken>();
		extractTokens(
			`:root {\n  /* Disabled controls only. Use --ca-text-hint for de-emphasised information. */\n  --ca-text-disabled: grey;\n  --ca-plain: 1;\n}`,
			"x.css",
			out
		);
		expect(out.get("--ca-text-disabled")?.description).toMatch(/disabled controls/i);
		expect(out.get("--ca-plain")?.description).toBeUndefined();
	});

	it("the shipped tokens carry the disabled-only description and the error pair", () => {
		const tokens = buildTokens();
		const byName = (n: string) => tokens.find((t) => t.name === n);
		expect(byName("--ca-text-disabled")?.description).toMatch(/disabled controls/i);
		expect(byName("--ca-outline-control")?.description).toMatch(/3:1/);
		expect(byName("--ca-semantic-error-contrast")?.description).toMatch(/semantic-error-fill/);
	});
});

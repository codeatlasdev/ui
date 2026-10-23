import { describe, expect, it } from "bun:test";
import {
	buildManifest,
	buildTokens,
	type ExportKind,
	extractClasses,
	extractComponentTokens,
	extractTokens,
	type ManifestToken,
	skillMarkdown,
} from "../scripts/build-manifest.ts";

const manifest = buildManifest();
const byName = (n: string) => manifest.components.find((c) => c.name === n);

describe("components manifest", () => {
	it("documents Button props with type, default and JSDoc", () => {
		const loading = byName("Button")?.props.find((p) => p.name === "loading");
		expect(loading).toMatchObject({ type: "boolean", optional: true, default: "false" });
		expect(loading?.description).toContain("aria-busy");
	});

	it("documents a Props union keyed on href (#290): shared props once, both attribute sets accepted", () => {
		const button = byName("Button");
		const names = button?.props.map((p) => p.name) ?? [];
		expect(new Set(names).size).toBe(names.length);
		expect(names).toEqual(expect.arrayContaining(["variant", "href", "target", "type", "loading"]));
		expect(button?.props.find((p) => p.name === "href")?.description).toContain("download");
		expect(button?.extends).toContain("AnchorAttributes");
		expect(button?.extends).toContain("ButtonAttributes");
	});

	it("lists the layout token props of the primitives, from their LayoutProps pick (#477)", () => {
		const props = (n: string) => byName(n)?.props.map((p) => p.name) ?? [];
		expect(props("Flex")).toEqual(
			expect.arrayContaining(["gap", "p", "px", "py", "align", "justify", "direction", "wrap"])
		);
		expect(props("Stack")).toEqual(
			expect.arrayContaining(["gap", "p", "px", "py", "align", "justify"])
		);
		expect(props("Stack")).not.toContain("direction");
		expect(props("Grid")).toEqual(
			expect.arrayContaining(["columns", "gap", "p", "px", "py", "align"])
		);
		expect(props("Box")).toEqual(expect.arrayContaining(["p", "px", "py"]));
		for (const n of ["Container", "Section", "Surface"])
			expect(props(n), n).toEqual(expect.arrayContaining(["px", "py"]));
		const gap = byName("Flex")?.props.find((p) => p.name === "gap");
		expect(gap).toMatchObject({ optional: true });
		expect(gap?.type).toContain("Responsive<Space>");
		expect(gap?.description).toContain("Gap between children");
		// No duplicates, and the picked props are no longer reported as an unexpanded `extends`.
		for (const n of ["Flex", "Stack", "Grid", "Box", "Container", "Section", "Surface"]) {
			const names = props(n);
			expect(new Set(names).size, n).toBe(names.length);
			expect(byName(n)?.extends ?? "", n).not.toContain("LayoutProps");
		}
		expect(byName("Flex")?.extends).toContain("PolymorphicAttributes");
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

describe("prop types spell out their union values (#509)", () => {
	const prop = (c: string, n: string) => byName(c)?.props.find((p) => p.name === n);

	it("expands a local alias: Avatar shape, size, status, tone", () => {
		expect(prop("Avatar", "shape")?.type).toBe("'circle' | 'rounded'");
		expect(prop("Avatar", "status")?.type).toBe("'online' | 'offline' | 'busy' | 'away'");
		expect(prop("Avatar", "tone")?.type).toBe("'palette' | 'neutral'");
		expect(prop("Avatar", "size")?.type).toBe("'xs' | 'sm' | 'md' | 'lg' | 'xl' | number");
	});

	it("expands an alias imported from a relative file: Card headingLevel", () => {
		expect(prop("Card", "headingLevel")?.type).toBe("2 | 3 | 4 | 5 | 6");
	});

	it("leaves object, array and generic types as written", () => {
		expect(prop("AppShellLayout", "modules")?.type).toBe("NavModule[]");
		expect(prop("Calendar", "value")?.type).toBe("DateValue");
	});

	it("SkipLink documents its label snippet", () => {
		const skip = byName("SkipLink");
		expect(skip?.snippets.map((x) => x.name)).toContain("children");
		expect(skip?.snippets.find((x) => x.name === "children")?.description).toContain("label");
		const md = skillMarkdown(manifest);
		const section = md.slice(md.indexOf("## SkipLink"), md.indexOf("## Slider"));
		expect(section).toContain("Replaces the localized");
	});
});

describe("non-component exports (#57)", () => {
	const exp = (name: string, entry = "") =>
		manifest.exports.find((e) => e.name === name && (!entry || e.import === entry));

	it("documents the exports the issue names, with import path, kind and signature", () => {
		const expected: Array<[string, string, ExportKind, RegExp]> = [
			["setLocale", "@codeatlasdev/ui", "function", /^function setLocale\(next: Locale/],
			["registerLocale", "@codeatlasdev/ui", "function", /^function registerLocale\(id: Locale/],
			["caErrorPlugin", "@codeatlasdev/ui/vite", "function", /^function caErrorPlugin\(/],
			["createErrorHandler", "@codeatlasdev/ui/kit", "function", /^function createErrorHandler\(/],
			["nativeFeel", "@codeatlasdev/ui/kit", "function", /^function nativeFeel\(/],
			["usePageTitle", "@codeatlasdev/ui/kit", "function", /^function usePageTitle\(/],
			[
				"primeKeyboard",
				"@codeatlasdev/ui/actions",
				"function",
				/^function primeKeyboard\(\): void/,
			],
		];
		for (const [name, entry, kind, signature] of expected) {
			const e = exp(name, entry);
			expect(e, `${entry} ${name}`).toBeDefined();
			expect(e?.kind).toBe(kind);
			expect(e?.signature).toMatch(signature);
		}
	});

	it("documents RouteAnnouncer (a Svelte component of ./kit) with its props", () => {
		const c = byName("RouteAnnouncer");
		expect(c?.import).toBe("@codeatlasdev/ui/kit");
		expect(c?.props.map((p) => p.name)).toContain("prefix");
		expect(exp("RouteAnnouncer")).toBeUndefined();
	});

	it("takes the description from the JSDoc of the declaration", () => {
		expect(exp("setLocale")?.description).toMatch(/Sets the UI language/);
		expect(exp("primeKeyboard")?.description).toMatch(/opens the keyboard on iOS/i);
		expect(exp("nativeFeel")?.description).toMatch(/behave like a native app/);
	});

	it("gives every function a description, and tags types and stores by kind", () => {
		expect(exp("caErrorPlugin")?.description).toMatch(/\+error\.svelte/);
		expect(exp("createErrorHandler")?.description).toMatch(/handleError/);
		expect(exp("toast")?.kind).toBe("store");
		expect(exp("CreateErrorHandlerOptions")?.kind).toBe("type");
		expect(exp("CreateErrorHandlerOptions")?.signature).toContain("report?:");
	});

	it("never lists a component as a plain export", () => {
		expect(manifest.exports.find((e) => e.name === "Button")).toBeUndefined();
		expect(manifest.exports.find((e) => e.name === "DataTable")).toBeUndefined();
	});

	it("covers every JS entry point declared in package.json#exports", () => {
		const imports = new Set(manifest.exports.map((e) => e.import));
		for (const entry of [
			"@codeatlasdev/ui",
			"@codeatlasdev/ui/kit",
			"@codeatlasdev/ui/vite",
			"@codeatlasdev/ui/astro",
			"@codeatlasdev/ui/actions",
			"@codeatlasdev/ui/seo",
			"@codeatlasdev/ui/forms",
			"@codeatlasdev/ui/tokens",
			"@codeatlasdev/ui/table",
		])
			expect(imports.has(entry), entry).toBe(true);
	});

	it("renders them in API.md under their import path", () => {
		const md = skillMarkdown(manifest);
		expect(md).toContain("# Non-component exports");
		expect(md).toContain('`import { setLocale } from "@codeatlasdev/ui"`');
		expect(md).toContain('`import { caErrorPlugin } from "@codeatlasdev/ui/vite"`');
		expect(md).toContain("function primeKeyboard(): void");
	});

	it("lists the fields of an exported interface with type, optionality and JSDoc (#508)", () => {
		const nav = exp("NavModule", "@codeatlasdev/ui");
		const badge = nav?.members?.find((m) => m.name === "badge");
		expect(nav?.members?.map((m) => m.name)).toEqual(
			expect.arrayContaining(["id", "label", "icon", "basePath", "items", "badge", "badgeLabel"])
		);
		expect(badge).toMatchObject({ type: 'number | "dot"', optional: true });
		expect(badge?.description).toContain("rail icon");
		expect(nav?.members?.find((m) => m.name === "basePath")?.optional).toBe(false);
		expect(exp("NavItem")?.members?.find((m) => m.name === "count")?.description).toContain(
			"Neutral count"
		);
		// not an object shape: no members
		expect(exp("setLocale")?.members).toBeUndefined();
	});

	it("renders interface fields as a table in API.md (#508)", () => {
		const md = skillMarkdown(manifest);
		expect(md).toContain("#### NavModule");
		expect(md).toContain('| `badge?` | `number \\| "dot"` |');
	});

	it("states the version it describes and how to get the installed one (#272)", () => {
		const header = skillMarkdown(manifest).split("\n").slice(0, 8).join("\n");
		expect(header).toContain(`@codeatlasdev/ui@${manifest.version}`);
		expect(header).toContain("ca-ui-mcp");
		expect(header).toContain("components.json");
	});
});

describe("extractClasses", () => {
	it("collects own classes, drops :global() descendants and comments", () => {
		const css = `/* .ca-comment */ .ca-a { } .ca-a:hover .ca-b { } :global(.ca-own) { } .ca-parent :global(.ca-foreign) { }`;
		expect(extractClasses(css)).toEqual(["ca-a", "ca-b", "ca-own", "ca-parent"]);
	});
});

describe("component tokens (#373)", () => {
	it("keeps var(--ca-<stem>-*, fallback) reads of the component's own classes, not global tokens", () => {
		const css = `.ca-icon-btn--sm { width: var(--ca-icon-btn-size-sm, var(--ca-space-8)); gap: var(--ca-space-2); } /* var(--ca-icon-btn-x, 1) */ .ca-icon-btn { color: var(--ca-icon-btn-font-weight, inherit) }`;
		expect(extractComponentTokens(css, ["ca-icon-btn", "ca-icon-btn--sm"])).toEqual([
			"--ca-icon-btn-font-weight",
			"--ca-icon-btn-size-sm",
		]);
	});

	it("get_component data lists Button, IconButton and Kbd tokens", () => {
		expect(byName("Button")?.tokens).toContain("--ca-btn-font-weight");
		expect(byName("Button")?.tokens).toContain("--ca-btn-sm-padding-x");
		expect(byName("IconButton")?.tokens).toContain("--ca-icon-btn-size-sm");
		expect(byName("Kbd")?.tokens).toEqual([
			"--ca-kbd-font-size",
			"--ca-kbd-line-height",
			"--ca-kbd-size",
		]);
		expect(byName("Badge")?.tokens).not.toContain("--ca-space-1");
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

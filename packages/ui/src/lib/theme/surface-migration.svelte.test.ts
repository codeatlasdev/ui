import { afterEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../tests/settled";
import DataTable from "../components/DataTable/DataTable.test.svelte";
import FacetedFilter from "../components/DataTable/DataTableFacetedFilter.svelte";
import Tooltip from "../components/Tooltip/Tooltip.svelte";
import Harness from "./SurfaceMigration.test.svelte";
import DocsHarness from "./SurfaceMigrationDocs.test.svelte";

// #202: every element that used to declare its own `backdrop-filter` now takes it from
// surface.css. The visual output must not change, so this compares computed styles with a
// baseline captured from the unmigrated components (surface-migration.baseline.json).
// Regenerate (only when a look change is intended): CA_SURFACE_CAPTURE=1 bun run test:browser -- <this file>
const BASELINE = "src/lib/theme/surface-migration.baseline.json";
const capture = import.meta.env.VITE_CA_SURFACE_CAPTURE === "1";

const STYLES = [
	"glass",
	"frosted",
	"solid",
	"flat",
	"outlined",
	"neumorphic",
	"clay",
	"chrome",
	"tonal",
] as const;
const SCHEMES = ["light", "dark"] as const;
const PROPS = [
	"backdropFilter",
	"webkitBackdropFilter",
	"willChange",
	"isolation",
	"position",
	"backgroundColor",
	"backgroundImage",
	"boxShadow",
	"borderTopWidth",
	"borderTopColor",
	"borderTopLeftRadius",
	"color",
] as const;

/** Every element that declared `backdrop-filter`, by name → selector inside the harness. */
const TARGETS: Record<string, string> = {
	"tabs-list": ".ca-tabs-list",
	"pagination-page": ".ca-pagination__page",
	"accordion-item": ".ca-accordion-item",
	toast: ".ca-toast",
	"chip-static": ".ca-chip:not(.ca-chip--interactive)",
	"chip-interactive": ".ca-chip--interactive",
	"stepper-bubble": ".ca-stepper__bubble",
	"collapsible-trigger": ".ca-collapsible__trigger",
	"button-glass": ".ca-btn--glass:not(:disabled)",
	"button-glass-disabled": ".ca-btn--glass:disabled",
	"button-filled-disabled": ".ca-btn--filled:disabled",
	"icon-button-glass": ".ca-icon-btn--glass:not(:disabled)",
	"icon-button-glass-disabled": ".ca-icon-btn--glass:disabled",
	"sticky-actions": ".ca-sticky-actions",
	"form-section": ".ca-form-section",
	"error-bubble": ".ca-error-page__bubble",
	rail: ".ca-rail",
	panel: ".ca-panel",
	"site-header": ".ca-site-header",
	"app-form-footer": ".ca-app-form__footer",
};

type Snapshot = Record<string, Record<string, string>>;

function read(el: Element): Record<string, string> {
	const cs = getComputedStyle(el) as CSSStyleDeclaration & Record<string, string>;
	return Object.fromEntries(PROPS.map((p) => [p, cs[p] ?? ""]));
}

function snapshot(root: ParentNode, targets: Record<string, string>): Snapshot {
	const out: Snapshot = {};
	for (const [name, selector] of Object.entries(targets)) {
		const el = root.querySelector(selector);
		if (!el) throw new Error(`${name}: no element matches ${selector}`);
		out[name] = read(el);
	}
	return out;
}

const html = document.documentElement;
const collected: Record<string, Snapshot> = {};

afterEach(() => {
	html.setAttribute("data-style", "solid");
	html.classList.remove("dark");
	for (const n of document.querySelectorAll("[data-scrim-probe]")) n.remove();
});

async function check(key: string, got: Snapshot) {
	if (capture) {
		collected[key] = got;
		return;
	}
	const want = (JSON.parse(await commands.readFile(BASELINE)) as Record<string, Snapshot>)[key];
	expect(want, `no baseline for ${key}`).toBeDefined();
	expect(got).toEqual(want);
}

describe("surface migration: computed styles equal the pre-migration baseline", () => {
	for (const style of STYLES)
		for (const scheme of SCHEMES)
			it(`components under data-style=${style} ${scheme}`, async () => {
				html.setAttribute("data-style", style);
				html.classList.toggle("dark", scheme === "dark");
				const screen = await render(Harness);
				await settled();
				await check(`components/${style}/${scheme}`, snapshot(screen.container, TARGETS));
			});

	for (const style of STYLES)
		for (const scheme of SCHEMES)
			it(`tooltip content and modal scrim under data-style=${style} ${scheme}`, async () => {
				html.setAttribute("data-style", style);
				html.classList.toggle("dark", scheme === "dark");
				const screen = await render(Tooltip, { content: "Save", delay: 0, children: undefined });
				await userEvent.tab();
				await expect.element(page.getByRole("tooltip")).toBeVisible();
				await settled();
				const tip = document.querySelector(".ca-tooltip-content") as HTMLElement;
				// A real <dialog> in the modal layer: its ::backdrop is the scrim.
				const dlg = document.createElement("dialog");
				dlg.className = "ca-overlay";
				dlg.dataset.scrimProbe = "";
				dlg.dataset.state = "open";
				document.body.append(dlg);
				dlg.showModal();
				const scrim = getComputedStyle(dlg, "::backdrop") as CSSStyleDeclaration &
					Record<string, string>;
				const got: Snapshot = {
					tooltip: read(tip),
					scrim: Object.fromEntries(
						["backdropFilter", "webkitBackdropFilter", "backgroundColor"].map((p) => [
							p,
							scrim[p] ?? "",
						])
					),
				};
				dlg.close();
				void screen;
				await check(`floating/${style}/${scheme}`, got);
			});

	for (const style of STYLES)
		for (const scheme of SCHEMES)
			it(`data table popovers under data-style=${style} ${scheme}`, async () => {
				html.setAttribute("data-style", style);
				html.classList.toggle("dark", scheme === "dark");
				const table = await render(DataTable);
				await table.getByRole("button", { name: "Columns" }).click();
				await settled();
				const toggle = read(document.querySelector(".ca-col-toggle__content") as Element);
				await userEvent.keyboard("{Escape}");
				const facet = await render(FacetedFilter, {
					title: "Role",
					facets: { Admin: 2, Developer: 3 },
					onSelectionChange: () => {},
				});
				await facet.getByRole("button", { name: "Role" }).click();
				await settled();
				const filter = read(document.querySelector(".ca-facet__content") as Element);
				await check(`datatable/${style}/${scheme}`, { toggle, filter });
			});

	for (const style of STYLES)
		for (const scheme of SCHEMES)
			for (const [name, width] of [
				["wide", 1280],
				["narrow", 390],
			] as const)
				it(`docs shell header, pager and sticky actions under data-style=${style} ${scheme} ${name}`, async () => {
					html.setAttribute("data-style", style);
					html.classList.toggle("dark", scheme === "dark");
					await page.viewport(width, 720);
					const screen = await render(DocsHarness);
					await settled();
					await check(
						`docs/${style}/${scheme}/${name}`,
						snapshot(screen.container, {
							header: ".ca-docs-header",
							pager: ".ca-docs-pager",
							"sticky-actions": ".ca-sticky-actions",
						})
					);
					await page.viewport(1280, 720);
				});

	it("writes the baseline when capturing", async () => {
		if (!capture) {
			expect(Object.keys(collected)).toHaveLength(0);
			return;
		}
		await commands.writeFile(BASELINE, `${JSON.stringify(collected, null, "\t")}\n`);
		expect(Object.keys(collected).length).toBeGreaterThan(0);
	});
});

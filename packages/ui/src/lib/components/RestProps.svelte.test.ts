import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Alert from "./Alert/Alert.svelte";
import EmptyState from "./EmptyState/EmptyState.svelte";
import RestProps from "./RestProps.test.svelte";
import Spinner from "./Spinner/Spinner.svelte";
import StatusChip from "./StatusChip/StatusChip.svelte";

// #1066: [harness branch, element that receives the attributes, element that receives `class`, `title` is an attribute].
// Form controls send attributes to the control and `class` to the field wrapper, like TextField and Checkbox.
const cases: [string, string, string, boolean][] = [
	["Badge (pill)", "span.ca-badge.ca-badge--inline", "span.ca-badge", true],
	["Badge (anchored)", "span.ca-badge-wrapper", "span.ca-badge-wrapper", true],
	["StatusChip", "span.ca-status-chip", "span.ca-status-chip", true],
	["Chip", "span.ca-chip", "span.ca-chip", true],
	["Avatar", "span.ca-avatar", "span.ca-avatar", true],
	["Stat", "dl.ca-stat", "dl.ca-stat", true],
	["Progress", "div.ca-progress[role=progressbar]", "div.ca-progress", true],
	["Spinner", "svg.ca-spinner", "svg.ca-spinner", false],
	["Switch", "input.ca-switch__input[role=switch]", "div.ca-switch-wrapper", true],
	["Select", "button.ca-sel__trigger", "div.ca-sel", true],
	["Sheet", "dialog.ca-sheet", "dialog.ca-sheet", false],
	["Dialog", "dialog.ca-dialog", "dialog.ca-dialog", false],
	["Alert", "div.ca-alert", "div.ca-alert", false],
	["Divider", "div.ca-divider[role=separator]", "div.ca-divider", true],
	["Kbd", "kbd.ca-kbd", "kbd.ca-kbd", true],
	["EmptyState", "div.ca-empty", "div.ca-empty", false],
	["Skeleton", "div.ca-skeleton", "div.ca-skeleton", true],
	["Skeleton (rows)", "div.ca-skeleton-rows", "div.ca-skeleton", true],
];

describe("rest props (#1066)", () => {
	it.each(cases)("%s forwards attributes", async (which, root, classOn, title) => {
		await render(RestProps, { which });
		await expect.poll(() => document.querySelector('[data-testid="rp"]')).not.toBeNull();
		const el = document.querySelector('[data-testid="rp"]') as Element;
		expect(el.matches(root), `${el.outerHTML.slice(0, 160)} is not ${root}`).toBe(true);
		expect(el.id).toBe("rp-id");
		expect(el.getAttribute("aria-describedby")?.split(" ")).toContain("rp-desc");
		if (title) expect(el.getAttribute("title")).toBe("rp-title");
		const styled = document.querySelector(".rp-class");
		expect(styled?.matches(classOn), `class on ${styled?.outerHTML.slice(0, 120)}`).toBe(true);
	});

	it("a form control's own id still names it from its label", async () => {
		for (const which of ["Switch", "Select"]) {
			const screen = await render(RestProps, { which });
			const label = document.querySelector('label[for="rp-id"]');
			expect(label, `${which}: label points at the caller's id`).not.toBeNull();
			screen.unmount();
		}
	});

	it("a caller's role replaces a live-region default", async () => {
		const chip = await render(StatusChip, { status: "info", label: "Draft", role: "none" });
		expect(chip.container.querySelector(".ca-status-chip")?.getAttribute("role")).toBe("none");
		const alert = await render(Alert, { severity: "info", role: "note" });
		expect(alert.container.querySelector(".ca-alert")?.getAttribute("role")).toBe("note");
		const empty = await render(EmptyState, { title: "No leads", role: "none" });
		expect(empty.container.querySelector(".ca-empty")?.getAttribute("role")).toBe("none");
		const spin = await render(Spinner, { role: "img" });
		expect(spin.container.querySelector(".ca-spinner")?.getAttribute("role")).toBe("img");
	});
});

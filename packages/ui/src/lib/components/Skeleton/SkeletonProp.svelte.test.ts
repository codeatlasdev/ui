import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Avatar from "../Avatar/Avatar.svelte";
import GlassCard from "../GlassCard/GlassCard.test.svelte";
import KpiCard from "../KpiCard/KpiCard.svelte";
import Table from "../Table/Table.test.svelte";
import TextField from "../TextField/TextField.svelte";

type Case = [string, new (...a: never[]) => unknown, Record<string, unknown>, string];

// Every component keeps its real DOM when `skeleton` is on, so the box cannot change (CLS 0).
const cases = [
	["Avatar", Avatar, { alt: "Ana Lima", size: "lg", src: "/x.png" }, ".ca-avatar"],
	["KpiCard", KpiCard, { title: "Revenue", value: "R$ 12.400", trend: 3.2 }, ".ca-kpi"],
	["TextField", TextField, { label: "Email", description: "We never share it" }, ".ca-tf"],
	["GlassCard", GlassCard, { title: "Overview" }, ".ca-glass-card"],
	["Table", Table, {}, ".ca-table-root"],
] as unknown as Case[];

const size = (el: Element) => {
	const r = el.getBoundingClientRect();
	return [Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100];
};

describe("skeleton prop", () => {
	it.each(cases)("%s keeps its exact box while loading", async (_n, C, props, sel) => {
		const real = await render(C as never, props as never);
		const loading = await render(C as never, { ...props, skeleton: true } as never);
		const a = real.container.querySelector(sel);
		const b = loading.container.querySelector(sel);
		expect(a && b).toBeTruthy();
		expect(size(b as Element)).toEqual(size(a as Element));
	});

	it.each(cases)("%s is busy, hides its content and shimmers", async (_n, C, props, sel) => {
		const screen = await render(C as never, { ...props, skeleton: true } as never);
		const host = screen.container.querySelector<HTMLElement>(sel) as HTMLElement;
		const busy = host.closest("[aria-busy='true']") ?? host.querySelector("[aria-busy='true']");
		expect(busy, "aria-busy").not.toBeNull();
		const marked = host.matches("[data-skeleton]") ? host : host.querySelector("[data-skeleton]");
		expect(marked, "data-skeleton").not.toBeNull();
		expect(getComputedStyle(marked as Element, "::after").animationName).toBe("ca-shimmer");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each(cases)("%s without skeleton is untouched", async (_n, C, props, sel) => {
		const screen = await render(C as never, props as never);
		expect(screen.container.querySelector("[data-skeleton]")).toBeNull();
		expect(screen.container.querySelector("[aria-busy]")).toBeNull();
		expect(screen.container.querySelector(sel)).not.toBeNull();
	});

	it("TextField keeps the input out of the tab order and the field disabled", async () => {
		const screen = await render(TextField, { label: "Email", skeleton: true });
		const input = screen.container.querySelector("input") as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});
});

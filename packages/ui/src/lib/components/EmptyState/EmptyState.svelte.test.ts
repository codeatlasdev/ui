import { Inbox } from "@lucide/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import EmptyState from "./EmptyState.svelte";
import InShell from "./EmptyStateInShell.test.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("EmptyState", () => {
	it("is a status named by its title, with a heading", async () => {
		const screen = await render(EmptyState, { title: "No results" });
		await expect.element(screen.getByRole("status", { name: "No results" })).toBeVisible();
		await expect.element(screen.getByRole("heading", { name: "No results" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders description text", async () => {
		const screen = await render(EmptyState, { title: "Empty", description: "Try another filter" });
		await expect.element(screen.getByText("Try another filter")).toBeVisible();
	});

	it("description prop wins over children", async () => {
		const screen = await render(EmptyState, {
			title: "Empty",
			description: "From prop",
			children: snip("<span>From child</span>"),
		});
		await expect.element(screen.getByText("From prop")).toBeVisible();
		await expect.element(screen.getByText("From child")).not.toBeInTheDocument();
	});

	it("children render as the description when no description prop", async () => {
		const screen = await render(EmptyState, {
			title: "Empty",
			children: snip("<span>From child</span>"),
		});
		await expect.element(screen.getByText("From child")).toBeVisible();
	});

	it("renders no description/actions containers when absent", async () => {
		const screen = await render(EmptyState, { title: "Empty" });
		expect(screen.container.querySelector(".ca-empty__description")).toBeNull();
		expect(screen.container.querySelector(".ca-empty__actions")).toBeNull();
		expect(screen.container.querySelector(".ca-empty__icon")).toBeNull();
	});

	it("renders the actions snippet with interactive content", async () => {
		const screen = await render(EmptyState, {
			title: "Empty",
			description: "Nothing here",
			actions: snip(`<button type="button">Create item</button>`),
		});
		await expect.element(screen.getByRole("button", { name: "Create item" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("icon is decorative (aria-hidden) and rendered as svg", async () => {
		const screen = await render(EmptyState, { title: "Empty", icon: Inbox });
		const tile = q(screen.container, ".ca-empty__icon");
		expect(tile.getAttribute("aria-hidden")).toBe("true");
		expect(tile.querySelector("svg")).not.toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hero variant uses the larger icon and passes axe with all parts", async () => {
		const screen = await render(EmptyState, {
			title: "Welcome",
			variant: "hero",
			icon: Inbox,
			description: "Start by creating something",
			actions: snip(`<button type="button">Get started</button>`),
		});
		const root = screen.getByRole("status");
		await expect.element(root).toHaveClass("ca-empty--hero");
		expect(q(screen.container, "svg").getAttribute("width")).toBe("32");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("default variant uses a 24px icon", async () => {
		const screen = await render(EmptyState, { title: "x", icon: Inbox });
		expect(q(screen.container, "svg").getAttribute("width")).toBe("24");
	});
	describe("heading level", () => {
		const level = (c: HTMLElement) => (q(c, ".ca-empty__title") as HTMLElement).tagName;

		it("stays h5 outside a PageShell", async () => {
			const screen = await render(EmptyState, { title: "Empty" });
			expect(level(screen.container)).toBe("H5");
		});

		it.each([2, 3, 4, 5, 6] as const)(
			"headingLevel %i renders that heading",
			async (headingLevel) => {
				const screen = await render(EmptyState, { title: "Empty", headingLevel });
				expect(level(screen.container)).toBe(`H${headingLevel}`);
				await expect
					.element(screen.getByRole("heading", { level: headingLevel, name: "Empty" }))
					.toBeVisible();
			}
		);

		it("looks the same at every level", async () => {
			const sizes = new Set<string>();
			for (const headingLevel of [2, 5] as const) {
				const screen = await render(EmptyState, { title: "Empty", headingLevel });
				const cs = getComputedStyle(q(screen.container, ".ca-empty__title") as HTMLElement);
				sizes.add(`${cs.fontSize}|${cs.fontWeight}|${cs.marginTop}|${cs.marginBottom}`);
				screen.unmount();
			}
			expect(sizes.size).toBe(1);
		});

		it("defaults to h2 inside a PageShell, with no heading-order violation", async () => {
			const screen = await render(InShell, {});
			expect(level(screen.container)).toBe("H2");
			expect(
				await checkA11y(screen.container, { runOnly: ["heading-order"] })
			).toHaveNoViolations();
		});

		it("an explicit headingLevel wins over the PageShell default", async () => {
			const screen = await render(InShell, { headingLevel: 3 });
			expect(level(screen.container)).toBe("H3");
		});
	});
});

describe("EmptyState tokens (#707)", () => {
	it("the tokens restyle the tile, title gap, description and actions; unset they change nothing", async () => {
		const actions = createRawSnippet(() => ({ render: () => "<a href='/'>Go</a>" }));
		const props = {
			icon: Inbox,
			title: "Invitation unavailable",
			description: "Ask for a new link.",
			actions,
		};
		const plain = await render(EmptyState, props);
		const p = plain.container.querySelector(".ca-empty") as HTMLElement;
		const gap = (root: HTMLElement) =>
			(root.querySelector(".ca-empty__description") as HTMLElement).getBoundingClientRect().top -
			(root.querySelector(".ca-empty__title") as HTMLElement).getBoundingClientRect().bottom;
		expect(Math.round(gap(p))).toBe(12);

		const screen = await render(EmptyState, props);
		const root = screen.container.querySelectorAll(".ca-empty")[0] as HTMLElement;
		for (const [k, v] of Object.entries({
			"--ca-empty-icon-bg": "rgb(1, 2, 3)",
			"--ca-empty-icon-border": "1px solid rgb(4, 5, 6)",
			"--ca-empty-icon-radius": "12px",
			"--ca-empty-title-gap": "4px",
			"--ca-empty-description-size": "14px",
			"--ca-empty-description-max-width": "none",
			"--ca-empty-actions-margin": "0px",
		}))
			root.style.setProperty(k, v);
		const icon = root.querySelector(".ca-empty__icon") as HTMLElement;
		expect(getComputedStyle(icon).backgroundColor).toBe("rgb(1, 2, 3)");
		expect(getComputedStyle(icon).borderTopColor).toBe("rgb(4, 5, 6)");
		expect(getComputedStyle(icon).borderTopLeftRadius).toBe("12px");
		expect(Math.round(gap(root))).toBe(4);
		const desc = root.querySelector(".ca-empty__description") as HTMLElement;
		expect(getComputedStyle(desc).fontSize).toBe("14px");
		expect(getComputedStyle(desc).maxWidth).toBe("none");
		expect(
			getComputedStyle(root.querySelector(".ca-empty__actions") as HTMLElement).marginTop
		).toBe("0px");
	});
});

// #992: an empty slot inside a list or a grid of sibling cards is one line, not a whole card.
describe('EmptyState size="row" (#992)', () => {
	const row = {
		size: "row" as const,
		icon: Inbox,
		title: "No one in this queue",
		description: "New tickets land here.",
		// A control-height action, like a Button in the slot.
		actions: snip(
			`<button type="button" style="height: var(--ca-control-height)">Add ticket</button>`
		),
	};
	const box = (el: Element) => el.getBoundingClientRect();
	const mid = (el: Element) => box(el).top + box(el).height / 2;

	it("lays icon, text and action on one line", async () => {
		const screen = await render(EmptyState, row);
		const root = q(screen.container, ".ca-empty");
		const [icon, title, desc, actions] = [
			".ca-empty__icon",
			".ca-empty__title",
			".ca-empty__description",
			".ca-empty__actions",
		].map((s) => q(root, s));
		// One control height plus a small inset, never the stacked block (~200px).
		expect(box(root).height).toBeLessThanOrEqual(56);
		for (const el of [title, desc, actions]) expect(Math.abs(mid(el) - mid(icon))).toBeLessThan(4);
		expect(box(title).left).toBeGreaterThan(box(icon).right);
		expect(box(actions).left).toBeGreaterThan(box(desc).right);
		expect(q(icon, "svg").getAttribute("width")).toBe("16");
	});

	it("keeps its name, text and action; no heading", async () => {
		const screen = await render(EmptyState, row);
		await expect.element(screen.getByRole("status", { name: row.title })).toBeVisible();
		await expect.element(screen.getByText(row.title)).toBeVisible();
		await expect.element(screen.getByText(row.description)).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Add ticket" })).toBeVisible();
		// Five empty rows must not add five headings to the page outline.
		expect(screen.container.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("wraps in a narrow slot instead of overflowing", async () => {
		// A title wider than the slot on one line: it must wrap, not push the row sideways.
		const title = "No one is waiting in the priority support queue right now";
		const screen = await render(EmptyState, { ...row, title });
		const root = q(screen.container, ".ca-empty");
		(root.parentElement as HTMLElement).style.width = "240px";
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
		expect(box(q(root, ".ca-empty__actions")).right).toBeLessThanOrEqual(box(root).right);
	});

	it("leaves the default size stacked", async () => {
		const screen = await render(EmptyState, { ...row, size: undefined });
		const root = q(screen.container, ".ca-empty");
		expect(root.classList.contains("ca-empty--row")).toBe(false);
		expect(box(q(root, ".ca-empty__icon")).bottom).toBeLessThanOrEqual(
			box(q(root, ".ca-empty__title")).top
		);
		expect(screen.container.querySelector("h5")).not.toBeNull();
	});
});

describe("EmptyState title leading (#1005)", () => {
	it("keeps its heading's line-height until --ca-empty-title-leading is set", async () => {
		const screen = await render(EmptyState, { title: "No data", headingLevel: 5 });
		const title = q(screen.container, ".ca-empty__title");
		// The h5 rule in base.css: an `inherit` fallback took the body leading and grew every state by 10px.
		expect(Number.parseFloat(getComputedStyle(title).lineHeight)).toBeCloseTo(
			Number.parseFloat(getComputedStyle(title).fontSize) * 1.3
		);
		title.closest<HTMLElement>(".ca-empty")?.style.setProperty("--ca-empty-title-leading", "2");
		expect(Number.parseFloat(getComputedStyle(title).lineHeight)).toBeCloseTo(
			Number.parseFloat(getComputedStyle(title).fontSize) * 2
		);
	});
});

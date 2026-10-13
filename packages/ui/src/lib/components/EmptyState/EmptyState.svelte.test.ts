import { Inbox } from "@lucide/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import EmptyState from "./EmptyState.svelte";

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
});

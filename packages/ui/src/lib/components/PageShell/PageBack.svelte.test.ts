import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import AppForm from "../AppForm/AppForm.svelte";
import AppSettings from "../AppSettings/AppSettings.svelte";
import PageShell from "./PageShell.svelte";

const body = createRawSnippet(() => ({ render: () => "<p>Body</p>" }));

// #777: one Back contract on the three page frames: `backHref` renders the standard back link in
// the leading position, `onback` runs first and may `preventDefault` (history-aware back).
const frames = [
	["AppForm", AppForm, { title: "Edit user", children: body }],
	[
		"AppSettings",
		AppSettings,
		{
			title: "Settings",
			tabs: [{ value: "a", label: "A" }],
			children: createRawSnippet(() => ({ render: () => "<p>x</p>" })),
		},
	],
	["PageShell", PageShell, { title: "Users", children: body }],
] as const;

describe.each(frames)("%s back contract (#777)", (_name, Component, base) => {
	it("renders a back link to backHref before the title and passes axe", async () => {
		const screen = await render(Component as never, { ...base, backHref: "/users" });
		const link = screen.getByRole("link", { name: "Back" });
		await expect.element(link).toHaveAttribute("href", "/users");
		const h1 = screen.getByRole("heading", { level: 1 }).element();
		const a = link.element();
		expect(a.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders nothing without backHref", async () => {
		const screen = await render(Component as never, { ...base });
		expect(screen.getByRole("link", { name: "Back" }).elements()).toHaveLength(0);
	});

	it("backLabel names the link", async () => {
		const screen = await render(Component as never, {
			...base,
			backHref: "/users",
			backLabel: "Back to users",
		});
		await expect.element(screen.getByRole("link", { name: "Back to users" })).toBeVisible();
	});

	it("onback runs on click and preventDefault stops the navigation", async () => {
		const onback = vi.fn((e: MouseEvent) => e.preventDefault());
		const screen = await render(Component as never, { ...base, backHref: "#never", onback });
		await screen.getByRole("link", { name: "Back" }).click();
		expect(onback).toHaveBeenCalledOnce();
		expect(location.hash).not.toBe("#never");
	});

	it("without preventDefault the link still navigates", async () => {
		const onback = vi.fn();
		const screen = await render(Component as never, { ...base, backHref: "#followed", onback });
		await screen.getByRole("link", { name: "Back" }).click();
		expect(onback).toHaveBeenCalledOnce();
		expect(location.hash).toBe("#followed");
		location.hash = "";
	});
});

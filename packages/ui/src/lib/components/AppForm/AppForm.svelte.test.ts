import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import AppForm from "./AppForm.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("AppForm", () => {
	it("renders title (h1), description and body children", async () => {
		const screen = await render(AppForm, {
			title: "New user",
			description: "Fill in the details",
			children: snip("<label>Name <input /></label>"),
		});
		await expect.element(screen.getByRole("heading", { level: 1, name: "New user" })).toBeVisible();
		await expect.element(screen.getByText("Fill in the details")).toBeVisible();
		await expect.element(screen.getByRole("textbox", { name: "Name" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits the header entirely when no header props are given", async () => {
		const screen = await render(AppForm, { children: snip("<p>Body</p>") });
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
		expect(screen.container.querySelector(".ca-app-form__header")).toBeNull();
	});

	it("backHref renders a labelled back link (default label 'Back')", async () => {
		const screen = await render(AppForm, { title: "Edit", backHref: "/users" });
		await expect
			.element(screen.getByRole("link", { name: "Back" }))
			.toHaveAttribute("href", "/users");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("backLabel customizes the back link name", async () => {
		const screen = await render(AppForm, { backHref: "/users", backLabel: "Go back" });
		await expect.element(screen.getByRole("link", { name: "Go back" })).toBeVisible();
	});

	it("leading snippet overrides backHref", async () => {
		const screen = await render(AppForm, {
			title: "Edit",
			backHref: "/users",
			leading: snip("<a href='/custom'>Home</a>"),
		});
		await expect.element(screen.getByRole("link", { name: "Home" })).toBeVisible();
		expect(screen.getByRole("link", { name: "Back" }).elements()).toHaveLength(0);
	});

	it("renders trailing and a footer toolbar with an accessible name", async () => {
		const screen = await render(AppForm, {
			title: "Edit",
			trailing: snip("<span>Draft</span>"),
			footer: snip(
				"<div><button type='button'>Cancel</button><button type='button'>Save</button></div>"
			),
		});
		await expect.element(screen.getByText("Draft")).toBeVisible();
		const bar = screen.getByRole("toolbar", { name: "Form actions" });
		await expect.element(bar).toBeVisible();
		await expect.element(bar.getByRole("button", { name: "Save" })).toBeVisible();
		await expect.element(bar.getByRole("button", { name: "Cancel" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders no footer toolbar without a footer snippet", async () => {
		const screen = await render(AppForm, { title: "Edit" });
		expect(screen.getByRole("toolbar").elements()).toHaveLength(0);
	});
});

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import ErrorPage from "./ErrorPage.svelte";

describe("ErrorPage", () => {
	it("defaults to the 500 preset with heading, code and hint", async () => {
		const screen = await render(ErrorPage, {});
		await expect
			.element(screen.getByRole("heading", { level: 1, name: "Internal server error" }))
			.toBeVisible();
		await expect.element(screen.getByText("500")).toBeVisible();
		await expect
			.element(screen.getByText("Something went wrong on our end. We're looking into it."))
			.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each([
		[404, "Page not found", "The page you're looking for doesn't exist or was moved."],
		[403, "Access denied", "You don't have permission to access this resource."],
		[500, "Internal server error", "Something went wrong on our end. We're looking into it."],
		[503, "Service unavailable", "The server is temporarily unavailable. Try again shortly."],
	] as const)("status %i uses its preset title and hint", async (status, title, hint) => {
		const screen = await render(ErrorPage, { status });
		await expect.element(screen.getByText(String(status), { exact: true })).toBeVisible();
		await expect.element(screen.getByRole("heading", { level: 1, name: title })).toBeVisible();
		await expect.element(screen.getByText(hint)).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("unknown status falls back to a generic title and shows the message as hint", async () => {
		const screen = await render(ErrorPage, { status: 418, message: "I'm a teapot" });
		await expect.element(screen.getByText("418")).toBeVisible();
		await expect
			.element(screen.getByRole("heading", { level: 1, name: "Something went wrong" }))
			.toBeVisible();
		await expect.element(screen.getByText("I'm a teapot")).toBeVisible();
	});

	it("custom message replaces the preset hint", async () => {
		const screen = await render(ErrorPage, { status: 404, message: "Project not found" });
		await expect.element(screen.getByText("Project not found")).toBeVisible();
		await expect
			.element(screen.getByText("The page you're looking for doesn't exist or was moved."))
			.not.toBeInTheDocument();
	});

	it("title prop overrides the preset title", async () => {
		const screen = await render(ErrorPage, { status: 404, title: "Oops" });
		await expect.element(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeVisible();
	});

	it("renders Go back and Home actions as buttons", async () => {
		const screen = await render(ErrorPage, { status: 404 });
		await expect.element(screen.getByRole("button", { name: "Go back" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Home" })).toBeVisible();
	});

	it("hideActions removes the buttons", async () => {
		const screen = await render(ErrorPage, { status: 404, hideActions: true });
		await expect.element(screen.getByRole("button")).not.toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

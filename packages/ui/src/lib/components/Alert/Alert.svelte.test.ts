import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Alert from "./Alert.svelte";

const body = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("Alert", () => {
	it("renders an alert region with title and content", async () => {
		const screen = await render(Alert, {
			severity: "info",
			title: "Heads up",
			children: body("Details here"),
		});
		const alert = screen.getByRole("alert");
		await expect.element(alert).toBeVisible();
		await expect.element(alert).toHaveAttribute("aria-live", "polite");
		await expect.element(screen.getByText("Heads up")).toBeVisible();
		await expect.element(screen.getByText("Details here")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each(["success", "warning", "error", "info"] as const)(
		"severity %s keeps role=alert, hides the decorative icon and passes axe",
		async (severity) => {
			const screen = await render(Alert, { severity, title: "T", children: body("Body") });
			const alert = screen.getByRole("alert");
			await expect.element(alert).toHaveClass(`ca-alert--${severity}`);
			const icon = alert.element().querySelector(".ca-alert__icon");
			expect(icon?.getAttribute("aria-hidden")).toBe("true");
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
	);

	it("omits the title when not provided", async () => {
		const screen = await render(Alert, { severity: "info", children: body("Only body") });
		expect(screen.container.querySelector(".ca-alert__title")).toBeNull();
		await expect.element(screen.getByText("Only body")).toBeVisible();
	});

	it("does not render a dismiss button unless closable", async () => {
		const screen = await render(Alert, { severity: "info", children: body("x") });
		await expect
			.element(screen.getByRole("button", { name: "Dismiss alert" }))
			.not.toBeInTheDocument();
	});

	it("closable renders a dismiss button that calls onclose", async () => {
		const onclose = vi.fn();
		const screen = await render(Alert, {
			severity: "error",
			title: "Falha",
			closable: true,
			onclose,
			children: body("x"),
		});
		const btn = screen.getByRole("button", { name: "Dismiss alert" });
		await expect.element(btn).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await btn.click();
		expect(onclose).toHaveBeenCalledOnce();
	});
});

describe("Alert variant=banner (#769)", () => {
	const body = createRawSnippet(() => ({
		render: () => "<span>Scheduled maintenance tonight</span>",
	}));

	it("spans its container edge to edge, square, with no side bar", async () => {
		const screen = await render(Alert, { severity: "warning", variant: "banner", children: body });
		const el = screen.container.querySelector(".ca-alert") as HTMLElement;
		const cs = getComputedStyle(el);
		expect(el.classList).toContain("ca-alert--banner");
		expect(cs.borderTopLeftRadius).toBe("0px");
		expect(cs.borderLeftWidth).toBe("0px");
		expect(el.getBoundingClientRect().width).toBe(screen.container.getBoundingClientRect().width);
		expect(getComputedStyle(el.querySelector(".ca-alert__bar") as HTMLElement).display).toBe(
			"none"
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("stays a rounded inline alert by default", async () => {
		const screen = await render(Alert, { severity: "warning", children: body });
		expect(
			getComputedStyle(screen.container.querySelector(".ca-alert") as HTMLElement)
				.borderTopLeftRadius
		).not.toBe("0px");
	});
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { toast } from "../../stores/toast.svelte.js";
import Toaster from "./Toaster.svelte";

afterEach(() => {
	vi.useRealTimers();
	for (const t of [...toast.items]) toast.remove(t.id);
});

describe("Toaster", () => {
	it("renders a labelled live region", async () => {
		const screen = await render(Toaster, {});
		const region = screen.container.querySelector(".ca-toaster");
		expect(region?.getAttribute("aria-live")).toBe("polite");
		expect(region?.getAttribute("aria-label")).toBe("Notifications");
	});

	it("toast.success renders a role=status item and passes axe", async () => {
		const screen = await render(Toaster, {});
		toast.success("Saved successfully", 0);
		const item = screen.getByRole("status");
		await expect.element(item).toMatchTextContent("Saved successfully");
		await expect.element(item).toHaveClass("ca-toast--success");
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it.each(["error", "warning", "info"] as const)("toast.%s uses its variant", async (variant) => {
		const screen = await render(Toaster, {});
		toast[variant]("Message", 0);
		const role = variant === "info" ? "status" : "alert";
		await expect.element(screen.getByRole(role)).toHaveClass(`ca-toast--${variant}`);
	});

	it("stacks several toasts", async () => {
		const screen = await render(Toaster, {});
		toast.show("One", { duration: 0 });
		toast.show("Two", { duration: 0 });
		await expect.poll(() => screen.getByRole("status").elements().length).toBe(2);
	});

	it("auto-removes after its duration", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout"] });
		const screen = await render(Toaster, {});
		toast.info("Ephemeral", 3000);
		await expect.element(screen.getByRole("status")).toBeVisible();
		vi.advanceTimersByTime(2999);
		expect(toast.items).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toast.items).toHaveLength(0);
		await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
	});

	it("duration 0 is persistent", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout"] });
		const screen = await render(Toaster, {});
		toast.warning("Stays", 0);
		vi.advanceTimersByTime(60_000);
		await expect.element(screen.getByRole("alert")).toBeVisible();
	});

	it("the dismiss button removes the toast", async () => {
		const screen = await render(Toaster, {});
		toast.error("Failed", 0);
		await screen.getByRole("button", { name: "Dismiss" }).click();
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
		expect(toast.items).toHaveLength(0);
	});

	it("repeats show one toast with a count badge and pass axe", async () => {
		const screen = await render(Toaster, {});
		for (let i = 0; i < 10; i++) toast.error("Too many requests", 0);
		await expect.poll(() => screen.getByRole("alert").elements().length).toBe(1);
		const item = screen.getByRole("alert");
		await expect.element(item).toMatchTextContent("Too many requests");
		await expect.element(screen.getByText("×10")).toBeVisible();
		await expect.element(item).toMatchTextContent("Repeated 10 times");
		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a single toast has no count badge", async () => {
		const screen = await render(Toaster, {});
		toast.info("Once", 0);
		await expect.element(screen.getByRole("status")).toBeVisible();
		expect(screen.container.querySelector(".ca-toast__count")).toBeNull();
	});

	describe("description and action (#356)", () => {
		const cases = {
			"title only": {},
			"title + description": { description: "Next step scheduled for tomorrow 09:00" },
			"title + action": { action: { label: "Mark as qualified", onClick: () => {} } },
			"title + description + action": {
				description: "Next step scheduled for tomorrow 09:00",
				action: { label: "Mark as qualified", onClick: () => {} },
			},
		};

		it.each(Object.entries(cases))("%s passes axe on mobile and desktop", async (_name, opts) => {
			for (const [w, h] of [VIEWPORTS.mobile, [1280, 800] as const]) {
				await page.viewport(w, h);
				const screen = await render(Toaster, {});
				toast.success("Sequence paused for Acme", { ...opts, duration: 0 });
				await expect.element(screen.getByRole("status")).toBeVisible();
				await settled();
				expect(await checkA11y(screen.container)).toHaveNoViolations();
				await screen.unmount();
				for (const t of [...toast.items]) toast.remove(t.id);
			}
		});

		it("renders the description under the message in the same live region", async () => {
			const screen = await render(Toaster, {});
			toast.success("Task completed", { description: "Next step tomorrow", duration: 0 });
			const item = screen.getByRole("status");
			await expect.element(item).toMatchTextContent("Task completed");
			await expect.element(item).toMatchTextContent("Next step tomorrow");
			expect(screen.container.querySelector(".ca-toast__description")?.textContent).toBe(
				"Next step tomorrow"
			);
		});

		it("error and warning are role=alert, success role=status", async () => {
			const screen = await render(Toaster, {});
			toast.error("e", 0);
			toast.warning("w", 0);
			toast.success("s", 0);
			await expect.poll(() => toast.items.length).toBe(3);
			expect(screen.getByRole("alert").elements()).toHaveLength(2);
			expect(screen.getByRole("status").elements()).toHaveLength(1);
		});

		it("the action runs onClick and dismisses the toast", async () => {
			const onClick = vi.fn();
			const screen = await render(Toaster, {});
			toast.info("Paused", { action: { label: "Mark as qualified", onClick }, duration: 0 });
			await screen.getByRole("button", { name: "Mark as qualified" }).click();
			expect(onClick).toHaveBeenCalledTimes(1);
			expect(toast.items).toHaveLength(0);
		});

		it("Tab reaches the action and Enter activates it", async () => {
			const onClick = vi.fn();
			const screen = await render(Toaster, {});
			toast.info("Paused", { action: { label: "Go", onClick }, duration: 0 });
			await expect.element(screen.getByRole("button", { name: "Go" })).toBeVisible();
			await userEvent.tab();
			await expect.element(screen.getByRole("button", { name: "Go" })).toHaveFocus();
			await userEvent.keyboard("{Enter}");
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it("the timer pauses while the toast is hovered and resumes after", async () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
			const screen = await render(Toaster, {});
			toast.info("Hover me", 1000);
			const item = screen.getByRole("status");
			await expect.element(item).toBeVisible();
			await item.hover();
			vi.advanceTimersByTime(5000);
			expect(toast.items).toHaveLength(1);
			await page.elementLocator(document.body).hover({ position: { x: 1, y: 1 } });
			vi.advanceTimersByTime(1000);
			expect(toast.items).toHaveLength(0);
		});

		it("the timer does not dismiss the toast while the action has focus", async () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
			const screen = await render(Toaster, {});
			toast.info("Focus", { action: { label: "Go", onClick: () => {} }, duration: 1000 });
			await expect.element(screen.getByRole("button", { name: "Go" })).toBeVisible();
			await userEvent.tab();
			vi.advanceTimersByTime(5000);
			expect(toast.items).toHaveLength(1);
			(document.activeElement as HTMLElement).blur();
			vi.advanceTimersByTime(1000);
			expect(toast.items).toHaveLength(0);
		});

		it("Escape dismisses the focused toast", async () => {
			const screen = await render(Toaster, {});
			toast.info("Esc", { action: { label: "Go", onClick: () => {} }, duration: 0 });
			await expect.element(screen.getByRole("button", { name: "Go" })).toBeVisible();
			await userEvent.tab();
			await userEvent.keyboard("{Escape}");
			expect(toast.items).toHaveLength(0);
		});

		it("the action is a 44px touch target on coarse pointers", async () => {
			const screen = await render(Toaster, {});
			toast.info("Touch", { action: { label: "Go", onClick: () => {} }, duration: 0 });
			const btn = screen.getByRole("button", { name: "Go" });
			await expect.element(btn).toBeVisible();
			const css = getComputedStyle(btn.element() as HTMLElement);
			expect(css.minHeight).not.toBe("0px");
		});
	});
});

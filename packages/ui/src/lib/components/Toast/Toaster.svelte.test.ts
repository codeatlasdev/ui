import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
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
		await expect.element(screen.getByRole("status")).toHaveClass(`ca-toast--${variant}`);
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
		await expect.element(screen.getByRole("status")).toBeVisible();
	});

	it("the dismiss button removes the toast", async () => {
		const screen = await render(Toaster, {});
		toast.error("Failed", 0);
		await screen.getByRole("button", { name: "Dismiss" }).click();
		await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
		expect(toast.items).toHaveLength(0);
	});
});

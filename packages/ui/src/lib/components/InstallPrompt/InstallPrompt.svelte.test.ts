import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import InstallPrompt from "./InstallPrompt.svelte";

const KEY = "ca-install-dismissed";

/** What Chromium fires: cancelable, with `prompt()` and `userChoice`. */
function installEvent(outcome: "accepted" | "dismissed" = "accepted") {
	const event = new Event("beforeinstallprompt", { cancelable: true });
	const prompt = vi.fn().mockResolvedValue(undefined);
	Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
	return { event, prompt };
}

beforeEach(() => localStorage.removeItem(KEY));
afterEach(() => vi.restoreAllMocks());

describe("InstallPrompt in Chromium", () => {
	it("renders nothing until the browser says the app is installable", async () => {
		const screen = await render(InstallPrompt, {});
		expect(screen.container.querySelector(".ca-install")).toBeNull();
	});

	it("shows the Install button after beforeinstallprompt, which it keeps from the mini-infobar", async () => {
		const screen = await render(InstallPrompt, {});
		const { event } = installEvent();
		dispatchEvent(event);
		await expect
			.element(screen.getByRole("button", { name: "Install", exact: true }))
			.toBeVisible();
		expect(event.defaultPrevented).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("Install opens the native dialog and reports the choice, then hides", async () => {
		const onchoice = vi.fn();
		const screen = await render(InstallPrompt, { onchoice });
		const { event, prompt } = installEvent("accepted");
		dispatchEvent(event);
		await screen.getByRole("button", { name: "Install", exact: true }).click();
		expect(prompt).toHaveBeenCalledOnce();
		await vi.waitFor(() => expect(onchoice).toHaveBeenCalledWith("accepted"));
		await vi.waitFor(() => expect(screen.container.querySelector(".ca-install")).toBeNull());
	});

	it("dismissing hides it, remembers for dismissDays and calls ondismiss", async () => {
		const ondismiss = vi.fn();
		const screen = await render(InstallPrompt, { ondismiss, dismissDays: 7 });
		dispatchEvent(installEvent().event);
		await screen.getByRole("button", { name: "Dismiss install prompt" }).click();
		expect(ondismiss).toHaveBeenCalledOnce();
		expect(screen.container.querySelector(".ca-install")).toBeNull();
		const until = JSON.parse(localStorage.getItem(KEY) ?? "0");
		expect(until).toBeGreaterThan(Date.now() + 6.9 * 86_400_000);
		expect(until).toBeLessThan(Date.now() + 7.1 * 86_400_000);
	});

	it("stays hidden while a previous dismissal is still in force, and returns after it", async () => {
		localStorage.setItem(KEY, JSON.stringify(Date.now() + 60_000));
		const hidden = await render(InstallPrompt, {});
		dispatchEvent(installEvent().event);
		await tick();
		expect(hidden.container.querySelector(".ca-install")).toBeNull();
		hidden.unmount();

		localStorage.setItem(KEY, JSON.stringify(Date.now() - 1));
		const shown = await render(InstallPrompt, {});
		dispatchEvent(installEvent().event);
		await expect.element(shown.getByRole("button", { name: "Install", exact: true })).toBeVisible();
	});

	it("renders nothing when the app already runs installed (standalone)", async () => {
		const real = window.matchMedia.bind(window);
		vi.spyOn(window, "matchMedia").mockImplementation((q) =>
			q === "(display-mode: standalone)"
				? ({ ...real(q), matches: true } as MediaQueryList)
				: real(q)
		);
		const screen = await render(InstallPrompt, {});
		dispatchEvent(installEvent().event);
		await tick();
		expect(screen.container.querySelector(".ca-install")).toBeNull();
	});

	it("hides on appinstalled and stops listening after unmount", async () => {
		const add = vi.spyOn(window, "addEventListener");
		const remove = vi.spyOn(window, "removeEventListener");
		const screen = await render(InstallPrompt, {});
		dispatchEvent(installEvent().event);
		await expect
			.element(screen.getByRole("button", { name: "Install", exact: true }))
			.toBeVisible();
		dispatchEvent(new Event("appinstalled"));
		await vi.waitFor(() => expect(screen.container.querySelector(".ca-install")).toBeNull());
		screen.unmount();
		for (const name of ["beforeinstallprompt", "appinstalled"])
			expect(remove.mock.calls.some(([n]) => n === name)).toBe(
				add.mock.calls.some(([n]) => n === name)
			);
	});
});

describe("InstallPrompt on iOS", () => {
	it("shows the Share-sheet steps and no Install button; axe passes", async () => {
		const screen = await render(InstallPrompt, { mode: "ios" });
		await expect.element(screen.getByText("Tap Share in the browser toolbar.")).toBeVisible();
		await expect.element(screen.getByText('Choose "Add to Home Screen".')).toBeVisible();
		expect(screen.container.querySelectorAll("ol li")).toHaveLength(2);
		await expect
			.element(screen.getByRole("button", { name: "Install", exact: true }))
			.not.toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("is picked automatically from an iPhone user agent", async () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"
		);
		const screen = await render(InstallPrompt, {});
		await expect.element(screen.getByText('Choose "Add to Home Screen".')).toBeVisible();
	});

	it("can be dismissed", async () => {
		const screen = await render(InstallPrompt, { mode: "ios" });
		await screen.getByRole("button", { name: "Dismiss install prompt" }).click();
		expect(screen.container.querySelector(".ca-install")).toBeNull();
		expect(localStorage.getItem(KEY)).not.toBeNull();
	});
});

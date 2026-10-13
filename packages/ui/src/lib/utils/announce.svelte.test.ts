import { afterEach, describe, expect, it } from "vitest";
import { announce } from "./announce.js";

const region = (p: "polite" | "assertive") =>
	document.querySelector<HTMLElement>(`[data-ca-announcer="${p}"]`);

afterEach(() => {
	for (const el of document.querySelectorAll("[data-ca-announcer]")) el.remove();
});

describe("announce", () => {
	it("creates one polite live region lazily and speaks into it", async () => {
		expect(region("polite")).toBeNull();
		announce("Saved");
		await expect.poll(() => region("polite")?.textContent).toBe("Saved");
		const el = region("polite");
		expect(el?.getAttribute("role")).toBe("status");
		expect(el?.getAttribute("aria-live")).toBe("polite");
		expect(el?.getAttribute("aria-atomic")).toBe("true");
		announce("Again");
		await expect.poll(() => region("polite")?.textContent).toBe("Again");
		expect(document.querySelectorAll('[data-ca-announcer="polite"]')).toHaveLength(1);
	});

	it("assertive uses its own role=alert region", async () => {
		announce("Failed", "assertive");
		await expect.poll(() => region("assertive")?.textContent).toBe("Failed");
		expect(region("assertive")?.getAttribute("role")).toBe("alert");
		expect(region("polite")).toBeNull();
	});

	it("re-announcing identical text re-triggers (region is emptied first)", async () => {
		announce("Same");
		await expect.poll(() => region("polite")?.textContent).toBe("Same");
		const seen: string[] = [];
		const el = region("polite") as HTMLElement;
		new MutationObserver(() => seen.push(el.textContent ?? "")).observe(el, { childList: true });
		announce("Same");
		await expect.poll(() => seen.at(-1)).toBe("Same");
		expect(seen).toContain("");
	});

	it("recreates the region if it was removed from the DOM", async () => {
		announce("One");
		await expect.poll(() => region("polite")?.textContent).toBe("One");
		region("polite")?.remove();
		announce("Two");
		await expect.poll(() => region("polite")?.textContent).toBe("Two");
	});

	it("ignores empty messages", () => {
		announce("");
		expect(region("polite")).toBeNull();
	});
});

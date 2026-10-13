import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "./toast.svelte.js";

afterEach(() => {
	vi.useRealTimers();
	for (const t of [...toast.items]) toast.remove(t.id);
});

describe("toast store", () => {
	it("show adds an item with defaults", () => {
		const id = toast.show("Hello");
		expect(toast.items).toEqual([{ id, message: "Hello", variant: "default", duration: 4000 }]);
	});

	it.each(["success", "error", "warning", "info"] as const)("%s sets the variant", (variant) => {
		toast[variant]("x", 0);
		expect(toast.items.at(-1)?.variant).toBe(variant);
	});

	it("show honours variant and duration options", () => {
		toast.show("x", { variant: "error", duration: 123 });
		expect(toast.items[0]).toMatchObject({ variant: "error", duration: 123 });
	});

	it("returns unique ids and remove only drops the target", () => {
		const a = toast.info("a", 0);
		const b = toast.info("b", 0);
		expect(a).not.toBe(b);
		toast.remove(a);
		expect(toast.items.map((t) => t.id)).toEqual([b]);
	});

	it("auto-removes after duration but keeps duration 0", () => {
		vi.useFakeTimers({ toFake: ["setTimeout"] });
		toast.info("temp", 1000);
		toast.info("stay", 0);
		vi.advanceTimersByTime(1000);
		expect(toast.items.map((t) => t.message)).toEqual(["stay"]);
	});
});

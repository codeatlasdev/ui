import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "./toast.svelte.js";

afterEach(() => {
	vi.useRealTimers();
	for (const t of [...toast.items]) toast.remove(t.id);
});

describe("toast store", () => {
	it("show adds an item with defaults", () => {
		const id = toast.show("Hello");
		expect(toast.items).toEqual([
			{ id, message: "Hello", variant: "default", duration: 4000, count: 1 },
		]);
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

	describe("dedupe, cap and id (#363)", () => {
		it("toast.error x10 keeps one toast", () => {
			const ids = Array.from({ length: 10 }, () => toast.error("x"));
			expect(toast.items).toHaveLength(1);
			expect(new Set(ids).size).toBe(1);
			expect(toast.items[0]?.count).toBe(10);
		});

		it("a repeat restarts the removal timer", () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
			toast.error("x", 1000);
			vi.advanceTimersByTime(900);
			toast.error("x", 1000);
			vi.advanceTimersByTime(900);
			expect(toast.items).toHaveLength(1);
			vi.advanceTimersByTime(100);
			expect(toast.items).toHaveLength(0);
		});

		it("same message with another variant is a separate toast", () => {
			toast.error("x", 0);
			toast.info("x", 0);
			expect(toast.items).toHaveLength(2);
		});

		it("keeps at most 3 toasts, dropping the oldest", () => {
			for (const m of ["a", "b", "c", "d"]) toast.info(m, 0);
			expect(toast.items.map((t) => t.message)).toEqual(["b", "c", "d"]);
		});

		it("the dropped toast's timer cannot remove a later one", () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
			toast.info("a", 1000);
			for (const m of ["b", "c", "d"]) toast.info(m, 0);
			toast.info("a", 0);
			vi.advanceTimersByTime(5000);
			expect(toast.items.map((t) => t.message)).toEqual(["c", "d", "a"]);
		});

		it("id replaces the toast in place and returns the same id", () => {
			const a = toast.info("Uploading", { id: "up", duration: 0 });
			toast.info("other", 0);
			const b = toast.success("Uploaded", { id: "up", duration: 0 });
			expect(b).toBe(a);
			expect(a).toBe("up");
			expect(toast.items.map((t) => [t.message, t.variant])).toEqual([
				["Uploaded", "success"],
				["other", "info"],
			]);
			expect(toast.items[0]?.id).toBe("up");
		});

		it("id replace restarts the timer and never counts as a repeat", () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
			toast.info("a", { id: "k", duration: 1000 });
			vi.advanceTimersByTime(900);
			toast.info("a", { id: "k", duration: 1000 });
			expect(toast.items[0]?.count).toBe(1);
			vi.advanceTimersByTime(900);
			expect(toast.items).toHaveLength(1);
			vi.advanceTimersByTime(100);
			expect(toast.items).toHaveLength(0);
		});
	});
});

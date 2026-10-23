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

	describe("description and action (#356)", () => {
		it("accepts description and action in the options object of a shortcut", () => {
			const onClick = vi.fn();
			toast.success("Done", {
				description: "Next step tomorrow",
				action: { label: "Undo", onClick },
				duration: 0,
			});
			expect(toast.items[0]).toMatchObject({
				description: "Next step tomorrow",
				action: { label: "Undo", onClick },
			});
		});

		it("an actionable toast defaults to 8s, a plain one stays 4s", () => {
			toast.info("plain");
			toast.info("with action", { action: { label: "Go", onClick: () => {} } });
			expect(toast.items.map((t) => t.duration)).toEqual([4000, 8000]);
		});

		it("an explicit duration wins over the actionable default", () => {
			toast.info("x", { action: { label: "Go", onClick: () => {} }, duration: 1500 });
			expect(toast.items[0]?.duration).toBe(1500);
		});

		it("positional duration keeps working next to the options object", () => {
			toast.error("x", 5000);
			expect(toast.items[0]).toMatchObject({ duration: 5000, variant: "error" });
		});

		it("same message with another description is a separate toast", () => {
			toast.info("Saved", { description: "a", duration: 0 });
			toast.info("Saved", { description: "b", duration: 0 });
			toast.info("Saved", { description: "b", duration: 0 });
			expect(toast.items.map((t) => [t.description, t.count])).toEqual([
				["a", 1],
				["b", 2],
			]);
		});

		it("toasts with an action are never merged", () => {
			const a = { label: "Go", onClick: () => {} };
			toast.info("Saved", { action: a, duration: 0 });
			toast.info("Saved", { action: a, duration: 0 });
			expect(toast.items).toHaveLength(2);
		});

		it("pause stops the timer and resume restarts it with the time left", () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
			const id = toast.info("x", 1000);
			vi.advanceTimersByTime(400);
			toast.pause(id);
			vi.advanceTimersByTime(5000);
			expect(toast.items).toHaveLength(1);
			toast.resume(id);
			vi.advanceTimersByTime(599);
			expect(toast.items).toHaveLength(1);
			vi.advanceTimersByTime(1);
			expect(toast.items).toHaveLength(0);
		});

		it("a repeat while paused keeps it paused until resume", () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
			const id = toast.info("x", 1000);
			toast.pause(id);
			toast.info("x", 1000);
			vi.advanceTimersByTime(5000);
			expect(toast.items).toHaveLength(1);
			toast.resume(id);
			vi.advanceTimersByTime(1000);
			expect(toast.items).toHaveLength(0);
		});
	});
});

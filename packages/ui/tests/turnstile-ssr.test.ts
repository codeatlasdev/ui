import { describe, expect, it } from "bun:test";
import { loadTurnstile } from "../src/lib/forms/turnstile-loader.js";

describe("turnstile loader on the server", () => {
	it("does not touch document or window and rejects with a clear error", async () => {
		expect(typeof document).toBe("undefined");
		await expect(loadTurnstile()).rejects.toThrow(/browser/i);
	});
});

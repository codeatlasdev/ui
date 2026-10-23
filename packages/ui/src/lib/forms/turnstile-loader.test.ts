import { afterEach, describe, expect, it } from "vitest";
import { loadTurnstile, resetTurnstileLoader, TURNSTILE_SRC } from "./turnstile-loader.js";

const scripts = () => document.querySelectorAll<HTMLScriptElement>("script[data-ca-turnstile]");

afterEach(() => {
	for (const s of scripts()) s.remove();
	delete (window as { turnstile?: unknown }).turnstile;
	resetTurnstileLoader();
});

describe("loadTurnstile", () => {
	it("injects the explicit-render script once, however many callers wait", async () => {
		const a = loadTurnstile();
		const b = loadTurnstile();
		expect(scripts()).toHaveLength(1);
		const s = scripts()[0];
		expect(s.src).toBe(TURNSTILE_SRC);
		expect(s.src).toContain("render=explicit");
		expect(s.async).toBe(true);
		(window as { turnstile?: unknown }).turnstile = { render() {} };
		s.dispatchEvent(new Event("load"));
		expect(await a).toBe(await b);
	});

	it("resolves immediately when the vendor API is already on the page", async () => {
		const api = { render() {} };
		(window as { turnstile?: unknown }).turnstile = api;
		expect(await loadTurnstile()).toBe(api);
		expect(scripts()).toHaveLength(0);
	});

	it("rejects when the script fails and a later call retries with a fresh tag", async () => {
		const first = loadTurnstile();
		scripts()[0].dispatchEvent(new Event("error"));
		await expect(first).rejects.toThrow(/turnstile/i);
		expect(scripts()).toHaveLength(0);
		const second = loadTurnstile();
		expect(scripts()).toHaveLength(1);
		(window as { turnstile?: unknown }).turnstile = { render() {} };
		scripts()[0].dispatchEvent(new Event("load"));
		await expect(second).resolves.toBeTruthy();
	});

	it("passes a CSP nonce to the tag", () => {
		loadTurnstile({ nonce: "abc123" });
		expect(scripts()[0].nonce || scripts()[0].getAttribute("nonce")).toBe("abc123");
	});
});

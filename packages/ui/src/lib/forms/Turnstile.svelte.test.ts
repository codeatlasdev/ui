import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { settled } from "../../../tests/settled";
import { setLocale } from "../i18n/index.js";
import { colorScheme } from "../stores/color-scheme.svelte.js";
import Harness from "./Turnstile.test.svelte";
import { resetTurnstileLoader } from "./turnstile-loader.js";

interface Opts {
	sitekey: string;
	action?: string;
	theme?: string;
	language?: string;
	callback: (t: string) => void;
	"expired-callback": () => void;
	"error-callback": (c: string) => void;
}
interface Call {
	id: string;
	el: HTMLElement;
	opts: Opts;
}

let calls: Call[];
let removed: string[];
let resets: string[];

function installFake() {
	calls = [];
	removed = [];
	resets = [];
	(window as unknown as { turnstile: unknown }).turnstile = {
		render(el: HTMLElement, opts: Opts) {
			const id = `w${calls.length + 1}`;
			calls.push({ id, el, opts });
			el.setAttribute("data-fake-widget", id);
			return id;
		},
		remove(id: string) {
			removed.push(id);
		},
		reset(id: string) {
			resets.push(id);
		},
	};
}

// The loader resolves in microtasks when `window.turnstile` is already there, and the widget renders in
// the effect after it: a settled frame covers both. Waits for a widget that must APPEAR poll on `calls`.
const rendered = (n: number) => expect.poll(() => calls.length).toBe(n);
const last = () => calls[calls.length - 1];

beforeEach(() => {
	resetTurnstileLoader();
	installFake();
	colorScheme.setPreference("light");
	setLocale("en");
});
afterEach(() => {
	delete (window as { turnstile?: unknown }).turnstile;
	for (const s of document.querySelectorAll("script[data-ca-turnstile]")) s.remove();
	setLocale("en");
});

describe("Turnstile", () => {
	it("without a site key renders nothing, loads nothing and returns no token", async () => {
		delete (window as { turnstile?: unknown }).turnstile;
		const screen = await render(Harness, {});
		await settled();
		expect(screen.container.querySelector(".ca-turnstile")).toBeNull();
		expect(document.querySelector("script[data-ca-turnstile]")).toBeNull();
		await expect.element(screen.getByTestId("token")).toHaveTextContent("none");
	});

	it("renders explicitly with sitekey, action, scheme theme and the locale", async () => {
		await render(Harness, { siteKey: "0xKEY", action: "sign-in" });
		await rendered(1);
		expect(calls).toHaveLength(1);
		expect(last().opts.sitekey).toBe("0xKEY");
		expect(last().opts.action).toBe("sign-in");
		expect(last().opts.theme).toBe("light");
		expect(last().opts.language).toBe("en");
	});

	it("passes the token to onverify, the bound token and handle.getToken()", async () => {
		const verified: string[] = [];
		const screen = await render(Harness, { siteKey: "k", verified });
		await rendered(1);
		last().opts.callback("TOKEN-1");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("TOKEN-1");
		await expect.element(screen.getByTestId("token")).toHaveTextContent("TOKEN-1");
		expect(verified).toEqual(["TOKEN-1"]);
	});

	it("reset() resets the widget and clears the token", async () => {
		const screen = await render(Harness, { siteKey: "k" });
		await rendered(1);
		last().opts.callback("T");
		await screen.getByRole("button", { name: "reset" }).click();
		expect(resets).toEqual([last().id]);
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("none");
	});

	it("an expired or errored widget clears the token and reports it", async () => {
		const errors: string[] = [];
		const expired = { n: 0 };
		const screen = await render(Harness, { siteKey: "k", errors, expired });
		await rendered(1);
		last().opts.callback("T");
		last().opts["expired-callback"]();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("none");
		expect(expired.n).toBe(1);
		last().opts.callback("T2");
		last().opts["error-callback"]("110200");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("none");
		expect(errors).toEqual(["110200"]);
	});

	it("re-renders in the new language when the locale changes, removing the old widget", async () => {
		await render(Harness, { siteKey: "k" });
		await rendered(1);
		expect(calls).toHaveLength(1);
		setLocale("pt-BR");
		await rendered(2);
		expect(removed).toEqual(["w1"]);
		expect(calls).toHaveLength(2);
		expect(last().opts.language).toBe("pt-br");
	});

	it("follows the colour scheme when theme is auto, an explicit theme wins", async () => {
		await render(Harness, { siteKey: "k" });
		await rendered(1);
		colorScheme.setPreference("dark");
		await expect.poll(() => last().opts.theme).toBe("dark");
		await render(Harness, { siteKey: "k2", theme: "light" });
		await expect.poll(() => last().opts.sitekey).toBe("k2");
		expect(last().opts.theme).toBe("light");
	});

	it("removes the widget on unmount (no leak)", async () => {
		const screen = await render(Harness, { siteKey: "k" });
		await rendered(1);
		const id = last().id;
		screen.unmount();
		expect(removed).toContain(id);
	});

	it("unmounting before the script loads never renders a widget", async () => {
		delete (window as { turnstile?: unknown }).turnstile;
		const screen = await render(Harness, { siteKey: "k" });
		screen.unmount();
		installFake();
		document.querySelector("script[data-ca-turnstile]")?.dispatchEvent(new Event("load"));
		await settled();
		expect(calls).toHaveLength(0);
	});

	it("has no axe violations with and without a key", async () => {
		const a = await render(Harness, { siteKey: "k" });
		await rendered(1);
		expect(await checkA11y(a.container)).toHaveNoViolations();
		a.unmount();
		const b = await render(Harness, {});
		expect(await checkA11y(b.container)).toHaveNoViolations();
	});
});

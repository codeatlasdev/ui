import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";

type Nav = { type: string };
const callbacks: Array<(nav: Nav) => void> = [];

// `$app/navigation` only exists inside a SvelteKit app: stub `afterNavigate` so the test can fire navigations.
vi.mock("$app/navigation", () => ({
	afterNavigate: (cb: (nav: Nav) => void) => {
		callbacks.push(cb);
	},
}));

const { default: RouteAnnouncer } = await import("./route-announcer.svelte");

const polite = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent;
const navigate = (type: string) => {
	for (const cb of callbacks) cb({ type });
};

afterEach(() => {
	callbacks.length = 0;
	document.title = "";
	for (const el of document.querySelectorAll("[data-ca-announcer], h1")) el.remove();
});

describe("RouteAnnouncer", () => {
	it("announces document.title after a client-side navigation", async () => {
		await render(RouteAnnouncer, {});
		document.title = "Billing";
		navigate("link");
		await expect.poll(polite).toBe("Billing");
	});

	it("stays silent on the first load (type enter)", async () => {
		await render(RouteAnnouncer, {});
		document.title = "Home";
		navigate("enter");
		await new Promise((r) => setTimeout(r, 150));
		expect(polite()).toBeUndefined();
	});

	it("falls back to the page <h1> when the route has no title", async () => {
		await render(RouteAnnouncer, {});
		const h1 = document.createElement("h1");
		h1.textContent = "Team settings";
		document.body.append(h1);
		navigate("goto");
		await expect.poll(polite).toBe("Team settings");
	});

	it("prefixes the title when `prefix` is set", async () => {
		await render(RouteAnnouncer, { props: { prefix: "Navegou para" } });
		document.title = "Faturas";
		navigate("popstate");
		await expect.poll(polite).toBe("Navegou para Faturas");
	});
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";

// `$app/state` only exists inside a SvelteKit app: a reactive stand-in the test can drive.
const nav = vi.hoisted(() => ({
	state: { from: null as unknown, to: null as unknown, type: null as string | null },
}));
vi.mock("$app/state", async () => {
	const { proxyState } = await import("../../../tests/nav-state.svelte");
	nav.state = proxyState;
	return { navigating: proxyState, page: { url: new URL("http://localhost/") } };
});

const { default: NavigationProgress } = await import("./navigation-progress.svelte");
const { pendingLink } = await import("./pending-link.svelte.js");

const start = (href: string) => {
	nav.state.from = { url: new URL("http://localhost/") };
	nav.state.to = { url: new URL(href, "http://localhost/") };
	nav.state.type = "link";
};
const end = () => {
	nav.state.from = nav.state.to = nav.state.type = null;
};
const bar = () => document.querySelector<HTMLElement>("[data-ca-nav-progress]");

afterEach(end);

describe("NavigationProgress", () => {
	it("stays hidden for a navigation that ends before `delay`", async () => {
		// A long delay keeps this deterministic under CPU load: `end()` always wins the race.
		await render(NavigationProgress, { props: { delay: 5000 } });
		start("/slow");
		await new Promise((r) => setTimeout(r, 50));
		expect(bar()?.hidden).toBe(true);
		end();
		await new Promise((r) => setTimeout(r, 50));
		expect(bar()?.hidden).toBe(true);
		expect(document.documentElement.hasAttribute("data-ca-navigating")).toBe(false);
	});

	it("shows an indeterminate progressbar while navigating, then hides", async () => {
		const screen = await render(NavigationProgress, {
			props: { delay: 20, label: "Loading page" },
		});
		start("/slow");
		await expect.poll(() => bar()?.hidden).toBe(false);
		const pb = screen.container.querySelector("[role=progressbar]") as HTMLElement;
		expect(pb.getAttribute("aria-label")).toBe("Loading page");
		expect(pb.hasAttribute("aria-valuenow")).toBe(false);
		expect(document.documentElement.hasAttribute("data-ca-navigating")).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		end();
		await expect.poll(() => bar()?.hidden).toBe(true);
		expect(document.documentElement.hasAttribute("data-ca-navigating")).toBe(false);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("pendingLink", () => {
	it("marks only the link being navigated to with data-pending", async () => {
		const a = document.createElement("a");
		a.href = "/billing";
		const b = document.createElement("a");
		b.href = "/team";
		document.body.append(a, b);
		// Attachments run inside an effect: `$effect.root` stands in for the component.
		const mount = (n: HTMLAnchorElement) =>
			$effect.root(() => {
				pendingLink()(n);
			});
		const offA = mount(a);
		const offB = mount(b);
		start("/billing?tab=1");
		await expect.poll(() => a.hasAttribute("data-pending")).toBe(true);
		expect(b.hasAttribute("data-pending")).toBe(false);
		expect(a.getAttribute("aria-busy")).toBe("true");
		end();
		await expect.poll(() => a.hasAttribute("data-pending")).toBe(false);
		expect(a.hasAttribute("aria-busy")).toBe(false);
		offA();
		offB();
		a.remove();
		b.remove();
	});
});

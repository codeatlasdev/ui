import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SplashScreen from "./SplashScreen.svelte";

const logo = createRawSnippet(() => ({
	render: () => '<svg aria-hidden="true" data-testid="logo"></svg>',
}));
const splash = (c: HTMLElement) => c.querySelector<HTMLElement>(".ca-splash");

describe("SplashScreen", () => {
	it("is a polite status region with a localised accessible name", async () => {
		const screen = await render(SplashScreen, { logo, ready: false });
		const el = splash(screen.container) as HTMLElement;
		expect(el.getAttribute("role")).toBe("status");
		expect(el.getAttribute("aria-label")).toBe("Loading…");
		await expect.element(screen.getByTestId("logo")).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("label prop overrides the catalog name", async () => {
		const screen = await render(SplashScreen, { label: "Opening Acme", ready: false });
		expect(splash(screen.container)?.getAttribute("aria-label")).toBe("Opening Acme");
	});

	it("stays at least minDuration after mount even when ready at once, then calls ondone", async () => {
		let done = 0;
		const screen = await render(SplashScreen, { minDuration: 300, ondone: () => done++ });
		expect(splash(screen.container)).not.toBeNull();
		expect(done).toBe(0);
		await expect.poll(() => splash(screen.container), { timeout: 2000 }).toBeNull();
		expect(done).toBe(1);
	});

	it("waits for ready after minDuration has passed, then leaves", async () => {
		let done = 0;
		const screen = await render(SplashScreen, {
			minDuration: 50,
			ready: false,
			ondone: () => done++,
		});
		await new Promise((r) => setTimeout(r, 200));
		expect(splash(screen.container)).not.toBeNull();
		await screen.rerender({ ready: true });
		await expect.poll(() => splash(screen.container)).toBeNull();
		expect(done).toBe(1);
	});

	it("is skipped (never rendered) under prefers-reduced-motion and still calls ondone", async () => {
		const real = window.matchMedia.bind(window);
		window.matchMedia = ((q: string) =>
			q.includes("prefers-reduced-motion")
				? ({
						matches: true,
						media: q,
						addEventListener() {},
						removeEventListener() {},
					} as unknown as MediaQueryList)
				: real(q)) as typeof window.matchMedia;
		try {
			let done = 0;
			const screen = await render(SplashScreen, { minDuration: 600, ondone: () => done++ });
			expect(splash(screen.container)).toBeNull();
			expect(done).toBe(1);
		} finally {
			window.matchMedia = real;
		}
	});

	it("has no axe violations while shown", async () => {
		const screen = await render(SplashScreen, { ready: false, logo });
		expect(splash(screen.container)).not.toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

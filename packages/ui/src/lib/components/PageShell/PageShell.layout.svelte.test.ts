import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Host from "./PageShellLayout.test.svelte";

const rect = (el: Element) => el.getBoundingClientRect();
const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

async function mount(props: Parameters<typeof render<typeof Host>>[1], vw = 1440) {
	await page.viewport(vw, 900);
	const screen = await render(Host, props);
	await settled();
	const q = (s: string) => screen.container.querySelector(s) as HTMLElement;
	return {
		screen,
		shell: q(".ca-page-shell"),
		main: q(".ca-page-shell__main"),
		aside: q(".ca-page-shell__aside"),
	};
}

describe("PageShell aside and width (#342)", () => {
	afterEach(async () => {
		await page.viewport(1280, 720);
	});

	it("an aside sits right of the content on a wide shell and sticks", async () => {
		const { screen, main, aside } = await mount({ withAside: true });
		expect(aside.tagName).toBe("ASIDE");
		expect(rect(aside).left).toBeGreaterThanOrEqual(rect(main).right);
		expect(Math.abs(rect(aside).top - rect(main).top)).toBeLessThan(1);
		expect(getComputedStyle(aside).position).toBe("sticky");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the aside is named so the landmark is distinguishable", async () => {
		const { aside } = await mount({ withAside: true, asideLabel: "Section index" });
		expect(aside.getAttribute("aria-label")).toBe("Section index");
	});

	it("the aside falls below the content on a narrow shell", async () => {
		const { screen, main, aside } = await mount({ withAside: true }, 800);
		expect(rect(aside).top).toBeGreaterThanOrEqual(rect(main).bottom);
		expect(getComputedStyle(aside).position).not.toBe("sticky");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("width=reading caps the content column at 46rem", async () => {
		const { screen, main } = await mount({ width: "reading" });
		expect(rect(main).width).toBeLessThanOrEqual(46 * rem() + 0.5);
		expect(rect(main).width).toBeGreaterThan(45 * rem());
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("width=reading keeps the aside next to the capped column", async () => {
		const { main, aside } = await mount({ width: "reading", withAside: true });
		expect(rect(main).width).toBeLessThanOrEqual(46 * rem() + 0.5);
		expect(rect(aside).left).toBeGreaterThanOrEqual(rect(main).right);
	});

	it("without aside or width the column fills the shell as before", async () => {
		const { shell, main } = await mount({});
		expect(rect(main).width).toBeGreaterThan(rect(shell).width - 100);
	});
});

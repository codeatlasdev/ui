import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { setLocale } from "../../i18n/index.js";
import Harness from "./ClampedText.test.svelte";

/** `n` short lines; the harness renders `\n` as a line break and each line is 24px tall. */
const lines = (n: number) =>
	Array.from({ length: n }, (_, i) => `Line ${i + 1} of the post`).join("\n");
/** One wrapping paragraph: about 7 lines at 320px, 2 at 1200px. */
const PARAGRAPH = "The quick brown fox jumps over the lazy dog. ".repeat(6).trim();

/** Two frames: a ResizeObserver callback and the update it schedules have both run. */
const frames = async (n = 2) => {
	for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame);
};

/** A tall block so the page scrolls (inline height: test fixture, not component CSS). */
const filler = () => {
	const el = document.createElement("div");
	el.style.height = "3000px";
	return el;
};

const region = (root: Element) => root.querySelector(".ca-clamped-text__content") as HTMLElement;

/** A DOM click: Playwright's click scrolls its target toward the centre first, which is exactly the
 *  movement the scroll tests measure. */
const press = (button: { element(): Element }) => (button.element() as HTMLButtonElement).click();

afterEach(() => {
	setLocale("en");
	window.scrollTo(0, 0);
});

describe("ClampedText", () => {
	it("shows no button when the text fits", async () => {
		const screen = await render(Harness, { text: lines(2), lines: 6 });
		await frames();
		expect(screen.container.querySelector("button")).toBeNull();
		expect(region(screen.container).clientHeight).toBe(48);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("offers Show more when 9 lines are clamped to 6", async () => {
		const screen = await render(Harness, { text: lines(9), lines: 6 });
		const button = screen.getByRole("button", { name: "Show more" });
		await expect.element(button).toHaveAttribute("aria-expanded", "false");
		const el = button.element() as HTMLButtonElement;
		// WCAG 2.5.3: the accessible name is the visible text.
		expect(el.textContent?.trim()).toBe("Show more");
		const text = region(screen.container);
		expect(el.getAttribute("aria-controls")).toBe(text.id);
		expect(text.textContent).toContain("Line 9");
		expect(text.clientHeight).toBe(6 * 24);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("expands and collapses on click", async () => {
		const screen = await render(Harness, { text: lines(9), lines: 6 });
		const root = screen.getByTestId("post");
		await screen.getByRole("button", { name: "Show more" }).click();
		const less = screen.getByRole("button", { name: "Show less" });
		await expect.element(less).toHaveAttribute("aria-expanded", "true");
		await expect.element(root).toHaveAttribute("data-state", "expanded");
		await expect.element(root).toHaveClass("post");
		expect(region(screen.container).clientHeight).toBe(9 * 24);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await less.click();
		const more = screen.getByRole("button", { name: "Show more" });
		await expect.element(more).toHaveAttribute("aria-expanded", "false");
		expect(region(screen.container).clientHeight).toBe(6 * 24);
	});

	it("reads its labels from the pt-BR catalog", async () => {
		setLocale("pt-BR");
		const screen = await render(Harness, { text: lines(9), lines: 6 });
		await screen.getByRole("button", { name: "Ver mais" }).click();
		await expect
			.element(screen.getByRole("button", { name: "Ver menos" }))
			.toHaveAttribute("aria-expanded", "true");
	});

	it("moreLabel and lessLabel override the catalog", async () => {
		const screen = await render(Harness, {
			text: lines(9),
			lines: 6,
			moreLabel: "Read the whole post",
			lessLabel: "Shorten",
		});
		await screen.getByRole("button", { name: "Read the whole post" }).click();
		await expect.element(screen.getByRole("button", { name: "Shorten" })).toBeVisible();
	});

	it("keeps the page scroll position when expanding", async () => {
		const above = filler();
		const below = filler();
		const screen = await render(Harness, { text: lines(9), lines: 6 });
		document.body.prepend(above);
		document.body.append(below);
		try {
			const button = screen.getByRole("button", { name: "Show more" });
			await expect.element(button).toBeVisible();
			// Only the button is in view; the clamped text ends just above the fold (the button
			// sits a few px below it). The browser's scroll anchoring would pick the button here.
			const textBottom = region(screen.container).getBoundingClientRect().bottom;
			window.scrollTo(0, window.scrollY + textBottom + 1);
			await frames();
			const before = window.scrollY;
			expect(before).toBeGreaterThan(0);
			expect((button.element() as HTMLElement).getBoundingClientRect().top).toBeGreaterThan(0);
			press(button);
			await expect.element(screen.getByRole("button", { name: "Show less" })).toBeVisible();
			await frames();
			expect(window.scrollY).toBe(before);
		} finally {
			above.remove();
			below.remove();
		}
	});

	it("keeps the button in view after collapsing", async () => {
		const below = filler();
		const screen = await render(Harness, { text: lines(80), lines: 3 });
		document.body.append(below);
		try {
			await screen.getByRole("button", { name: "Show more" }).click();
			const less = screen.getByRole("button", { name: "Show less" });
			await expect.element(less).toBeVisible();
			// At the end of the expanded text: its first line is far above the fold.
			const bottom = (less.element() as HTMLElement).getBoundingClientRect().bottom;
			window.scrollTo(0, window.scrollY + bottom - innerHeight + 8);
			await frames();
			press(less);
			const more = screen.getByRole("button", { name: "Show more" });
			await expect.element(more).toHaveAttribute("aria-expanded", "false");
			await frames();
			const box = (more.element() as HTMLElement).getBoundingClientRect();
			expect(box.top).toBeGreaterThanOrEqual(0);
			expect(box.bottom).toBeLessThanOrEqual(innerHeight);
		} finally {
			below.remove();
		}
	});

	it("re-measures when the width changes", async () => {
		const screen = await render(Harness, { text: PARAGRAPH, lines: 3, width: 320 });
		const button = screen.getByRole("button", { name: "Show more" });
		await expect.element(button).toBeVisible();
		const host = screen.getByTestId("host").element() as HTMLElement;
		host.style.setProperty("--host-w", "1200px");
		await expect.element(button).not.toBeInTheDocument();
		host.style.setProperty("--host-w", "320px");
		await expect.element(button).toBeVisible();
	});
});

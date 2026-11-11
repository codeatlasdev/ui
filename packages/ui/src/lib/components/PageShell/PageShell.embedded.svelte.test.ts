import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import Host from "./PageShellEmbedded.test.svelte";

const left = (el: Element) => el.getBoundingClientRect().left;

async function mount(kind: "settings" | "list" | "form", embedded = true, vw = 1280) {
	await page.viewport(vw, 900);
	const screen = await render(Host, { kind, embedded });
	await settled();
	const q = (s: string) => screen.container.querySelector(s) as HTMLElement | null;
	return { q, screen };
}

const ROOT = { settings: ".ca-app-settings", list: ".ca-app-list", form: ".ca-app-form" } as const;
const BODY = {
	settings: ".ca-app-settings__content",
	list: ".ca-app-list__body",
	form: ".ca-app-form__inner",
} as const;

describe("App* embedded (#917)", () => {
	afterEach(async () => {
		await page.viewport(1280, 720);
	});

	for (const kind of ["settings", "list", "form"] as const) {
		it(`${kind}: embedded aligns, no gutter`, async () => {
			for (const vw of [360, 1280, 1920]) {
				const { q, screen } = await mount(kind, true, vw);
				const title = q(".ca-page-shell__title") as HTMLElement;
				const body = q(BODY[kind]) as HTMLElement;
				expect(Number.parseFloat(getComputedStyle(body).paddingLeft)).toBe(0);
				// AppSettings puts its nav first; the others start with their body.
				const first = kind === "settings" ? (q(".ca-app-settings__nav") as HTMLElement) : body;
				expect(Math.abs(left(first) - left(title))).toBeLessThan(1);
				screen.unmount();
			}
		});

		it(`${kind}: embedded has no 2nd header`, async () => {
			const { q, screen } = await mount(kind);
			expect(q(`${ROOT[kind]}__header`)).toBeNull();
			expect(screen.container.querySelectorAll("h1")).toHaveLength(1);
			expect(screen.container.textContent).not.toContain("Inner title");
		});

		it(`${kind}: standalone keeps gutter`, async () => {
			const { q } = await mount(kind, false);
			expect(q(`${ROOT[kind]}__header`)).not.toBeNull();
			if (kind !== "list") {
				expect(
					Number.parseFloat(getComputedStyle(q(BODY[kind]) as HTMLElement).paddingLeft)
				).toBeGreaterThan(0);
			}
		});
	}

	it("same title size as PageShell", async () => {
		const { q, screen } = await mount("settings", false);
		const shell = getComputedStyle(q(".ca-page-shell__title") as HTMLElement).fontSize;
		const app = getComputedStyle(q(".ca-app-settings__title") as HTMLElement).fontSize;
		expect(app).toBe(shell);
		screen.unmount();
	});
});

import type { Component } from "svelte";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import type { ColorScheme, SurfaceStyle } from "../src/lib/stores/color-scheme.svelte";
import { colorScheme } from "../src/lib/stores/color-scheme.svelte";

export const SCHEMES = ["dark", "light"] as const satisfies readonly ColorScheme[];
export const STYLES = ["glass", "solid"] as const satisfies readonly SurfaceStyle[];

type Theme = { scheme: (typeof SCHEMES)[number]; style: SurfaceStyle };

/**
 * Resolves once the page is visually quiescent: fonts loaded, every <link rel=stylesheet>
 * applied, and layout stable across two consecutive frames (CSS imported by lazily mounted
 * components is injected by Vite after first paint, which otherwise races the screenshot).
 */
export async function vrtReady({
	parkPointer = true,
}: {
	parkPointer?: boolean;
} = {}): Promise<void> {
	await document.fonts.ready;
	if (parkPointer) {
		// Park the real pointer after layout exists: the previous test may have left it over this one's
		// elements, which would render them in :hover.
		let parking = document.querySelector<HTMLElement>('[data-testid="vrt-pointer-parking"]');
		if (!parking) {
			parking = document.createElement("div");
			parking.setAttribute("data-testid", "vrt-pointer-parking");
			parking.style.cssText =
				"position:fixed;right:0;bottom:0;width:1px;height:1px;z-index:2147483647;pointer-events:auto";
			document.body.append(parking);
		}
		await page.getByTestId("vrt-pointer-parking").hover({ force: true });
	}
	await expect
		.poll(() =>
			[...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every(
				(l) => l.sheet
			)
		)
		.toBe(true);
	let last = "";
	await expect
		.poll(async () => {
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
			const root = document.querySelector('[data-testid="matrix"]') ?? document.body;
			const r = root.getBoundingClientRect();
			const sig = `${r.width}x${r.height}|${document.styleSheets.length}`;
			const stable = sig === last;
			last = sig;
			return stable;
		})
		.toBe(true);
}

/** Applies scheme/style through the real store (sets `.dark` + `data-style` on <html>). */
export function applyTheme({ scheme, style }: Theme) {
	colorScheme.setPreference(scheme);
	colorScheme.setStyle(style);
}

/**
 * One screenshot per scheme × style of the `data-testid="matrix"` element rendered by `Matrix`.
 * Baseline name: `${name}-${scheme}-${style}`.
 */
export function matrixVrt<P extends Record<string, unknown>>(
	name: string,
	Matrix: Component<P>,
	props: Partial<NoInfer<P>> = {}
) {
	describe(`${name} (vrt)`, () => {
		for (const scheme of SCHEMES) {
			for (const style of STYLES) {
				it(`${scheme} / ${style}`, async () => {
					applyTheme({ scheme, style });
					// `render` overloads cannot resolve an unresolved generic; callers are already checked against P.
					await render(Matrix as unknown as Component<Record<string, unknown>>, props);
					await vrtReady();
					await expect
						.element(page.getByTestId("matrix"))
						.toMatchScreenshot(`${name}-${scheme}-${style}`);
				});
			}
		}
	});
}

/**
 * Overlay variant: `open` runs after render (click trigger, press keys); the element with
 * `role` (+ optional accessible `name`) is then captured.
 */
export function overlayVrt<P extends Record<string, unknown>>(
	name: string,
	Matrix: Component<P>,
	open: () => Promise<void>,
	role: "dialog" | "alertdialog" | "menu" | "tooltip" | "listbox",
	props: Partial<NoInfer<P>> = {}
) {
	describe(`${name} (vrt)`, () => {
		for (const scheme of SCHEMES) {
			for (const style of STYLES) {
				it(`${scheme} / ${style}`, async () => {
					applyTheme({ scheme, style });
					// `render` overloads cannot resolve an unresolved generic; callers are already checked against P.
					await render(Matrix as unknown as Component<Record<string, unknown>>, props);
					await open();
					const target = page.getByRole(role);
					await expect.element(target).toBeVisible();
					await vrtReady({ parkPointer: false });
					await expect.element(target).toMatchScreenshot(`${name}-${scheme}-${style}`);
				});
			}
		}
	});
}

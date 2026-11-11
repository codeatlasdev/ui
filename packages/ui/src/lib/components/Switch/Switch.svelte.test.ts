import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import SwitchHarness from "./SwitchHarness.test.svelte";

describe("Switch", () => {
	it("label names the switch; Space toggles aria-checked and the bound value", async () => {
		const screen = await render(SwitchHarness, { label: "Notifications" });
		const sw = screen.getByRole("switch", { name: "Notifications" });
		await expect.element(sw).toHaveAttribute("aria-checked", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		sw.element().focus();
		await userEvent.keyboard(" ");
		await expect.element(sw).toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await userEvent.keyboard("{Enter}");
		await expect.element(sw).toHaveAttribute("aria-checked", "false");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("false");
	});

	it("clicking the label toggles and calls onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(SwitchHarness, { label: "Dark mode", onchange });
		await screen.getByText("Dark mode").click();
		expect(onchange).toHaveBeenCalledWith(true);
		await expect.element(screen.getByRole("switch", { name: "Dark mode" })).toBeChecked();
	});

	it("starts checked when bound value is true", async () => {
		const screen = await render(SwitchHarness, { label: "On", initial: true });
		await expect
			.element(screen.getByRole("switch", { name: "On" }))
			.toHaveAttribute("aria-checked", "true");
	});

	it("disabled does not toggle", async () => {
		const onchange = vi.fn();
		const screen = await render(SwitchHarness, { label: "Locked", disabled: true, onchange });
		const sw = screen.getByRole("switch", { name: "Locked" });
		await expect.element(sw).toBeDisabled();
		await sw.click({ force: true });
		expect(onchange).not.toHaveBeenCalled();
	});
});

describe("Switch geometry tokens (#691)", () => {
	const root = document.documentElement;
	const TOKENS = {
		"--ca-switch-track-width": "40px",
		"--ca-switch-track-height": "24px",
		"--ca-switch-padding": "2px",
		"--ca-switch-border-width": "1px",
		"--ca-switch-thumb-size": "18px",
		"--ca-switch-thumb-bg": "rgb(10, 20, 30)",
		"--ca-switch-thumb-shadow": "none",
		"--ca-switch-on-bg": "rgb(1, 2, 3)",
	};

	async function withTokens(tokens: Record<string, string>, fn: () => Promise<void>) {
		for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
		try {
			await fn();
		} finally {
			for (const k of Object.keys(tokens)) root.style.removeProperty(k);
		}
	}

	/** Track and thumb boxes; the thumb must touch the inner edge of the track at the current end. */
	function boxes(container: Element) {
		const track = q(container, ".ca-switch").getBoundingClientRect();
		const thumb = q(container, ".ca-switch__thumb").getBoundingClientRect();
		const c = getComputedStyle(q(container, ".ca-switch"));
		const inset = parseFloat(c.paddingLeft) + parseFloat(c.borderLeftWidth);
		return { track, thumb, inset };
	}

	it("measures the configured track and thumb with the thumb flush at both ends", async () => {
		await withTokens(TOKENS, async () => {
			const screen = await render(SwitchHarness, { label: "Tokens" });
			const sw = screen.getByRole("switch", { name: "Tokens" });
			const off = boxes(screen.container);
			expect(off.track.width).toBe(40);
			expect(off.track.height).toBe(24);
			expect(off.thumb.width).toBe(18);
			expect(off.thumb.height).toBe(18);
			expect(off.thumb.left - off.track.left).toBeCloseTo(off.inset, 1);
			expect(getComputedStyle(q(screen.container, ".ca-switch__thumb")).backgroundColor).toBe(
				"rgb(10, 20, 30)"
			);
			expect(getComputedStyle(q(screen.container, ".ca-switch__thumb")).boxShadow).toBe("none");

			await sw.click();
			await expect.element(sw).toBeChecked();
			await vi.waitFor(() => {
				const on = boxes(screen.container);
				expect(on.track.width).toBe(40);
				expect(on.track.right - on.thumb.right).toBeCloseTo(on.inset, 1);
			});
			// The track transitions its background: read once, the runner caught it mid-way (#1013).
			await expect
				.poll(() => getComputedStyle(q(screen.container, ".ca-switch")).backgroundColor)
				.toBe("rgb(1, 2, 3)");
		});
	});

	it("size=sm is a 32x20 track with a 14px thumb, flush at both ends", async () => {
		const screen = await render(SwitchHarness, { label: "Compact", size: "sm" });
		const sw = screen.getByRole("switch", { name: "Compact" });
		const off = boxes(screen.container);
		expect([off.track.width, off.track.height]).toEqual([32, 20]);
		expect([off.thumb.width, off.thumb.height]).toEqual([14, 14]);
		expect(off.thumb.left - off.track.left).toBeCloseTo(off.inset, 1);
		await sw.click();
		await vi.waitFor(() => {
			const on = boxes(screen.container);
			expect(on.track.width).toBe(32);
			expect(on.track.right - on.thumb.right).toBeCloseTo(on.inset, 1);
		});
	});

	it("defaults keep the 44x24 track and 20px thumb", async () => {
		const screen = await render(SwitchHarness, { label: "Default" });
		const { track, thumb } = boxes(screen.container);
		expect([track.width, track.height, thumb.width]).toEqual([44, 24, 20]);
	});
});

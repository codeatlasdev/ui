import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { withTheme } from "../../testing";
import Badge from "./Badge.svelte";
import BadgeSolidTones from "./BadgeSolidTones.test.svelte";

const child = createRawSnippet(() => ({ render: () => `<button type="button">Inbox</button>` }));

describe("Badge", () => {
	it("renders the count as a status next to its children", async () => {
		const screen = await render(Badge, { count: 5, children: child });
		await expect.element(screen.getByRole("button", { name: "Inbox" })).toBeVisible();
		const status = screen.getByRole("status", { name: "5 notifications" });
		await expect.element(status).toHaveTextContent("5");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hides the badge when count is 0", async () => {
		const screen = await render(Badge, { count: 0, children: child });
		await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
	});

	it("hides the badge when neither count nor dot is set", async () => {
		const screen = await render(Badge, { children: child });
		await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
	});

	it("caps counts above 99 at '99+' but keeps the real count in the label", async () => {
		const screen = await render(Badge, { count: 150, children: child });
		const status = screen.getByRole("status", { name: "150 notifications" });
		await expect.element(status).toHaveTextContent("99+");
	});

	it("shows 99 as-is", async () => {
		const screen = await render(Badge, { count: 99, children: child });
		await expect.element(screen.getByRole("status")).toHaveTextContent("99");
	});

	it("dot renders an empty 'New' status even without a count", async () => {
		const screen = await render(Badge, { dot: true, children: child });
		const status = screen.getByRole("status", { name: "New" });
		await expect.element(status).toBeInTheDocument();
		await expect.element(status).toBeEmptyDOMElement();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("dot wins over count (no number rendered)", async () => {
		const screen = await render(Badge, { dot: true, count: 7, children: child });
		await expect.element(screen.getByRole("status", { name: "New" })).toBeEmptyDOMElement();
	});

	it.each(["brand", "success", "error", "warning"] as const)(
		"color %s passes axe",
		async (color) => {
			const screen = await render(Badge, { count: 3, color, children: child });
			await expect.element(screen.getByRole("status")).toHaveClass(`ca-badge--${color}`);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
	);

	describe("inline tone pill", () => {
		const text = createRawSnippet(() => ({ render: () => `<span>Overdue</span>` }));
		const bg = (el: Element) => getComputedStyle(el).backgroundColor;

		it("renders its children as the label, in flow, without a corner anchor", async () => {
			const screen = await render(Badge, {
				tone: "danger",
				subtle: true,
				dot: true,
				children: text,
			});
			const pill = screen.getByText("Overdue").element().closest(".ca-badge") as HTMLElement;
			expect(pill.classList.contains("ca-badge--inline")).toBe(true);
			expect(getComputedStyle(pill).position).toBe("static");
			expect(pill.querySelector(".ca-badge__dot")).not.toBeNull();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("size md is 24px high with a 6px dot", async () => {
			const screen = await render(Badge, {
				tone: "danger",
				subtle: true,
				dot: true,
				size: "md",
				children: text,
			});
			const pill = screen.getByText("Overdue").element().closest(".ca-badge") as HTMLElement;
			expect(pill.getBoundingClientRect().height).toBe(24);
			expect(pill.querySelector(".ca-badge__dot")!.getBoundingClientRect().width).toBe(6);
		});

		it("subtle tints the background; solid does not", async () => {
			const subtle = await render(Badge, { tone: "danger", subtle: true, children: text });
			const solid = await render(Badge, { tone: "danger", children: text });
			const a = subtle.container.querySelector(".ca-badge") as HTMLElement;
			const b = solid.container.querySelector(".ca-badge") as HTMLElement;
			expect(bg(a)).not.toBe(bg(b));
			expect(getComputedStyle(a).color).not.toBe(getComputedStyle(b).color);
		});

		it.each(["brand", "success", "danger", "warning", "info", "neutral"] as const)(
			"subtle %s meets 4.5:1 in light and dark",
			async (tone) => {
				for (const dark of [false, true]) {
					document.documentElement.classList.toggle("dark", dark);
					try {
						const screen = await render(Badge, {
							tone,
							subtle: true,
							dot: true,
							size: "md",
							children: text,
						});
						expect(await checkA11y(screen.container)).toHaveNoViolations();
					} finally {
						document.documentElement.classList.remove("dark");
					}
				}
			}
		);

		it('tone="custom" derives fill, on-fill and subtle pair from `color` (#684)', async () => {
			const rgb = (c: string) => {
				const el = document.createElement("span");
				el.style.color = c;
				document.body.append(el);
				const out = getComputedStyle(el).color;
				el.remove();
				return out;
			};
			const solid = await render(Badge, { tone: "custom", color: "#7c3aed", children: text });
			const pill = solid.container.querySelector(".ca-badge") as HTMLElement;
			expect(pill.classList.contains("ca-badge--custom")).toBe(true);
			expect(pill.classList.contains("ca-badge--inline")).toBe(true);
			expect(bg(pill)).toBe(rgb("#7c3aed"));
			expect(await checkA11y(solid.container)).toHaveNoViolations();
			const subtle = await render(Badge, {
				tone: "custom",
				color: "#7c3aed",
				subtle: true,
				dot: true,
				children: text,
			});
			const sp = subtle.container.querySelector(".ca-badge") as HTMLElement;
			expect(bg(sp)).not.toBe(bg(pill));
			expect(bg(sp)).not.toBe("rgba(0, 0, 0, 0)");
			expect(getComputedStyle(sp.querySelector(".ca-badge__dot")!).backgroundColor).toBe(
				rgb("#7c3aed")
			);
			expect(await checkA11y(subtle.container)).toHaveNoViolations();
		});

		it('tone="custom" takes a token reference and holds 4.5:1 in light and dark', async () => {
			for (const dark of [false, true]) {
				document.documentElement.classList.toggle("dark", dark);
				try {
					for (const color of [
						"var(--ca-semantic-warning)",
						"#facc15",
						"#1e3a8a",
						"oklch(0.6 0.2 150)",
					])
						for (const subtle of [false, true]) {
							const screen = await render(Badge, { tone: "custom", color, subtle, children: text });
							expect(
								await checkA11y(screen.container),
								`${color} subtle=${subtle} dark=${dark}`
							).toHaveNoViolations();
						}
				} finally {
					document.documentElement.classList.remove("dark");
				}
			}
		});

		it("--ca-badge-h, -font-size, -weight and -border tune the pill; defaults unchanged", async () => {
			const base = await render(Badge, { tone: "info", subtle: true, size: "md", children: text });
			const bp = base.container.querySelector(".ca-badge") as HTMLElement;
			expect(bp.getBoundingClientRect().height).toBe(24);
			expect(getComputedStyle(bp).fontWeight).toBe("500");
			expect(getComputedStyle(bp).borderTopWidth).toBe("0px");
			const screen = await render(Badge, {
				tone: "info",
				subtle: true,
				size: "md",
				children: text,
			});
			const pill = screen.container.querySelector(".ca-badge") as HTMLElement;
			pill.style.setProperty("--ca-badge-h", "28px");
			pill.style.setProperty("--ca-badge-font-size", "12px");
			pill.style.setProperty("--ca-badge-weight", "400");
			pill.style.setProperty("--ca-badge-border", "1px solid transparent");
			const cs = getComputedStyle(pill);
			expect(pill.getBoundingClientRect().height).toBe(28);
			expect(cs.fontSize).toBe("12px");
			expect(cs.fontWeight).toBe("400");
			expect(cs.borderTopWidth).toBe("1px");
		});

		it("keeps the anchored badge when tone is not set", async () => {
			const screen = await render(Badge, { count: 2, children: child });
			const status = screen.getByRole("status", { name: "2 notifications" }).element();
			expect(getComputedStyle(status).position).toBe("absolute");
		});
	});
});

// #749: solid semantic fills drew white (--ca-on-semantic) on the light dark-scheme tones (1.5 to 2.3:1).
describe("Badge solid fills hold 4.5:1 in both schemes (#749)", () => {
	for (const scheme of ["light", "dark"] as const)
		it(`counter and inline pills pass axe color-contrast (${scheme})`, async () => {
			const restore = withTheme({ scheme });
			try {
				const screen = await render(BadgeSolidTones);
				await expect.element(screen.getByText("info pill")).toBeVisible();
				expect(await checkA11y(screen.container)).toHaveNoViolations();
			} finally {
				restore();
			}
		});
});

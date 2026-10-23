import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Badge from "./Badge.svelte";

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

		it("keeps the anchored badge when tone is not set", async () => {
			const screen = await render(Badge, { count: 2, children: child });
			const status = screen.getByRole("status", { name: "2 notifications" }).element();
			expect(getComputedStyle(status).position).toBe("absolute");
		});
	});
});

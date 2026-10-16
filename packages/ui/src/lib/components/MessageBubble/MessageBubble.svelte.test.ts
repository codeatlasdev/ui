import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./MessageBubble.test.svelte";

const bubble = (c: Element) => c.querySelector(".ca-bubble") as HTMLElement;
const row = (c: Element) => c.querySelector(".ca-bubble-row") as HTMLElement;
const radius = (el: HTMLElement, corner: "BottomLeft" | "BottomRight") =>
	Number.parseFloat(getComputedStyle(el)[`border${corner}Radius` as "borderBottomLeftRadius"]);

describe("MessageBubble", () => {
	it("renders an incoming bubble with the default aria-label", async () => {
		const screen = await render(Harness, { props: { time: "14:32" } });
		const b = bubble(screen.container);
		expect(b.tagName).toBe("ARTICLE");
		expect(b.getAttribute("aria-label")).toBe("Message");
		expect(row(screen.container).className).toContain("ca-bubble-row--in");
		expect(row(screen.container).dataset.grouped).toBe("single");
		await expect.element(screen.getByText("Hello there")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("labels an outgoing bubble and uses the brand fill", async () => {
		const screen = await render(Harness, { props: { direction: "out", time: "14:32" } });
		const b = bubble(screen.container);
		expect(b.getAttribute("aria-label")).toBe("Your message");
		expect(row(screen.container).className).toContain("ca-bubble-row--out");
		const incoming = await render(Harness, { props: { direction: "in" } });
		expect(getComputedStyle(b).backgroundColor).not.toBe(
			getComputedStyle(bubble(incoming.container)).backgroundColor
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("passes axe for an outgoing bubble in dark mode", async () => {
		document.documentElement.classList.add("dark");
		try {
			const screen = await render(Harness, {
				props: { direction: "out", time: "14:32", status: "read" },
			});
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		} finally {
			document.documentElement.classList.remove("dark");
		}
	});

	it("uses the sender name as label and shows it for single and first only", async () => {
		const single = await render(Harness, { props: { sender: "Ana" } });
		expect(bubble(single.container).getAttribute("aria-label")).toBe("Message from Ana");
		expect(single.container.querySelector(".ca-bubble__sender")?.textContent).toBe("Ana");
		expect(await checkA11y(single.container)).toHaveNoViolations();

		const first = await render(Harness, { props: { sender: "Ana", grouped: "first" } });
		expect(first.container.querySelector(".ca-bubble__sender")).not.toBeNull();

		const middle = await render(Harness, { props: { sender: "Ana", grouped: "middle" } });
		expect(middle.container.querySelector(".ca-bubble__sender")).toBeNull();
		const last = await render(Harness, { props: { sender: "Ana", grouped: "last" } });
		expect(last.container.querySelector(".ca-bubble__sender")).toBeNull();
	});

	it("never shows the sender on outgoing bubbles", async () => {
		const screen = await render(Harness, { props: { direction: "out", sender: "Ana" } });
		expect(screen.container.querySelector(".ca-bubble__sender")).toBeNull();
	});

	it("shows the tail corner only on single and last", async () => {
		const radii: Record<string, number> = {};
		const big: Record<string, number> = {};
		for (const grouped of ["single", "first", "middle", "last"] as const) {
			const screen = await render(Harness, { props: { grouped } });
			const b = bubble(screen.container);
			radii[grouped] = radius(b, "BottomLeft");
			big[grouped] = radius(b, "BottomRight");
		}
		expect(radii.single).toBeLessThan(big.single);
		expect(radii.last).toBeLessThan(big.last);
		expect(radii.first).toBe(big.first);
		expect(radii.middle).toBe(big.middle);
		expect(radii.single).toBe(radii.last);
	});

	it("puts the tail on the end side for outgoing bubbles", async () => {
		const screen = await render(Harness, { props: { direction: "out", grouped: "single" } });
		const b = bubble(screen.container);
		expect(radius(b, "BottomRight")).toBeLessThan(radius(b, "BottomLeft"));
	});

	it("tightens spacing inside a group", async () => {
		const single = await render(Harness, { props: { grouped: "single" } });
		const middle = await render(Harness, { props: { grouped: "middle" } });
		const gap = (c: Element) => Number.parseFloat(getComputedStyle(row(c)).marginBlockStart);
		expect(gap(middle.container)).toBeLessThan(gap(single.container));
	});

	it("shows the avatar on single and last, and reserves its width otherwise", async () => {
		const widths: Record<string, number> = {};
		for (const grouped of ["single", "last", "first", "middle"] as const) {
			const screen = await render(Harness, { props: { grouped, withAvatar: true } });
			const slot = screen.container.querySelector(".ca-bubble-row__avatar") as HTMLElement;
			widths[grouped] = slot.getBoundingClientRect().width;
			const visible = getComputedStyle(slot.firstElementChild ?? slot).visibility !== "hidden";
			if (grouped === "single" || grouped === "last") {
				const av = screen.container.querySelector('[data-testid="avatar"]') as HTMLElement;
				expect(av.getBoundingClientRect().width).toBeGreaterThan(0);
				expect(visible).toBe(true);
			} else {
				expect(screen.container.querySelector('[data-testid="avatar"]')).toBeNull();
			}
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		}
		expect(widths.first).toBe(widths.single);
		expect(widths.middle).toBe(widths.single);
		expect(widths.last).toBe(widths.single);
		expect(widths.single).toBeGreaterThan(0);
	});

	it("does not render an avatar slot on outgoing bubbles", async () => {
		const screen = await render(Harness, { props: { direction: "out", withAvatar: true } });
		expect(screen.container.querySelector('[data-testid="avatar"]')).toBeNull();
	});

	it("renders the quote slot at the top inside the bubble", async () => {
		const screen = await render(Harness, { props: { withQuote: true, sender: "Ana" } });
		const q = screen.container.querySelector(".ca-bubble__quote") as HTMLElement;
		expect(bubble(screen.container).contains(q)).toBe(true);
		expect(q.textContent).toContain("Earlier text");
		const text = screen.container.querySelector(".ca-bubble__body") as HTMLElement;
		expect(q.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("omits the quote block when no quote content is given", async () => {
		const screen = await render(Harness, { props: {} });
		const q = screen.container.querySelector(".ca-bubble__quote") as HTMLElement | null;
		expect(!q || q.getBoundingClientRect().height === 0).toBe(true);
	});

	it("renders reaction chips with counts and a labelled group", async () => {
		const screen = await render(Harness, {
			props: {
				reactions: [{ emoji: "👍", count: 3, mine: true }, { emoji: "❤️" }],
			},
		});
		const group = screen.container.querySelector(".ca-bubble__reactions") as HTMLElement;
		expect(group.getAttribute("aria-label")).toBe("2 reactions");
		const chips = group.querySelectorAll(".ca-bubble__reaction");
		expect(chips.length).toBe(2);
		expect(chips[0].textContent).toContain("3");
		expect(chips[0].className).toContain("ca-bubble__reaction--mine");
		expect(chips[1].className).not.toContain("--mine");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders no reactions group for an empty list", async () => {
		const screen = await render(Harness, { props: { reactions: [] } });
		expect(screen.container.querySelector(".ca-bubble__reactions")).toBeNull();
	});

	it("renders time and the footer slot", async () => {
		const screen = await render(Harness, { props: { time: "14:32", withFooter: true } });
		await expect.element(screen.getByText("14:32")).toBeVisible();
		await expect.element(screen.getByTestId("footer")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	for (const [status, label] of [
		["pending", "Sending"],
		["sent", "Sent"],
		["delivered", "Delivered"],
		["read", "Read"],
	] as const) {
		it(`announces "${label}" once for status ${status}`, async () => {
			const screen = await render(Harness, { props: { direction: "out", time: "14:32", status } });
			const b = bubble(screen.container);
			const matches = b.textContent?.match(new RegExp(label, "g")) ?? [];
			expect(matches.length).toBe(1);
			const meta = screen.container.querySelector(".ca-bubble__meta") as HTMLElement;
			expect(meta.textContent?.replace(/\s+/g, " ").trim()).toMatch(new RegExp(`14:32.*${label}`));
			expect(meta.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
			expect(b.querySelector("[aria-live], [role=status]")).toBeNull();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});
	}

	it("colors read ticks with the info token and others not", async () => {
		const read = await render(Harness, { props: { direction: "out", status: "read" } });
		const sent = await render(Harness, { props: { direction: "out", status: "sent" } });
		const tick = (c: Element) => c.querySelector(".ca-bubble__status") as HTMLElement;
		expect(tick(read.container).className).toContain("ca-bubble__status--read");
		expect(getComputedStyle(tick(read.container)).color).not.toBe(
			getComputedStyle(tick(sent.container)).color
		);
	});

	it("ignores status on incoming bubbles", async () => {
		const screen = await render(Harness, {
			props: { direction: "in", time: "14:32", status: "read" },
		});
		expect(screen.container.querySelector(".ca-bubble__status")).toBeNull();
		expect(bubble(screen.container).textContent).not.toContain("Read");
	});

	it("keeps pre-wrapped text and caps the width", async () => {
		const screen = await render(Harness, {});
		const body = screen.container.querySelector(".ca-bubble__body") as HTMLElement;
		expect(getComputedStyle(body).whiteSpace).toBe("pre-wrap");
		expect(getComputedStyle(body).overflowWrap).toBe("anywhere");
	});
});

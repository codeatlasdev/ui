import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import MessageBubble from "./MessageBubble.svelte";
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
		expect(getComputedStyle(body).overflowWrap).toBe("break-word");
	});

	it("keeps a short message on one line when the row is sized by min-content (#837)", async () => {
		for (const text of ["oie", "Alô?"]) {
			const screen = await render(Harness, { props: { text, shrink: true, minContent: true } });
			const body = screen.container.querySelector(".ca-bubble__body") as HTMLElement;
			const lineHeight = Number.parseFloat(getComputedStyle(body).lineHeight);
			expect(body.getBoundingClientRect().height).toBeLessThan(lineHeight * 1.5);
			expect(body.getBoundingClientRect().width).toBeGreaterThan(12);
		}
	});

	it("still wraps a long unbroken word inside the bubble (#837)", async () => {
		const long = "x".repeat(200);
		const screen = await render(Harness, { props: { text: long, shrink: true } });
		const b = bubble(screen.container);
		const body = screen.container.querySelector(".ca-bubble__body") as HTMLElement;
		expect(body.scrollWidth).toBeLessThanOrEqual(Math.ceil(b.getBoundingClientRect().width));
	});

	it("keeps the meta footer inside the bubble box (#837)", async () => {
		const screen = await render(Harness, {
			props: {
				direction: "out",
				text: "ok",
				shrink: true,
				wideFooter: true,
				time: "14:32",
				status: "read",
			},
		});
		const b = bubble(screen.container).getBoundingClientRect();
		const meta = screen.container.querySelector(".ca-bubble__meta") as HTMLElement;
		for (const child of Array.from(meta.children)) {
			const r = child.getBoundingClientRect();
			expect(r.left).toBeGreaterThanOrEqual(b.left - 0.5);
			expect(r.right).toBeLessThanOrEqual(b.right + 0.5);
		}
	});
	describe("failed status (#893)", () => {
		it("shows a warning icon and the localized label, in the error color", async () => {
			const screen = await render(Harness, {
				props: { direction: "out", time: "14:32", status: "failed" },
			});
			const b = bubble(screen.container);
			const matches = b.textContent?.match(/Not sent/g) ?? [];
			expect(matches.length).toBe(1);
			const tick = screen.container.querySelector(".ca-bubble__status--failed") as HTMLElement;
			expect(tick.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
			const sent = await render(Harness, { props: { direction: "out", status: "sent" } });
			expect(getComputedStyle(tick).backgroundColor).not.toBe(
				getComputedStyle(sent.container.querySelector(".ca-bubble__status") as HTMLElement)
					.backgroundColor
			);
			expect(getComputedStyle(tick).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
			expect(b.querySelector("[aria-live], [role=status]")).toBeNull();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("is axe clean in dark mode and on an incoming-styled surface", async () => {
			document.documentElement.classList.add("dark");
			try {
				const screen = await render(Harness, {
					props: {
						direction: "out",
						time: "14:32",
						status: "failed",
						withRetry: true,
						onretry: () => {},
					},
				});
				expect(await checkA11y(screen.container)).toHaveNoViolations();
			} finally {
				document.documentElement.classList.remove("dark");
			}
		});

		it("renders no retry button without onretry", async () => {
			const screen = await render(Harness, { props: { direction: "out", status: "failed" } });
			expect(screen.container.querySelector(".ca-bubble__retry")).toBeNull();
		});

		it("retry is a keyboard reachable button that fires onretry on Enter, Space and click", async () => {
			const onretry = vi.fn();
			const screen = await render(Harness, {
				props: { direction: "out", time: "14:32", status: "failed", onretry },
			});
			const btn = screen.container.querySelector(".ca-bubble__retry") as HTMLButtonElement;
			expect(btn.tagName).toBe("BUTTON");
			expect(btn.type).toBe("button");
			expect(btn.textContent?.trim()).toBe("Retry");
			await userEvent.tab();
			expect(document.activeElement).toBe(btn);
			await userEvent.keyboard("{Enter}");
			expect(onretry).toHaveBeenCalledTimes(1);
			await userEvent.keyboard(" ");
			expect(onretry).toHaveBeenCalledTimes(2);
			await userEvent.click(btn);
			expect(onretry).toHaveBeenCalledTimes(3);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("lets the retry snippet replace the default label", async () => {
			const screen = await render(Harness, {
				props: { direction: "out", status: "failed", onretry: () => {}, withRetry: true },
			});
			const btn = screen.container.querySelector(".ca-bubble__retry") as HTMLElement;
			expect(btn.textContent?.trim()).toBe("Retry sending");
		});

		it("ignores failed and retry on incoming bubbles", async () => {
			const screen = await render(Harness, {
				props: { direction: "in", status: "failed", onretry: () => {} },
			});
			expect(screen.container.querySelector(".ca-bubble__status")).toBeNull();
			expect(screen.container.querySelector(".ca-bubble__retry")).toBeNull();
		});
	});

	describe("clickable quote (#893)", () => {
		it("renders a plain div without onquoteclick", async () => {
			const screen = await render(Harness, { props: { withQuote: true } });
			const q = screen.container.querySelector(".ca-bubble__quote") as HTMLElement;
			expect(q.tagName).toBe("DIV");
			expect(screen.container.querySelector("button")).toBeNull();
		});

		it("renders a named button that activates with click, Enter and Space", async () => {
			const onquoteclick = vi.fn();
			const screen = await render(Harness, {
				props: { withQuote: true, sender: "Ana", onquoteclick },
			});
			const q = screen.container.querySelector(".ca-bubble__quote") as HTMLButtonElement;
			expect(q.tagName).toBe("BUTTON");
			expect(q.type).toBe("button");
			expect(q.hasAttribute("aria-label")).toBe(false);
			expect(q.textContent).toMatch(/^Go to the quoted message\.\s+Earlier text/);
			expect(bubble(screen.container).contains(q)).toBe(true);
			await userEvent.tab();
			expect(document.activeElement).toBe(q);
			await userEvent.keyboard("{Enter}");
			expect(onquoteclick).toHaveBeenCalledTimes(1);
			await userEvent.keyboard(" ");
			expect(onquoteclick).toHaveBeenCalledTimes(2);
			await userEvent.click(q);
			expect(onquoteclick).toHaveBeenCalledTimes(3);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("takes a custom accessible name and keeps the quote text visible", async () => {
			const screen = await render(Harness, {
				props: { withQuote: true, onquoteclick: () => {}, quoteLabel: "Jump to Ana's message" },
			});
			const q = screen.container.querySelector(".ca-bubble__quote") as HTMLElement;
			expect(q.getAttribute("aria-label")).toBe("Jump to Ana's message");
			expect(q.textContent).toContain("Earlier text");
		});

		it("shows a focus ring and is axe clean on an outgoing bubble in dark mode", async () => {
			document.documentElement.classList.add("dark");
			try {
				const screen = await render(Harness, {
					props: { direction: "out", withQuote: true, onquoteclick: () => {} },
				});
				const q = screen.container.querySelector(".ca-bubble__quote") as HTMLElement;
				await userEvent.tab();
				expect(document.activeElement).toBe(q);
				expect(getComputedStyle(q).outlineStyle).not.toBe("none");
				expect(await checkA11y(screen.container)).toHaveNoViolations();
			} finally {
				document.documentElement.classList.remove("dark");
			}
		});
	});
});

describe("MessageBubble rest attributes (#723)", () => {
	it("forwards data-* and id to the row", async () => {
		const screen = await render(MessageBubble, {
			children: createRawSnippet(() => ({ render: () => "<span>hi</span>" })),
			id: "m1",
			"data-msg": "m1",
		} as never);
		const row = screen.container.querySelector(".ca-bubble-row") as HTMLElement;
		expect(row.id).toBe("m1");
		expect(row.dataset.msg).toBe("m1");
	});
});

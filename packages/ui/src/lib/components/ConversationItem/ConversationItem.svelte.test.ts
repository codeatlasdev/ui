import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./ConversationItem.test.svelte";

const item = (c: Element) => c.querySelector(".ca-conversation") as HTMLElement;

describe("ConversationItem", () => {
	it("renders a button with title, time and a one-line preview", async () => {
		const screen = await render(Harness, {
			props: { time: "14:32", preview: "See you tomorrow", withAvatar: true, withIcon: true },
		});
		const el = item(screen.container);
		expect(el.tagName).toBe("BUTTON");
		expect(el.getAttribute("type")).toBe("button");
		await expect.element(screen.getByText("Ana Souza")).toBeVisible();
		await expect.element(screen.getByText("14:32")).toBeVisible();
		await expect.element(screen.getByText("See you tomorrow")).toBeVisible();
		await expect.element(screen.getByTestId("avatar")).toBeVisible();
		await expect.element(screen.getByTestId("ticks")).toBeVisible();
		const p = screen.container.querySelector(".ca-conversation__preview") as HTMLElement;
		expect(getComputedStyle(p).textOverflow).toBe("ellipsis");
		expect(getComputedStyle(p).whiteSpace).toBe("nowrap");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders an anchor when href is set", async () => {
		const screen = await render(Harness, { props: { href: "/chat/1", preview: "Hi" } });
		const el = item(screen.container);
		expect(el.tagName).toBe("A");
		expect(el.getAttribute("href")).toBe("/chat/1");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("marks the active row with aria-current and a selected background", async () => {
		const idle = await render(Harness, { props: { preview: "Hi" } });
		const active = await render(Harness, { props: { preview: "Hi", active: true } });
		expect(item(idle.container).hasAttribute("aria-current")).toBe(false);
		expect(item(active.container).getAttribute("aria-current")).toBe("true");
		expect(getComputedStyle(item(active.container)).backgroundColor).not.toBe(
			getComputedStyle(item(idle.container)).backgroundColor
		);
		expect(await checkA11y(active.container)).toHaveNoViolations();
	});

	it("shows an unread pill with an accessible count", async () => {
		const screen = await render(Harness, { props: { preview: "Hi", unread: 3, time: "now" } });
		const pill = screen.container.querySelector(".ca-conversation__unread") as HTMLElement;
		expect(pill.textContent?.trim()).toBe("3");
		expect(pill.getAttribute("aria-label")).toBe("3 unread messages");
		expect(item(screen.container).className).toContain("ca-conversation--unread");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("caps the unread pill at 99+ but keeps the real count in the label", async () => {
		const screen = await render(Harness, { props: { preview: "Hi", unread: 250 } });
		const pill = screen.container.querySelector(".ca-conversation__unread") as HTMLElement;
		expect(pill.textContent?.trim()).toBe("99+");
		expect(pill.getAttribute("aria-label")).toBe("250 unread messages");
	});

	it("hides the pill when unread is 0 or undefined", async () => {
		const zero = await render(Harness, { props: { preview: "Hi", unread: 0 } });
		expect(zero.container.querySelector(".ca-conversation__unread")).toBeNull();
		expect(item(zero.container).className).not.toContain("--unread");
	});

	it("uses a quieter pill color when muted", async () => {
		const on = await render(Harness, { props: { preview: "Hi", unread: 2 } });
		const off = await render(Harness, { props: { preview: "Hi", unread: 2, muted: true } });
		const bg = (c: Element) =>
			getComputedStyle(c.querySelector(".ca-conversation__unread") as HTMLElement).backgroundColor;
		expect(bg(off.container)).not.toBe(bg(on.container));
		expect(await checkA11y(off.container)).toHaveNoViolations();
	});

	it("shows pinned and muted indicators with labels", async () => {
		const screen = await render(Harness, { props: { preview: "Hi", pinned: true, muted: true } });
		expect(screen.container.querySelector('[aria-label="Pinned"]')).not.toBeNull();
		expect(screen.container.querySelector('[aria-label="Muted"]')).not.toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		const none = await render(Harness, { props: { preview: "Hi" } });
		expect(none.container.querySelector('[aria-label="Pinned"]')).toBeNull();
		expect(none.container.querySelector('[aria-label="Muted"]')).toBeNull();
	});

	it("replaces the preview with the typing label", async () => {
		const screen = await render(Harness, { props: { preview: "Old text", typing: true } });
		await expect.element(screen.getByText("Typing…")).toBeVisible();
		expect(screen.container.textContent).not.toContain("Old text");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps a 44px minimum height for the whole row", async () => {
		const screen = await render(Harness, { props: { preview: "Hi" } });
		expect(item(screen.container).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		const link = await render(Harness, { props: { href: "/x" } });
		expect(item(link.container).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
	});

	it("calls onclick on click", async () => {
		const clicks = { n: 0 };
		const screen = await render(Harness, { props: { preview: "Hi", clicks } });
		item(screen.container).click();
		expect(clicks.n).toBe(1);
	});

	it("activates with Enter and Space from the keyboard", async () => {
		const clicks = { n: 0 };
		const screen = await render(Harness, { props: { preview: "Hi", clicks } });
		await userEvent.tab();
		expect(document.activeElement).toBe(item(screen.container));
		await userEvent.keyboard("{Enter}");
		expect(clicks.n).toBe(1);
		await userEvent.keyboard(" ");
		expect(clicks.n).toBe(2);
	});

	it("shows a focus ring on keyboard focus", async () => {
		const screen = await render(Harness, { props: { preview: "Hi" } });
		await userEvent.tab();
		const cs = getComputedStyle(item(screen.container));
		expect(cs.outlineStyle !== "none" || cs.boxShadow !== "none").toBe(true);
	});
});

import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Button from "./Button.svelte";

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe("Button", () => {
	it("calls onclick when enabled", async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: label("Save"), onclick });
		await screen.getByRole("button", { name: "Save" }).click();
		expect(onclick).toHaveBeenCalledOnce();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("loading sets aria-busy, disables and blocks onclick", async () => {
		const onclick = vi.fn();
		const screen = await render(Button, { children: label("Save"), loading: true, onclick });
		const btn = screen.getByRole("button", { name: "Save" });
		await expect.element(btn).toHaveAttribute("aria-busy", "true");
		await expect.element(btn).toBeDisabled();
		await btn.click({ force: true });
		expect(onclick).not.toHaveBeenCalled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("announces when loading finishes, but not on mount or while loading", async () => {
		const polite = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent ?? "";
		const screen = await render(Button, { children: label("Save"), loading: true });
		await new Promise((r) => setTimeout(r, 100));
		expect(polite()).toBe("");
		await screen.rerender({ loading: false });
		await expect.poll(polite).toBe("Finished loading");
	});

	it.each(["filled", "glass", "outlined", "ghost", "destructive"] as const)(
		"variant %s renders its class",
		async (variant) => {
			const screen = await render(Button, { children: label("X"), variant, size: "lg" });
			const btn = screen.getByRole("button");
			await expect.element(btn).toHaveClass(`ca-btn--${variant}`);
			await expect.element(btn).toHaveClass("ca-btn--lg");
		}
	);

	it("href with loading renders a disabled link", async () => {
		const screen = await render(Button, { children: label("Go"), href: "/x", loading: true });
		const link = screen.getByRole("link", { name: "Go" });
		await expect.element(link).toHaveAttribute("aria-disabled", "true");
		await expect.element(link).toHaveAttribute("tabindex", "-1");
	});
});

describe("Button with href forwards anchor attributes (#290)", () => {
	it("download, hreflang, ping, referrerpolicy and type reach the <a>", async () => {
		const screen = await render(Button, {
			children: label("Get"),
			href: "/files/report.csv",
			download: "report.csv",
			hreflang: "pt-BR",
			ping: "/ping",
			referrerpolicy: "no-referrer",
			type: "text/csv",
		});
		const link = screen.getByRole("link", { name: "Get" });
		await expect.element(link).toHaveAttribute("href", "/files/report.csv");
		await expect.element(link).toHaveAttribute("download", "report.csv");
		await expect.element(link).toHaveAttribute("hreflang", "pt-BR");
		await expect.element(link).toHaveAttribute("ping", "/ping");
		await expect.element(link).toHaveAttribute("referrerpolicy", "no-referrer");
		await expect.element(link).toHaveAttribute("type", "text/csv");
		await expect.element(link).not.toHaveAttribute("target");
		await expect.element(link).not.toHaveAttribute("rel");
	});

	it("a bare download attribute (<Button download>) is kept", async () => {
		const screen = await render(Button, { children: label("Get"), href: "/f", download: "" });
		await expect.element(screen.getByRole("link", { name: "Get" })).toHaveAttribute("download", "");
	});

	it("target=_blank adds noopener noreferrer", async () => {
		const screen = await render(Button, {
			props: { children: label("Out"), href: "https://x.dev", target: "_blank" },
		});
		const link = screen.getByRole("link", { name: "Out" });
		await expect.element(link).toHaveAttribute("target", "_blank");
		await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("a rel passed with target=_blank is kept next to noopener noreferrer", async () => {
		const screen = await render(Button, {
			props: { children: label("Out"), href: "https://x.dev", target: "_blank", rel: "nofollow" },
		});
		const rel =
			(await screen.getByRole("link", { name: "Out" }).element()).getAttribute("rel") ?? "";
		expect(rel.split(/\s+/).sort()).toEqual(["nofollow", "noopener", "noreferrer"]);
	});

	it("a rel passed without target is forwarded as is", async () => {
		const screen = await render(Button, { children: label("Go"), href: "/x", rel: "nofollow" });
		await expect
			.element(screen.getByRole("link", { name: "Go" }))
			.toHaveAttribute("rel", "nofollow");
	});

	it("without href the type stays a button type and anchor attributes are not rendered", async () => {
		const screen = await render(Button, { children: label("Send"), type: "submit" });
		const btn = screen.getByRole("button", { name: "Send" });
		await expect.element(btn).toHaveAttribute("type", "submit");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("Button tone=neutral (#357)", () => {
	const rgb = (el: Element, prop: "color" | "borderTopColor") => getComputedStyle(el)[prop];

	it("outlined: label and border are neutral, not the brand colour", async () => {
		const brand = await render(Button, { children: label("A"), variant: "outlined" });
		const neutral = await render(Button, {
			children: label("B"),
			variant: "outlined",
			tone: "neutral",
		});
		const b = brand.container.querySelector("button") as HTMLElement;
		const n = neutral.container.querySelector("button") as HTMLElement;
		expect(rgb(n, "color")).not.toBe(rgb(b, "color"));
		expect(rgb(n, "borderTopColor")).not.toBe(rgb(b, "borderTopColor"));
		expect(n.classList.contains("ca-btn--neutral")).toBe(true);
		expect(await checkA11y(neutral.container)).toHaveNoViolations();
	});

	it("ghost: label is the secondary text and hover goes to the primary text", async () => {
		const screen = await render(Button, {
			children: label("Snooze"),
			variant: "ghost",
			tone: "neutral",
			size: "sm",
		});
		const btn = screen.getByRole("button");
		const el = btn.element();
		const secondary = getComputedStyle(document.documentElement).getPropertyValue(
			"--ca-text-secondary"
		);
		expect(secondary).not.toBe("");
		const probe = document.createElement("span");
		probe.style.color = "var(--ca-text-secondary)";
		document.body.append(probe);
		await btn.unhover();
		await expect.poll(() => rgb(el, "color")).toBe(getComputedStyle(probe).color);
		probe.style.color = "var(--ca-text-primary)";
		await btn.hover();
		await expect.poll(() => rgb(el, "color")).toBe(getComputedStyle(probe).color);
		probe.remove();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps sizes, loading and disabled the same as the brand tone", async () => {
		const loading = await render(Button, {
			children: label("Save"),
			variant: "outlined",
			tone: "neutral",
			loading: true,
		});
		expect(loading.container.querySelector("button")?.getAttribute("aria-busy")).toBe("true");
		const off = await render(Button, {
			children: label("Off"),
			variant: "outlined",
			tone: "neutral",
			disabled: true,
		});
		const probe = document.createElement("span");
		probe.style.color = "var(--ca-text-disabled)";
		document.body.append(probe);
		expect(rgb(off.container.querySelector("button") as HTMLElement, "color")).toBe(
			getComputedStyle(probe).color
		);
		probe.remove();
		expect(await checkA11y(off.container)).toHaveNoViolations();
	});

	it("forwards aria-expanded and other attributes (Popover triggers)", async () => {
		const screen = await render(Button, {
			children: label("More"),
			variant: "outlined",
			tone: "neutral",
			"aria-expanded": false,
			"aria-haspopup": "menu",
		});
		const btn = screen.getByRole("button", { name: "More" });
		await expect.element(btn).toHaveAttribute("aria-expanded", "false");
		await expect.element(btn).toHaveAttribute("aria-haspopup", "menu");
	});
});

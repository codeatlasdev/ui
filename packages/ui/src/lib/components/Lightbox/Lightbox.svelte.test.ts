import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import Harness from "./Lightbox.test.svelte";
import Gallery from "./LightboxGallery.test.svelte";

const open = async (props = {}) => {
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Ver foto" });
	(trigger.element() as HTMLElement).focus();
	await userEvent.keyboard("{Enter}");
	const dialog = page.getByRole("dialog", { name: "Foto enviada por Maria" });
	await expect.element(dialog).toBeVisible();
	return { screen, trigger, dialog };
};

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("Lightbox", () => {
	it("opens from the keyboard showing the image with its alt; no axe violations", async () => {
		await open();
		await expect.element(page.getByRole("img", { name: "Foto enviada por Maria" })).toBeVisible();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("Escape closes, calls onclose and returns focus to the trigger", async () => {
		const onclose = vi.fn();
		const { trigger } = await open({ onclose });
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalledOnce();
		await expect.element(trigger).toHaveFocus();
	});

	it("close button (keyboard-reachable) dismisses", async () => {
		const onclose = vi.fn();
		await open({ onclose });
		const close = page.getByRole("button", { name: "Fechar" });
		await expect.element(close).toBeVisible();
		(close.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalled();
	});

	it("clicking the backdrop area dismisses but clicking the image does not", async () => {
		const onclose = vi.fn();
		await open({ onclose });
		await page.getByRole("img", { name: "Foto enviada por Maria" }).click();
		await expect.element(page.getByRole("dialog")).toBeVisible();
		expect(onclose).not.toHaveBeenCalled();

		await page.getByRole("dialog").click({ position: { x: 5, y: 5 } });
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		expect(onclose).toHaveBeenCalled();
	});
});

describe("Lightbox gallery", () => {
	const openGallery = async (props = {}) => {
		const screen = await render(Gallery, props);
		const trigger = screen.getByRole("button", { name: "Abrir galeria" });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("dialog")).toBeVisible();
		return { screen, trigger };
	};
	const idx = () => document.querySelector("[data-testid=index]")?.textContent;

	it("starts at `index`, names the dialog after the current item and shows its caption", async () => {
		await openGallery({ start: 0 });
		await expect.element(page.getByRole("dialog", { name: "Primeira foto" })).toBeVisible();
		await expect.element(page.getByText("Praia")).toBeVisible();
		await expect.element(page.getByText("Maria, 10:42")).toBeVisible();
		await expect.element(page.getByText("1 / 3")).toBeVisible();
	});

	it("next/previous buttons and arrow keys move through items and write back to index", async () => {
		await openGallery();
		await page.getByRole("button", { name: "Próxima" }).click();
		expect(idx()).toBe("1");
		await userEvent.keyboard("{ArrowRight}");
		expect(idx()).toBe("2");
		await userEvent.keyboard("{ArrowLeft}");
		expect(idx()).toBe("1");
		await page.getByRole("button", { name: "Anterior" }).click();
		expect(idx()).toBe("0");
	});

	it("does not wrap: the ends are aria-disabled and keep focus", async () => {
		await openGallery();
		await expect
			.element(page.getByRole("button", { name: "Anterior" }))
			.toHaveAttribute("aria-disabled", "true");
		await userEvent.keyboard("{ArrowLeft}");
		expect(idx()).toBe("0");
		await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
		expect(idx()).toBe("2");
		await expect
			.element(page.getByRole("button", { name: "Próxima" }))
			.toHaveAttribute("aria-disabled", "true");
	});

	it("renders a video item with controls and poster, and pauses it when navigating away", async () => {
		await openGallery({ start: 1 });
		const video = document.querySelector<HTMLVideoElement>("dialog video.ca-lightbox__video");
		expect(video).not.toBeNull();
		expect(video?.controls).toBe(true);
		expect(video?.getAttribute("poster")).toContain("data:image/gif");
		expect(document.querySelector("dialog img.ca-lightbox__img")).toBeNull();
		await page.getByRole("button", { name: "Próxima" }).click();
		expect(document.querySelector("dialog video")).toBeNull();
		await expect.element(page.getByRole("img", { name: "Terceira foto" })).toBeVisible();
	});

	it("swiping the stage left goes next, right goes previous", async () => {
		await openGallery({ start: 1 });
		const stage = document.querySelector(".ca-lightbox__stage") as HTMLElement;
		const swipe = (from: number, to: number) => {
			const opts = {
				pointerId: 7,
				pointerType: "touch",
				isPrimary: true,
				bubbles: true,
				clientY: 200,
			};
			stage.dispatchEvent(new PointerEvent("pointerdown", { ...opts, clientX: from }));
			stage.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientX: (from + to) / 2 }));
			stage.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientX: to }));
		};
		swipe(300, 100);
		await expect.poll(idx).toBe("2");
		swipe(100, 300);
		await expect.poll(idx).toBe("1");
		swipe(200, 190); // too short: no move
		await settled();
		expect(idx()).toBe("1");
	});

	it("download calls ondownload with the item, or falls back to a real download link", async () => {
		const ondownload = vi.fn();
		await openGallery({ ondownload });
		await page.getByRole("button", { name: "Baixar" }).click();
		expect(ondownload).toHaveBeenCalledOnce();
		expect(ondownload.mock.calls[0][0].alt).toBe("Primeira foto");
		expect(ondownload.mock.calls[0][1]).toBe(0);
	});

	it("without ondownload the download control is an <a download> to the item src", async () => {
		await openGallery();
		const link = document.querySelector<HTMLAnchorElement>(
			"dialog a.ca-lightbox__action[download]"
		);
		expect(link?.getAttribute("href")).toContain("data:image/gif");
	});

	it("single `src` form shows no navigation, counter or download", async () => {
		await open();
		expect(document.querySelector("[aria-label='Próxima']")).toBeNull();
		expect(document.querySelector(".ca-lightbox__counter")).toBeNull();
		expect(document.querySelector("a[download], button[aria-label='Baixar']")).toBeNull();
	});

	it("passes axe with an image, a video and a caption", async () => {
		await openGallery();
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
		await userEvent.keyboard("{ArrowRight}");
		await settled();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("Escape closes the gallery and returns focus to the trigger", async () => {
		const { trigger } = await openGallery();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});
});

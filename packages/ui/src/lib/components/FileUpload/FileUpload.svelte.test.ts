import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import FileUpload from "./FileUpload.svelte";

const txt = (name: string, size = 10) =>
	new File([new Uint8Array(size)], name, { type: "text/plain" });

/** Sets files on the hidden input and fires `change`, like a native picker would. */
function choose(input: HTMLInputElement, ...files: File[]) {
	const dt = new DataTransfer();
	for (const f of files) dt.items.add(f);
	input.files = dt.files;
	input.dispatchEvent(new Event("change", { bubbles: true }));
}

const inputOf = (container: HTMLElement) =>
	container.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;

describe("FileUpload", () => {
	it("exposes the dropzone as a named, focusable button", async () => {
		const screen = await render(FileUpload, {});
		const zone = screen.getByRole("button", { name: "Drop files here or click to browse" });
		await expect.element(zone).toHaveAttribute("tabindex", "0");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("custom label becomes the accessible name", async () => {
		const screen = await render(FileUpload, { label: "Upload attachment" });
		await expect.element(screen.getByRole("button", { name: "Upload attachment" })).toBeVisible();
	});

	it("shows hint, falling back to accept", async () => {
		const a = await render(FileUpload, { accept: "image/*" });
		await expect.element(a.getByText("image/*")).toBeVisible();
		const b = await render(FileUpload, { accept: "image/*", hint: "Up to 2 MB" });
		await expect.element(b.getByText("Up to 2 MB")).toBeVisible();
		expect(b.container.textContent).not.toContain("image/*");
	});

	it("forwards accept and multiple to the native input", async () => {
		const screen = await render(FileUpload, { accept: ".png", multiple: true });
		const input = inputOf(screen.container);
		expect(input.accept).toBe(".png");
		expect(input.multiple).toBe(true);
	});

	it("selecting a file calls onchange and lists it", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { onchange });
		choose(inputOf(screen.container), txt("a.txt", 2048));
		await expect.element(screen.getByText("a.txt")).toBeVisible();
		await expect.element(screen.getByText("2 KB")).toBeVisible();
		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange.mock.calls[0][0].map((f: File) => f.name)).toEqual(["a.txt"]);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("single mode replaces the previous selection", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { onchange });
		const input = inputOf(screen.container);
		choose(input, txt("a.txt"));
		choose(input, txt("b.txt"));
		await expect.element(screen.getByText("b.txt")).toBeVisible();
		expect(screen.container.textContent).not.toContain("a.txt");
		expect(onchange.mock.lastCall?.[0].map((f: File) => f.name)).toEqual(["b.txt"]);
	});

	it("multiple mode accumulates selections", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { multiple: true, onchange });
		const input = inputOf(screen.container);
		choose(input, txt("a.txt"));
		choose(input, txt("b.txt"), txt("c.txt"));
		expect(onchange.mock.lastCall?.[0].map((f: File) => f.name)).toEqual([
			"a.txt",
			"b.txt",
			"c.txt",
		]);
		await expect.element(screen.getByRole("button", { name: "Remove c.txt" })).toBeVisible();
	});

	it("maxSize rejects oversize files with an error message", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { maxSize: 1024 * 1024, multiple: true, onchange });
		choose(inputOf(screen.container), txt("ok.txt", 100), txt("big.txt", 2 * 1024 * 1024));
		await expect.element(screen.getByText("big.txt: larger than 1.0 MB")).toBeVisible();
		expect(onchange.mock.lastCall?.[0].map((f: File) => f.name)).toEqual(["ok.txt"]);
		expect(screen.container.querySelectorAll(".ca-file-upload__file")).toHaveLength(1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("errors are cleared by the next valid selection", async () => {
		const screen = await render(FileUpload, { maxSize: 1024 });
		const input = inputOf(screen.container);
		choose(input, txt("big.txt", 5000));
		await expect.element(screen.getByText(/big\.txt: larger/)).toBeVisible();
		choose(input, txt("small.txt", 10));
		await expect.element(screen.getByText("small.txt")).toBeVisible();
		expect(screen.container.querySelector(".ca-file-upload__errors")).toBeNull();
	});

	it("remove button deletes the file and calls onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { multiple: true, onchange });
		choose(inputOf(screen.container), txt("a.txt"), txt("b.txt"));
		await screen.getByRole("button", { name: "Remove a.txt" }).click();
		expect(screen.container.textContent).not.toContain("a.txt");
		await expect.element(screen.getByText("b.txt")).toBeVisible();
		expect(onchange.mock.lastCall?.[0].map((f: File) => f.name)).toEqual(["b.txt"]);
	});

	it("dropping files on the zone selects them", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { onchange });
		const zone = screen.getByRole("button", { name: /Drop files/ }).element();
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(txt("dropped.txt"));
		zone.dispatchEvent(new DragEvent("drop", { dataTransfer, bubbles: true, cancelable: true }));
		await expect.element(screen.getByText("dropped.txt")).toBeVisible();
		expect(onchange).toHaveBeenCalledOnce();
	});

	it.each(["Enter", " "])("keyboard %j on the dropzone opens the file picker", async (key) => {
		const screen = await render(FileUpload, {});
		const input = inputOf(screen.container);
		const click = vi.spyOn(input, "click").mockImplementation(() => {});
		const zone = screen.getByRole("button", { name: /Drop files/ }).element() as HTMLElement;
		zone.focus();
		zone.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
		expect(click).toHaveBeenCalledOnce();
	});

	it("clicking the dropzone opens the file picker", async () => {
		const screen = await render(FileUpload, {});
		const input = inputOf(screen.container);
		const click = vi.spyOn(input, "click").mockImplementation(() => {});
		await screen.getByRole("button", { name: /Drop files/ }).click();
		expect(click).toHaveBeenCalledOnce();
	});

	it("disabled removes the zone from tab order and disables the input", async () => {
		const screen = await render(FileUpload, { disabled: true });
		await expect
			.element(screen.getByRole("button", { name: /Drop files/ }))
			.toHaveAttribute("tabindex", "-1");
		expect(inputOf(screen.container).disabled).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("disabled ignores dropped files", async () => {
		const onchange = vi.fn();
		const screen = await render(FileUpload, { disabled: true, onchange });
		const zone = screen.getByRole("button", { name: /Drop files/ }).element();
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(txt("x.txt"));
		zone.dispatchEvent(new DragEvent("drop", { dataTransfer, bubbles: true, cancelable: true }));
		expect(onchange).not.toHaveBeenCalled();
		expect(screen.container.textContent).not.toContain("x.txt");
	});
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import TextArea from "./TextArea.svelte";
import TextAreaRef from "./TextAreaRef.test.svelte";

describe("TextArea", () => {
	it("associates the label with the textarea", async () => {
		const screen = await render(TextArea, { label: "Message" });
		const field = screen.getByLabelText("Message");
		await field.fill("Hello\nworld");
		await expect.element(field).toHaveValue("Hello\nworld");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("description is the accessible description", async () => {
		const screen = await render(TextArea, { label: "Bio", description: "Up to 200 characters" });
		await expect
			.element(screen.getByLabelText("Bio"))
			.toHaveAccessibleDescription("Up to 200 characters");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("error sets aria-invalid, role=alert and describes the field", async () => {
		const screen = await render(TextArea, {
			label: "Bio",
			description: "Hint",
			error: "Required",
		});
		const field = screen.getByLabelText("Bio");
		await expect.element(field).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Required");
		await expect.element(field).toHaveAccessibleDescription("Required");
		expect(field.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("reports typed value through oninput", async () => {
		const oninput = vi.fn();
		const screen = await render(TextArea, { label: "Note", oninput });
		await screen.getByLabelText("Note").fill("abc");
		expect(oninput).toHaveBeenLastCalledWith("abc");
	});

	it("readonly and disabled states are exposed", async () => {
		const ro = await render(TextArea, { label: "Read only", readonly: true, value: "x" });
		await expect.element(ro.getByLabelText("Read only")).toHaveAttribute("readonly");
		const dis = await render(TextArea, { label: "Off", disabled: true });
		await expect.element(dis.getByLabelText("Off")).toBeDisabled();
	});
	it("forwards native attributes and handlers to the textarea", async () => {
		const onkeydown = vi.fn();
		const screen = await render(TextArea, {
			label: "Bio",
			maxlength: 5,
			"data-testid": "bio",
			onkeydown,
		});
		const field = screen.getByTestId("bio");
		await expect.element(field).toHaveAttribute("maxlength", "5");
		await field.fill("1234567");
		await expect.element(field).toHaveValue("12345");
		await field.element().focus();
		await userEvent.keyboard("a");
		expect(onkeydown).toHaveBeenCalled();
	});

	it("ref is the textarea element", async () => {
		const screen = await render(TextAreaRef, { label: "Bio" });
		await expect.element(screen.getByTestId("ref-tag")).toHaveTextContent("TEXTAREA");
	});

	it("hideLabel keeps the label for assistive tech only", async () => {
		const screen = await render(TextArea, { label: "Bio", hideLabel: true });
		await expect.element(screen.getByRole("textbox", { name: "Bio" })).toBeVisible();
		const label = screen.container.querySelector<HTMLElement>("label.ca-ta__label");
		expect(label?.classList.contains("ca-sr-only")).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("aria-label names a field without a label", async () => {
		const screen = await render(TextArea, { "aria-label": "Notes" });
		await expect.element(screen.getByRole("textbox", { name: "Notes" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

// #1120: the same counter as TextField (n/max, warning at warnAt, error over the limit, one polite
// announcement per crossing).
describe("TextArea counter (#1120)", () => {
	afterEach(() => setLocale("en"));

	const counterOf = (s: { container: HTMLElement }) =>
		s.container.querySelector<HTMLElement>(".ca-field-counter");

	it("shows n/max and describes the field", async () => {
		const screen = await render(TextArea, { label: "Bio", maxlength: 20, counter: true });
		const field = screen.getByLabelText("Bio");
		await field.fill("Hello");
		await expect.element(screen.getByText("5/20")).toBeVisible();
		await userEvent.keyboard("!");
		await expect.element(screen.getByText("6/20")).toBeVisible();
		await expect.element(field).toHaveAccessibleDescription("6 of 20 characters");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("warning tone at 90%, error tone over a soft max", async () => {
		const warn = await render(TextArea, {
			label: "Bio",
			maxlength: 10,
			counter: true,
			value: "123456789",
		});
		expect(counterOf(warn)?.classList.contains("ca-field-counter--warn")).toBe(true);
		expect(await checkA11y(warn.container)).toHaveNoViolations();
		const over = await render(TextArea, { label: "Post", counter: { max: 10 } });
		await over.getByLabelText("Post").fill("12345678901");
		expect(counterOf(over)?.classList.contains("ca-field-counter--over")).toBe(true);
		expect(await checkA11y(over.container)).toHaveNoViolations();
	});

	it("from keeps it hidden until that many characters", async () => {
		const screen = await render(TextArea, { label: "Post", counter: { max: 10, from: 4 } });
		const field = screen.getByLabelText("Post");
		await field.fill("abc");
		expect(counterOf(screen)).toBeNull();
		expect(field.element().hasAttribute("aria-describedby")).toBe(false);
		await field.fill("abcd");
		await expect.element(screen.getByText("4/10")).toBeVisible();
	});

	it("announces once when crossing the threshold", async () => {
		const said: string[] = [];
		const watch = new MutationObserver((records) => {
			for (const r of records) {
				if ((r.target as HTMLElement).dataset?.caAnnouncer !== "polite") continue;
				for (const node of r.addedNodes) if (node.textContent) said.push(node.textContent);
			}
		});
		const screen = await render(TextArea, {
			label: "Bio",
			maxlength: 10,
			counter: true,
			value: "12345678",
		});
		watch.observe(document.body, { childList: true, subtree: true });
		try {
			await screen.getByLabelText("Bio").click();
			await userEvent.keyboard("{Control>}{End}{/Control}9");
			await expect.poll(() => said).toEqual(["9 of 10 characters"]);
			await userEvent.keyboard("0");
			await expect.element(screen.getByText("10/10")).toBeVisible();
			await settled();
			await settled();
			expect(said).toEqual(["9 of 10 characters"]);
		} finally {
			watch.disconnect();
		}
	});

	it("is localized", async () => {
		setLocale("pt-BR");
		const screen = await render(TextArea, { label: "Bio", maxlength: 10, counter: true });
		await screen.getByLabelText("Bio").fill("abc");
		await expect
			.element(screen.getByLabelText("Bio"))
			.toHaveAccessibleDescription("3 de 10 caracteres");
	});
});

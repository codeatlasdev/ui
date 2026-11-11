import { describe, expect, it } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import Harness from "./RatingHarness.test.svelte";

// #767: a rating is a radiogroup of native radios (WAI-ARIA rating pattern), with half steps and read-only.
describe("Rating (#767)", () => {
	it("is a labelled radiogroup; a click sets the value and it submits with the form", async () => {
		const screen = await render(Harness, {});
		await expect.element(screen.getByRole("radiogroup", { name: "Service" })).toBeVisible();
		await screen.getByRole("radio", { name: "4 stars" }).click();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("4");
		const data = new FormData(screen.getByTestId("form").element() as HTMLFormElement);
		expect(data.get("score")).toBe("4");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrow keys move by one step, Home and End go to the ends", async () => {
		const screen = await render(Harness, { initial: 2 });
		(screen.getByRole("radio", { name: "2 stars" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("3");
		await userEvent.keyboard("{End}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("5");
		await userEvent.keyboard("{Home}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("1");
	});

	it("half steps offer 0.5 increments", async () => {
		const screen = await render(Harness, { step: 0.5 });
		await screen.getByRole("radio", { name: "3.5 stars" }).click();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("3.5");
	});

	it("read-only shows the value as one image with a text alternative", async () => {
		const screen = await render(Harness, { initial: 3.5, readonly: true, step: 0.5 });
		await expect
			.element(screen.getByRole("img", { name: "Service: 3.5 of 5 stars" }))
			.toBeVisible();
		expect(screen.container.querySelectorAll("input")).toHaveLength(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a whole star is the touch target under a coarse pointer", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(Harness, {});
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			const r = (
				screen.getByRole("radio", { name: "3 stars" }).element() as HTMLElement
			).getBoundingClientRect();
			expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(touchTarget() - 0.5);
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});

	it("an unlit star reads as a control boundary (outline-control, >= 3:1), not a divider", async () => {
		const screen = await render(Harness, { initial: 1 });
		const probe = document.createElement("span");
		probe.style.color = "var(--ca-outline-control)";
		screen.container.append(probe);
		const unlit = screen.container.querySelectorAll<HTMLElement>(".ca-rating__option")[4];
		expect(getComputedStyle(unlit).color).toBe(getComputedStyle(probe).color);
		probe.remove();
	});

	it("read-only shows its label (hideLabel hides it visually), the image name is unchanged", async () => {
		const screen = await render(Harness, { initial: 4, readonly: true });
		await expect.element(screen.getByText("Service", { exact: true })).toBeVisible();
		await expect.element(screen.getByRole("img", { name: "Service: 4 of 5 stars" })).toBeVisible();
		const hidden = await render(Harness, { initial: 4, readonly: true, hideLabel: true });
		const label = hidden.container.querySelector(".ca-rating__label");
		expect(label?.classList.contains("ca-sr-only")).toBe(true);
		expect(await checkA11y(hidden.container)).toHaveNoViolations();
	});

	it("disabled: a click changes nothing", async () => {
		const screen = await render(Harness, { initial: 2, disabled: true });
		await screen.getByRole("radio", { name: "4 stars" }).click({ force: true });
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("2");
	});

	it("half steps: arrows move by 0.5", async () => {
		const screen = await render(Harness, { initial: 2, step: 0.5 });
		(screen.getByRole("radio", { name: "2 stars" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("2.5");
	});
});

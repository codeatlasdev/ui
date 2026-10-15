import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import NativeForm from "./NativeForm.test.svelte";

const entries = (screen: { getByTestId: (id: string) => { element: () => Element } }) =>
	Object.fromEntries(new FormData(screen.getByTestId("form").element() as HTMLFormElement));

describe("`name` makes the controls submit in a native form", () => {
	it("RadioGroup, Checkbox, Switch and Select reach FormData", async () => {
		const screen = await render(NativeForm);
		expect(entries(screen)).toEqual({ segment: "pro", agree: "on", alerts: "on", plan: "b" });
	});

	it("the submitted values follow the user's changes", async () => {
		const screen = await render(NativeForm);
		await screen.getByRole("radio", { name: "Free" }).click();
		await screen.getByRole("checkbox", { name: "Agree" }).click();
		await screen.getByRole("switch", { name: "Alerts" }).click();
		await userEvent.click(screen.getByRole("button", { name: /Plan/ }));
		await userEvent.click(screen.getByRole("option", { name: "Alpha" }));
		expect(entries(screen)).toEqual({ segment: "free", plan: "a" });
	});

	it("without `name` the checkbox, switch and select submit nothing", async () => {
		const screen = await render(NativeForm, { names: false });
		const { agree, alerts, plan } = entries(screen);
		expect([agree, alerts, plan]).toEqual([undefined, undefined, undefined]);
	});
});

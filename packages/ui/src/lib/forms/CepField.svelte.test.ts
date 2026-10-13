import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { setLocale } from "../i18n/index.js";
import Harness from "./CepField.test.svelte";
import type { CepAddress } from "./types";

const address: CepAddress = {
	logradouro: "Avenida Paulista",
	bairro: "Bela Vista",
	localidade: "São Paulo",
	uf: "SP",
};

function deferred<T>() {
	let resolve!: (v: T) => void;
	let reject!: (e: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("CepField", () => {
	it("masks the CEP and a11y is clean", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("CEP");
		await input.fill("01310100");
		await expect.element(input).toHaveValue("01310-100");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("01310-100");
		await expect.element(input).toHaveAttribute("autocomplete", "postal-code");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("does not call onlookup until the CEP has 8 digits", async () => {
		const onlookup = vi.fn().mockResolvedValue(address);
		const screen = await render(Harness, { onlookup });
		await screen.getByLabelText("CEP").fill("0131010");
		expect(onlookup).not.toHaveBeenCalled();
	});

	it("calls onlookup with 8 unmasked digits and resolves the address", async () => {
		const onlookup = vi.fn().mockResolvedValue(address);
		const onresolve = vi.fn();
		const screen = await render(Harness, { onlookup, onresolve });
		await screen.getByLabelText("CEP").fill("01310100");
		await vi.waitFor(() => expect(onresolve).toHaveBeenCalledWith(address));
		expect(onlookup).toHaveBeenCalledOnce();
		expect(onlookup).toHaveBeenCalledWith("01310100");
		await expect.element(screen.getByLabelText("Street")).toHaveValue("Avenida Paulista");
	});

	it("lookupPending is bindable: true while in flight, false after", async () => {
		const d = deferred<CepAddress | null>();
		const onlookup = vi.fn(() => d.promise);
		const screen = await render(Harness, { onlookup });
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("false");
		await screen.getByLabelText("CEP").fill("01310100");
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("true");
		await expect.element(screen.getByLabelText("Street")).toBeDisabled();
		d.resolve(address);
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("false");
		await expect.element(screen.getByLabelText("Street")).toBeEnabled();
	});

	it("unknown CEP (null) shows an alert and does not resolve", async () => {
		const onlookup = vi.fn().mockResolvedValue(null);
		const onresolve = vi.fn();
		const screen = await render(Harness, { onlookup, onresolve });
		await screen.getByLabelText("CEP").fill("99999999");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("CEP não encontrado");
		expect(onresolve).not.toHaveBeenCalled();
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("lookup failure shows an error and clears pending", async () => {
		const onlookup = vi.fn().mockRejectedValue(new Error("network"));
		const screen = await render(Harness, { onlookup });
		await screen.getByLabelText("CEP").fill("01310100");
		await expect
			.element(screen.getByRole("alert"))
			.toHaveTextContent("Não foi possível consultar o CEP");
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("false");
	});

	it("editing the CEP clears a previous lookup error", async () => {
		const onlookup = vi.fn().mockResolvedValue(null);
		const screen = await render(Harness, { onlookup });
		const input = screen.getByLabelText("CEP");
		await input.fill("99999999");
		await expect.element(screen.getByRole("alert")).toBeInTheDocument();
		await input.fill("9999");
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
	});

	it("ignores a stale response when a newer lookup was issued", async () => {
		const first = deferred<CepAddress | null>();
		const second = deferred<CepAddress | null>();
		const onlookup = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const onresolve = vi.fn();
		const screen = await render(Harness, { onlookup, onresolve });
		const input = screen.getByLabelText("CEP");
		await input.fill("01310100");
		await input.fill("20040020");
		await vi.waitFor(() => expect(onlookup).toHaveBeenCalledTimes(2));

		second.resolve({ ...address, logradouro: "New Street" });
		await expect.element(screen.getByLabelText("Street")).toHaveValue("New Street");
		first.resolve({ ...address, logradouro: "Old Street" });
		await Promise.resolve();
		await expect.element(screen.getByLabelText("Street")).toHaveValue("New Street");
		expect(onresolve).toHaveBeenCalledOnce();
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("false");
	});

	it("without onlookup nothing is fetched and no error appears", async () => {
		const screen = await render(Harness);
		await screen.getByLabelText("CEP").fill("01310100");
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
		await expect.element(screen.getByTestId("pending")).toHaveTextContent("false");
	});
});

import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { registerLocale, setLocale } from "./index.js";
import ProviderHarness from "./provider-harness.svelte";

const es = { spinner: { label: "Cargando…" } };

describe("i18n SSR", () => {
	it("registers a custom locale with partial messages and falls back to en", () => {
		registerLocale("es", es);
		const { body } = render(ProviderHarness, { props: { locale: "es" } });
		expect(body).toContain('aria-label="Cargando…"');
		// A key the es dictionary does not define falls back to English.
		expect(body).toContain("On this page");
	});

	it("does not leak between concurrent renders with different locales", async () => {
		registerLocale("es", es);
		setLocale("en");
		const run = async (locale: string) => {
			await Promise.resolve();
			return render(ProviderHarness, { props: { locale } }).body;
		};
		const [a, b, c] = await Promise.all([run("pt-BR"), run("es"), run("en")]);
		expect(a).toContain("Carregando");
		expect(b).toContain("Cargando");
		expect(c).toContain('aria-label="Loading');
	});

	it("setLocale on the server does not change a tree rendered with its own locale", () => {
		setLocale("pt-BR");
		const { body } = render(ProviderHarness, { props: { locale: "en" } });
		expect(body).toContain('aria-label="Loading');
		setLocale("en");
	});
});

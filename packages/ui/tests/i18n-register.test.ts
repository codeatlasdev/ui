import { describe, expect, it } from "bun:test";
import { getLocales, getMessages, registerLocale } from "../src/lib/i18n/catalog.js";

describe("registerLocale", () => {
	it("registers 'es' with partial messages and falls back to en for the rest", () => {
		registerLocale("es", { common: { close: "Cerrar" } });
		expect(getLocales()).toContain("es");
		expect(getMessages("es").common.close).toBe("Cerrar");
		expect(getMessages("es").common.back).toBe("Back");
	});

	it("deep-merges per-call overrides over a registered locale", () => {
		registerLocale("es", { common: { close: "Cerrar" } });
		expect(getMessages("es", { common: { back: "Atrás" } }).common.back).toBe("Atrás");
		expect(getMessages("es", { common: { back: "Atrás" } }).common.close).toBe("Cerrar");
	});

	it("resolves region subtags to the base language, then en", () => {
		registerLocale("es", { common: { close: "Cerrar" } });
		expect(getMessages("es-MX").common.close).toBe("Cerrar");
		expect(getMessages("fr").common.close).toBe("Close");
	});

	it("keeps built-in pt-BR intact", () => {
		expect(getMessages("pt-BR").common.close).toBe("Fechar");
	});
});

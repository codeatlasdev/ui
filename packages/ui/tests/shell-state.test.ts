import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import {
	readSectionOpen,
	SHELL_KEY,
	writeSectionOpen,
} from "../src/lib/components/AppShell/shell-state.js";

// DOM only for this file (localStorage); `afterAll` removes it so other unit files keep a bare global.
GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

beforeEach(() => localStorage.clear());

describe("shell-state: section open state (#1173)", () => {
	it("same label in two modules: each keeps its own", () => {
		writeSectionOpen("crm", "Cadastros", false);
		expect(readSectionOpen("crm", "Cadastros")).toBe(false);
		expect(readSectionOpen("fin", "Cadastros")).toBeUndefined();
	});

	it("reads a label-only key stored before #1173", () => {
		localStorage.setItem(SHELL_KEY, JSON.stringify({ sections: { Cadastros: false } }));
		expect(readSectionOpen("crm", "Cadastros")).toBe(false);
		expect(readSectionOpen("fin", "Cadastros")).toBe(false);
	});

	it("a module's own choice wins over the old key", () => {
		localStorage.setItem(SHELL_KEY, JSON.stringify({ sections: { Cadastros: false } }));
		writeSectionOpen("crm", "Cadastros", true);
		expect(readSectionOpen("crm", "Cadastros")).toBe(true);
		// The module the user has not touched keeps what it had.
		expect(readSectionOpen("fin", "Cadastros")).toBe(false);
	});
});

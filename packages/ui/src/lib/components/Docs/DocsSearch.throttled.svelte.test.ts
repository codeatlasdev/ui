import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { SLOW_FLOW } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import DocsSearchHarness from "./DocsSearchHarness.test.svelte";
import type { DocsSearchEntry } from "./types";

const entries: DocsSearchEntry[] = [
	{
		href: "/guide/start",
		title: "Getting started",
		section: "Guide",
		description: "Start here",
		headings: [{ text: "Installation", id: "installation" }],
		text: "install the package",
	},
	{
		href: "/api/messages",
		title: "Send message",
		section: "API",
		description: "Sending endpoint",
		headings: [],
		text: "webhook and QR code",
	},
	{
		href: "/api/webhooks",
		title: "Webhooks",
		section: "API",
		description: "Events",
		headings: [],
		text: "configuração of callbacks",
	},
];

const input = () => page.getByRole("combobox", { name: "Buscar" });

beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

// #97: the same flow as DocsSearch.svelte.test.ts under CDP CPU throttling, so the slow-CI behaviour
// (every Playwright step costing hundreds of ms) is reproduced on demand.
describe.each([40, 150])("DocsSearch under %dx CPU throttle (#97)", (rate) => {
	beforeEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate });
	});
	afterEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate: 1 });
	});

	it(
		"ArrowDown/ArrowUp move aria-activedescendant/aria-selected; Enter selects it",
		async () => {
			const onselect = vi.fn();
			await render(DocsSearchHarness, { index: entries, open: true, onselect });
			await userEvent.keyboard("webhook");
			const options = page.getByRole("option");
			await expect.poll(() => options.elements().length).toBeGreaterThan(1);
			await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
			const firstId = options.first().element().id;
			await expect.element(input()).toHaveAttribute("aria-activedescendant", firstId);
			await userEvent.keyboard("{ArrowDown}");
			await expect.element(options.nth(1)).toHaveAttribute("aria-selected", "true");
			await expect.element(options.first()).toHaveAttribute("aria-selected", "false");
			await userEvent.keyboard("{ArrowUp}");
			await expect.element(options.first()).toHaveAttribute("aria-selected", "true");
			await userEvent.keyboard("{ArrowDown}{Enter}");
			expect(onselect).toHaveBeenCalledOnce();
		},
		SLOW_FLOW
	);
});

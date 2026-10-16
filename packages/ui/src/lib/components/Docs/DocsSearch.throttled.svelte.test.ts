import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
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
	const budget = rate >= 150 ? 30_000 : 15_000;

	beforeEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate });
	});
	afterEach(async () => {
		await cdp().send("Emulation.setCPUThrottlingRate", { rate: 1 });
	});

	it(
		"ArrowDown moves selection; Enter selects under load (#97)",
		async () => {
			const onselect = vi.fn();
			await render(DocsSearchHarness, { index: entries, open: true, onselect });
			// fill() = 1 CDP call vs 14 for keyboard("webhook"); onOpen already focused the input.
			await input().fill("webhook");
			const options = page.getByRole("option");
			await expect.poll(() => options.elements().length).toBeGreaterThan(0);
			// ArrowDown + Enter proves selection state is not reset by the $effect race (#97).
			await userEvent.keyboard("{ArrowDown}{Enter}");
			expect(onselect).toHaveBeenCalledOnce();
		},
		budget
	);
});

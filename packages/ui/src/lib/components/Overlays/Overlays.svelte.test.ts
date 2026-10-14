import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./ClosedOverlays.test.svelte";

const OVERLAYS = [
	"Dialog",
	"AlertDialog",
	"Drawer",
	"Sheet",
	"Lightbox",
	"CommandPalette",
	"DocsSearch",
	"DropdownMenu",
	"Popover",
	"Select",
	"Combobox",
	"Tooltip",
	"NotificationBell",
	"DatePicker",
	"DateRangePicker",
] as const;

const label = (n: Node) => `${n.nodeName}:${(n.textContent ?? "").trim().slice(0, 30)}`;

/**
 * Mounts `only` and returns the nodes it added under <body> beside the render container
 * (the container is the one new <div> that holds the harness's own markup). A closed overlay
 * must be a no-op for the document: no portal root, no anchors, no marker comments.
 */
async function bodyNodesAdded(only: string): Promise<string[]> {
	const before = new Set(document.body.childNodes);
	const screen = await render(Harness, { only });
	const added = [...document.body.childNodes].filter(
		(n) => !before.has(n) && n !== screen.container && !screen.container.contains(n)
	);
	return added.map(label);
}

describe("closed overlays", () => {
	for (const name of OVERLAYS) {
		it(`${name} adds no nodes under <body> while closed`, async () => {
			expect(await bodyNodesAdded(name)).toEqual([]);
			expect(
				document.querySelectorAll(
					"dialog, [role='dialog'], [role='menu'], [role='listbox'], [role='tooltip'], .ca-floating, .ca-overlay"
				)
			).toHaveLength(0);
		});
	}
});

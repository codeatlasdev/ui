import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

/**
 * #741: every prose table cell used to be forced to `min-width: 7rem` (105px at the 15px root), so a
 * column holding `string` or `true` took as much room as the description and the table grew 45% taller
 * on a phone. Cells hug their content; only a `data-prose` cell gets a readable measure.
 */
const host = document.createElement("div");
afterEach(() => host.remove());

const table = `<div class="ca-prose"><div class="ca-table-wrap"><table>
<thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
<tbody><tr>
<td><code>to</code></td><td>string</td><td>sim</td>
<td data-prose>The recipient phone number in international format, including the country code and no spaces.</td>
</tr><tr>
<td><code>unauthorized_client_credentials_error</code></td><td>string</td><td>não</td>
<td>Short.</td>
</tr></tbody></table></div></div>`;

const cells = (row: number) =>
	[...host.querySelectorAll(`tbody tr:nth-child(${row}) td`)] as HTMLElement[];

describe("prose table cells (#741)", () => {
	it("short cells hug their content instead of a 7rem minimum", async () => {
		await page.viewport(360, 800);
		host.innerHTML = table;
		document.body.append(host);
		const [, type, required] = cells(1);
		const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(type.getBoundingClientRect().width).toBeLessThan(7 * rem);
		expect(required.getBoundingClientRect().width).toBeLessThan(7 * rem);
	});

	it("a data-prose cell keeps a readable measure, tunable by --ca-prose-cell-min", () => {
		host.innerHTML = table;
		document.body.append(host);
		const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
		const a = cells(1)[3];
		expect(Number.parseFloat(getComputedStyle(a).minWidth)).toBe(12 * rem);
		host.style.setProperty("--ca-prose-cell-min", "20rem");
		expect(Number.parseFloat(getComputedStyle(a).minWidth)).toBe(20 * rem);
	});
});

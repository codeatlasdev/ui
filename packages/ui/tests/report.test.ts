import { describe, expect, it } from "bun:test";
import { buildReport, redact } from "../src/cli/report.ts";

describe("redact", () => {
	it("replaces absolute and home paths", () => {
		const r = redact(
			"fails in /Users/jane/Projects/acme-billing/src/app.ts and C:\\Users\\jane\\acme\\x.ts and ~/work/acme/y.ts"
		);
		expect(r.text).not.toContain("jane");
		expect(r.text).not.toContain("acme");
		expect(r.text.match(/<path>/g)?.length).toBe(3);
		expect(r.redactions).toContain("path");
	});

	it("replaces project-relative file paths with directories", () => {
		const r = redact("see src/routes/billing/+page.svelte:12 and ./lib/acme/invoice.ts");
		expect(r.text).not.toContain("billing");
		expect(r.text).not.toContain("invoice");
		expect(r.redactions).toContain("path");
	});

	it("keeps github.com/codeatlasdev and ui.codeatlas.com.br URLs, drops others", () => {
		const r = redact(
			"see https://ui.codeatlas.com.br/docs/inputs/button/ and https://github.com/codeatlasdev/ui/issues/1 but not https://staging.acme.io/app?token=abc or http://localhost:5173/x"
		);
		expect(r.text).toContain("https://ui.codeatlas.com.br/docs/inputs/button/");
		expect(r.text).toContain("https://github.com/codeatlasdev/ui/issues/1");
		expect(r.text).not.toContain("acme.io");
		expect(r.text).not.toContain("localhost");
		expect(r.text.match(/<url>/g)?.length).toBe(2);
		expect(r.redactions).toContain("url");
	});

	it("drops lookalike hosts of the allowed ones", () => {
		const r = redact("https://ui.codeatlas.com.br.evil.io/x https://github.com/acme-corp/app");
		expect(r.text).not.toContain("evil.io");
		expect(r.text).not.toContain("acme-corp");
	});

	it("replaces emails and IPs", () => {
		const r = redact("contact jane.doe@acme.com at 10.99.201.14 or 2001:db8::1");
		expect(r.text).toContain("<email>");
		expect(r.text).toContain("<ip>");
		expect(r.text).not.toContain("acme.com");
		expect(r.text).not.toContain("10.99");
		expect(r.redactions).toEqual(expect.arrayContaining(["email", "ip"]));
	});

	it("replaces tokens and keys", () => {
		const secrets = [
			"sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789",
			"ghp_abcdefghijklmnopqrstuvwxyz0123456789",
			"AKIAIOSFODNN7EXAMPLE",
			"Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abcDEF123_-xyz",
			"Zk3p9QxW7vLm2RtY8bNc4HdJ6sFg1AeU5oKi0XyV",
		];
		const r = redact(secrets.map((s) => `key: ${s}`).join("\n"));
		for (const s of secrets) expect(r.text).not.toContain(s.replace("Bearer ", ""));
		expect(r.text).toContain("<secret>");
		expect(r.redactions).toContain("secret");
	});

	it("does not treat ordinary long identifiers or class names as secrets", () => {
		const t =
			"ca-dialog__body-container and onSelectionChangeHandlerForRangeCalendar and --ca-space-4";
		expect(redact(t).text).toBe(t);
	});

	it("replaces env assignments", () => {
		const r = redact(
			"DATABASE_URL=postgres://u:p@db/app\nPUBLIC_API_KEY='abc' and NODE_ENV=production"
		);
		expect(r.text).not.toContain("postgres");
		expect(r.text).not.toContain("abc");
		expect(r.text).toContain("<env>");
		expect(r.redactions).toContain("env");
	});

	it("replaces package scopes other than @codeatlasdev", () => {
		const r = redact(
			'import { x } from "@acme/billing"; import { Button } from "@codeatlasdev/ui"; import y from "@acme-corp/internal/db"'
		);
		expect(r.text).not.toContain("acme");
		expect(r.text).toContain("@codeatlasdev/ui");
		expect(r.text).toContain("@scope/pkg");
		expect(r.redactions).toContain("scope");
	});

	it("leaves clean text untouched and reports nothing", () => {
		const t = "Button with loading never announces. <Button loading>Save</Button>";
		const r = redact(t);
		expect(r.text).toBe(t);
		expect(r.redactions).toEqual([]);
	});
});

describe("buildReport", () => {
	const input = {
		kind: "bug" as const,
		title: "Select closes on /Users/jane/acme/app.ts scroll",
		component: "Select",
		expected: "Stays open",
		actual: "Closes; token sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789 leaked",
		repro: '<Select items={[{ value: "a", label: "A" }]} />',
		workaround: "Wrap in a div",
		version: "4.1.0",
	};

	it("builds a sanitized markdown body with every field and the footer", () => {
		const r = buildReport(input, "9.9.9");
		expect(r.body).toContain("Select");
		expect(r.body).toContain("Stays open");
		expect(r.body).toContain("Wrap in a div");
		expect(r.body).toContain("4.1.0");
		expect(r.body).toContain("Reported by an AI agent via ca-ui-mcp; reviewed for private details");
		expect(r.body).not.toContain("jane");
		expect(r.body).not.toContain("sk-ant");
		expect(r.title).not.toContain("jane");
		expect(r.redactions.length).toBeGreaterThan(0);
	});

	it("falls back to the manifest version when none is given", () => {
		const r = buildReport({ ...input, version: undefined }, "9.9.9");
		expect(r.body).toContain("9.9.9");
	});

	it("prefills the ai_report form with sanitized fields", () => {
		const r = buildReport(input, "9.9.9");
		const url = new URL(r.url);
		expect(url.origin + url.pathname).toBe("https://github.com/codeatlasdev/ui/issues/new");
		expect(url.searchParams.get("template")).toBe("ai_report.yml");
		expect(url.searchParams.get("kind")).toBe("bug");
		expect(url.searchParams.get("component")).toBe("Select");
		expect(url.searchParams.get("expected")).toBe("Stays open");
		expect(url.searchParams.get("title")).not.toContain("jane");
		expect(url.searchParams.get("actual")).not.toContain("sk-ant");
	});

	it("emits a gh issue create command that shell-quotes the body", () => {
		const r = buildReport({ ...input, title: "it's broken" }, "9.9.9");
		expect(r.command.startsWith("gh issue create --repo codeatlasdev/ui")).toBe(true);
		expect(r.command).toContain("--label");
		expect(r.command).toContain(`'it'\\''s broken'`);
	});

	it("labels by kind", () => {
		expect(buildReport({ ...input, kind: "docs" }, "1.0.0").command).toContain(
			"'documentation,ai-report'"
		);
	});

	it("omits optional sections that were not provided", () => {
		const r = buildReport({ kind: "docs", title: "Typo", expected: "a", actual: "b" }, "1.0.0");
		expect(r.body).not.toContain("Workaround");
		expect(r.body).not.toContain("Reproduction");
	});
});

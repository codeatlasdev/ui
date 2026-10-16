import { describe, expect, it } from "bun:test";
import { parseIds, runPick } from "../src/cli/pick.ts";

const GALLERY = "https://ui.codeatlas.com.br/gallery/";

/** Starts `runPick` with a fake opener and returns the callback URL the gallery would receive. */
async function start(opts: { timeoutMs?: number; ids?: string[] } = {}) {
	const lines: string[] = [];
	let opened = "";
	let resolveOpened: () => void = () => {};
	const openedP = new Promise<void>((r) => (resolveOpened = r));
	const done = runPick({
		gallery: GALLERY,
		ids: opts.ids,
		timeoutMs: opts.timeoutMs ?? 5000,
		open: (url) => {
			opened = url;
			resolveOpened();
		},
		log: (l) => lines.push(l),
	});
	await openedP;
	const link = new URL(opened);
	const cb = new URL(link.searchParams.get("cb") ?? "");
	return { done, lines, link, cb };
}

describe("parseIds", () => {
	it("accepts 12, 012 and #012, dedupes and sorts", () => {
		expect(parseIds("12,#012, 045 ,5")).toEqual(["005", "012", "045"]);
	});
	it("rejects anything that is not a catalog number", () => {
		expect(parseIds("012,../x")).toBeNull();
		expect(parseIds("")).toBeNull();
		expect(parseIds("1234")).toBeNull();
	});
});

describe("runPick", () => {
	it("opens the gallery with a loopback callback and a random token", async () => {
		const a = await start();
		const b = await start();
		for (const s of [a, b]) {
			expect(s.link.origin + s.link.pathname).toBe(GALLERY);
			expect(s.cb.hostname).toBe("127.0.0.1");
			expect(s.cb.protocol).toBe("http:");
			expect(Number(s.cb.port)).toBeGreaterThan(0);
			expect(s.cb.searchParams.get("t")).toMatch(/^[0-9a-f]{32}$/);
		}
		expect(a.cb.searchParams.get("t")).not.toBe(b.cb.searchParams.get("t"));
		await fetch(`${a.cb.href}&ids=001`);
		await fetch(`${b.cb.href}&ids=001`);
		await Promise.all([a.done, b.done]);
	});

	it("resolves with the picked ids, prints them and answers the browser", async () => {
		const s = await start();
		const res = await fetch(`${s.cb.href}&ids=012,005,012`);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("close this tab");
		const out = await s.done;
		expect(out).toEqual({ ids: ["005", "012"] });
		expect(s.lines).toContain("#005 #012");
	});

	it("keeps listening after a wrong or missing token (403)", async () => {
		const s = await start();
		const bad = new URL(s.cb.href);
		bad.searchParams.set("t", "0".repeat(32));
		expect((await fetch(`${bad.href}&ids=001`)).status).toBe(403);
		const none = new URL(s.cb.origin);
		expect((await fetch(`${none.href}?ids=001`)).status).toBe(403);
		expect((await fetch(`${s.cb.href}&ids=001`)).status).toBe(200);
		expect(await s.done).toEqual({ ids: ["001"] });
	});

	it("rejects malformed ids (400) and non-GET methods (405) without finishing", async () => {
		const s = await start();
		expect((await fetch(`${s.cb.href}&ids=zzz`)).status).toBe(400);
		expect((await fetch(`${s.cb.href}&ids=001`, { method: "POST" })).status).toBe(405);
		expect((await fetch(`${s.cb.href}&ids=007`)).status).toBe(200);
		expect(await s.done).toEqual({ ids: ["007"] });
	});

	it("does not send a CORS header (another site cannot read the reply)", async () => {
		const s = await start();
		const res = await fetch(`${s.cb.href}&ids=001`, {
			headers: { origin: "https://evil.example" },
		});
		expect(res.headers.get("access-control-allow-origin")).toBeNull();
		await s.done;
	});

	it("times out and frees the port", async () => {
		const s = await start({ timeoutMs: 150 });
		await expect(s.done).rejects.toThrow(/timed out/i);
		await expect(fetch(s.cb.href)).rejects.toBeDefined();
	});

	it("preselects ids on the gallery link with ?pick=", async () => {
		const s = await start({ ids: ["045", "012"] });
		expect(s.link.searchParams.get("pick")).toBe("012,045");
		await fetch(`${s.cb.href}&ids=012`);
		await s.done;
	});
});

describe("codeatlas-ui pick (binary)", () => {
	const BIN = new URL("../bin/codeatlas-ui.ts", import.meta.url).pathname;

	it("prints the link, then the picked ids, and exits 0", async () => {
		const proc = Bun.spawn([process.execPath, BIN, "pick", "12", "--url", GALLERY], {
			stdout: "pipe",
			stderr: "pipe",
			// No browser in tests: a PATH without the opener makes the spawn fail silently.
			env: { ...process.env, PATH: "/nonexistent" },
		});
		const reader = proc.stdout.getReader();
		let out = "";
		const cb = await (async () => {
			for (;;) {
				const { value, done } = await reader.read();
				if (done) throw new Error(`no link printed: ${out}`);
				out += new TextDecoder().decode(value);
				const m = out.match(/visit: (\S+)/);
				if (m) return new URL(new URL(m[1]).searchParams.get("cb") ?? "");
			}
		})();
		expect(new URL(out.match(/visit: (\S+)/)?.[1] ?? "").searchParams.get("pick")).toBe("012");
		expect((await fetch(`${cb.href}&ids=012,5`)).status).toBe(200);
		while (!out.includes("#005 #012")) {
			const { value, done } = await reader.read();
			if (done) break;
			out += new TextDecoder().decode(value);
		}
		expect(out).toContain("#005 #012");
		expect(await proc.exited).toBe(0);
	});

	it("exits 1 on a malformed id and on timeout", async () => {
		const bad = Bun.spawn([process.execPath, BIN, "pick", "nope"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		expect(await bad.exited).toBe(1);
		const slow = Bun.spawn([process.execPath, BIN, "pick", "--timeout", "0.2", "--url", GALLERY], {
			stdout: "pipe",
			stderr: "pipe",
			env: { ...process.env, PATH: "/nonexistent" },
		});
		expect(await slow.exited).toBe(1);
		expect(await new Response(slow.stderr).text()).toContain("timed out");
	});
});

/**
 * `codeatlas-ui pick`: opens the gallery with a one-shot loopback callback, waits for the ids the
 * user sends back ("Send to AI") and prints them. The listener binds 127.0.0.1 only, answers a single
 * GET carrying a random per-run token, sends no CORS header, and closes after the first valid pick,
 * on timeout or on Ctrl-C. The gallery drops any `?cb=` that is not loopback (`safeCallback`).
 */

import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export const GALLERY_URL = "https://ui.codeatlas.com.br/gallery/";

export interface PickOptions {
	/** Gallery page to open (default: the public site). */
	gallery?: string;
	/** Ids to preselect with `?pick=`. */
	ids?: string[];
	/** Give up after this many ms (default 10 minutes). */
	timeoutMs?: number;
	/** Opens a URL in the browser (default: the platform opener). */
	open?: (url: string) => void;
	log?: (line: string) => void;
	signal?: AbortSignal;
}

export interface PickResult {
	ids: string[];
}

/** `12`, `012`, `#012` → `012`; sorted and deduplicated. `null` when any entry is not a catalog number. */
export function parseIds(raw: string): string[] | null {
	const parts = raw
		.split(",")
		.map((s) => s.trim().replace(/^#/, ""))
		.filter(Boolean);
	if (!parts.length || parts.some((p) => !/^\d{1,3}$/.test(p))) return null;
	return [...new Set(parts.map((p) => p.padStart(3, "0")))].sort();
}

function openInBrowser(url: string): void {
	const [cmd, args] =
		process.platform === "darwin"
			? ["open", [url]]
			: process.platform === "win32"
				? ["cmd", ["/c", "start", "", url.replaceAll("&", "^&")]]
				: ["xdg-open", [url]];
	// A missing opener must not crash the run: the URL is printed, the user can open it by hand.
	spawn(cmd, args, { stdio: "ignore", detached: true })
		.on("error", () => {})
		.unref();
}

const PAGE_HEAD =
	'<!doctype html><meta charset="utf-8"><title>codeatlas-ui pick</title><body style="font:16px system-ui;padding:2rem">';

export function runPick(opts: PickOptions = {}): Promise<PickResult> {
	const log = opts.log ?? ((l: string) => process.stdout.write(`${l}\n`));
	const open = opts.open ?? openInBrowser;
	const token = randomBytes(16).toString("hex");

	return new Promise<PickResult>((resolve, reject) => {
		let timer: NodeJS.Timeout | undefined;
		const server = createServer((req, res) => {
			const send = (status: number, body: string, headers: Record<string, string> = {}) => {
				res.writeHead(status, {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "no-store",
					...headers,
				});
				res.end(`${PAGE_HEAD}<p>${body}</p>`);
			};
			if (req.method !== "GET") return send(405, "Method not allowed.", { allow: "GET" });
			const url = new URL(req.url ?? "/", "http://127.0.0.1");
			const sent = Buffer.from(url.searchParams.get("t") ?? "");
			if (sent.length !== token.length || !timingSafeEqual(sent, Buffer.from(token)))
				return send(403, "Forbidden.");
			const ids = parseIds(url.searchParams.get("ids") ?? "");
			if (!ids) return send(400, "Expected ids like 012,045.");
			send(200, `Received ${ids.map((i) => `#${i}`).join(" ")}. You can close this tab.`);
			finish(() => resolve({ ids }));
		});

		const finish = (settle: () => void) => {
			clearTimeout(timer);
			opts.signal?.removeEventListener("abort", onAbort);
			server.close();
			server.closeAllConnections();
			settle();
		};
		const onAbort = () => finish(() => reject(new Error("pick cancelled")));
		server.on("error", (e) => finish(() => reject(e)));

		server.listen(0, "127.0.0.1", () => {
			const { port } = server.address() as AddressInfo;
			const link = new URL(opts.gallery ?? GALLERY_URL);
			if (opts.ids?.length) link.searchParams.set("pick", [...opts.ids].sort().join(","));
			link.searchParams.set("cb", `http://127.0.0.1:${port}/?t=${token}`);
			log(`Opening the gallery. Pick pages, then press "Send to AI".`);
			log(`If the browser does not open, visit: ${link.href}`);
			open(link.href);
			timer = setTimeout(
				() => finish(() => reject(new Error("pick timed out: no ids received"))),
				opts.timeoutMs ?? 600_000
			);
			if (opts.signal?.aborted) onAbort();
			else opts.signal?.addEventListener("abort", onAbort, { once: true });
		});
	}).then((r) => {
		log(r.ids.map((i) => `#${i}`).join(" "));
		return r;
	});
}

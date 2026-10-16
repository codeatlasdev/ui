import { afterEach, describe, expect, it, vi } from "vitest";
import { checkA11y } from "../../../tests/a11y";
import { type LayerChange, type LayerHandle, onLayerChange, openLayer } from "./layer.js";

const open: LayerHandle[] = [];
afterEach(() => {
	while (open.length) open.pop()?.close();
	document.body.innerHTML = "";
});

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = ""): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	node.textContent = text;
	document.body.appendChild(node);
	return node;
}
function track(handle: LayerHandle) {
	open.push(handle);
	return handle;
}
const esc = () =>
	document.dispatchEvent(
		new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
	);
const down = (target: Element) =>
	target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

function modal(label = "Modal") {
	const dialog = el("dialog");
	dialog.setAttribute("aria-label", label);
	dialog.innerHTML = `<button type="button">${label} action</button>`;
	return dialog;
}
function menu(label = "Menu") {
	const node = el("div");
	node.setAttribute("role", "menu");
	node.setAttribute("aria-label", label);
	node.innerHTML = `<button type="button" role="menuitem">${label} item</button>`;
	return node;
}

describe("openLayer: stack", () => {
	it("Escape dismisses nested layers top-first, one per press", () => {
		const onBottom = vi.fn();
		const onTop = vi.fn();
		const dialog = modal();
		const bottom = track(openLayer(dialog, { kind: "modal", onDismiss: onBottom }));
		const top = track(openLayer(menu(), { kind: "popover", onDismiss: onTop }));

		esc();
		expect(onTop).toHaveBeenCalledExactlyOnceWith("escape");
		expect(onBottom).not.toHaveBeenCalled();

		top.close();
		esc();
		expect(onBottom).toHaveBeenCalledExactlyOnceWith("escape");
		bottom.close();
	});

	it("one Escape dismisses once; the native cancel is stopped, never reported twice", () => {
		const onDismiss = vi.fn();
		const dialog = modal();
		track(openLayer(dialog, { kind: "modal", onDismiss }));
		esc();
		const cancel = new Event("cancel", { cancelable: true });
		dialog.dispatchEvent(cancel);
		expect(cancel.defaultPrevented).toBe(true);
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith("escape");
		expect(dialog.open).toBe(true);
	});

	it("outside press reaches only the top layer; the anchor counts as inside", () => {
		const trigger = el("button", "trigger");
		const onBottom = vi.fn();
		const onTop = vi.fn();
		track(openLayer(modal(), { kind: "modal", onDismiss: onBottom }));
		const content = menu();
		track(openLayer(content, { kind: "popover", anchor: trigger, onDismiss: onTop }));

		down(content);
		down(trigger);
		expect(onTop).not.toHaveBeenCalled();
		down(el("p", "elsewhere"));
		expect(onTop).toHaveBeenCalledExactlyOnceWith("outside");
		expect(onBottom).not.toHaveBeenCalled();
	});

	it("a click on the modal scrim dismisses it; a click inside does not", () => {
		const onDismiss = vi.fn();
		const dialog = modal();
		track(openLayer(dialog, { kind: "modal", onDismiss }));
		const box = dialog.getBoundingClientRect();

		const at = (target: Element, x: number, y: number) => {
			target.dispatchEvent(
				new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y })
			);
			target.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
		};
		at(dialog, box.left + 4, box.top + 4);
		expect(onDismiss).not.toHaveBeenCalled();
		at(dialog, box.left - 20, box.top - 20);
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith("outside");
	});

	it("outside:false and escape:false opt out", () => {
		const onDismiss = vi.fn();
		track(openLayer(modal(), { kind: "modal", onDismiss, outside: false, escape: false }));
		esc();
		down(el("p"));
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it("a hint layer never takes Escape or outside presses", () => {
		const onDismiss = vi.fn();
		const tip = el("div", "tip");
		track(openLayer(tip, { kind: "hint", anchor: el("button"), onDismiss }));
		esc();
		down(el("p"));
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it("focus moving outside is reported only with focusOutside", () => {
		const outside = el("button", "elsewhere");
		const quiet = vi.fn();
		const loud = vi.fn();
		const a = openLayer(menu("A"), { kind: "popover", onDismiss: quiet });
		outside.focus();
		a.close();
		const b = track(openLayer(menu("B"), { kind: "popover", focusOutside: true, onDismiss: loud }));
		outside.blur();
		outside.focus();
		expect(quiet).not.toHaveBeenCalled();
		expect(loud).toHaveBeenCalledWith("focus-outside");
		b.close();
	});

	it("a node that is already detached opens nothing and throws nothing", () => {
		const events: LayerChange[] = [];
		const stop = onLayerChange((d) => events.push(d));
		const gone = document.createElement("div");
		const handle = openLayer(gone, { kind: "popover", onDismiss: () => {} });
		handle.close();
		stop();
		expect(events).toEqual([]);
	});

	it("closing twice is harmless and a closed layer stops reacting", () => {
		const onDismiss = vi.fn();
		const handle = openLayer(modal(), { kind: "modal", onDismiss });
		handle.close();
		handle.close();
		esc();
		expect(onDismiss).not.toHaveBeenCalled();
	});
});

describe("openLayer: top layer, no z-index", () => {
	it("modal uses showModal and moves to body; the page behind becomes inert", () => {
		const host = el("section");
		const dialog = document.createElement("dialog");
		host.appendChild(dialog);
		track(openLayer(dialog, { kind: "modal", onDismiss: () => {} }));
		expect(dialog.open).toBe(true);
		expect(dialog.matches(":modal")).toBe(true);
		expect(dialog.parentElement).toBe(document.body);
	});

	it("a popover opened over a modal is in the top layer and hit-tests above it", () => {
		const dialog = modal();
		// A rule that would lose to any z-index game: the dialog is declared with a huge z-index.
		dialog.style.zIndex = "2147483000";
		track(openLayer(dialog, { kind: "modal", onDismiss: () => {} }));
		const trigger = dialog.querySelector("button") as HTMLElement;
		const content = menu();
		Object.assign(content.style, { width: "120px", height: "60px", zIndex: "0" });
		track(openLayer(content, { kind: "popover", anchor: trigger, onDismiss: () => {} }));

		expect(content.matches(":popover-open")).toBe(true);
		const r = content.getBoundingClientRect();
		const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
		expect(content.contains(hit)).toBe(true);
	});

	it("the page behind a modal is inert; a popover mounted into it stays interactive", () => {
		const behind = el("button", "behind");
		const dialog = modal();
		track(openLayer(dialog, { kind: "modal", onDismiss: () => {} }));
		const b = behind.getBoundingClientRect();
		expect(document.elementFromPoint(b.left + 2, b.top + 2)).not.toBe(behind);

		const content = menu();
		track(openLayer(content, { kind: "popover", anchor: dialog, onDismiss: () => {} }));
		expect(dialog.contains(content)).toBe(true);
	});

	it("closing a popover puts it back where its owner declared it", () => {
		const host = el("section");
		const content = document.createElement("div");
		host.appendChild(content);
		const dialog = modal();
		track(openLayer(dialog, { kind: "modal", onDismiss: () => {} }));
		const handle = openLayer(content, { kind: "popover", onDismiss: () => {} });
		expect(content.parentElement).toBe(dialog);
		handle.close();
		expect(content.parentElement).toBe(host);
	});
});

describe("openLayer: focus", () => {
	it("returns focus to the opener when the layer closes (modal)", () => {
		const trigger = el("button", "open");
		trigger.focus();
		const handle = openLayer(modal(), { kind: "modal", onDismiss: () => {} });
		expect(document.activeElement).not.toBe(trigger);
		handle.close();
		expect(document.activeElement).toBe(trigger);
	});

	it("returns focus to the pressed opener when the browser never focused it (Safari)", () => {
		const trigger = el("button", "open");
		(document.activeElement as HTMLElement | null)?.blur();
		down(trigger);
		expect(document.activeElement).toBe(document.body);
		const handle = openLayer(modal(), { kind: "modal", onDismiss: () => {} });
		handle.close();
		expect(document.activeElement).toBe(trigger);
	});

	it("prefers the pressed opener over a focused ancestor (WebKit tap focuses <main>)", () => {
		const main = el("main");
		main.tabIndex = -1;
		const trigger = document.createElement("button");
		trigger.textContent = "open";
		main.append(trigger);
		down(trigger);
		main.focus();
		const handle = openLayer(modal(), { kind: "modal", onDismiss: () => {} });
		handle.close();
		expect(document.activeElement).toBe(trigger);
	});

	it("returns focus to the anchor when a popover closes", () => {
		const trigger = el("button", "open");
		trigger.focus();
		const content = menu();
		const handle = openLayer(content, { kind: "popover", anchor: trigger, onDismiss: () => {} });
		(content.querySelector("button") as HTMLElement).focus();
		handle.close();
		expect(document.activeElement).toBe(trigger);
	});

	it("restoreFocus:false leaves focus alone", () => {
		const trigger = el("button", "open");
		const other = el("button", "other");
		trigger.focus();
		const content = menu();
		const handle = openLayer(content, {
			kind: "popover",
			anchor: trigger,
			onDismiss: () => {},
			restoreFocus: false,
		});
		other.focus();
		handle.close();
		expect(document.activeElement).toBe(other);
	});

	it("closing a nested menu returns focus into the dialog, not the page", () => {
		const dialog = modal();
		track(openLayer(dialog, { kind: "modal", onDismiss: () => {} }));
		const inDialog = dialog.querySelector("button") as HTMLElement;
		inDialog.focus();
		const handle = openLayer(menu(), { kind: "popover", anchor: inDialog, onDismiss: () => {} });
		handle.close();
		expect(document.activeElement).toBe(inDialog);
	});
});

describe("layerchange", () => {
	it("fires on open and on close with the modal flag and depth", () => {
		const events: LayerChange[] = [];
		const stop = onLayerChange((d) => events.push(d));

		const dialog = openLayer(modal(), { kind: "modal", onDismiss: () => {} });
		const pop = openLayer(menu(), { kind: "popover", onDismiss: () => {} });
		pop.close();
		dialog.close();
		stop();

		expect(events.map((e) => [e.count, e.modal])).toEqual([
			[1, true],
			[2, true],
			[1, true],
			[0, false],
		]);
		expect(events[1].layers.map((l) => l.kind)).toEqual(["modal", "popover"]);
		expect(events[1].layers[1].rect.width).toBeGreaterThanOrEqual(0);
	});

	it("is a DOM CustomEvent named layerchange on document, and the unsubscribe works", () => {
		const raw = vi.fn();
		document.addEventListener("layerchange", raw);
		const seen = vi.fn();
		const stop = onLayerChange(seen);

		const a = openLayer(modal(), { kind: "modal", onDismiss: () => {} });
		expect(raw).toHaveBeenCalledTimes(1);
		expect(raw.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
		expect(seen).toHaveBeenCalledTimes(1);

		stop();
		a.close();
		expect(seen).toHaveBeenCalledTimes(1);
		expect(raw).toHaveBeenCalledTimes(2);
		document.removeEventListener("layerchange", raw);
	});

	it("a hint layer is reported too (a host must park native views under tooltips)", () => {
		const events: LayerChange[] = [];
		const stop = onLayerChange((d) => events.push(d));
		const handle = openLayer(el("div", "tip"), { kind: "hint", anchor: el("button") });
		handle.close();
		stop();
		expect(events.map((e) => e.count)).toEqual([1, 0]);
		expect(events[0].layers[0].kind).toBe("hint");
	});
});

describe("openLayer: positioning", () => {
	it("anchored layers get data-side and --ca-anchor-width, and follow the resolved side", async () => {
		const trigger = el("button", "anchor");
		Object.assign(trigger.style, {
			position: "fixed",
			left: "100px",
			top: "100px",
			width: "120px",
		});
		const content = menu();
		content.style.height = "40px";
		track(
			openLayer(content, {
				kind: "popover",
				anchor: trigger,
				side: "bottom",
				sideOffset: 4,
				onDismiss: () => {},
			})
		);
		await expect.poll(() => content.dataset.side).toBe("bottom");
		expect(content.dataset.align).toBe("start");
		await expect.poll(() => content.style.getPropertyValue("--ca-anchor-width")).toBe("120px");
		expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			trigger.getBoundingClientRect().bottom
		);
	});

	it("flips to the top when there is no room below", async () => {
		const trigger = el("button", "anchor");
		Object.assign(trigger.style, {
			position: "fixed",
			left: "100px",
			top: `${window.innerHeight - 40}px`,
			width: "120px",
		});
		const content = menu();
		content.style.height = "160px";
		track(
			openLayer(content, { kind: "popover", anchor: trigger, side: "bottom", onDismiss: () => {} })
		);
		await expect.poll(() => content.dataset.side).toBe("top");
	});

	const SIDES = ["bottom", "top", "right", "left"] as const;
	const ALIGNS = ["start", "center", "end"] as const;
	const placed = async (
		mode: "css" | "js",
		side: (typeof SIDES)[number],
		align: (typeof ALIGNS)[number]
	) => {
		const trigger = el("button", "anchor");
		Object.assign(trigger.style, {
			position: "fixed",
			left: "400px",
			top: "300px",
			width: "100px",
			height: "30px",
		});
		const content = menu();
		Object.assign(content.style, { width: "160px", height: "80px", padding: "0" });
		const handle = openLayer(content, {
			kind: "popover",
			anchor: trigger,
			side,
			align,
			sideOffset: 8,
			positioning: mode,
			onDismiss: () => {},
		});
		await expect.poll(() => content.dataset.side).toBe(side);
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		const r = content.getBoundingClientRect();
		const t = trigger.getBoundingClientRect();
		handle.close();
		return [Math.round(r.left - t.left), Math.round(r.top - t.top)];
	};

	for (const side of SIDES) {
		for (const align of ALIGNS) {
			it(`css and floating-ui agree on ${side}-${align}`, async () => {
				const js = await placed("js", side, align);
				if (!CSS.supports("position-area: bottom")) return;
				expect(await placed("css", side, align)).toEqual(js);
			});
		}
	}
});

describe("openLayer: a11y per state", () => {
	it("a menu popover inside a modal has no axe violations open", async () => {
		const dialog = modal("Settings");
		track(openLayer(dialog, { kind: "modal", onDismiss: () => {} }));
		const content = menu("Actions");
		track(
			openLayer(content, {
				kind: "popover",
				anchor: dialog.querySelector("button") as HTMLElement,
				onDismiss: () => {},
			})
		);
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("closed layer leaves no stray attributes or top-layer state behind", () => {
		const dialog = modal();
		const handle = openLayer(dialog, { kind: "modal", onDismiss: () => {} });
		const content = menu();
		const pop = openLayer(content, { kind: "popover", onDismiss: () => {} });
		pop.close();
		handle.close();
		expect(content.matches(":popover-open")).toBe(false);
		expect(dialog.open).toBe(false);
		expect(document.documentElement.style.overflow).toBe("");
		expect(document.body.style.overflow).toBe("");
	});
});

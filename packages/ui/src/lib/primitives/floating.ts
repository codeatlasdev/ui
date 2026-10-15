import {
	arrow as arrowMiddleware,
	autoUpdate,
	computePosition,
	flip as flipMiddleware,
	type Middleware,
	offset,
	type Placement,
	shift as shiftMiddleware,
	size,
} from "@floating-ui/dom";

export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";

export interface FloatOptions {
	side?: Side;
	align?: Align;
	sideOffset?: number;
	alignOffset?: number;
	collisionPadding?: number;
	flip?: boolean;
	shift?: boolean;
	/** Make the floating element as wide as the anchor. */
	sameWidth?: boolean;
	arrow?: HTMLElement;
}

/** Cleanup function with a way to force a re-position (content size changed). */
export type FloatHandle = (() => void) & { update(): void };

/**
 * floating-ui fallback for browsers without CSS anchor positioning. Positions the top-layer
 * (`position: fixed`) box `floating` against `anchor` and keeps it positioned (scroll, resize,
 * layout change). Writes `data-side` / `data-align` (the *resolved* placement after flipping) and
 * the `--ca-anchor-width` / `--ca-available-height` custom properties. Returns cleanup.
 */
export function float(
	anchor: Element,
	floating: HTMLElement,
	options: FloatOptions = {}
): FloatHandle {
	const {
		side = "bottom",
		align = "start",
		sideOffset = 0,
		alignOffset = 0,
		collisionPadding = 8,
		flip = true,
		shift = true,
		sameWidth = false,
		arrow,
	} = options;

	const placement: Placement = align === "center" ? side : `${side}-${align}`;

	// A top-layer box is positioned from the viewport; the UA popover/dialog styles add `inset: 0` and `margin: auto`.
	floating.style.position = "fixed";
	floating.style.inset = "0 auto auto 0";
	floating.style.margin = "0";

	const middleware: Middleware[] = [offset({ mainAxis: sideOffset, alignmentAxis: alignOffset })];
	if (flip) middleware.push(flipMiddleware({ padding: collisionPadding }));
	if (shift) middleware.push(shiftMiddleware({ padding: collisionPadding }));
	middleware.push(
		size({
			padding: collisionPadding,
			apply({ availableHeight, rects, elements }) {
				elements.floating.style.setProperty(
					"--ca-available-height",
					`${Math.max(0, availableHeight)}px`
				);
				elements.floating.style.setProperty("--ca-anchor-width", `${rects.reference.width}px`);
				if (sameWidth) elements.floating.style.width = `${rects.reference.width}px`;
			},
		})
	);
	if (arrow) middleware.push(arrowMiddleware({ element: arrow }));

	let cancelled = false;
	const update = () => {
		void computePosition(anchor, floating, { placement, middleware, strategy: "fixed" }).then(
			({ x, y, placement: resolved, middlewareData }) => {
				if (cancelled) return;
				// `translate` (not `transform`) so an enter animation on `transform: scale()` composes with it.
				floating.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
				const [s, a = "center"] = resolved.split("-");
				floating.dataset.side = s;
				floating.dataset.align = a;
				const data = middlewareData.arrow;
				if (arrow && data) {
					arrow.style.left = data.x != null ? `${data.x}px` : "";
					arrow.style.top = data.y != null ? `${data.y}px` : "";
				}
			}
		);
	};

	const stop = autoUpdate(anchor, floating, update);
	return Object.assign(
		() => {
			cancelled = true;
			stop();
		},
		{ update }
	);
}

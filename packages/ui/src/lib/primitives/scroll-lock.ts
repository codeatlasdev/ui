let count = 0;
let restore: (() => void) | null = null;

function isIOS() {
	const ua = navigator.userAgent;
	return /iP(hone|ad|od)/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function apply(): () => void {
	const html = document.documentElement;
	const body = document.body;
	const scrollbar = window.innerWidth - html.clientWidth;
	const prev = {
		overflow: body.style.overflow,
		paddingRight: body.style.paddingRight,
		position: body.style.position,
		top: body.style.top,
		width: body.style.width,
	};
	const scrollY = window.scrollY;
	const scrollX = window.scrollX;
	const ios = isIOS();

	if (scrollbar > 0) {
		const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
		body.style.paddingRight = `${current + scrollbar}px`;
	}
	body.style.overflow = "hidden";
	if (ios) {
		// overflow:hidden does not stop touch scrolling on iOS Safari: pin the body instead.
		body.style.position = "fixed";
		body.style.top = `-${scrollY}px`;
		body.style.width = "100%";
	}

	return () => {
		body.style.overflow = prev.overflow;
		body.style.paddingRight = prev.paddingRight;
		if (ios) {
			body.style.position = prev.position;
			body.style.top = prev.top;
			body.style.width = prev.width;
			window.scrollTo(scrollX, scrollY);
		}
	};
}

/**
 * Locks page scroll. Ref-counted: nested overlays share one lock, released when the last one
 * lets go. Compensates the scrollbar width with `padding-right` so layout does not jump, and
 * pins the body on iOS (restoring the scroll position on release).
 */
export function lockScroll(): () => void {
	if (typeof document === "undefined") return () => {};
	if (count === 0) restore = apply();
	count++;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		count--;
		if (count === 0) {
			restore?.();
			restore = null;
		}
	};
}

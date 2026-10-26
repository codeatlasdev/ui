/**
 * The minimum hit area in px: `--ca-touch-target` (styles/tokens.css), resolved by the browser. A test that
 * asserts a touch target compares with this, never with a literal 44 (#650). Browser tests only: the setup
 * file loads global.css, which defines the token.
 */
export function touchTarget(): number {
	const probe = document.createElement("div");
	probe.style.cssText = "position:absolute;visibility:hidden;width:var(--ca-touch-target)";
	document.body.append(probe);
	const px = probe.getBoundingClientRect().width;
	probe.remove();
	if (!(px > 0)) throw new Error("--ca-touch-target did not resolve: is global.css loaded?");
	return px;
}

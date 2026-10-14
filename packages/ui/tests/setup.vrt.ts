import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { beforeEach } from "vitest";

// Same typefaces the docs site self-hosts (site/src/layouts/Base.astro), so baselines don't depend on
// whatever fallback fonts the CI runner ships.
const style = document.createElement("style");
style.textContent = `
:root{--ca-font-sans:"Inter Variable",Inter,system-ui,sans-serif;--ca-font-mono:"JetBrains Mono Variable","JetBrains Mono",monospace}
*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}`;
document.head.append(style);

beforeEach(async () => {
	// Font faces load lazily on first use; force them so the first screenshot isn't a fallback.
	await Promise.all(
		["400", "500", "600", "700"].flatMap((w) => [
			document.fonts.load(`${w} 1em "Inter Variable"`),
			document.fonts.load(`${w} 1em "JetBrains Mono Variable"`),
		])
	);
	await document.fonts.ready;
});

import { vitePreprocess } from "@astrojs/svelte";

export default {
	preprocess: vitePreprocess(),
	// `LoadingBoundary` is shown with a demo that suspends on `await`, which needs this compiler flag.
	compilerOptions: { experimental: { async: true } },
	// Accessibility warnings are errors: a demo that ships an a11y bug fails the build.
	onwarn: (w, handler) => {
		if (w.code.startsWith("a11y_"))
			throw new Error(`${w.filename}:${w.start?.line} ${w.code}: ${w.message}`);
		handler(w);
	},
};

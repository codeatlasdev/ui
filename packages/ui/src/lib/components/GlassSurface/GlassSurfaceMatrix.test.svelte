<script lang="ts">
	import { createRawSnippet } from "svelte";
	import GlassSurface from "./GlassSurface.svelte";

	const thicknesses = ["ultra-thin", "thin", "regular", "thick", "chrome"] as const;
	const body = createRawSnippet(() => ({ render: () => `<span>Surface</span>` }));
	const box = "padding:20px;border-radius:16px;min-width:140px";
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(3,200px);gap:16px;padding:24px;width:max-content"
>
	{#each thicknesses as thickness (thickness)}
		<GlassSurface {thickness} style={box} children={body} />
	{/each}
	<GlassSurface tinted style={box} children={body} />
	<GlassSurface glowing style={box} children={body} />
	<GlassSurface tinted glowing style={box} children={body} />
	<GlassSurface refraction={false} style={box} children={body} />
</div>

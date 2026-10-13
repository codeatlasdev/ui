<script lang="ts">
	// Theme chapter: pick any built-in preset or paste a hex; the preview below is a real set of
	// package components re-themed on its own wrapper. Brand presets are generated in the browser
	// with the package's own palette generator, the same function defineTheme() uses at build time.
	import { Button, Chip, GlassCard, Progress, SegmentedControl, Switch } from "@codeatlasdev/ui";
	import { generatePreset, hexToOklch, presetVars } from "@codeatlasdev/ui/utils/palette-generator";
	import { Check } from "@lucide/svelte";

	const BUILTIN = ["amber", "ocean", "crimson", "cyan", "violet", "emerald", "rose", "slate"] as const;
	const STYLES = ["glass", "frosted", "solid", "flat"] as const;

	let preset = $state<string>("ocean");
	let style = $state<(typeof STYLES)[number]>("glass");
	let dark = $state(true);
	let hex = $state("#e8590c");
	let custom = $state(false);
	let progress = $state(68);

	const validHex = $derived(/^#[0-9a-fA-F]{6}$/.test(hex));

	// Brand preset = the same tokens defineTheme() emits, scoped to this element only.
	const brandStyle = $derived.by(() => {
		if (!custom || !validHex) return undefined;
		const { h, c, l } = hexToOklch(hex);
		const tokens = presetVars(generatePreset(h, c, l))[dark ? "dark" : "light"];
		return Object.entries(tokens)
			.map(([k, v]) => `${k}:${v}`)
			.join(";");
	});

	const code = $derived(`// src/theme.ts
import type { ThemeOptions } from "@codeatlasdev/ui/astro";

export const theme: ThemeOptions = {
  defaultPreset: "${custom && validHex ? "brand" : preset}",
  defaultScheme: "${dark ? "dark" : "light"}",
  defaultStyle: "${style}",${custom && validHex ? `\n  presets: [{ id: "brand", color: "${hex.toLowerCase()}" }],` : ""}
};`);
</script>

<div class="lab">
	<div class="lab__controls">
		<div class="lab__group" role="group" aria-label="Built-in presets">
			{#each BUILTIN as p}
				<button
					type="button"
					class="dot"
					data-preset={p}
					aria-pressed={!custom && preset === p}
					aria-label={p}
					onclick={() => {
						preset = p;
						custom = false;
					}}
				>
					{#if !custom && preset === p}<Check size={12} aria-hidden="true" />{/if}
				</button>
			{/each}
		</div>
		<label class="lab__hex">
			<span>Brand color</span>
			<input
				type="text"
				inputmode="text"
				spellcheck="false"
				maxlength="7"
				bind:value={hex}
				aria-invalid={!validHex}
				onfocus={() => (custom = true)}
				oninput={() => (custom = true)}
			/>
		</label>
		<SegmentedControl
			size="sm"
			aria-label="Surface style"
			value={style}
			items={STYLES.map((s) => ({ value: s, label: s }))}
			onchange={(v) => (style = v as (typeof STYLES)[number])}
		/>
		<Switch bind:checked={dark} label="Dark" />
	</div>

	<div class="lab__island" data-preset={custom ? undefined : preset} data-style={style}>
		<div class="lab__preview" data-theme-scope={dark ? "dark" : "light"} style={brandStyle}>
		<GlassCard title="Storage" thickness="thick">
			<p class="lab__copy">Plan usage resets in 9 days.</p>
			<Progress value={progress} label="Storage used" />
			<div class="lab__row">
				<Chip label="Team" variant="brand" size="sm" />
				<Chip label="Annual" size="sm" />
				<Button size="sm" onclick={() => (progress = (progress + 11) % 100)}>Add 11%</Button>
				<Button size="sm" variant="outlined">Manage</Button>
			</div>
		</GlassCard>
		</div>
	</div>

	<pre class="lab__code"><code>{code}</code></pre>
</div>

<style>
	.lab {
		display: grid;
		gap: var(--ca-space-5);
		min-width: 0;
	}
	.lab__controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ca-space-4);
		align-items: center;
	}
	.lab__group {
		display: flex;
		gap: var(--ca-space-2);
	}
	.dot {
		position: relative;
		display: grid;
		place-items: center;
		inline-size: 26px;
		block-size: 26px;
		border: 0;
		border-radius: var(--ca-radius-pill);
		background: var(--ca-brand-main);
		color: var(--ca-brand-contrast);
		cursor: pointer;
		box-shadow: 0 0 0 1px var(--ca-outline-default);
	}	/* 26px swatch, 44px tap area. */
	.dot::after {
		content: "";
		position: absolute;
		inset: 50% auto auto 50%;
		width: var(--ca-touch-target);
		height: var(--ca-touch-target);
		translate: -50% -50%;
	}

	.dot::after {
		content: "";
		position: absolute;
		inset: -9px -3px;
	}
	.dot:focus-visible {
		outline: 2px solid var(--ca-brand-main);
		outline-offset: 3px;
	}
	.lab__hex {
		display: inline-flex;
		align-items: center;
		gap: var(--ca-space-2);
		font-size: var(--ca-font-size-body2);
		color: var(--ca-text-secondary);
	}
	.lab__hex input {
		inline-size: 7.5rem;
		min-block-size: 44px;
		padding: 0 var(--ca-space-3);
		border-radius: var(--ca-radius-md);
		border: 1px solid var(--ca-outline-default);
		background: var(--ca-surface-raised);
		color: var(--ca-text-primary);
		font-family: var(--ca-font-mono);
		font-size: max(16px, var(--ca-font-size-body2));
	}
	.lab__hex input[aria-invalid="true"] {
		border-color: var(--ca-error-main, currentColor);
	}
	.lab__hex input:focus-visible {
		outline: 2px solid var(--ca-brand-main);
		outline-offset: 2px;
	}
	.lab__preview {
		padding: var(--ca-space-6);
		border-radius: var(--ca-radius-xl);
		background:
			radial-gradient(
				ellipse 80% 70% at 10% 0%,
				color-mix(in oklab, var(--ca-brand-main) 40%, transparent),
				transparent 65%
			),
			var(--ca-surface-base);
		color: var(--ca-text-primary);
		box-shadow: 0 0 0 1px var(--ca-outline-subtle);
	}
	.lab__island[data-style="solid"] .lab__preview,
	.lab__island[data-style="flat"] .lab__preview {
		background: var(--ca-surface-base);
	}
	.lab__copy {
		margin: 0 0 var(--ca-space-3);
		color: var(--ca-text-secondary);
		font-size: var(--ca-font-size-body2);
	}
	.lab__row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ca-space-2);
		align-items: center;
		margin-top: var(--ca-space-4);
	}
	.lab__code {
		margin: 0;
		padding: var(--ca-space-5);
		border-radius: var(--ca-radius-lg);
		background: var(--ca-surface-sunken);
		box-shadow: 0 0 0 1px var(--ca-outline-subtle);
		font-family: var(--ca-font-mono);
		font-size: var(--ca-font-size-body2);
		line-height: 1.7;
		overflow-x: auto;
		color: var(--ca-text-primary);
	}
</style>

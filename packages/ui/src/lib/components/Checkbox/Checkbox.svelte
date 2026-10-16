<script lang="ts">
	import { Check, Minus } from "@lucide/svelte";

	interface Props {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		label?: string;
		/** Native `name`, so the checkbox is part of `FormData` on a plain form submit (value `on`). */
		name?: string;
		/** Accessible name when no visible `label` is rendered. */
		"aria-label"?: string;
		"aria-labelledby"?: string;
		class?: string;
		onchange?: (checked: boolean) => void;
	}

	let {
		checked = $bindable(false),
		indeterminate = false,
		disabled = false,
		label,
		name,
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		class: className = "",
		onchange,
	}: Props = $props();

	const checkId = $props.id();

	const dataState = $derived(indeterminate ? "indeterminate" : checked ? "checked" : "unchecked");
</script>

<div class="ca-checkbox-wrapper {className}">
	<!-- The native input is the control (role, keyboard, form, label association); the box around
	     it only paints. The input covers the box so the whole target is clickable. -->
	<span class="ca-checkbox" data-state={dataState} data-disabled={disabled ? "" : undefined}>
		<input
			id={checkId}
			{name}
			type="checkbox"
			class="ca-checkbox__input"
			{checked}
			{indeterminate}
			{disabled}
			aria-checked={indeterminate ? "mixed" : checked}
			aria-label={label ? undefined : ariaLabel}
			aria-labelledby={label ? undefined : ariaLabelledby}
			onchange={(e) => {
				checked = e.currentTarget.checked;
				onchange?.(checked);
			}}
		/>
		<span class="ca-checkbox__indicator" aria-hidden="true">
			{#if indeterminate}
				<Minus size={12} strokeWidth={3} />
			{:else if checked}
				<Check size={12} strokeWidth={3} />
			{/if}
		</span>
	</span>
	{#if label}
		<label for={checkId} class="ca-checkbox__label" class:ca-checkbox__label--disabled={disabled}>
			{label}
		</label>
	{/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  	.ca-checkbox-wrapper {
  		display: inline-flex;
  		align-items: center;
  		gap: var(--ca-space-2);
  	}

  	:global(.ca-checkbox) {
  		position: relative;
  		width: calc(var(--ca-space-4) + var(--ca-space-0-5));
  		height: calc(var(--ca-space-4) + var(--ca-space-0-5));
  		border-radius: var(--ca-radius-xs);
  		border: var(--ca-border-width-strong) solid var(--ca-outline-control);
  		background: transparent;
  		display: flex;
  		align-items: center;
  		justify-content: center;
  		cursor: pointer;
  		flex-shrink: 0;
  		padding: 0;
  		transition:
  			background var(--ca-duration-fast) var(--ca-ease-standard),
  			border-color var(--ca-duration-fast) var(--ca-ease-standard);
  	}

  	:global(.ca-checkbox[data-state="checked"]),
  	:global(.ca-checkbox[data-state="indeterminate"]) {
  		background: var(--ca-brand-fill);
  		border-color: var(--ca-brand-fill);
  	}

  	/* Disabled from tokens, not opacity: the box edge and mark keep a defined contrast. */
  	:global(.ca-checkbox[data-disabled]) {
  		cursor: not-allowed;
  		border-color: var(--ca-outline-default);
  		color: var(--ca-text-disabled);
  	}
  	:global(.ca-checkbox[data-disabled][data-state="checked"]),
  	:global(.ca-checkbox[data-disabled][data-state="indeterminate"]) {
  		background: var(--ca-text-disabled);
  		border-color: var(--ca-text-disabled);
  		color: var(--ca-surface-raised);
  	}

  	:global(.ca-checkbox:has(.ca-checkbox__input:focus-visible)) {
  		outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
  		outline-offset: var(--ca-focus-ring-offset);
  	}

  	:global(.ca-checkbox__input) {
  		position: absolute;
  		inset: 0;
  		width: 100%;
  		height: 100%;
  		margin: 0;
  		opacity: 0;
  		cursor: inherit;
  	}

  	/* Under coarse pointers the input is the 44px hit area (base.css drops the overlay's taps). */
  	@media (pointer: coarse) {
  		:global(.ca-checkbox__input) {
  			inset: auto;
  			top: 50%;
  			left: 50%;
  			width: max(100%, var(--ca-touch-target));
  			height: max(100%, var(--ca-touch-target));
  			translate: -50% -50%;
  		}
  	}

  	:global(.ca-checkbox__indicator) {
  		display: flex;
  		align-items: center;
  		justify-content: center;
  		color: var(--ca-brand-contrast);
  		width: 100%;
  		height: 100%;
  		pointer-events: none;
  	}

  	.ca-checkbox__label {
  		font-size: var(--ca-font-size-body2);
  		color: var(--ca-text-primary);
  		cursor: pointer;
  		user-select: none;
  	}

  	.ca-checkbox__label--disabled {
  		color: var(--ca-text-disabled);
  		cursor: not-allowed;
  	}
}
</style>

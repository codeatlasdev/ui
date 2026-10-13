<script lang="ts">
	import { Checkbox } from "bits-ui";
	import { Check, Minus } from "@lucide/svelte";
	import { uid } from '../../utils/index.js';

	interface Props {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		label?: string;
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
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		class: className = "",
		onchange,
	}: Props = $props();

	const checkId = uid('cb');
</script>

<div class="ca-checkbox-wrapper {className}">
	<Checkbox.Root
		{checked}
		{indeterminate}
		{disabled}
		id={checkId}
		aria-label={label ? undefined : ariaLabel}
		aria-labelledby={label ? undefined : ariaLabelledby}
		class="ca-checkbox"
		onCheckedChange={(v) => {
			checked = v;
			onchange?.(v);
		}}
	>
		<div class="ca-checkbox__indicator">
			{#if indeterminate}
				<Minus size={12} strokeWidth={3} />
			{:else if checked}
				<Check size={12} strokeWidth={3} />
			{/if}
		</div>
	</Checkbox.Root>
	{#if label}
		<label for={checkId} class="ca-checkbox__label" class:ca-checkbox__label--disabled={disabled}>
			{label}
		</label>
	{/if}
</div>

<style>
	.ca-checkbox-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--ca-space-2);
	}

	:global(.ca-checkbox) {
		width: calc(var(--ca-space-4) + var(--ca-space-0-5));
		height: calc(var(--ca-space-4) + var(--ca-space-0-5));
		border-radius: var(--ca-radius-xs);
		border: var(--ca-border-width-strong) solid var(--ca-outline-strong);
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

	:global(.ca-checkbox[disabled]) {
		cursor: not-allowed;
		opacity: 0.45;
	}

	:global(.ca-checkbox:focus-visible) {
		outline: var(--ca-border-width-focus) solid var(--ca-brand-main);
		outline-offset: var(--ca-focus-ring-offset);
	}

	:global(.ca-checkbox__indicator) {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ca-brand-contrast);
		width: 100%;
		height: 100%;
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
</style>

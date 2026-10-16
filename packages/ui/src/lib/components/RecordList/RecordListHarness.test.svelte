<script lang="ts">
	import IconButton from '../Button/IconButton.svelte';
	import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
	import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';
	import RecordCell from './RecordCell.svelte';
	import RecordList from './RecordList.svelte';
	import RecordRow from './RecordRow.svelte';

	interface Props {
		count?: number;
		columns?: string;
		/** Passes no `labels` (no header row). */
		header?: boolean;
		/** Renders no rows, so the `empty` snippet shows. */
		none?: boolean;
		/** Wraps the list in a box of this width (px) to test the container, not the viewport. */
		width?: number;
	}

	let {
		count = 3,
		columns = 'minmax(0,1.2fr) minmax(0,1.6fr) 5rem 6.5rem 2.75rem',
		header = true,
		none = false,
		width,
	}: Props = $props();

	const apps = $derived(
		Array.from({ length: none ? 0 : count }, (_, i) => ({
			id: i + 1,
			name: `App ${i + 1}`,
			scopes: 'read:users write:orders',
			installs: (i + 1) * 12,
			created: `2026-0${i + 1}-1${i}`,
		}))
	);
</script>

<div data-testid="host" style:width={width ? `${width}px` : undefined}>
	{#if none}
		<p>No apps yet</p>
	{:else}
		<RecordList {columns} labels={header ? ['App', 'Scopes', 'Installs', 'Created'] : undefined} aria-label="Apps">
			{#each apps as app (app.id)}
				<RecordRow>
					{#snippet identity()}<strong>{app.name}</strong>{/snippet}
					<RecordCell label="Scopes">{app.scopes}</RecordCell>
					<RecordCell label="Installs">{app.installs}</RecordCell>
					<RecordCell label="Created">{app.created}</RecordCell>
					{#snippet actions()}
						<DropdownMenu>
							{#snippet triggerChild(props)}
								<IconButton {...props} aria-label={`Actions for ${app.name}`}>⋯</IconButton>
							{/snippet}
							<DropdownMenuItem>Edit</DropdownMenuItem>
						</DropdownMenu>
					{/snippet}
				</RecordRow>
			{/each}
		</RecordList>
	{/if}
</div>

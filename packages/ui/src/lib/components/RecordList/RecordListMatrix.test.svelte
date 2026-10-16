<script lang="ts">
	import Avatar from "../Avatar/Avatar.svelte";
	import IconButton from "../Button/IconButton.svelte";
	import RecordCell from "./RecordCell.svelte";
	import RecordList from "./RecordList.svelte";
	import RecordRow from "./RecordRow.svelte";

	const COLUMNS = "minmax(0,1.2fr) minmax(0,1.6fr) 5rem 6.5rem 2.75rem";
	const LABELS = ["App", "Scopes", "Installs", "Created"];
	const APPS = [
		{ name: "Billing", scopes: "read:invoices write:invoices", installs: 128, created: "2026-03-14" },
		{ name: "Support desk with a very long application name", scopes: "read:tickets", installs: 7, created: "2026-04-02" },
	];
</script>

{#snippet rows()}
	{#each APPS as app (app.name)}
		<RecordRow>
			{#snippet identity()}<Avatar alt={app.name} size="sm" /> <strong>{app.name}</strong>{/snippet}
			<RecordCell label="Scopes">{app.scopes}</RecordCell>
			<RecordCell label="Installs">{app.installs}</RecordCell>
			<RecordCell label="Created">{app.created}</RecordCell>
			{#snippet actions()}<IconButton aria-label={`Actions for ${app.name}`}>⋯</IconButton>{/snippet}
		</RecordRow>
	{/each}
{/snippet}

<div data-testid="matrix" style="display:grid;gap:24px;padding:16px;width:max-content">
	<div style:width="840px">
		<RecordList columns={COLUMNS} labels={LABELS} aria-label="Wide">{@render rows()}</RecordList>
	</div>
	<div style:width="344px">
		<RecordList columns={COLUMNS} labels={LABELS} aria-label="Stacked">{@render rows()}</RecordList>
	</div>
</div>

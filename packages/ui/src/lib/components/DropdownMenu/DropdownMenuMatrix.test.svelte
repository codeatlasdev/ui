<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
	import DropdownMenuLabel from "./DropdownMenuLabel.svelte";
	import DropdownMenuSeparator from "./DropdownMenuSeparator.svelte";
	import SchemeAsset from "../SchemeAsset/SchemeAsset.svelte";
</script>

<div data-testid="matrix" style="padding:24px">
	<DropdownMenu>
		{#snippet trigger()}Options{/snippet}
		<DropdownMenuLabel>Account</DropdownMenuLabel>
		<DropdownMenuItem>
			{#snippet icon()}<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>{/snippet}
			Profile
		</DropdownMenuItem>
		<DropdownMenuItem brandIcon>
			{#snippet icon()}
				<SchemeAsset>
					{#snippet light()}<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#d97757" /></svg>{/snippet}
					{#snippet dark()}<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#faf9f5" /></svg>{/snippet}
				</SchemeAsset>
			{/snippet}
			Claude Code
		</DropdownMenuItem>
		<DropdownMenuItem disabled brandIcon>
			{#snippet icon()}<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#d97757" /></svg>{/snippet}
			Billing
		</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
	</DropdownMenu>
</div>

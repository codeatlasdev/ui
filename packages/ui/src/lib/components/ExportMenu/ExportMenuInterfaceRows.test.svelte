<script lang="ts">
	import ExportMenu from "./ExportMenu.svelte";
	// An `interface` row type has no implicit index signature (the case of most API row types).
	interface ApiKey {
		id: string;
		name: string;
		createdAt: string;
	}
	const keys: ApiKey[] = [{ id: "k1", name: "CI", createdAt: "2026-01-02" }];
</script>

<ExportMenu data={keys} columns={[{ key: "name", header: "Nome" }]} />

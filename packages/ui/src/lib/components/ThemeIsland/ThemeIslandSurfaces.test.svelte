<script lang="ts">
	import Chip from "../Chip/Chip.svelte";
	import CodeSnippet from "../CodeSnippet/CodeSnippet.svelte";
	import FileUpload from "../FileUpload/FileUpload.svelte";
	import ThemeIsland from "./ThemeIsland.svelte";

	let { scheme = "dark" }: { scheme?: "light" | "dark" } = $props();
</script>

<ThemeIsland {scheme}>
	<FileUpload hint="PNG up to 10 MB" />
	<Chip label="Design" variant="success" />
	<CodeSnippet code="const a = 1;" language="ts" />
</ThemeIsland>

<script lang="ts">
	import { page } from "$app/state";
	import { ErrorPage } from "@codeatlasdev/ui";
</script>

<ErrorPage status={page.status} message={page.error?.message} />

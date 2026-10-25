<script lang="ts">
  import ChartScope from './ChartScope.svelte';
  import Probe from './ChartScopeProbe.test.svelte';
</script>

<!-- The island carries the scope attributes; ChartScope inside it resolves tokens from the island. -->
<div data-theme-scope="light" data-preset="ocean"><ChartScope><Probe id="light" /></ChartScope></div>
<div data-theme-scope="dark" data-preset="violet"><ChartScope><Probe id="dark" /></ChartScope></div>

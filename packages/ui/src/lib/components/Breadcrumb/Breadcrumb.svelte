<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  const t = useT();
	export interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		items: BreadcrumbItem[];
		separator?: string;
		class?: string;
	}

	let { items, separator = '/', class: className = '' }: Props = $props();
</script>

<nav aria-label={t().breadcrumb.label} class="ca-breadcrumb {className}">
	<ol class="ca-breadcrumb__list">
		{#each items as item, i}
			<li class="ca-breadcrumb__item">
				{#if i > 0}
					<span class="ca-breadcrumb__sep" aria-hidden="true">{separator}</span>
				{/if}
				{#if item.href && i < items.length - 1}
					<a href={item.href} class="ca-breadcrumb__link">{item.label}</a>
				{:else}
					<span class="ca-breadcrumb__current" aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  	.ca-breadcrumb__list {
  		display: flex;
  		align-items: center;
  		gap: var(--ca-space-1);
  		list-style: none;
  		margin: 0;
  		padding: 0;
  		font-size: var(--ca-font-size-caption);
  	}

  	.ca-breadcrumb__item {
  		display: flex;
  		align-items: center;
  		gap: var(--ca-space-1);
  	}

  	.ca-breadcrumb__sep {
  		color: var(--ca-outline-default);
  		user-select: none;
  	}

  	.ca-breadcrumb__link {
  		color: var(--ca-text-secondary);
  		text-decoration: none;
  	}

  	.ca-breadcrumb__link:hover {
  		color: var(--ca-text-primary);
  		text-decoration: underline;
  	}

  	.ca-breadcrumb__current {
  		color: var(--ca-text-primary);
  	}
}
</style>

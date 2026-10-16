<script lang="ts">
	// Every element that declared its own `backdrop-filter` before #202, mounted for real, so
	// surface-migration.svelte.test.ts can compare computed styles with the pre-migration baseline.
	import { createRawSnippet } from "svelte";
	import { Home, Settings } from "@lucide/svelte";
	import Accordion from "../components/Accordion/Accordion.svelte";
	import AccordionItem from "../components/Accordion/AccordionItem.svelte";
	import AppForm from "../components/AppForm/AppForm.svelte";
	import Panel from "../components/AppShell/Panel.svelte";
	import Rail from "../components/AppShell/Rail.svelte";
	import type { NavModule } from "../components/AppShell/types.js";
	import Button from "../components/Button/Button.svelte";
	import IconButton from "../components/Button/IconButton.svelte";
	import Chip from "../components/Chip/Chip.svelte";
	import Collapsible from "../components/Collapsible/Collapsible.svelte";
	import ErrorPage from "../components/ErrorPage/ErrorPage.svelte";
	import Pagination from "../components/Pagination/Pagination.svelte";
	import SiteHeader from "../components/SiteHeader/SiteHeader.svelte";
	import StickyActions from "../components/StickyActions/StickyActions.svelte";
	import Stepper from "../components/Stepper/Stepper.svelte";
	import Tabs from "../components/Tabs/Tabs.svelte";
	import TabsList from "../components/Tabs/TabsList.svelte";
	import TabsTrigger from "../components/Tabs/TabsTrigger.svelte";
	import ToastItem from "../components/Toast/ToastItem.svelte";
	import FormSection from "../components/templates/FormSection.svelte";

	const text = (s: string) => createRawSnippet(() => ({ render: () => `<p>${s}</p>` }));
	const modules: NavModule[] = [
		{
			id: "app",
			label: "Application",
			icon: Home,
			basePath: "/app",
			items: [{ id: "dash", label: "Dashboard", icon: Home, path: "/app/dashboard" }],
		},
		{
			id: "cfg",
			label: "Settings",
			icon: Settings,
			basePath: "/settings",
			items: [{ id: "gen", label: "General", icon: Settings, path: "/settings/general" }],
		},
	];
</script>

<div data-testid="harness" style="display:grid;gap:12px;padding:16px;width:640px">
	<Tabs value="a">
		<TabsList>
			<TabsTrigger value="a">Account</TabsTrigger>
			<TabsTrigger value="b">Password</TabsTrigger>
		</TabsList>
	</Tabs>
	<Pagination count={100} perPage={10} page={3} />
	<Accordion type="single" value="a">
		<AccordionItem value="a" title="Question">{@render text("Answer")()}</AccordionItem>
	</Accordion>
	<ToastItem item={{ id: "t", message: "Saved", variant: "success", duration: 0 }} onclose={() => {}} />
	<Chip label="Design" />
	<Chip label="Design" onclick={() => {}} />
	<Stepper steps={[{ label: "One" }, { label: "Two" }]} current={0} />
	<Collapsible title="More" open>{@render text("Body")()}</Collapsible>
	<Button variant="glass">Glass</Button>
	<Button variant="glass" disabled>Glass off</Button>
	<Button variant="filled" disabled>Filled off</Button>
	<IconButton variant="glass" aria-label="Glass"><Home size={16} /></IconButton>
	<IconButton variant="glass" aria-label="Glass off" disabled><Home size={16} /></IconButton>
	<StickyActions>{@render text("Actions")()}</StickyActions>
	<FormSection label="Section">{@render text("Fields")()}</FormSection>
	<ErrorPage status={404} />
	<div class="ca-test-shell" style="position:relative;height:320px;transform:translateZ(0);overflow:hidden">
		<Rail {modules} activeIndex={0} onSelect={() => {}} />
		<Panel {modules} activeModuleIndex={0} pathname="/app/dashboard" show panelW={200} />
	</div>
	<SiteHeader />
	<AppForm title="Edit" description="Form">
		{#snippet footer()}<button type="button">Save</button>{/snippet}
		{@render text("Body")()}
	</AppForm>
</div>

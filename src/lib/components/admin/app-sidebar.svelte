<script lang="ts">
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import SteamIcon from '@tabler/icons-svelte/icons/steam';
	import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import NavDocuments from './nav-documents.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import type { User } from '@supabase/supabase-js';
	import { resolve } from '$app/paths';
	import { APP_NAME } from '$lib/constants';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';

	const data = {
		navMain: [
			{
				title: 'Dashboard',
				url: '/app',
				icon: DashboardIcon
			},
			{
				title: 'Scheduler',
				url: '/app/scheduler',
				icon: CalendarIcon
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '/app/settings',
				icon: SettingsIcon
			}
		],
		documents: [
			{
				name: 'Documents',
				url: '/app/documents',
				icon: FileWordIcon
			}
		]
	} as const;

	let {
		user = null,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user?: User | null;
	} = $props();

	const displayName = $derived.by(
		() =>
			(user?.user_metadata?.display_name as string | undefined) ??
			(user?.user_metadata?.full_name as string | undefined) ??
			(user?.user_metadata?.name as string | undefined) ??
			user?.email?.split('@')[0] ??
			'User'
	);
	const email = $derived.by(() => user?.email ?? '');
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href={resolve('/app')} {...props}>
							<SteamIcon class="!size-5 text-orange-500" />
							<span class="text-base font-semibold">{APP_NAME}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavDocuments items={data.documents} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={{ name: displayName, email }} />
	</Sidebar.Footer>
</Sidebar.Root>

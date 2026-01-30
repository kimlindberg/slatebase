<script lang="ts">
	import CameraIcon from '@tabler/icons-svelte/icons/camera';
	import ChartBarIcon from '@tabler/icons-svelte/icons/chart-bar';
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import DatabaseIcon from '@tabler/icons-svelte/icons/database';
	import FileAiIcon from '@tabler/icons-svelte/icons/file-ai';
	import FileDescriptionIcon from '@tabler/icons-svelte/icons/file-description';
	import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
	import FolderIcon from '@tabler/icons-svelte/icons/folder';
	import HelpIcon from '@tabler/icons-svelte/icons/help';
	import SteamIcon from '@tabler/icons-svelte/icons/steam';
	import ListDetailsIcon from '@tabler/icons-svelte/icons/list-details';
	import ReportIcon from '@tabler/icons-svelte/icons/report';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import UsersIcon from '@tabler/icons-svelte/icons/users';
	import NavDocuments from './nav-documents.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import type { User } from '@supabase/supabase-js';
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
			},
			{
				title: 'Lifecycle',
				url: '#',
				icon: ListDetailsIcon
			},
			{
				title: 'Analytics',
				url: '#',
				icon: ChartBarIcon
			},
			{
				title: 'Projects',
				url: '#',
				icon: FolderIcon
			},
			{
				title: 'Team',
				url: '#',
				icon: UsersIcon
			}
		],
		navClouds: [
			{
				title: 'Capture',
				icon: CameraIcon,
				isActive: true,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Proposal',
				icon: FileDescriptionIcon,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Prompts',
				icon: FileAiIcon,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '#',
				icon: SettingsIcon
			},
			{
				title: 'Get Help',
				url: '#',
				icon: HelpIcon
			},
			{
				title: 'Search',
				url: '#',
				icon: SearchIcon
			}
		],
		documents: [
			{
				name: 'Data Library',
				url: '#',
				icon: DatabaseIcon
			},
			{
				name: 'Reports',
				url: '#',
				icon: ReportIcon
			},
			{
				name: 'Word Assistant',
				url: '#',
				icon: FileWordIcon
			}
		]
	};

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
						<a href="##" {...props}>
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

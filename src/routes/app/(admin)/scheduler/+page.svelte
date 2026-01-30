<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@tabler/icons-svelte/icons/loader-2';
	import ArrowsUpDownIcon from '@tabler/icons-svelte/icons/arrows-up-down';
	import CheckIcon from '@tabler/icons-svelte/icons/check';
	import CloudIcon from '@tabler/icons-svelte/icons/cloud';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import KeyIcon from '@tabler/icons-svelte/icons/key';
	import ExternalLinkIcon from '@tabler/icons-svelte/icons/external-link';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import AppSidebar from '$lib/components/admin/app-sidebar.svelte';
	import SiteHeader from '$lib/components/admin/site-header.svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data } = $props();

	let username = $state('');
	let connected = $state(false);
	let appPassword = $state('');
	let isSubmitting = $state(false);
	let success = $state(false);
	let error = $state<string | null>(null);
	let successTimer: ReturnType<typeof setTimeout> | null = null;
	let calendars = $state<{ id: string; title: string }[]>([]);
	let selectedCalendarIds = $state<string[]>([]);
	let isOpen = $state(false);
	let selectionSubmitting = $state(false);
	let selectionSuccess = $state(false);
	let selectionError = $state<string | null>(null);
	let selectionTimer: ReturnType<typeof setTimeout> | null = null;
	let deleteSubmitting = $state(false);
	let deleteSuccess = $state(false);
	let deleteError = $state<string | null>(null);
	let deleteTimer: ReturnType<typeof setTimeout> | null = null;
	let initialized = $state(false);
	let workdayStart = $state('09:00');
	let workdayEnd = $state('17:00');
	let whatsappMessage = $state('');
	let settingsSubmitting = $state(false);
	let settingsSuccess = $state(false);
	let settingsError = $state<string | null>(null);
	let settingsTimer: ReturnType<typeof setTimeout> | null = null;
	let publicSlug = $state('');
	let isPublic = $state(false);
	let publicBaseUrl = $state('');
	let publicSubmitting = $state(false);
	let publicSuccess = $state(false);
	let publicError = $state<string | null>(null);
	let publicTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (initialized) return;
		username = data.icloudUsername ?? '';
		calendars = data.calendars ?? [];
		selectedCalendarIds = data.selectedCalendarIds ?? [];
		connected = (data.icloudUsername ?? '').trim().length > 0;
		workdayStart = data.schedulerSettings?.workdayStart ?? '09:00';
		workdayEnd = data.schedulerSettings?.workdayEnd ?? '17:00';
		whatsappMessage = data.schedulerSettings?.whatsappMessage ?? '';
		publicSlug = data.providerProfile?.publicSlug ?? data.providerSlugSuggestion ?? '';
		isPublic = data.providerProfile?.isPublic ?? false;
		publicBaseUrl = data.publicBaseUrl ?? '';
		initialized = true;
	});

	const canSubmit = $derived(
		username.trim().length > 0 && appPassword.trim().length > 0 && !isSubmitting
	);
	const selectedTitles = $derived.by(() =>
		calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id))
	);
	const selectionLabel = $derived.by(() => {
		if (!selectedTitles.length) return 'Select calendars';
		if (selectedTitles.length <= 2) return selectedTitles.map((c) => c.title).join(', ');
		return `${selectedTitles
			.slice(0, 2)
			.map((c) => c.title)
			.join(', ')} +${selectedTitles.length - 2}`;
	});
	const canSaveSelection = $derived(selectedCalendarIds.length > 0 && !selectionSubmitting);
	const isConnected = $derived(connected);
	const canSavePublic = $derived(publicSlug.trim().length > 0 && !publicSubmitting);
	const canSaveSettings = $derived(
		workdayStart.trim().length > 0 && workdayEnd.trim().length > 0 && !settingsSubmitting
	);
	const normalizedSlug = $derived(
		publicSlug
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.replace(/--+/g, '-')
	);
	const publicPageUrl = $derived(
		normalizedSlug && publicBaseUrl ? `${publicBaseUrl}/c/${normalizedSlug}` : ''
	);

	const clearTimer = () => {
		if (successTimer) clearTimeout(successTimer);
		successTimer = null;
	};

	const handleFetchEnhance: SubmitFunction = () => {
		isSubmitting = true;
		error = null;
		success = false;
		clearTimer();

		return async ({ result, update }) => {
			isSubmitting = false;
			const updatePromise = update({ reset: false });
			if (result.type === 'failure') {
				error = result.data?.error ?? 'Unable to fetch calendars.';
				await updatePromise;
				return;
			}
			if (result.type === 'success') {
				calendars = result.data?.calendars ?? [];
				selectedCalendarIds = [];
				connected = true;
				success = true;
				successTimer = setTimeout(() => {
					success = false;
					successTimer = null;
				}, 2000);
			}
			await updatePromise;
		};
	};

	const handleSelectionEnhance: SubmitFunction = () => {
		selectionSubmitting = true;
		selectionError = null;
		selectionSuccess = false;
		if (selectionTimer) {
			clearTimeout(selectionTimer);
			selectionTimer = null;
		}

		return async ({ result, update }) => {
			selectionSubmitting = false;
			const updatePromise = update({ reset: false });
			if (result.type === 'failure') {
				selectionError = result.data?.selectionError ?? 'Unable to save selection.';
				await updatePromise;
				return;
			}
			if (result.type === 'success') {
				selectionSuccess = true;
				selectionTimer = setTimeout(() => {
					selectionSuccess = false;
					selectionTimer = null;
				}, 2000);
			}
			await updatePromise;
		};
	};

	const handleDeleteEnhance: SubmitFunction = () => {
		deleteSubmitting = true;
		deleteError = null;
		deleteSuccess = false;
		if (deleteTimer) {
			clearTimeout(deleteTimer);
			deleteTimer = null;
		}

		return async ({ result, update }) => {
			deleteSubmitting = false;
			const updatePromise = update({ reset: false });
			if (result.type === 'failure') {
				deleteError = result.data?.deleteError ?? 'Unable to delete integration.';
				await updatePromise;
				return;
			}
			if (result.type === 'success') {
				deleteSuccess = true;
				username = '';
				appPassword = '';
				calendars = [];
				selectedCalendarIds = [];
				connected = false;
				deleteTimer = setTimeout(() => {
					deleteSuccess = false;
					deleteTimer = null;
				}, 2000);
			}
			await updatePromise;
		};
	};

	const handleSettingsEnhance: SubmitFunction = () => {
		settingsSubmitting = true;
		settingsError = null;
		settingsSuccess = false;
		if (settingsTimer) {
			clearTimeout(settingsTimer);
			settingsTimer = null;
		}

		return async ({ result, update }) => {
			settingsSubmitting = false;
			const updatePromise = update({ reset: false });
			if (result.type === 'failure') {
				settingsError = result.data?.settingsError ?? 'Unable to save settings.';
				await updatePromise;
				return;
			}
			if (result.type === 'success') {
				settingsSuccess = true;
				settingsTimer = setTimeout(() => {
					settingsSuccess = false;
					settingsTimer = null;
				}, 2000);
			}
			await updatePromise;
		};
	};
	const handlePublicEnhance: SubmitFunction = () => {
		publicSubmitting = true;
		publicError = null;
		publicSuccess = false;
		if (publicTimer) {
			clearTimeout(publicTimer);
			publicTimer = null;
		}

		return async ({ result, update }) => {
			publicSubmitting = false;
			const updatePromise = update({ reset: false });
			if (result.type === 'failure') {
				publicError = result.data?.publicError ?? 'Unable to save public page.';
				await updatePromise;
				return;
			}
			if (result.type === 'success') {
				publicSuccess = true;
				publicTimer = setTimeout(() => {
					publicSuccess = false;
					publicTimer = null;
				}, 2000);
			}
			await updatePromise;
		};
	};

	const toggleCalendar = (id: string) => {
		if (selectedCalendarIds.includes(id)) {
			selectedCalendarIds = selectedCalendarIds.filter((item) => item !== id);
		} else {
			selectedCalendarIds = [...selectedCalendarIds, id];
		}
	};
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" user={data.user} />
	<Sidebar.Inset>
		<SiteHeader title="Scheduler" />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					<div class="px-4 lg:px-6">
						<Card.Root>
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<CloudIcon class="size-5 text-orange-500" />
									iCloud calendar
								</Card.Title>
								<Card.Description>
									Connect iCloud and pick which calendars to sync.
								</Card.Description>
								<Card.Action>
									<Badge variant="outline" class="text-muted-foreground">
										{#if isConnected}
											Connected
										{:else}
											Not connected
										{/if}
									</Badge>
								</Card.Action>
							</Card.Header>
							<Card.Content class="space-y-6">
								<form
									id="icloud-fetch-form"
									method="post"
									action="?/fetch"
									class="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
									use:enhance={handleFetchEnhance}
								>
									<div class="space-y-2 md:col-span-1">
										<Label for="icloud-username" class="flex items-center gap-2">
											<CalendarIcon class="size-4 text-muted-foreground" />
											iCloud username
										</Label>
										<Input
											id="icloud-username"
											bind:value={username}
											name="username"
											autocomplete="username"
											placeholder="example@icloud.com"
											required
										/>
									</div>
									<div class="space-y-2 md:col-span-1">
										<Label for="icloud-password" class="flex items-center gap-2">
											<KeyIcon class="size-4 text-muted-foreground" />
											iCloud app password
										</Label>
										<Input
											id="icloud-password"
											type="password"
											bind:value={appPassword}
											name="appPassword"
											autocomplete="current-password"
											placeholder="••••-••••-••••-••••"
											required
										/>
									</div>
									<div class="flex min-h-[1.25rem] items-center gap-3 md:justify-end">
										<Button type="submit" disabled={!canSubmit}>
											{#if isSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												{#if isConnected}
													Refreshing…
												{:else}
													Connecting…
												{/if}
											{:else if isConnected}
												Refresh calendars
											{:else}
												Connect & fetch
											{/if}
										</Button>
										{#if isConnected}
											<Button
												form="icloud-delete-form"
												type="submit"
												variant="ghost"
												disabled={deleteSubmitting}
											>
												{#if deleteSubmitting}
													<Loader2Icon class="size-3 animate-spin" />
												{:else}
													Disconnect
												{/if}
											</Button>
										{/if}
										<p
											class="text-sm text-muted-foreground transition-opacity duration-500"
											class:opacity-0={!success}
											aria-live="polite"
										>
											Calendars fetched.
										</p>
									</div>
									{#if !canSubmit && !isSubmitting}
										<p class="text-xs text-muted-foreground">
											Enter your iCloud credentials to continue.
										</p>
									{/if}
									{#if error}
										<p class="text-sm text-destructive md:col-span-full">{error}</p>
									{/if}
									{#if deleteError}
										<p class="text-sm text-destructive md:col-span-full">{deleteError}</p>
									{/if}
									<p
										class="text-sm text-muted-foreground transition-opacity duration-500 md:col-span-full"
										class:opacity-0={!deleteSuccess}
										aria-live="polite"
									>
										Integration removed.
									</p>
								</form>
								<form
									id="icloud-delete-form"
									method="post"
									action="?/delete"
									class="sr-only"
									use:enhance={handleDeleteEnhance}
								></form>
								{#if isConnected}
									<Separator />
								{/if}
								{#if calendars.length > 0}
									<div class="space-y-2">
										<Label for="icloud-calendars">Calendars to sync</Label>
										<Popover.Root bind:open={isOpen}>
											<Popover.Trigger>
												{#snippet child({ props })}
													<Button
														{...props}
														id="icloud-calendars"
														variant="outline"
														role="combobox"
														aria-expanded={isOpen}
														class="w-full justify-between"
													>
														<span class="truncate">{selectionLabel}</span>
														<ArrowsUpDownIcon class="size-4 shrink-0 opacity-50" />
													</Button>
												{/snippet}
											</Popover.Trigger>
											<Popover.Content class="w-[--bits-popover-trigger-width] p-0">
												<Command.Root>
													<Command.Input placeholder="Search calendars..." />
													<Command.List>
														<Command.Empty>No calendars found.</Command.Empty>
														<Command.Group>
															{#each calendars as calendar (calendar.id)}
																<Command.Item
																	value={calendar.title}
																	onSelect={() => toggleCalendar(calendar.id)}
																>
																	<CheckIcon
																		class={cn(
																			'size-4',
																			selectedCalendarIds.includes(calendar.id)
																				? 'opacity-100'
																				: 'opacity-0'
																		)}
																	/>
																	{calendar.title}
																</Command.Item>
															{/each}
														</Command.Group>
													</Command.List>
												</Command.Root>
											</Popover.Content>
										</Popover.Root>
									</div>
									{#if selectedTitles.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each selectedTitles as calendar (calendar.id)}
												<button
													type="button"
													class="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-muted/70"
													onclick={() => toggleCalendar(calendar.id)}
												>
													{calendar.title}
													<span class="text-[10px] leading-none text-muted-foreground/80">×</span>
												</button>
											{/each}
										</div>
									{/if}
									<form
										method="post"
										action="?/selection"
										class="flex min-h-[1.25rem] items-center gap-3"
										use:enhance={handleSelectionEnhance}
									>
										<input
											type="hidden"
											name="calendarIds"
											value={JSON.stringify(selectedCalendarIds)}
										/>
										<Button type="submit" disabled={!canSaveSelection}>
											{#if selectionSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												Saving…
											{:else}
												Save selection
											{/if}
										</Button>
										<p
											class="text-sm text-muted-foreground transition-opacity duration-500"
											class:opacity-0={!selectionSuccess}
											aria-live="polite"
										>
											Selection saved.
										</p>
									</form>
									{#if selectionError}
										<p class="text-sm text-destructive">{selectionError}</p>
									{/if}
									{#if !canSaveSelection && !selectionSubmitting}
										<p class="text-xs text-muted-foreground">
											Select at least one calendar to save.
										</p>
									{/if}
								{/if}
							</Card.Content>
						</Card.Root>
					</div>
					<div class="px-4 lg:px-6">
						<Card.Root>
							<Card.Header>
								<Card.Title>Public booking page</Card.Title>
								<Card.Description>
									Choose a URL for your public booking page and decide when it’s visible.
								</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<form
									method="post"
									action="?/publicPage"
									class="grid gap-4 md:grid-cols-[1fr_1fr] md:items-end"
									use:enhance={handlePublicEnhance}
								>
									<input type="hidden" name="isPublic" value={isPublic ? 'on' : ''} />
									<div class="space-y-2 md:col-span-2">
										<Label for="public-slug">Public page slug</Label>
										<div class="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
											<Input
												id="public-slug"
												name="publicSlug"
												bind:value={publicSlug}
												placeholder="your-name-1234"
												required
											/>
											{#if publicPageUrl}
												<Button
													variant="outline"
													size="sm"
													class="gap-2"
													href={publicPageUrl}
													rel="noreferrer"
													target="_blank"
												>
													<ExternalLinkIcon class="size-4" />
													Open page
												</Button>
											{:else}
												<Button variant="outline" size="sm" disabled>
													<ExternalLinkIcon class="size-4" />
													Open page
												</Button>
											{/if}
										</div>
										<div class="text-xs text-muted-foreground">
											{#if publicPageUrl}
												<span>Public link: </span>
												<a
													class="text-primary underline-offset-4 hover:underline"
													href={resolve('/c/[slug]', { slug: normalizedSlug })}
													rel="noreferrer"
													target="_blank"
												>
													{publicPageUrl}
												</a>
											{:else}
												<span>Save a slug to generate the public link.</span>
											{/if}
										</div>
									</div>
									<div class="flex items-center gap-2 md:col-span-2">
										<Checkbox id="is-public" bind:checked={isPublic} />
										<Label for="is-public">Make public page visible</Label>
									</div>
									<div class="flex min-h-[1.25rem] items-center gap-3 md:col-span-2">
										<Button type="submit" disabled={!canSavePublic}>
											{#if publicSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												Saving…
											{:else}
												Save public page settings
											{/if}
										</Button>
										<p
											class="text-sm text-muted-foreground transition-opacity duration-500"
											class:opacity-0={!publicSuccess}
											aria-live="polite"
										>
											Settings saved.
										</p>
									</div>
									{#if publicError}
										<p class="text-sm text-destructive md:col-span-2">{publicError}</p>
									{/if}
								</form>
							</Card.Content>
						</Card.Root>
					</div>
					<div class="px-4 lg:px-6">
						<Card.Root>
							<Card.Header>
								<Card.Title>Scheduler settings</Card.Title>
								<Card.Description>
									Set default availability and booking request defaults.
								</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<form
									method="post"
									action="?/settings"
									class="grid gap-4 md:grid-cols-[1fr_1fr] md:items-end"
									use:enhance={handleSettingsEnhance}
								>
									<div class="space-y-2">
										<Label for="workday-start">Working hours start</Label>
										<Input
											id="workday-start"
											type="time"
											step="60"
											bind:value={workdayStart}
											name="workdayStart"
											required
										/>
									</div>
									<div class="space-y-2">
										<Label for="workday-end">Working hours end</Label>
										<Input
											id="workday-end"
											type="time"
											step="60"
											bind:value={workdayEnd}
											name="workdayEnd"
											required
										/>
									</div>
									<div class="space-y-2 md:col-span-2">
										<Label for="whatsapp-message">WhatsApp booking request message</Label>
										<textarea
											id="whatsapp-message"
											name="whatsappMessage"
											bind:value={whatsappMessage}
											rows="4"
											class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 dark:border-input dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
											placeholder="Hi! I would like to book a session..."
										></textarea>
									</div>
									<div class="flex min-h-[1.25rem] items-center gap-3 md:col-span-2">
										<Button type="submit" disabled={!canSaveSettings}>
											{#if settingsSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												Saving…
											{:else}
												Save scheduler settings
											{/if}
										</Button>
										<p
											class="text-sm text-muted-foreground transition-opacity duration-500"
											class:opacity-0={!settingsSuccess}
											aria-live="polite"
										>
											Settings saved.
										</p>
									</div>
									{#if settingsError}
										<p class="text-sm text-destructive md:col-span-2">{settingsError}</p>
									{/if}
									{#if !canSaveSettings && !settingsSubmitting}
										<p class="text-xs text-muted-foreground md:col-span-2">
											Start and end time are required.
										</p>
									{/if}
								</form>
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

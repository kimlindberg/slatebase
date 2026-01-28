<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import { cn } from "$lib/utils.js";
	import Loader2Icon from "@tabler/icons-svelte/icons/loader-2";
	import ArrowsUpDownIcon from "@tabler/icons-svelte/icons/arrows-up-down";
	import CheckIcon from "@tabler/icons-svelte/icons/check";
	import CloudIcon from "@tabler/icons-svelte/icons/cloud";
	import CalendarIcon from "@tabler/icons-svelte/icons/calendar";
	import KeyIcon from "@tabler/icons-svelte/icons/key";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import AppSidebar from "$lib/components/admin/app-sidebar.svelte";
	import SiteHeader from "$lib/components/admin/site-header.svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();

	let username = $state(data.icloudUsername ?? "");
	let connected = $state((data.icloudUsername ?? "").trim().length > 0);
	let appPassword = $state("");
	let isSubmitting = $state(false);
	let success = $state(false);
	let error = $state<string | null>(null);
	let successTimer: ReturnType<typeof setTimeout> | null = null;
	let calendars = $state<{ id: string; title: string }[]>(data.calendars ?? []);
	let selectedCalendarIds = $state<string[]>(data.selectedCalendarIds ?? []);
	let isOpen = $state(false);
	let selectionSubmitting = $state(false);
	let selectionSuccess = $state(false);
	let selectionError = $state<string | null>(null);
	let selectionTimer: ReturnType<typeof setTimeout> | null = null;
	let deleteSubmitting = $state(false);
	let deleteSuccess = $state(false);
	let deleteError = $state<string | null>(null);
	let deleteTimer: ReturnType<typeof setTimeout> | null = null;

	const canSubmit = $derived(
		username.trim().length > 0 && appPassword.trim().length > 0 && !isSubmitting
	);
	const selectedTitles = $derived.by(() =>
		calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id))
	);
	const selectionLabel = $derived.by(() => {
		if (!selectedTitles.length) return "Select calendars";
		if (selectedTitles.length <= 2) return selectedTitles.map((c) => c.title).join(", ");
		return `${selectedTitles
			.slice(0, 2)
			.map((c) => c.title)
			.join(", ")} +${selectedTitles.length - 2}`;
	});
	const canSaveSelection = $derived(selectedCalendarIds.length > 0 && !selectionSubmitting);
	const isConnected = $derived(connected);

	const clearTimer = () => {
		if (successTimer) clearTimeout(successTimer);
		successTimer = null;
	};

	const handleFetchEnhance = () => {
		isSubmitting = true;
		error = null;
		success = false;
		clearTimer();

		return async ({ result, update }) => {
			isSubmitting = false;
			await update({ reset: false });
			if (result.type === "failure") {
				error = result.data?.error ?? "Unable to fetch calendars.";
				return;
			}
			if (result.type === "success") {
				calendars = result.data?.calendars ?? [];
				selectedCalendarIds = [];
				connected = true;
				success = true;
				successTimer = setTimeout(() => {
					success = false;
					successTimer = null;
				}, 2000);
			}
		};
	};

	const handleSelectionEnhance = () => {
		selectionSubmitting = true;
		selectionError = null;
		selectionSuccess = false;
		if (selectionTimer) {
			clearTimeout(selectionTimer);
			selectionTimer = null;
		}

		return async ({ result, update }) => {
			selectionSubmitting = false;
			await update({ reset: false });
			if (result.type === "failure") {
				selectionError = result.data?.selectionError ?? "Unable to save selection.";
				return;
			}
			if (result.type === "success") {
				selectionSuccess = true;
				selectionTimer = setTimeout(() => {
					selectionSuccess = false;
					selectionTimer = null;
				}, 2000);
			}
		};
	};

	const handleDeleteEnhance = () => {
		deleteSubmitting = true;
		deleteError = null;
		deleteSuccess = false;
		if (deleteTimer) {
			clearTimeout(deleteTimer);
			deleteTimer = null;
		}

		return async ({ result, update }) => {
			deleteSubmitting = false;
			await update({ reset: false });
			if (result.type === "failure") {
				deleteError = result.data?.deleteError ?? "Unable to delete integration.";
				return;
			}
			if (result.type === "success") {
				deleteSuccess = true;
				username = "";
				appPassword = "";
				calendars = [];
				selectedCalendarIds = [];
				connected = false;
				deleteTimer = setTimeout(() => {
					deleteSuccess = false;
					deleteTimer = null;
				}, 2000);
			}
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
									<div class="flex items-center gap-3 md:justify-end">
										<Button type="submit" disabled={!canSubmit}>
											{#if isSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												{#if isConnected}
													Refreshing…
												{:else}
													Connecting…
												{/if}
											{:else}
												{#if isConnected}
													Refresh calendars
												{:else}
													Connect & fetch
												{/if}
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
									{#if deleteSuccess}
										<p class="text-sm text-muted-foreground md:col-span-full">
											Integration removed.
										</p>
									{/if}
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
											<Popover.Trigger asChild>
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
																			"size-4",
																			selectedCalendarIds.includes(calendar.id)
																				? "opacity-100"
																				: "opacity-0"
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
										class="flex items-center gap-3"
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
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

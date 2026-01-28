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
	import AppSidebar from "$lib/components/admin/app-sidebar.svelte";
	import SiteHeader from "$lib/components/admin/site-header.svelte";
	import { enhance } from "$app/forms";

	let { data } = $props();

	let username = $state(data.icloudUsername ?? "");
	let appPassword = $state("");
	let isSubmitting = $state(false);
	let success = $state(false);
	let error = $state<string | null>(null);
	let successTimer: ReturnType<typeof setTimeout> | null = null;
	let calendars = $state<{ id: string; title: string }[]>([]);
	let selectedCalendarIds = $state<string[]>([]);
	let isOpen = $state(false);

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
				success = true;
				successTimer = setTimeout(() => {
					success = false;
					successTimer = null;
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
								<Card.Title>iCloud calendar</Card.Title>
								<Card.Description>
									Connect an iCloud account to sync availability.
								</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<form
									method="post"
									action="?/fetch"
									class="space-y-4"
									use:enhance={handleFetchEnhance}
								>
									<div class="space-y-2">
										<Label for="icloud-username">iCloud username</Label>
										<Input
											id="icloud-username"
											bind:value={username}
											name="username"
											autocomplete="username"
											placeholder="example@icloud.com"
											required
										/>
									</div>
									<div class="space-y-2">
										<Label for="icloud-password">iCloud app password</Label>
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
									{#if error}
										<p class="text-sm text-destructive">{error}</p>
									{/if}
									<div class="flex items-center gap-3">
										<Button type="submit" disabled={!canSubmit}>
											{#if isSubmitting}
												<Loader2Icon class="size-4 animate-spin" />
												Fetching…
											{:else}
												Fetch calendars
											{/if}
										</Button>
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
									{#if calendars.length > 0}
										<div class="space-y-2">
											<Label for="icloud-calendars">Calendars</Label>
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

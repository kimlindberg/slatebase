import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabase/server';
import {
	generateProviderSlug,
	getProviderProfile,
	normalizeProviderSlug,
	upsertProviderProfile
} from '$lib/server/domain/providers';

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
	const supabase = supabaseServer(cookies);
	const { data } = await supabase.auth.getUser();
	const user = data.user ?? null;
	const displayName = user
		? ((user.user_metadata?.display_name as string | undefined) ??
			(user.user_metadata?.full_name as string | undefined) ??
			(user.user_metadata?.name as string | undefined) ??
			'')
		: '';

	let icloudUsername = '';
	let selectedCalendarIds: string[] = [];
	let calendars: { id: string; title: string }[] = [];
	let schedulerSettings = {
		workdayStart: '09:00',
		workdayEnd: '17:00',
		whatsappMessage: ''
	};
	let providerProfile = {
		publicSlug: '',
		isPublic: false
	};
	let providerSlugSuggestion = '';
	if (user) {
		try {
			const response = await fetch('/api/integrations/icloud', {
				headers: { accept: 'application/json' }
			});
			if (response.ok) {
				const result = await response.json();
				icloudUsername = result.username ?? '';
				selectedCalendarIds = result.selectedCalendarIds ?? [];
			}
			const calendarsResponse = await fetch('/api/integrations/icloud/calendars', {
				headers: { accept: 'application/json' }
			});
			if (calendarsResponse.ok) {
				const result = await calendarsResponse.json();
				calendars = result.calendars ?? [];
			}
			const settingsResponse = await fetch('/api/scheduler/settings', {
				headers: { accept: 'application/json' }
			});
			if (settingsResponse.ok) {
				schedulerSettings = await settingsResponse.json();
			}

			const profile = await getProviderProfile(supabase, user.id);
			providerSlugSuggestion = generateProviderSlug(displayName, user.id);
			providerProfile = {
				publicSlug: profile?.publicSlug ?? providerSlugSuggestion,
				isPublic: profile?.isPublic ?? false
			};
		} catch {
			icloudUsername = '';
		}
	}

	return {
		user,
		icloudUsername,
		calendars,
		selectedCalendarIds,
		schedulerSettings,
		providerProfile,
		providerSlugSuggestion,
		publicBaseUrl: url.origin
	};
};

export const actions: Actions = {
	fetch: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const username = (formData.get('username') ?? '').toString().trim();
		const appPassword = (formData.get('appPassword') ?? '').toString().trim();

		if (!username || !appPassword) {
			return fail(400, { error: 'iCloud username and app password are required.' });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		try {
			const response = await fetch('/api/integrations/icloud', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json' }
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, { error: result?.error ?? 'Unable to save integration.' });
			}
			return { calendars: result.calendars ?? [] };
		} catch (err) {
			return fail(500, {
				error: err instanceof Error ? err.message : 'Unable to save integration.'
			});
		}
	},
	selection: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const raw = (formData.get('calendarIds') ?? '').toString();
		if (!raw) {
			return fail(400, { selectionError: 'Select at least one calendar.' });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { selectionError: 'Not authenticated.' });
		}

		try {
			const response = await fetch('/api/integrations/icloud/selection', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json' }
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					selectionError: result?.error ?? 'Unable to save selection.'
				});
			}
			return { selectionSuccess: true };
		} catch (err) {
			return fail(500, {
				selectionError: err instanceof Error ? err.message : 'Unable to save selection.'
			});
		}
	},
	delete: async ({ cookies, fetch }) => {
		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { deleteError: 'Not authenticated.' });
		}

		try {
			const response = await fetch('/api/integrations/icloud', {
				method: 'DELETE',
				headers: { accept: 'application/json' }
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					deleteError: result?.error ?? 'Unable to delete integration.'
				});
			}
			return { deleteSuccess: true };
		} catch (err) {
			return fail(500, {
				deleteError: err instanceof Error ? err.message : 'Unable to delete integration.'
			});
		}
	},
	publicPage: async ({ request, cookies }) => {
		const formData = await request.formData();
		const publicSlugRaw = (formData.get('publicSlug') ?? '').toString();
		const isPublic = formData.get('isPublic') === 'on';

		const normalizedSlug = normalizeProviderSlug(publicSlugRaw);
		if (!normalizedSlug) {
			return fail(400, { publicError: 'Public page slug is required.' });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { publicError: 'Not authenticated.' });
		}

		try {
			await upsertProviderProfile(supabase, data.user.id, {
				publicSlug: normalizedSlug,
				isPublic
			});
			return { publicSuccess: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to save public page.';
			if (message.includes('providers_public_slug_uq') || message.includes('duplicate')) {
				return fail(409, { publicError: 'That slug is already taken.' });
			}
			return fail(500, {
				publicError: message
			});
		}
	},
	settings: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const workdayStart = (formData.get('workdayStart') ?? '').toString();
		const workdayEnd = (formData.get('workdayEnd') ?? '').toString();

		if (!workdayStart || !workdayEnd) {
			return fail(400, { settingsError: 'Working hours are required.' });
		}

		const supabase = supabaseServer(cookies);
		const { data } = await supabase.auth.getUser();
		if (!data.user) {
			return fail(401, { settingsError: 'Not authenticated.' });
		}

		try {
			const response = await fetch('/api/scheduler/settings', {
				method: 'POST',
				body: formData,
				headers: { accept: 'application/json' }
			});
			const result = await response.json();
			if (!response.ok) {
				return fail(response.status, {
					settingsError: result?.error ?? 'Unable to save settings.'
				});
			}
			return { settingsSuccess: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to save settings.';
			if (message.includes('providers_public_slug_uq') || message.includes('duplicate')) {
				return fail(409, { settingsError: 'That slug is already taken.' });
			}
			return fail(500, {
				settingsError: message
			});
		}
	}
};

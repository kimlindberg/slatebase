import type { SupabaseClient } from '@supabase/supabase-js';

type SettingsSection = Record<string, unknown>;

export type ProviderSettings = {
	calendar?: {
		selectedCalendarIds?: string[];
	};
	workingHours?: {
		timezone?: string;
		days?: number[];
		start?: string;
		end?: string;
	};
	whatsapp?: {
		enabled?: boolean;
		phoneE164?: string;
		messageTemplate?: string;
		bookingMessage?: string;
	};
};

const mergeSettings = (current: ProviderSettings, updates: ProviderSettings): ProviderSettings => {
	const merged: ProviderSettings = { ...current };

	(Object.keys(updates) as Array<keyof ProviderSettings>).forEach((key) => {
		const updateValue = updates[key];
		if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
			const existing = current[key];
			merged[key] = {
				...((existing as SettingsSection | undefined) ?? {}),
				...(updateValue as SettingsSection)
			} as ProviderSettings[typeof key];
		} else if (updateValue !== undefined) {
			merged[key] = updateValue;
		}
	});

	return merged;
};

export async function getProviderSettings(
	supabase: SupabaseClient,
	userId: string
): Promise<ProviderSettings> {
	const { data, error } = await supabase
		.from('providers')
		.select('settings')
		.eq('owner_user_id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	return (data?.settings as ProviderSettings | null) ?? {};
}

export async function upsertProviderSettings(
	supabase: SupabaseClient,
	userId: string,
	updates: ProviderSettings
) {
	const { data, error } = await supabase
		.from('providers')
		.select('settings')
		.eq('owner_user_id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	const merged = mergeSettings((data?.settings as ProviderSettings | null) ?? {}, updates);

	const { error: upsertError } = await supabase.from('providers').upsert(
		{
			owner_user_id: userId,
			settings: merged
		},
		{ onConflict: 'owner_user_id' }
	);

	if (upsertError) {
		throw new Error(upsertError.message);
	}
}

import type { SupabaseClient } from '@supabase/supabase-js';

export type ProviderProfile = {
	publicSlug: string | null;
	isPublic: boolean;
	timezone: string;
};

const slugify = (input: string) =>
	input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/--+/g, '-');

export const normalizeProviderSlug = (input: string) => slugify(input);

export const generateProviderSlug = (displayName: string, userId: string) => {
	const base = slugify(displayName) || 'provider';
	const suffix = userId.replace(/-/g, '').slice(0, 6);
	return `${base}-${suffix}`;
};

export async function getProviderProfile(
	supabase: SupabaseClient,
	userId: string
): Promise<ProviderProfile | null> {
	const { data, error } = await supabase
		.from('providers')
		.select('public_slug, is_public, timezone')
		.eq('owner_user_id', userId)
		.maybeSingle();

	if (error) {
		throw new Error(error.message);
	}

	if (!data) return null;

	return {
		publicSlug: data.public_slug ?? null,
		isPublic: data.is_public ?? false,
		timezone: data.timezone ?? 'Asia/Dubai'
	};
}

export async function upsertProviderProfile(
	supabase: SupabaseClient,
	userId: string,
	profile: Partial<ProviderProfile>
) {
	const existing = await getProviderProfile(supabase, userId);
	const { error } = await supabase.from('providers').upsert(
		{
			owner_user_id: userId,
			public_slug: profile.publicSlug ?? existing?.publicSlug ?? null,
			is_public: profile.isPublic ?? existing?.isPublic ?? false,
			timezone: profile.timezone ?? existing?.timezone ?? 'Asia/Dubai'
		},
		{ onConflict: 'owner_user_id' }
	);

	if (error) {
		throw new Error(error.message);
	}
}

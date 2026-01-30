import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabase/server';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = supabaseServer(cookies);
	const { data, error } = await supabase.auth.getUser();
	if (error) {
		return { profile: null };
	}

	const { user } = data;

	return {
		profile: user
			? {
					email: user.email ?? '',
					displayName:
						(user.user_metadata?.display_name as string | undefined) ??
						(user.user_metadata?.full_name as string | undefined) ??
						(user.user_metadata?.name as string | undefined) ??
						'',
					phone: (user.user_metadata?.phone as string | undefined) ?? ''
				}
			: null
	};
};

export const actions: Actions = {
	profile: async ({ request, cookies }) => {
		const formData = await request.formData();
		const displayName = (formData.get('displayName') ?? '').toString().trim();
		const phone = (formData.get('phone') ?? '').toString().trim();

		const supabase = supabaseServer(cookies);
		const { error } = await supabase.auth.updateUser({
			data: {
				display_name: displayName,
				full_name: displayName,
				phone
			}
		});

		if (error) {
			return fail(400, { profileError: error.message });
		}

		return { profileSuccess: true };
	},
	password: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = (formData.get('password') ?? '').toString();
		const confirmPassword = (formData.get('confirmPassword') ?? '').toString();

		if (!password || password.length < 8) {
			return fail(400, { passwordError: 'Password must be at least 8 characters.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { passwordError: 'Passwords do not match.' });
		}

		const supabase = supabaseServer(cookies);
		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { passwordError: error.message });
		}

		return { passwordSuccess: true };
	}
};
